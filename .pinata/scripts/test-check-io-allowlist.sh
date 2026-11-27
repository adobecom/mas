#!/usr/bin/env bash
# Exercises .pinata/scripts/check-io-allowlist.sh, the io-preview-support gate.
#
# Hermetic: every case runs the real script and allowlist in a throwaway checkout that
# contains exactly the files the case says exist, so deletions (a changed file that is
# missing from the checkout) and new files can be expressed directly.
#
# Usage: .pinata/scripts/test-check-io-allowlist.sh
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
ROOT=$(pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
failures=0

# run_gate <present files, ;-separated> <changed files...>: sets out and code from the caller's scope.
run_gate() {
    local present=$1 repo="$WORK/$RANDOM$RANDOM" file
    shift
    mkdir -p "$repo/.pinata/scripts"
    cp "$ROOT/.pinata/scripts/check-io-allowlist.sh" "$repo/.pinata/scripts/"
    cp "$ROOT/.pinata/io-allowlist.txt" "$repo/.pinata/"
    local IFS=';'
    for file in $present; do
        [ -n "$file" ] || continue
        mkdir -p "$repo/$(dirname "$file")"
        : > "$repo/$file"
    done
    unset IFS
    out=$(bash "$repo/.pinata/scripts/check-io-allowlist.sh" "$@" 2>&1)
    code=$?
}

# check <name> <expected exit> <expected output substring | -> <present files, ;-separated> -- <changed files...>
check() {
    local name=$1 want_exit=$2 want_text=$3 present=$4 out code
    shift 5
    run_gate "$present" "$@"
    if [ "$code" != "$want_exit" ]; then
        echo "FAIL: $name: exit $code, want $want_exit"$'\n'"$out"
        failures=$((failures + 1))
    elif [ "$want_text" != "-" ] && ! grep -qF -- "$want_text" <<<"$out"; then
        echo "FAIL: $name: output lacks '$want_text'"$'\n'"$out"
        failures=$((failures + 1))
    else
        echo "ok: $name"
    fi
}

# not_in_output <name> <text> <present> -- <changed...>: the gate fails but must not list <text>.
not_in_output() {
    local name=$1 text=$2 present=$3 out code
    shift 4
    run_gate "$present" "$@"
    if grep -qF -- "$text" <<<"$out"; then
        echo "FAIL: $name: output lists allowlisted '$text'"$'\n'"$out"
        failures=$((failures + 1))
    else
        echo "ok: $name"
    fi
}

LOCALES_WWW=io/www/src/fragment/locales.js
LOCALES_STUDIO=io/studio/src/locales.js

check "no changed files" 0 "no IO change" "" --
check "non-IO change only" 0 "no IO change" "web-components/src/merch-card.js" -- web-components/src/merch-card.js
check "both locale tables" 0 "no IO change" "$LOCALES_WWW;$LOCALES_STUDIO" -- "$LOCALES_WWW" "$LOCALES_STUDIO"
check "IO tests only" 0 "no IO change" "io/www/test/fragment/locales.test.js;io/studio/test/cleanup-variations/index.test.js" -- \
    io/www/test/fragment/locales.test.js io/studio/test/cleanup-variations/index.test.js
check "nested test path (** semantics)" 0 "no IO change" "io/www/test/fragment/deep/nested/x.test.js" -- io/www/test/fragment/deep/nested/x.test.js
check "file name with a space" 0 "no IO change" "io/www/test/fragment/a b.test.js" -- "io/www/test/fragment/a b.test.js"
check "MWPW-214992 replay" 0 "no IO change" \
    "$LOCALES_WWW;$LOCALES_STUDIO;io/www/test/fragment/locales.test.js;io/studio/test/cleanup-variations/index.test.js" -- \
    "$LOCALES_WWW" "$LOCALES_STUDIO" io/www/test/fragment/locales.test.js io/studio/test/cleanup-variations/index.test.js

check "locales plus a transformer" 1 "outside .pinata/io-allowlist.txt: io/www/src/fragment/transformers/corrector.js" \
    "$LOCALES_WWW;io/www/src/fragment/transformers/corrector.js" -- "$LOCALES_WWW" io/www/src/fragment/transformers/corrector.js
not_in_output "mixed change does not list the allowlisted file" "$LOCALES_WWW" \
    "$LOCALES_WWW;io/www/src/fragment/transformers/corrector.js" -- "$LOCALES_WWW" io/www/src/fragment/transformers/corrector.js
check "new IO file" 1 "outside .pinata/io-allowlist.txt: io/www/src/fragment/new-step.js" \
    "io/www/src/fragment/new-step.js" -- io/www/src/fragment/new-step.js
check "IO config" 1 "outside .pinata/io-allowlist.txt: io/www/app.config.yaml" "io/www/app.config.yaml" -- io/www/app.config.yaml
check "near-miss of an exact entry" 1 "outside .pinata/io-allowlist.txt: io/www/src/fragment/locales.js.orig" \
    "io/www/src/fragment/locales.js.orig" -- io/www/src/fragment/locales.js.orig
check "Studio IO source" 1 "outside .pinata/io-allowlist.txt: io/studio/src/ai-chat/index.js" "io/studio/src/ai-chat/index.js" -- io/studio/src/ai-chat/index.js
check "deleted IO test" 1 "deleted: io/www/test/fragment/locales.test.js" "" -- io/www/test/fragment/locales.test.js
check "deleted locale table" 1 "deleted: $LOCALES_STUDIO" "" -- "$LOCALES_STUDIO"

# #1629 (plans-card CSS that drifted into io/www) must still stop, naming the IO logic it touched.
PR1629_PRESENT="$LOCALES_STUDIO;$LOCALES_WWW;io/www/src/fragment/transformers/corrector.js;io/www/src/fragment/utils/countdown.js;io/www/test/fragment/corrector.test.js;io/www/test/fragment/countdown.test.js;io/www/test/fragment/customize.test.js;io/www/test/fragment/locales.test.js;io/www/test/fragment/pipeline-e2e.test.js;web-components/src/merch-card.js"
PR1629_CHANGED=("$LOCALES_STUDIO" "$LOCALES_WWW" io/www/src/fragment/transformers/corrector.js io/www/src/fragment/utils/countdown.js \
    io/www/test/fragment/corrector.test.js io/www/test/fragment/countdown.test.js io/www/test/fragment/customize.test.js \
    io/www/test/fragment/locales.test.js io/www/test/fragment/pipeline-e2e.test.js web-components/src/merch-card.js)
check "#1629 replay names corrector.js" 1 "outside .pinata/io-allowlist.txt: io/www/src/fragment/transformers/corrector.js" \
    "$PR1629_PRESENT" -- "${PR1629_CHANGED[@]}"
check "#1629 replay names countdown.js" 1 "outside .pinata/io-allowlist.txt: io/www/src/fragment/utils/countdown.js" \
    "$PR1629_PRESENT" -- "${PR1629_CHANGED[@]}"

if [ "$failures" -gt 0 ]; then
    echo "$failures case(s) failed"
    exit 1
fi
echo "all cases passed"
