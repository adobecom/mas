#!/usr/bin/env bash
# io-studio-candidate gate: deploy a candidate's io/studio changes to the shared
# bot workspace through CI (.github/workflows/io-studio-candidate.yaml), then wait
# for unit tests, deploy and health check. Piñata never holds runtime credentials:
# the dispatched workflow reads them from Vault on the self-hosted runner.
#
# Usage: deploy-candidate-io.sh <changed file>...
set -euo pipefail
cd "$(dirname "$0")/../.."

WORKFLOW=io-studio-candidate.yaml
RUN_LOOKUP_ATTEMPTS=30
WATCH_ATTEMPTS=5

touches_io_studio=0
for file in "$@"; do
    case "$file" in
        io/studio/*) touches_io_studio=1 ;;
    esac
done
if [ "$touches_io_studio" -eq 0 ]; then
    echo "SKIP: no io/studio changes"
    exit 0
fi

branch=$(git rev-parse --abbrev-ref HEAD)
sha=$(git rev-parse HEAD)
if [ "$branch" = "HEAD" ]; then
    echo "FAIL: detached HEAD; the candidate must be on a pushed branch." >&2
    exit 1
fi
remote_sha=$(git ls-remote origin "refs/heads/$branch" | cut -f1)
if [ "$remote_sha" != "$sha" ]; then
    echo "FAIL: $branch is not pushed at $sha (origin has '${remote_sha:-nothing}')." >&2
    exit 1
fi

# If the engine stops this gate (timeout, abort), don't leave the run deploying
# behind it: a retry would queue behind the orphan in the same concurrency group.
# The trap goes in before dispatch, so a stop while looking up the run still cancels it.
child_pid=""
run_child() {
    "$@" &
    child_pid=$!
    local child_status=0
    wait "$child_pid" || child_status=$?
    child_pid=""
    return "$child_status"
}

# workflow_dispatch returns no run id: tag the dispatch with a unique id that the
# workflow puts in its run name, so concurrent dispatches on one commit stay apart.
dispatch_id="$(date +%s)-$$-$RANDOM"
dispatched=0
run_id=""
find_run() {
    gh run list --workflow "$WORKFLOW" --branch "$branch" --event workflow_dispatch \
        --json databaseId,headSha,displayTitle \
        --jq "[.[] | select(.headSha == \"$sha\" and (.displayTitle | endswith(\" $dispatch_id\")))][0].databaseId // empty"
}

stop_gate() {
    local exit_code="$1"
    trap - TERM INT
    if [ -n "$child_pid" ] && kill -0 "$child_pid" 2>/dev/null; then
        if ! kill -TERM "$child_pid" 2>/dev/null; then
            echo "WARN: could not stop gate child $child_pid." >&2
        fi
    fi
    if [ -z "$run_id" ] && [ "$dispatched" -eq 1 ]; then
        run_id=$(find_run || true)
    fi
    if [ -n "$run_id" ]; then
        if ! gh run cancel "$run_id"; then
            echo "FAIL: could not cancel $WORKFLOW run $run_id. Cancel it on GitHub." >&2
        fi
    elif [ "$dispatched" -eq 1 ]; then
        echo "FAIL: stopped before run $dispatch_id appeared. Cancel it on GitHub if it starts." >&2
    fi
    exit "$exit_code"
}
trap 'stop_gate 143' TERM
trap 'stop_gate 130' INT

# Set first: bash runs a trap only after the foreground command returns.
dispatched=1
gh workflow run "$WORKFLOW" --ref "$branch" -f dispatch_id="$dispatch_id"

for attempt in $(seq "$RUN_LOOKUP_ATTEMPTS"); do
    run_id=$(find_run)
    [ -n "$run_id" ] && break
    run_child sleep 2
done
if [ -z "$run_id" ]; then
    trap - TERM INT
    echo "FAIL: no $WORKFLOW run appeared for $sha after $attempt lookups." >&2
    exit 1
fi

echo "Waiting on $WORKFLOW run $run_id"
# A watch can drop on a network error while the run keeps going, so the verdict
# comes from the run's own status and conclusion, never from the watch's exit code.
status=""
for attempt in $(seq "$WATCH_ATTEMPTS"); do
    if ! run_child gh run watch "$run_id" --interval 15; then
        echo "WARN: watch disconnected for run $run_id; checking the run status." >&2
    fi
    status=$(gh run view "$run_id" --json status --jq '.status' || true)
    [ "$status" = "completed" ] && break
    run_child sleep 15
done
trap - TERM INT
if [ "$status" != "completed" ]; then
    echo "FAIL: lost track of $WORKFLOW run $run_id after $attempt watch attempts (last status '${status:-unknown}'). Check it on GitHub." >&2
    exit 1
fi

conclusion=$(gh run view "$run_id" --json conclusion --jq '.conclusion')
if [ "$conclusion" = "cancelled" ]; then
    echo "FAIL: $WORKFLOW run $run_id was cancelled, most likely replaced by a newer deploy to the shared bot workspace. Retry the gate." >&2
    exit 1
fi
if [ "$conclusion" != "success" ]; then
    echo "FAIL: $WORKFLOW run $run_id ended '$conclusion'. Failed steps:" >&2
    gh run view "$run_id" --log-failed | tail -n 200 >&2
    exit 1
fi
echo "OK: io/studio candidate deployed and healthy (run $run_id)"
