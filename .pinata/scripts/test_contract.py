"""Offline regression checks for the M@S configuration, without engine dependencies."""

import fnmatch
import json
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import urlsplit

import yaml


CONTRACT = Path(__file__).resolve().parents[1]


class OwnershipReferenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.contract = self.repo / ".pinata"
        shutil.copytree(CONTRACT, self.contract, ignore=shutil.ignore_patterns("__pycache__"))
        self.manifest_path = self.contract / "manifest.yaml"
        self.manifest = yaml.safe_load(self.manifest_path.read_text())

    def check(self, success, message=None):
        self.manifest_path.write_text(yaml.safe_dump(self.manifest))
        result = subprocess.run(
            [sys.executable, str(self.contract / "scripts/check-contract.py"), "--skip-registry"],
            text=True, capture_output=True, timeout=15,
        )
        self.assertEqual(result.returncode, 0 if success else 1, result.stdout + result.stderr)
        if message:
            self.assertIn(message, result.stdout)

    def test_omitted_ownership_is_explicitly_unconfigured(self):
        self.manifest.pop("owners_from", None)
        self.check(True, "repository ownership is not configured")

    def test_missing_ownership_file_fails(self):
        self.manifest["owners_from"] = "CODEOWNERS"
        self.check(False, "owners_from does not reference a file")

    def test_existing_root_ownership_file_passes(self):
        self.manifest["owners_from"] = "CODEOWNERS"
        (self.repo / "CODEOWNERS").write_text("* @example-team\n")
        self.check(True)

    def test_existing_nested_ownership_file_passes(self):
        self.manifest["owners_from"] = ".github/CODEOWNERS"
        (self.repo / ".github").mkdir()
        (self.repo / ".github/CODEOWNERS").write_text("* @example-team\n")
        self.check(True)

    def test_directory_is_not_an_ownership_file(self):
        self.manifest["owners_from"] = ".pinata"
        self.check(False, "owners_from does not reference a file")

    def test_invalid_reference_types_fail(self):
        for value in (None, "", [], 42):
            with self.subTest(value=value):
                self.manifest["owners_from"] = value
                self.check(False, "owners_from must name")

    def test_path_escape_fails(self):
        for value in ("../CODEOWNERS", str(self.repo / "CODEOWNERS")):
            with self.subTest(value=value):
                self.manifest["owners_from"] = value
                self.check(False, "owners_from must stay inside")

    def test_symlink_escape_fails(self):
        with tempfile.TemporaryDirectory() as external:
            target = Path(external) / "CODEOWNERS"
            target.write_text("* @example-team\n")
            (self.repo / "CODEOWNERS").symlink_to(target)
            self.manifest["owners_from"] = "CODEOWNERS"
            self.check(False, "owners_from does not reference a file")


class PreviewPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.gates = yaml.safe_load((CONTRACT / "gates.yaml").read_text())["gates"]
        cls.preview = yaml.safe_load((CONTRACT / "preview.yaml").read_text())

    def test_io_gate_is_first_and_requires_human_review(self):
        self.assertEqual(next(iter(self.gates)), "io-preview-support")
        gate = self.gates["io-preview-support"]
        self.assertEqual(gate["template"], "protected_paths")
        self.assertEqual(set(gate["paths"]), {"io/www", "io/studio"})
        self.assertIs(gate["blocking"], True)
        self.assertEqual(gate["failure_route"], "escalate_to_human")

    def test_io_files_do_not_select_production_surfaces(self):
        files = ["io/www/src/fragment/index.js", "io/studio/actions/save.js"]
        for surface in self.preview["surfaces"]:
            for path in files:
                with self.subTest(surface=surface["id"], path=path):
                    self.assertFalse(fnmatch.fnmatchcase(path, surface.get("match", "")))

    def test_pro_mapping_excludes_product_variant(self):
        surface = next(s for s in self.preview["surfaces"] if s["id"] == "dc-bizpro-plans")
        for filename in ("pro.js", "pro.css.js"):
            path = f"web-components/src/variants/{filename}"
            self.assertTrue((CONTRACT.parent / path).is_file())
            self.assertTrue(fnmatch.fnmatchcase(path, surface["match"]))
        for filename in ("product.js", "product.css.js", "bizpro.js"):
            self.assertFalse(fnmatch.fnmatchcase(f"web-components/src/variants/{filename}", surface["match"]))

    def test_public_catalog_hosts_also_accept_pasted_links(self):
        public_ids = ("cc-plans", "express-pricing", "milo-merch-kitchen-sink")
        public_hosts = [h for h in self.preview["capture_hosts"] if isinstance(h, str)]
        for surface in self.preview["surfaces"]:
            if surface["id"] in public_ids:
                host = urlsplit(surface["url"]).hostname
                self.assertTrue(any(host.endswith(h) for h in public_hosts), host)


