#!/usr/bin/env bash
# Exercises .pinata/scripts/deploy-candidate-io.sh, the io-studio-candidate gate.
#
# Hermetic: `git`, `gh` and `sleep` are shims on PATH, so no real workflow is ever
# dispatched. Cancellation cases deliberately block on FIFOs. The `gh` shim runs
# real jq over canned JSON, so the script's run-selection filter is itself under test.
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
        # The first FAKE_WATCH_DROPS watches lose the connection before the run ends.
        count=$(( $(cat "$WORK/watch_count" 2>/dev/null || echo 0) + 1 ))
        echo "$count" >"$WORK/watch_count"
        if [ "$FAKE_BLOCK_AT" = watch ]; then
            echo "$$" >"$WORK/blocked_pid"
            printf 'ready\n' >"$WORK/ready"
            read -r release <"$WORK/release"
        fi
        # Simulates the engine stopping the gate while it waits on the run.
        [ -n "$FAKE_WATCH_SIGNAL" ] && kill "-$FAKE_WATCH_SIGNAL" "$PPID"
        [ "$count" -le "$FAKE_WATCH_DROPS" ] && exit 1
        exit 0 ;;
    'run view')
        if [ -n "$jq_expr" ]; then
            count=$(cat "$WORK/watch_count" 2>/dev/null || echo 0)
            if [ "$count" -gt "$FAKE_WATCH_DROPS" ]; then status=completed; else status=in_progress; fi
            echo "{\"status\":\"$status\",\"conclusion\":\"$FAKE_CONCLUSION\"}" | jq -r "$jq_expr"
        else
            echo "npm test: 3 failing"
        fi ;;
    'run cancel') exit "$FAKE_CANCEL_EXIT" ;;
    *) echo "unexpected gh $*" >&2; exit 2 ;;
esac
SH

cat >"$BIN/sleep" <<'SH'
#!/usr/bin/env bash
if [ "$FAKE_BLOCK_AT" = poll ] && [ "$1" = 15 ]; then
    echo "$$" >"$WORK/blocked_pid"
    printf 'ready\n' >"$WORK/ready"
    read -r release <"$WORK/release"
fi
SH
chmod +x "$BIN"/*

defaults() {
    export FAKE_BRANCH=MWPW-123456 FAKE_SHA=abc123 FAKE_REMOTE_SHA=abc123
    export FAKE_WATCH_SIGNAL="" FAKE_WATCH_DROPS=0 FAKE_CONCLUSION=success FAKE_BLOCK_AT="" FAKE_CANCEL_EXIT=0
    export FAKE_RUNS_BEFORE='[{"databaseId":100,"headSha":"abc123"}]'
    export FAKE_RUNS_AFTER='[{"databaseId":101,"headSha":"abc123"},{"databaseId":100,"headSha":"abc123"}]'
}

# run_case <name> <expected exit> <expected output substring> <changed file>...
run_case() {
    local name="$1" expected_exit="$2" expected_out="$3"
    shift 3
    rm -f "$WORK/gh.log" "$WORK/dispatched" "$WORK/watch_count"
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
export FAKE_CONCLUSION=failure
run_case "surfaces the failed run log" 1 "npm test: 3 failing" io/studio/src/custom-field-audit/index.js

defaults
export FAKE_CONCLUSION=cancelled
run_case "explains a run replaced by a newer deploy" 1 "was cancelled" io/studio/src/custom-field-audit/index.js
log_lacks "skips the empty failed-step log" "--log-failed"

defaults
export FAKE_WATCH_DROPS=1
run_case "rides out a dropped watch connection" 0 "OK: io/studio candidate deployed" \
    io/studio/src/custom-field-audit/index.js

defaults
export FAKE_WATCH_DROPS=99
run_case "gives up after repeated dropped watches" 1 "lost track of" io/studio/src/custom-field-audit/index.js

defaults
export FAKE_WATCH_SIGNAL=TERM
run_case "fails when the gate is stopped mid-wait" 143 "Waiting on" io/studio/src/custom-field-audit/index.js
log_has "cancels the run it was waiting on" "run cancel 101"

defaults
export FAKE_WATCH_SIGNAL=TERM FAKE_CANCEL_EXIT=1
run_case "reports a rejected remote cancellation" 143 "could not cancel" io/studio/src/custom-field-audit/index.js

defaults
export SCRIPT BIN
python3 - <<'PY'
import os
from pathlib import Path
import select
import signal
import subprocess
import sys

work = Path(os.environ["WORK"])
failures = 0
for phase in ("watch", "poll"):
    for received_signal, expected_exit in ((signal.SIGTERM, 143), (signal.SIGINT, 130)):
        for name in ("gh.log", "dispatched", "watch_count", "blocked_pid"):
            (work / name).unlink(missing_ok=True)
        for name in ("ready", "release"):
            os.mkfifo(work / name)
        ready = os.open(work / "ready", os.O_RDWR | os.O_NONBLOCK)
        env = dict(os.environ, PATH=f'{os.environ["BIN"]}:{os.environ["PATH"]}',
                   FAKE_BLOCK_AT=phase, FAKE_WATCH_DROPS="99" if phase == "poll" else "0")
        process = subprocess.Popen(
            ["bash", os.environ["SCRIPT"], "io/studio/src/custom-field-audit/index.js"],
            env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        )
        name = f"interrupts blocked {phase} with {received_signal.name}"
        try:
            if not select.select([ready], [], [], 3)[0]:
                raise AssertionError("child did not reach the readiness handshake")
            os.read(ready, 128)
            process.send_signal(received_signal)
            try:
                actual_exit = process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                raise AssertionError("gate did not cancel before the blocked child was released") from None
            if actual_exit != expected_exit:
                raise AssertionError(f"exit {actual_exit}, want {expected_exit}")
            if "run cancel 101" not in (work / "gh.log").read_text():
                raise AssertionError("known remote run was not cancelled")
            print(f"ok: {name}")
        except AssertionError as error:
            failures += 1
            print(f"FAIL: {name}: {error}", file=sys.stderr)
        finally:
            if (work / "blocked_pid").exists():
                try:
                    os.kill(int((work / "blocked_pid").read_text()), signal.SIGTERM)
                except ProcessLookupError:
                    pass
            if process.poll() is None:
                process.kill()
            process.communicate(timeout=3)
            os.close(ready)
            for fifo in ("ready", "release"):
                (work / fifo).unlink()
sys.exit(bool(failures))
PY
signal_status=$?
if [ "$signal_status" -ne 0 ]; then
    failures=$((failures + 1))
fi

if [ "$failures" -ne 0 ]; then
    echo "$failures failure(s)" >&2
    exit 1
fi
echo "all deploy-candidate-io cases passed"
