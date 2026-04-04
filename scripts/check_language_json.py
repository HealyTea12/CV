#!/usr/bin/env python3
"""Validate that localized CV JSON files keep the same structure."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def compare_structure(reference: Any, candidate: Any, path: str = "$") -> list[str]:
    errors: list[str] = []

    if type(reference) is not type(candidate):
        errors.append(
            f"{path}: type mismatch ({type(reference).__name__} vs {type(candidate).__name__})"
        )
        return errors

    if isinstance(reference, dict):
        reference_keys = set(reference)
        candidate_keys = set(candidate)

        missing_keys = sorted(reference_keys - candidate_keys)
        extra_keys = sorted(candidate_keys - reference_keys)

        if missing_keys:
            errors.append(f"{path}: missing keys in candidate: {', '.join(missing_keys)}")
        if extra_keys:
            errors.append(f"{path}: extra keys in candidate: {', '.join(extra_keys)}")

        for key in sorted(reference_keys & candidate_keys):
            errors.extend(compare_structure(reference[key], candidate[key], f"{path}.{key}"))
        return errors

    if isinstance(reference, list):
        if len(reference) != len(candidate):
            errors.append(
                f"{path}: list length mismatch ({len(reference)} vs {len(candidate)})"
            )
            return errors

        for index, (reference_item, candidate_item) in enumerate(zip(reference, candidate)):
            errors.extend(compare_structure(reference_item, candidate_item, f"{path}[{index}]"))
        return errors

    return errors


def load_json_file(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check that localized CV JSON files share the same structure."
    )
    parser.add_argument(
        "directory",
        nargs="?",
        default="data",
        help="Directory containing localized JSON files (default: data)",
    )
    args = parser.parse_args()

    directory = Path(args.directory)
    if not directory.is_dir():
        print(f"Error: {directory} is not a directory.", file=sys.stderr)
        return 1

    json_files = sorted(directory.glob("*.json"))
    if len(json_files) < 2:
        print("Error: expected at least two JSON files for comparison.", file=sys.stderr)
        return 1

    reference_file = json_files[0]
    reference_data = load_json_file(reference_file)

    if not isinstance(reference_data, dict):
        print(f"Error: {reference_file} does not contain a JSON object.", file=sys.stderr)
        return 1

    all_errors: list[str] = []

    reference_lang = reference_data.get("meta", {}).get("lang")
    if reference_lang and reference_lang != reference_file.stem:
        all_errors.append(
            f"{reference_file}: meta.lang is {reference_lang!r}, expected {reference_file.stem!r}"
        )

    for candidate_file in json_files[1:]:
        candidate_data = load_json_file(candidate_file)
        if not isinstance(candidate_data, dict):
            all_errors.append(f"{candidate_file}: does not contain a JSON object")
            continue

        candidate_lang = candidate_data.get("meta", {}).get("lang")
        if candidate_lang and candidate_lang != candidate_file.stem:
            all_errors.append(
                f"{candidate_file}: meta.lang is {candidate_lang!r}, expected {candidate_file.stem!r}"
            )

        all_errors.extend(compare_structure(reference_data, candidate_data, path=str(candidate_file)))

    if all_errors:
        print("Localized JSON files are inconsistent:", file=sys.stderr)
        for error in all_errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Validated {len(json_files)} JSON files in {directory}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
