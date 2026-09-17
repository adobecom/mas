#!/usr/bin/env bash
# Exercises `local.cmd` from .pinata/preview.yaml — the supervisor that keeps the
# author proxy and `aem up` alive for a visual-gate capture.
#
# Hermetic: no port is ever bound and no server is ever started. `nc`, `curl`,
# `npm` and `aem` are replaced by shims on PATH that answer however the scenario
# needs, so what is under test is the SCRIPT's logic — does it refuse a bound
# port, does it bound its probes, does it fail when a child dies — and not the
# machine it runs on. The script itself is read out of the contract, so it can
# never drift from the one the harness actually runs.
#
# Usage: .pinata/scripts/test-preview-supervisor.sh
set -uo pipefail
cd "$(dirname "$0")/../.."

CMD=$(python3 - <<'PY'
import pathlib
import yaml
print(yaml.safe_load(pathlib.Path(".pinata/preview.yaml").read_text())["local"]["cmd"], end="")
PY
)
if [ -z "$CMD" ]; then
    echo "FAIL: could not read local.cmd out of .pinata/preview.yaml" >&2
    exit 1
fi

WORK=$(mktemp -d)
BIN="$WORK/bin"
mkdir -p "$BIN"
trap 'reap_shims; rm -rf "$WORK"' EXIT

failures=0

