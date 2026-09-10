"""Offline regression checks for the M@S configuration, without engine dependencies."""

import fnmatch
from pathlib import Path
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


if __name__ == "__main__":
    unittest.main()
