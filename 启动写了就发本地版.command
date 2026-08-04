#!/bin/zsh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATUS_URL="http://127.0.0.1:5173/api/live-photo/status"
LOCAL_URL="http://127.0.0.1:5173/?mode=local"

cd "$PROJECT_DIR" || exit 1

if /usr/bin/curl -fsS "$STATUS_URL" >/dev/null 2>&1; then
  /usr/bin/open "$LOCAL_URL"
  exit 0
fi

clear
echo "写了就发本地版正在运行"
echo ""
echo "此版本不需要登录、邮箱或云端同步。"
echo "草稿保存在这台电脑当前浏览器中；请主动导出重要内容。"
echo "请保留这个窗口；关闭窗口后，实况照片本机服务会停止。"
echo ""

/usr/bin/python3 "$PROJECT_DIR/server.py" &
SERVER_PID=$!

for attempt in {1..30}; do
  if /usr/bin/curl -fsS "$STATUS_URL" >/dev/null 2>&1; then
    /usr/bin/open "$LOCAL_URL"
    break
  fi
  /bin/sleep 0.2
done

wait "$SERVER_PID"