class A11yTargetGateTests(unittest.TestCase):
    """The farm's target check: what the harness needs to verify a farm run, and to let it publish unattended."""

    @classmethod
    def setUpClass(cls):
        cls.gates = yaml.safe_load((CONTRACT / "gates.yaml").read_text())["gates"]
        cls.gate = cls.gates["a11y-target"]

    def test_is_a_blocking_command_gate_that_reads_the_work_item(self):
        self.assertEqual(self.gate["template"], "command")
        self.assertIs(self.gate["blocking"], True)
        self.assertIn("{work_item_file}", self.gate["cmd"])

    def test_runs_one_contract_script_directly(self):
        # Only `[interpreter] .pinata/<script>` with no shell syntax runs the base commit's pinned copy.
        self.assertEqual(shlex.split(self.gate["cmd"]), ["node", ".pinata/scripts/a11y-target.mjs", "{work_item_file}"])
        self.assertFalse(set(self.gate["cmd"]) & set(";&|`$><\n"))
        self.assertTrue((CONTRACT / "scripts/a11y-target.mjs").is_file())

    def test_violation_exit_code_is_the_scripts_and_one_the_harness_accepts(self):
        code = self.gate["violation_exit_code"]
        self.assertIs(type(code), int)
        self.assertTrue(2 <= code <= 125 and code != 124, code)
        self.assertIn(f"const VIOLATION = {code};", (CONTRACT / "scripts/a11y-target.mjs").read_text())

    def test_runs_after_dist_sync_and_before_the_adversary(self):
        order = list(self.gates)
        self.assertLess(order.index("dist-sync"), order.index("a11y-target"))
        self.assertEqual(order[-1], "adversary")


class ViolationExitCodeCheckTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.contract = Path(self.temp.name) / ".pinata"
        shutil.copytree(CONTRACT, self.contract, ignore=shutil.ignore_patterns("__pycache__"))
        self.gates_path = self.contract / "gates.yaml"
        self.gates = yaml.safe_load(self.gates_path.read_text())

    def check(self, **changes):
        self.gates["gates"]["a11y-target"].update(changes)
        self.gates_path.write_text(yaml.safe_dump(self.gates, sort_keys=False))
        return subprocess.run(
            [sys.executable, str(self.contract / "scripts/check-contract.py"), "--skip-registry"],
            text=True, capture_output=True, timeout=15,
        )

    def test_the_declared_gate_passes(self):
        result = self.check()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_a_code_the_harness_refuses_fails(self):
        for code in (0, 1, 124, 126, "3", True):
            with self.subTest(code=code):
                result = self.check(violation_exit_code=code)
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                self.assertIn("violation_exit_code must be an integer", result.stdout)

    def test_a_gate_that_does_not_read_the_work_item_cannot_declare_one(self):
        result = self.check(cmd="node .pinata/scripts/a11y-target.mjs")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("does not read {work_item_file}", result.stdout)


@unittest.skipUnless(shutil.which("node"), "node is not installed")
class A11yTargetScriptTests(unittest.TestCase):
    """Exit codes on the paths that need no browser: only 0 and 3 are verdicts."""

    TARGET = {
        "page": "https://main--mas--adobecom.aem.page/web-components/docs/plans.html",
        "element": "merch-card",
        "rule": "button-name",
        "state": "none",
    }

    def run_check(self, document):
        with tempfile.TemporaryDirectory() as checkout:
            item = Path(checkout) / "work-item.json"
            item.write_text(document if isinstance(document, str) else json.dumps(document))
            return subprocess.run(
                ["node", str(CONTRACT / "scripts/a11y-target.mjs"), str(item)],
                cwd=checkout, text=True, capture_output=True, timeout=30,
            )

    def test_a_run_without_a_required_work_item_passes(self):
        for document in ({"required": False}, {"ticket": "MWPW-1"}):
            with self.subTest(document=document):
                result = self.run_check(document)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_an_unreadable_work_item_is_not_a_verdict(self):
        broken = (
            "not json",
            [],
            {"required": True},
            {"required": True, "target": {**self.TARGET, "rule": "Button Name"}},
            {"required": True, "target": {**self.TARGET, "state": "pressed"}},
            {"required": True, "target": {**self.TARGET, "page": "http://main--mas--adobecom.aem.page/"}},
        )
        for document in broken:
            with self.subTest(document=document):
                result = self.run_check(document)
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)

    def test_a_page_no_mas_branch_host_serves_is_not_a_verdict(self):
        page = "https://main--cc--adobecom.aem.live/creativecloud/plans"
        result = self.run_check({"required": True, "target": {**self.TARGET, "page": page}})
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("not on a MAS branch host", result.stdout)

    def test_a_checkout_without_its_dependencies_is_not_a_verdict(self):
        result = self.run_check({"required": True, "target": self.TARGET})
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("Could not check the target", result.stdout)


if __name__ == "__main__":
    unittest.main()
