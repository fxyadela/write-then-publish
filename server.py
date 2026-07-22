#!/usr/bin/env python3
"""Serve Write Then Publish and relay confirmed articles to WeChat drafts."""

from __future__ import annotations

import base64
import binascii
import html as html_module
import json
import os
import re
import subprocess
import sys
import tempfile
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
CONFIG_PATH = Path(
    os.environ.get(
        "KOUBO_WECHAT_CONFIG",
        "~/.config/koubo-script-writer/wechat.json",
    )
).expanduser()
KEYCHAIN_SERVICE = "koubo-script-writer.wechat-official-account"
RELAY_LABEL = "com.iamcora.koubo-wechat-relay"
ENQUEUE_SCRIPT = Path(
    "~/.codex/skills/koubo-script-writer/scripts/enqueue_wechat_draft.py"
).expanduser()
MAX_REQUEST_BYTES = 80 * 1024 * 1024
MAX_IMAGE_BYTES = 30 * 1024 * 1024
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5173",
    "http://localhost:5173",
}
DATA_IMAGE_PATTERN = re.compile(
    r"^data:(image/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$",
    re.IGNORECASE,
)


def redact_error(value: str) -> str:
    return re.sub(
        r"([?&](?:secret|access_token)=)[^&\s]+",
        r"\1[REDACTED]",
        str(value),
        flags=re.IGNORECASE,
    )


def load_appid() -> str:
    try:
        payload = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return ""
    return str(payload.get("appid", "")).strip() if isinstance(payload, dict) else ""


