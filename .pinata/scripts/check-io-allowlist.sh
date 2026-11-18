#!/usr/bin/env bash
# io-preview-support gate: changed io/www and io/studio files must match .pinata/io-allowlist.txt.
#
# Usage (gates.yaml): bash .pinata/scripts/check-io-allowlist.sh {changed_files}
# Exit 0: no IO file changed, or every changed IO file is allowlisted and still present.
# Exit 1: prints the IO files outside the allowlist and the IO files the change deletes;
#         the harness then escalates to a human (failure_route: escalate_to_human).
# The result depends only on the arguments and the checkout, so the gate sets
# waive_preexisting: false: re-running it on the base commit would fail the same way.
set -eo pipefail
cd "$(dirname "$0")/../.."

patterns=()
while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [ -n "$line" ] && patterns+=("$line")
done < .pinata/io-allowlist.txt

outside=()
deleted=()
for file in "$@"; do
    case "$file" in
        io/www/* | io/studio/*) ;;
        *) continue ;;
    esac
    # {changed_files} includes deletions; a deleted IO file always needs a human.
    if [ ! -e "$file" ]; then
        deleted+=("$file")
        continue
    fi
    allowed=false
    for pattern in "${patterns[@]}"; do
        # shellcheck disable=SC2254 # the allowlist entries are globs on purpose
        case "$file" in
            $pattern)
                allowed=true
                break
                ;;
        esac
    done
    $allowed || outside+=("$file")
done

if [ ${#outside[@]} -eq 0 ] && [ ${#deleted[@]} -eq 0 ]; then
    echo "io-preview-support: no IO change needs manual verification"
    exit 0
fi
echo "io-preview-support: IO changes need manual verification (no candidate IO preview)"
for file in ${outside[@]+"${outside[@]}"}; do
    echo "  outside .pinata/io-allowlist.txt: $file"
done
for file in ${deleted[@]+"${deleted[@]}"}; do
    echo "  deleted: $file"
done
exit 1
