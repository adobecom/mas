#!/usr/bin/env bash
set -euo pipefail

SERVICE=mas-freyja-proxy
UNIT_DST=/etc/systemd/system/${SERVICE}.service
DIR=$(cd "$(dirname "$0")" && pwd -P)
UNIT_SRC="${DIR}/deploy/${SERVICE}.service"

cmd=${1:-help}

case "$cmd" in
  install)
    [[ -f "${DIR}/.env" ]] || { echo ".env missing at ${DIR}/.env"; exit 1; }
    [[ -f "${UNIT_SRC}" ]] || { echo "unit template missing at ${UNIT_SRC}"; exit 1; }
    NODE_BIN=$(command -v node) || { echo "node not on PATH"; exit 1; }
    sed -e "s|__DIR__|${DIR}|g" -e "s|__NODE__|${NODE_BIN}|g" \
        "${UNIT_SRC}" > "${UNIT_DST}"
    systemctl daemon-reload
    systemctl enable --now ${SERVICE}
    systemctl status --no-pager ${SERVICE}
    ;;
  start|stop|restart|status)
    systemctl "${cmd}" ${SERVICE}
    ;;
  logs)
    journalctl -u ${SERVICE} -f -n 200
    ;;
  uninstall)
    systemctl disable --now ${SERVICE} || true
    rm -f "${UNIT_DST}"
    systemctl daemon-reload
    ;;
  *)
    echo "usage: $0 {install|start|stop|restart|status|logs|uninstall}"
    exit 1
    ;;
esac