def has_keychain_secret(appid: str) -> bool:
    if not appid:
        return False
    result = subprocess.run(
        [
            "/usr/bin/security",
            "find-generic-password",
            "-a",
            appid,
            "-s",
            KEYCHAIN_SERVICE,
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def relay_is_loaded() -> bool:
    result = subprocess.run(
        [
            "/bin/launchctl",
            "print",
            f"gui/{os.getuid()}/{RELAY_LABEL}",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def check_wechat_access() -> tuple[bool, str]:
    try:
        process = subprocess.run(
            [sys.executable, str(ENQUEUE_SCRIPT), "check", "--wait", "45"],
            cwd=ENQUEUE_SCRIPT.parent,
            capture_output=True,
            text=True,
            timeout=55,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return False, "公众号连通检查超时，请稍后重试。"
    try:
        envelope = json.loads(process.stdout) if process.stdout.strip() else {}
    except json.JSONDecodeError:
        envelope = {}
    nested = envelope.get("result", {}) if isinstance(envelope, dict) else {}
    ready = process.returncode == 0 and envelope.get("status") == "succeeded" and nested.get("exit_code") == 0
    if ready:
        return True, ""
    message = nested.get("stderr") or process.stderr or "公众号接口暂时不可用。"
    return False, redact_error(str(message)).strip()[:500]


def wechat_status(check_remote: bool = True) -> dict[str, Any]:
    appid = load_appid()
    configured = bool(appid and has_keychain_secret(appid))
    relay_loaded = relay_is_loaded()
    local_ready = configured and relay_loaded and ENQUEUE_SCRIPT.is_file()
    remote_ready = False
    error = ""
    if local_ready and check_remote:
        remote_ready, error = check_wechat_access()
    return {
        "ok": True,
        "configured": configured,
        "relay_loaded": relay_loaded,
        "local_ready": local_ready,
        "remote_checked": bool(local_ready and check_remote),
        "remote_ready": remote_ready,
        "ready": local_ready and (remote_ready if check_remote else True),
        "error": error,
    }


def decode_image_data_url(source: str, directory: Path, stem: str) -> Path:
    match = DATA_IMAGE_PATTERN.fullmatch(str(source or "").strip())
    if not match:
        raise ValueError("图片不是可同步的 PNG、JPG、WebP 或 GIF，请重新上传。")
    try:
        raw = base64.b64decode(re.sub(r"\s+", "", match.group(2)), validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("图片数据损坏，请重新上传。") from exc
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("单张图片过大，请控制在 30MB 以内。")
    mime_type = match.group(1).lower()
    signatures = {
        "image/png": (raw.startswith(b"\x89PNG\r\n\x1a\n"), ".png"),
        "image/jpeg": (raw.startswith(b"\xff\xd8\xff"), ".jpg"),
        "image/jpg": (raw.startswith(b"\xff\xd8\xff"), ".jpg"),
        "image/webp": (raw.startswith(b"RIFF") and raw[8:12] == b"WEBP", ".webp"),
        "image/gif": (raw.startswith((b"GIF87a", b"GIF89a")), ".gif"),
    }
    valid, extension = signatures.get(mime_type, (False, ""))
    if not valid:
        raise ValueError("图片数据与格式不匹配，请重新上传。")
    path = directory / f"{stem}{extension}"
    path.write_bytes(raw)
    os.chmod(path, 0o600)
    return path


class ArticleImageLocalizer(HTMLParser):
    def __init__(self, assets: Path) -> None:
        super().__init__(convert_charrefs=False)
        self.assets = assets
        self.parts: list[str] = []
        self.image_index = 0

    def render_tag(self, tag: str, attrs: list[tuple[str, str | None]], closing: str) -> None:
        rendered_attrs = []
        for name, value in attrs:
            if value is None:
                rendered_attrs.append(name)
            else:
                rendered_attrs.append(f'{name}="{html_module.escape(value, quote=True)}"')
        suffix = f" {' '.join(rendered_attrs)}" if rendered_attrs else ""
        self.parts.append(f"<{tag}{suffix}{closing}>")

    def localize_attrs(self, tag: str, attrs: list[tuple[str, str | None]]) -> list[tuple[str, str | None]]:
        if tag.lower() != "img":
            return attrs
        localized = []
        found_source = False
        for name, value in attrs:
            if name.lower() != "src":
                localized.append((name, value))
                continue
            found_source = True
            source = str(value or "")
            if source.startswith("data:"):
                self.image_index += 1
                local = decode_image_data_url(source, self.assets, f"article-{self.image_index:02d}")
                localized.append((name, f"assets/{local.name}"))
            elif source.startswith("https://mmbiz.qpic.cn/"):
                localized.append((name, source))
            else:
                raise ValueError("正文存在无法直接同步的网络图片，请先在编辑器中重新上传。")
        if not found_source:
            raise ValueError("正文图片缺少来源。")
        return localized

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.render_tag(tag, self.localize_attrs(tag, attrs), "")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.render_tag(tag, self.localize_attrs(tag, attrs), " /")

    def handle_endtag(self, tag: str) -> None:
        self.parts.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def handle_entityref(self, name: str) -> None:
        self.parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self.parts.append(f"&#{name};")

    def handle_comment(self, data: str) -> None:
        self.parts.append(f"<!--{data}-->")

    def handle_decl(self, decl: str) -> None:
        self.parts.append(f"<!{decl}>")


def prepare_article_html(article_html: str, directory: Path) -> Path:
    if not article_html.strip():
        raise ValueError("长文内容为空。")
    assets = directory / "assets"
    assets.mkdir(mode=0o700)
    parser = ArticleImageLocalizer(assets)
    try:
        parser.feed(article_html)
        parser.close()
    except (ValueError, TypeError) as exc:
        raise ValueError(str(exc) or "长文 HTML 无法解析。") from exc
    path = directory / "article.html"
    path.write_text("".join(parser.parts), encoding="utf-8")
    os.chmod(path, 0o600)
    return path


def sync_wechat_draft(payload: dict[str, Any]) -> dict[str, Any]:
    status = wechat_status(check_remote=False)
    if not status["ready"]:
        raise ValueError("本机公众号同步服务尚未配置完整。")
    title = str(payload.get("title", "")).strip()
    if not title:
        raise ValueError("请填写公众号标题。")
    if len(title) > 64:
        raise ValueError("公众号标题不能超过 64 个字符。")
    author = str(payload.get("author", "")).strip()[:32]
    slug = re.sub(r"[^A-Za-z0-9_-]+", "-", str(payload.get("slug", ""))).strip("-")
    if not slug:
        slug = "write-then-publish"
    article_html = str(payload.get("html", ""))
    cover_source = str(payload.get("cover", ""))

    with tempfile.TemporaryDirectory(prefix="write-then-publish-wechat-") as temp_name:
        temp_dir = Path(temp_name)
        article_path = prepare_article_html(article_html, temp_dir)
        cover_path = decode_image_data_url(cover_source, temp_dir, "cover")
        command = [
            sys.executable,
            str(ENQUEUE_SCRIPT),
            "sync",
            "--html",
            str(article_path),
            "--title",
            title,
            "--slug",
            slug,
            "--cover",
            str(cover_path),
            "--title-confirmed",
            "--cover-confirmed",
            "--wait",
            "240",
        ]
        if author:
            command.extend(["--author", author])
        process = subprocess.run(
            command,
            cwd=ENQUEUE_SCRIPT.parent,
            capture_output=True,
            text=True,
            timeout=280,
            check=False,
        )
    try:
        envelope = json.loads(process.stdout) if process.stdout.strip() else {}
    except json.JSONDecodeError:
        envelope = {}
    if process.returncode != 0 or envelope.get("status") != "succeeded":
        nested = envelope.get("result", {}) if isinstance(envelope, dict) else {}
        message = nested.get("stderr") or process.stderr or "公众号草稿同步失败。"
        raise ValueError(redact_error(str(message)))
    nested = envelope.get("result", {})
    draft = nested.get("stdout", {}) if isinstance(nested, dict) else {}
    if not isinstance(draft, dict):
        draft = {}
    return {
        "ok": True,
        "status": str(draft.get("status", "created")),
        "title": str(draft.get("title", title)),
    }


class AppHandler(SimpleHTTPRequestHandler):
    server_version = "WriteThenPublish/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/api/wechat/status":
            self.send_json(200, wechat_status())
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path.split("?", 1)[0] != "/api/wechat/drafts":
            self.send_json(404, {"ok": False, "error": "接口不存在。"})
            return
        origin = str(self.headers.get("Origin", ""))
        if origin not in ALLOWED_ORIGINS:
            self.send_json(403, {"ok": False, "error": "只允许从本机写了就发页面同步。"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_REQUEST_BYTES:
            self.send_json(413, {"ok": False, "error": "同步内容为空或超过 80MB。"})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("请求格式错误。")
            result = sync_wechat_draft(payload)
        except subprocess.TimeoutExpired:
            self.send_json(504, {"ok": False, "error": "同步等待超时，请稍后检查公众号草稿箱。"})
            return
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            self.send_json(400, {"ok": False, "error": redact_error(str(exc))})
            return
        except Exception:
            self.send_json(500, {"ok": False, "error": "本机同步服务异常，没有确认草稿写入。"})
            return
        self.send_json(200, result)

    def log_message(self, format_string: str, *args: Any) -> None:
        sys.stderr.write(f"[write-then-publish] {format_string % args}\n")


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 5173), AppHandler)
    print("写了就发已启动：http://127.0.0.1:5173/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
