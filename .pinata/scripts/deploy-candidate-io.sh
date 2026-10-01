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

# workflow_dispatch returns no run id: remember the newest run before dispatching,
# then wait for a newer one on this exact commit.
last_id=$(gh run list --workflow "$WORKFLOW" --limit 1 --json databaseId --jq '.[0].databaseId // 0')
gh workflow run "$WORKFLOW" --ref "$branch"

run_id=""
for attempt in $(seq "$RUN_LOOKUP_ATTEMPTS"); do
    run_id=$(gh run list --workflow "$WORKFLOW" --branch "$branch" --event workflow_dispatch \
        --json databaseId,headSha \
        --jq "[.[] | select(.headSha == \"$sha\" and .databaseId > $last_id)][0].databaseId // empty")
    [ -n "$run_id" ] && break
    sleep 2
done
if [ -z "$run_id" ]; then
    echo "FAIL: no $WORKFLOW run appeared for $sha after $attempt lookups." >&2
    exit 1
fi

# If the engine stops this gate (timeout, abort), don't leave the run deploying
# behind it: a retry would queue behind the orphan in the same concurrency group.
trap 'gh run cancel "$run_id" >/dev/null 2>&1 || true; exit 1' TERM INT

echo "Waiting on $WORKFLOW run $run_id"
# A watch can drop on a network error while the run keeps going, so the verdict
# comes from the run's own status and conclusion, never from the watch's exit code.
status=""
for attempt in $(seq "$WATCH_ATTEMPTS"); do
    gh run watch "$run_id" --interval 15 || true
    status=$(gh run view "$run_id" --json status --jq '.status' || true)
    [ "$status" = "completed" ] && break
    sleep 15
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