reap_shims() {
    for pidfile in "$WORK"/*.pid; do
        [ -e "$pidfile" ] || continue
        kill -9 "$(cat "$pidfile")" 2>/dev/null
    done
}

# ── the shims ────────────────────────────────────────────────────────────────
# Each answers from the environment the scenario exports, and records what it
# was asked to do so the assertions can look at it afterwards.

cat >"$BIN/nc" <<'SH'
#!/bin/sh
echo "$*" >> "$SHIM_LOG/nc.log"
exit "${NC_EXIT:-1}"
SH

cat >"$BIN/lsof" <<'SH'
#!/bin/sh
echo "$*" >> "$SHIM_LOG/lsof.log"
exit "${LSOF_EXIT:-1}"
SH

# The readiness probe. It refuses to pretend it is bounded: without both timeout
# flags it records the fact, so "the loop can park inside curl forever" fails the
# test instead of silently coming back.
cat >"$BIN/curl" <<'SH'
#!/bin/sh
echo "$*" >> "$SHIM_LOG/curl.log"
case " $* " in *" --max-time "*) ;; *) echo "no --max-time" >> "$SHIM_LOG/unbounded" ;; esac
case " $* " in *" --connect-timeout "*) ;; *) echo "no --connect-timeout" >> "$SHIM_LOG/unbounded" ;; esac
case "${CURL_MODE:-refused}" in
    ok) exit 0 ;;
    hang)
        # Behave like curl does when a listener accepts and never answers: block
        # until --max-time, then fail. With no --max-time this blocks for good,
        # which is exactly the regression under test.
        maxtime=""
        prev=""
        for arg in "$@"; do
            [ "$prev" = "--max-time" ] && maxtime="$arg"
            prev="$arg"
        done
        [ -n "$maxtime" ] && sleep "$maxtime" || sleep 120
        exit 28
        ;;
    *) exit 7 ;;
esac
SH

cat >"$BIN/npm" <<'SH'
#!/bin/sh
echo "$*" >> "$SHIM_LOG/npm.log"
echo $$ > "$SHIM_LOG/npm.pid"
[ -n "${NPM_LIVE_S:-}" ] && exec sleep "$NPM_LIVE_S"
exit "${NPM_EXIT:-0}"
SH

cat >"$BIN/aem" <<'SH'
#!/bin/sh
echo "$*" >> "$SHIM_LOG/aem.log"
echo $$ > "$SHIM_LOG/aem.pid"
[ -n "${AEM_LIVE_S:-}" ] && exec sleep "$AEM_LIVE_S"
exit "${AEM_EXIT:-1}"
SH

chmod +x "$BIN"/*

# ── harness ──────────────────────────────────────────────────────────────────

status=""

# run <max_seconds>: start the supervisor, wait up to max_seconds, and set
# `status` to its exit code (or "timeout" when it was still running).
run() {
    rm -f "$WORK"/*.log "$WORK"/*.pid "$WORK"/unbounded "$WORK/err"
    /bin/sh -c "$CMD" >/dev/null 2>"$WORK/err" &
    local sup=$! ticks=0
    local limit=$(( $1 * 5 ))
    while kill -0 "$sup" 2>/dev/null; do
        if [ "$ticks" -ge "$limit" ]; then
            kill -9 "$sup" 2>/dev/null
            wait "$sup" 2>/dev/null
            status="timeout"
            return
        fi
        sleep 0.2
        ticks=$(( ticks + 1 ))
    done
    wait "$sup"
    status=$?
}

check() {  # check <description> <condition-as-string>
    if eval "$2"; then
        echo "  ok: $1"
    else
        echo "  FAIL: $1" >&2
        echo "    (exit=$status, stderr: $(tr '\n' '|' < "$WORK/err"))" >&2
        failures=$(( failures + 1 ))
    fi
}

scenario() {
    echo "$1"
    reap_shims
}

export SHIM_LOG="$WORK"
export PATH="$BIN:$PATH"

scenario "a missing runtime CLI fails before starting the proxy"
# Override only command lookup for aem: a globally installed CLI must not make
# this negative test pass accidentally.
saved_cmd="$CMD"
CMD='command() { if [ "$1" = "-v" ] && [ "$2" = "aem" ]; then return 1; fi; return 99; }
'
# Only the missing-aem lookup is reached before the expected early exit.
CMD="${CMD}${saved_cmd}"
run 4
check "exits 127" '[ "$status" = "127" ]'
check "explains runtime provisioning" 'grep -q "Piñata runtime PATH" "$WORK/err"'
check "never starts the proxy" '[ ! -e "$WORK/npm.log" ]'
CMD="$saved_cmd"

# ── 1. a port that already has a listener is refused ─────────────────────────
# Not "a port that answers HTTP": any process holding 8091 would be captured
# through as if it were ours.
scenario "a bound 8091 is refused before anything starts"
NC_EXIT=0 CURL_MODE=refused run 10
check "exits non-zero" '[ "$status" != "0" ] && [ "$status" != "timeout" ]'
check "says the port is taken" 'grep -q "already has a listener" "$WORK/err"'
check "never started the proxy" '[ ! -e "$WORK/npm.log" ]'
check "never started aem up" '[ ! -e "$WORK/aem.log" ]'
check "probed for a listener, not for HTTP" '[ -e "$WORK/nc.log" ] && [ ! -e "$WORK/curl.log" ]'

# ── 2. a probe that hangs stays bounded, so liveness keeps being checked ─────
scenario "a hung readiness probe does not stop the liveness check"
NC_EXIT=1 CURL_MODE=hang NPM_LIVE_S=7 run 40
check "no probe was left unbounded" '[ ! -e "$WORK/unbounded" ]'
check "probed more than once" '[ "$(wc -l < "$WORK/curl.log")" -ge 2 ]'
check "noticed the dead proxy and exited non-zero" \
      '[ "$status" != "0" ] && [ "$status" != "timeout" ]'
check "named the proxy" 'grep -q "author proxy exited with status" "$WORK/err"'

# ── 3. a proxy that dies before binding fails the supervisor ────────────────
scenario "a proxy that exits 0 without binding is still a failure"
NC_EXIT=1 CURL_MODE=refused NPM_EXIT=0 run 20
check "does NOT exit 0" '[ "$status" != "0" ]'
check "exits 1" '[ "$status" = "1" ]'
check "names the proxy exit" 'grep -q "author proxy exited with status 1" "$WORK/err"'
check "never reached aem up" '[ ! -e "$WORK/aem.log" ]'

scenario "a proxy that dies with its own status keeps it"
NC_EXIT=1 CURL_MODE=refused NPM_EXIT=3 run 20
check "exits 3" '[ "$status" = "3" ]'
check "names status 3" 'grep -q "author proxy exited with status 3" "$WORK/err"'

# ── 4. aem up dying after readiness takes the supervisor (and the proxy) ─────
scenario "aem up dying ends the supervisor and reaps the proxy"
NC_EXIT=1 CURL_MODE=ok NPM_LIVE_S=120 AEM_EXIT=1 run 20
check "exits non-zero" '[ "$status" != "0" ] && [ "$status" != "timeout" ]'
check "says the preview stopped" 'grep -q "local preview stopped" "$WORK/err"'
check "the proxy was killed with it" \
      '[ -e "$WORK/npm.pid" ] && ! kill -0 "$(cat "$WORK/npm.pid")" 2>/dev/null'

# ── 5. both children healthy: the supervisor stays in the foreground ────────
scenario "a healthy pair keeps the supervisor running"
NC_EXIT=1 CURL_MODE=ok NPM_LIVE_S=120 AEM_LIVE_S=120 run 4
check "still supervising when we gave up waiting" '[ "$status" = "timeout" ]'
check "started both servers" '[ -e "$WORK/npm.log" ] && [ -e "$WORK/aem.log" ]'

reap_shims
if [ "$failures" -ne 0 ]; then
    echo "FAIL: $failures supervisor check(s) failed" >&2
    exit 1
fi
echo "OK: the preview supervisor behaves"
