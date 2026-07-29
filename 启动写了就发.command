#!/bin/zsh

PROJECT_DIR="/Users/iamcora/Documents/开发/write-then-publish"
STATUS_URL="http://127.0.0.1:5173/api/live-photo/status"

cd "$PROJECT_DIR" || exit 1

if /usr/bin/curl -fsS "$STATUS_URL" >/dev/null 2>&1; then
  /usr/bin/open "$PROJECT_DIR/index.html"
  exit 0
fi

clear
echo "写了就发正在运行"
echo ""
echo "请保留这个窗口；关闭窗口后，Live Photo 本地生成服务会停止。"
echo "页面将在服务就绪后自动打开。"
echo ""

/usr/bin/python3 "$PROJECT_DIR/server.py" &
SERVER_PID=$!

for attempt in {1..30}; do
  if /usr/bin/curl -fsS "$STATUS_URL" >/dev/null 2>&1; then
    /usr/bin/open "$PROJECT_DIR/index.html"
    break
  fi
  /bin/sleep 0.2
done

wait "$SERVER_PID"
