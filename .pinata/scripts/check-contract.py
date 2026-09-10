#!/usr/bin/env python3
"""Reference-integrity check for the .pinata/ tenant contract (R-14).

Validates that the contract files parse with their required shapes, and that
every mental-model id declared in manifest.yaml resolves to a directory in the
shared registry (Adobe-acom/pinata-tool-shelf). Contract-shape problems always
fail; the registry check degrades to a warning when the registry cannot be
cloned (e.g. no token in a fork's CI).
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

FIESTA = Path(__file__).resolve().parents[1]
REGISTRY_URL = "https://github.com/Adobe-acom/pinata-tool-shelf.git"
errors: list[str] = []
parser = argparse.ArgumentParser(description=__doc__)
registry_options = parser.add_mutually_exclusive_group()
registry_options.add_argument("--registry", type=Path, help="Existing pinata-tool-shelf checkout")
registry_options.add_argument("--skip-registry", action="store_true", help="Validate configuration offline; model availability is not checked")
args = parser.parse_args()


def _load(name: str, required: bool = False) -> dict | None:
    path = FIESTA / name
    if not path.exists():
        if required:
            errors.append(f"{name}: missing (required)")
        return None
    try:
        data = yaml.safe_load(path.read_text())
    except yaml.YAMLError as exc:
        errors.append(f"{name}: malformed YAML: {exc}")
        return None
    if not isinstance(data, dict):
        errors.append(f"{name}: must be a mapping")
        return None
    return data


manifest = _load("manifest.yaml", required=True) or {}
for field in ("org", "product", "repo"):
    if not manifest.get(field):
        errors.append(f"manifest.yaml: missing required field '{field}'")

# An omitted source is explicitly unconfigured, not a claim of ownership.
# Validate declared references without inventing or assigning repository owners.
if "owners_from" not in manifest:
    print("NOTE: repository ownership is not configured (owners_from omitted)")
else:
    owner_source = manifest["owners_from"]
    repo_root = FIESTA.parent.resolve()
    if not isinstance(owner_source, str) or not owner_source.strip():
        errors.append("manifest.yaml: owners_from must name a repository-relative ownership file")
    elif Path(owner_source).is_absolute() or ".." in Path(owner_source).parts:
        errors.append("manifest.yaml: owners_from must stay inside the repository")
    else:
        owner_path = (repo_root / owner_source).resolve()
        if not owner_path.is_relative_to(repo_root) or not owner_path.is_file():
            errors.append(f"manifest.yaml: owners_from does not reference a file inside the repository: {owner_source}")

gates = _load("gates.yaml")
if gates is not None:
    for gate_id, defn in (gates.get("gates") or {}).items():
        if not isinstance(defn, dict) or not defn.get("template"):
            errors.append(f"gates.yaml: gate '{gate_id}' needs a template")


def _regeneration_max(document: dict | None, label: str) -> int | None:
    if document is None or "regeneration" not in document:
        return None
    policy = document["regeneration"]
    if not isinstance(policy, dict):
        errors.append(f"{label}: regeneration must be a mapping")
        return None
    unknown = sorted(set(policy) - {"max_candidates"})
    if unknown:
        errors.append(f"{label}: regeneration has unknown fields {unknown}")
    value = policy.get("max_candidates")
    if type(value) is not int or value < 1:
        errors.append(f"{label}: regeneration.max_candidates must be a positive integer")
        return None
    return value


def _route(defn: dict) -> str:
    # Mirrors the harness default: an unset failure_route is the strictest.
    return defn.get("failure_route") or "escalate_to_human"


def _autonomous_route(defn: dict) -> bool:
    return _route(defn) in {"repair_loop", "regenerate"}


# INV-3 monotonic strictness (R-8): tenant gates may only tighten the org
# floor, never weaken it. The floor snapshot is vendored at
# .pinata/floor/gates.yaml (source of truth: fiesta config/floors/<org>/ —
# the harness enforces THAT one at run time; this lint catches a weakening
# PR in CI before it ever reaches a run).
floor = _load("floor/gates.yaml")
tenant_regeneration_max = _regeneration_max(gates, "gates.yaml")
floor_regeneration_max = _regeneration_max(floor, "floor/gates.yaml")
if floor is None:
    print("WARN: no .pinata/floor/gates.yaml snapshot — INV-3 strictness lint skipped")
elif gates is not None:
    if (
        floor_regeneration_max is not None
        and tenant_regeneration_max is not None
        and tenant_regeneration_max > floor_regeneration_max
    ):
        errors.append(
            "gates.yaml: regeneration.max_candidates "
            f"{tenant_regeneration_max} exceeds the org floor ceiling "
            f"{floor_regeneration_max} (INV-3)"
        )
    tenant_gates = gates.get("gates") or {}
    for name, fdef in (floor.get("gates") or {}).items():
        tdef = tenant_gates.get(name)
        if not isinstance(tdef, dict):
            errors.append(f"gates.yaml: gate '{name}' is required by the org floor but missing (INV-3)")
            continue
        if tdef.get("template") != fdef.get("template"):
            errors.append(
                f"gates.yaml: gate '{name}' changes the org floor template "
                f"'{fdef.get('template')}' to '{tdef.get('template')}' (INV-3)"
            )
        if fdef.get("blocking", True) and not tdef.get("blocking", True):
            errors.append(f"gates.yaml: gate '{name}' is blocking in the org floor but advisory here (INV-3)")
        if fdef.get("threshold") is not None and (
            tdef.get("threshold") is None or tdef["threshold"] < fdef["threshold"]
        ):
            errors.append(
                f"gates.yaml: gate '{name}' drops or lowers the org floor threshold {fdef['threshold']} (INV-3)"
            )
        if not _autonomous_route(fdef) and _autonomous_route(tdef):
            errors.append(
                f"gates.yaml: gate '{name}' downgrades the org floor failure_route "
                f"to autonomous {_route(tdef)} (INV-3)"
            )
        if fdef.get("require_human", True) and not tdef.get("require_human", True):
            errors.append(f"gates.yaml: gate '{name}' drops require_human, which the org floor mandates (INV-3)")

preview = _load("preview.yaml")
if preview is not None:
    if not preview.get("pin_pattern"):
        errors.append("preview.yaml: missing pin_pattern")
    for i, surface in enumerate(preview.get("surfaces") or []):
        label = f"preview.yaml: surfaces[{i}]"
        if not isinstance(surface, dict) or not surface.get("id"):
            errors.append(f"{label}: needs an id")
            continue
        if bool(surface.get("page")) == bool(surface.get("url")):
            errors.append(f"preview.yaml: surface '{surface['id']}' needs exactly one of page/url")
        if not surface.get("description"):
            errors.append(
                f"preview.yaml: surface '{surface['id']}' needs a description "
                "(the selector's only page signal)"
            )

pr = _load("pr.yaml")
if pr is not None and not pr.get("template"):
    errors.append("pr.yaml: missing template")

for wf in sorted((FIESTA / "workflows").glob("*.yaml")) if (FIESTA / "workflows").is_dir() else []:
    try:
        data = yaml.safe_load(wf.read_text()) or {}
        if not data.get("workflow_id"):
            errors.append(f"workflows/{wf.name}: missing workflow_id")
    except yaml.YAMLError as exc:
        errors.append(f"workflows/{wf.name}: malformed YAML: {exc}")

ids = [str(i) for i in ((manifest.get("mental_models") or {}).get("use") or [])]
if ids and args.skip_registry:
    print("NOTE: model registry check explicitly skipped (offline configuration check)")
elif ids and args.registry:
    model_root = args.registry / "mental-models"
    available = {p.name for p in model_root.iterdir() if p.is_dir()} if model_root.is_dir() else set()
    dangling = [i for i in ids if i not in available]
    if dangling:
        errors.append(f"manifest.yaml: mental-model IDs absent from {model_root}: {dangling}")
elif ids:
    with tempfile.TemporaryDirectory() as tmp:
        clone = subprocess.run(
            ["git", "clone", "--depth", "1", REGISTRY_URL, tmp],
            capture_output=True, text=True, timeout=120,
        )
        if clone.returncode != 0:
            print(f"WARN: could not clone the mental-model registry — id check skipped:\n{clone.stderr[-300:]}")
        else:
            available = {p.name for p in (Path(tmp) / "mental-models").iterdir() if p.is_dir()}
            dangling = [i for i in ids if i not in available]
            if dangling:
                errors.append(
                    f"manifest.yaml: mental_models.use ids not in the registry: {dangling} "
                    f"(available: {sorted(available)})"
                )

if errors:
    print("fiesta contract check FAILED:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print("fiesta contract check passed")
