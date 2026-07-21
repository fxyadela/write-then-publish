#!/bin/zsh
set -e

SCRIPT_DIR="${0:A:h}"
PORT=5173
URL="http://127.0.0.1:${PORT}/"

cd "$SCRIPT_DIR"
mkdir -p runtime-data

if ! /usr/sbin/lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  nohup /usr/bin/env python3 server.py > runtime-data/write-then-publish.log 2>&1 &

  for _ in {1..30}; do
    if /usr/sbin/lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
      break
    fi
    sleep 0.2
  done
fi

if ! /usr/sbin/lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "写了就发启动失败，请查看：$SCRIPT_DIR/runtime-data/write-then-publish.log"
  read -k 1 "?按任意键退出……"
  exit 1
fi

open "$URL"
