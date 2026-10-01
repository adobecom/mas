#!/usr/bin/env bash
# Exercises .pinata/scripts/deploy-candidate-io.sh, the io-studio-candidate gate.
#
# Hermetic: `git`, `gh` and `sleep` are shims on PATH, so no workflow is ever
# dispatched and nothing waits. The `gh` shim answers `--jq` by running the real
# jq over canned JSON, so the script's run-selection filter is itself under test.
#
# Usage: .pinata/scripts/test-deploy-candidate-io.sh
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1

SCRIPT=.pinata/scripts/deploy-candidate-io.sh
WORK=$(mktemp -d)
BIN="$WORK/bin"
mkdir -p "$BIN"
trap 'rm -rf "$WORK"' EXIT
export WORK
failures=0

cat >"$BIN/git" <<'SH'
#!/usr/bin/env bash
case "$*" in
    'rev-parse --abbrev-ref HEAD') echo "$FAKE_BRANCH" ;;
    'rev-parse HEAD') echo "$FAKE_SHA" ;;
    ls-remote*) [ -n "$FAKE_REMOTE_SHA" ] && printf '%s\trefs/heads/%s\n' "$FAKE_REMOTE_SHA" "$FAKE_BRANCH" ;;
    *) echo "unexpected git $*" >&2; exit 2 ;;
esac
exit 0
SH

cat >"$BIN/gh" <<'SH'
#!/usr/bin/env bash
echo "gh $*" >>"$WORK/gh.log"
jq_expr=""
args=("$@")
for i in "${!args[@]}"; do
    [ "${args[$i]}" = "--jq" ] && jq_expr="${args[$((i + 1))]}"
done
case "$1 $2" in
    'workflow run') touch "$WORK/dispatched" ;;
    'run list')
        if [ -e "$WORK/dispatched" ]; then runs="$FAKE_RUNS_AFTER"; else runs="$FAKE_RUNS_BEFORE"; fi
        echo "$runs" | jq -r "$jq_expr" ;;
    'run watch')
        # Simulates the engine stopping the gate while it waits on the run.
        [ -n "$FAKE_WATCH_SIGNAL" ] && kill "-$FAKE_WATCH_SIGNAL" "$PPID"
        exit "$FAKE_WATCH_EXIT" ;;
    'run view')
        if [ -n "$jq_expr" ]; then
            echo "{\"conclusion\":\"$FAKE_CONCLUSION\"}" | jq -r "$jq_expr"
        else
            echo "npm test: 3 failing"
        fi ;;
    'run cancel') ;;
    *) echo "unexpected gh $*" >&2; exit 2 ;;
esac
SH

printf '#!/usr/bin/env bash\nexit 0\n' >"$BIN/sleep"
chmod +x "$BIN"/*

defaults() {
    export FAKE_BRANCH=MWPW-123456 FAKE_SHA=abc123 FAKE_REMOTE_SHA=abc123 FAKE_WATCH_EXIT=0
    export FAKE_WATCH_SIGNAL="" FAKE_CONCLUSION=failure
    export FAKE_RUNS_BEFORE='[{"databaseId":100,"headSha":"abc123"}]'
    export FAKE_RUNS_AFTER='[{"databaseId":101,"headSha":"abc123"},{"databaseId":100,"headSha":"abc123"}]'
}

# run_case <name> <expected exit> <expected output substring> <changed file>...
run_case() {
    local name="$1" expected_exit="$2" expected_out="$3"
    shift 3
    rm -f "$WORK/gh.log" "$WORK/dispatched"
    local out code
    out=$(PATH="$BIN:$PATH" bash "$SCRIPT" "$@" 2>&1)
    code=$?
    if [ "$code" -ne "$expected_exit" ] || ! grep -qF -- "$expected_out" <<<"$out"; then
        echo "FAIL: $name (exit $code, want $expected_exit; want output containing '$expected_out')" >&2
        sed 's/^/    /' <<<"$out" >&2
        failures=$((failures + 1))
        return 1
    fi
    echo "ok: $name"
}

# log_lacks <name> <substring>: the gh shim was never asked for <substring>
log_lacks() {
    if [ -e "$WORK/gh.log" ] && grep -qF -- "$2" "$WORK/gh.log"; then
        echo "FAIL: $1 (gh was called with '$2')" >&2
        failures=$((failures + 1))
    fi
}

log_has() {
    if ! grep -qF -- "$2" "$WORK/gh.log" 2>/dev/null; then
        echo "FAIL: $1 (gh was never called with '$2')" >&2
        failures=$((failures + 1))
    fi
}

defaults
run_case "skips without io/studio files" 0 "SKIP: no io/studio changes" \
    studio/src/editors/merch-card-editor.js io/www/src/fragment/pipeline.js
log_lacks "skip dispatches nothing" "workflow run"

defaults
export FAKE_REMOTE_SHA=def456
run_case "refuses an unpushed candidate" 1 "is not pushed at abc123" io/studio/src/custom-field-audit/index.js
log_lacks "unpushed dispatches nothing" "workflow run"

defaults
export FAKE_BRANCH=HEAD
run_case "refuses a detached HEAD" 1 "detached HEAD" io/studio/src/custom-field-audit/index.js
log_lacks "detached dispatches nothing" "workflow run"

defaults
run_case "deploys and waits on the new run" 0 "OK: io/studio candidate deployed" \
    io/studio/src/custom-field-audit/index.js
log_has "dispatches the candidate branch" "workflow run io-studio-candidate.yaml --ref MWPW-123456"
log_has "watches the new run" "run watch 101"

defaults
export FAKE_RUNS_AFTER="$FAKE_RUNS_BEFORE"
run_case "ignores an older run for the same commit" 1 "run appeared for abc123" \
    io/studio/src/custom-field-audit/index.js
log_lacks "never watches the stale run" "run watch 100"

defaults
export FAKE_RUNS_AFTER='[{"databaseId":101,"headSha":"fff999"},{"databaseId":100,"headSha":"abc123"}]'
run_case "ignores a newer run for a different commit" 1 "run appeared for abc123" \
    io/studio/src/custom-field-audit/index.js
log_lacks "never watches the other commit's run" "run watch 101"

defaults
export FAKE_WATCH_EXIT=1
run_case "surfaces the failed run log" 1 "npm test: 3 failing" io/studio/src/custom-field-audit/index.js

defaults
export FAKE_WATCH_EXIT=1 FAKE_CONCLUSION=cancelled
run_case "explains a run replaced by a newer deploy" 1 "was cancelled" io/studio/src/custom-field-audit/index.js
log_lacks "skips the empty failed-step log" "--log-failed"

defaults
export FAKE_WATCH_SIGNAL=TERM
run_case "fails when the gate is stopped mid-wait" 1 "Waiting on" io/studio/src/custom-field-audit/index.js
log_has "cancels the run it was waiting on" "run cancel 101"

if [ "$failures" -ne 0 ]; then
    echo "$failures failure(s)" >&2
    exit 1
fi
echo "all deploy-candidate-io cases passed"
