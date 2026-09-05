#!/usr/bin/env python3
"""Serve Write Then Publish and relay confirmed articles to WeChat drafts."""

from __future__ import annotations

import base64
import binascii
import cgi
import html as html_module
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import uuid
import zipfile
from datetime import datetime
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
MAX_LIVE_PHOTO_REQUEST_BYTES = 350 * 1024 * 1024
MAX_LIVE_OVERLAY_BYTES = 12 * 1024 * 1024
MAX_BATCH_EXPORT_BYTES = 300 * 1024 * 1024
LIVE_PHOTO_OUTPUT_ROOT = Path(
    os.environ.get(
        "WRITE_THEN_PUBLISH_LIVE_OUTPUT",
        "~/Downloads/写了就发/Live Photo",
    )
).expanduser()
BATCH_OUTPUT_ROOT = Path(
    os.environ.get(
        "WRITE_THEN_PUBLISH_BATCH_OUTPUT",
        "~/Downloads/写了就发/批量导出",
    )
).expanduser()
LIVE_PHOTO_LOCK = threading.Lock()
AIR_DROP_LOCK = threading.Lock()
LIVE_PHOTO_JOBS: dict[str, dict[str, Any]] = {}
BATCH_EXPORTS: dict[str, dict[str, Any]] = {}
AIR_DROP_HELPER_SOURCE = ROOT / "scripts" / "airdrop_share.swift"
AIR_DROP_HELPER_BINARY = Path("/private/tmp/write-then-publish-airdrop-share")
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "null",
}
DATA_IMAGE_PATTERN = re.compile(
    r"^data:(image/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$",
    re.IGNORECASE,
)

LIVE_PHOTO_DURATIONS = (3.0, 5.0, 8.0)
LIVE_PHOTO_SPEEDS = (1.0, 1.5, 2.0, 3.0)
# 老客户端只会传 platform，按时长映射过来。
LIVE_PHOTO_PLATFORMS = {
    "xhs": {"duration": 5.0},
    "wechat": {"duration": 3.0},
}
# 实况成片参数：30fps 与 iPhone 原生实况一致；CRF 18 / medium 相对 CRF 10 / slow
# 实测 VMAF 96.7（视觉无损），编码快约 3 倍、体积小约一半，上传下载同步减半。
LIVE_PHOTO_MAX_FPS = 30.0
LIVE_PHOTO_CRF = "18"
LIVE_PHOTO_PRESET = "medium"


def redact_error(value: str) -> str:
    return re.sub(
        r"([?&](?:secret|access_token)=)[^&\s]+",
        r"\1[REDACTED]",
        str(value),
        flags=re.IGNORECASE,
    )


def command_path(name: str) -> str:
    return shutil.which(name) or ""


def make_stored_zip(archive_path: Path, root_dir: Path, entries: list[Path]) -> Path:
    """Archive already-compressed media without duplicating compression work."""
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    # macOS 的 /var 是 /private/var 的软链，调用方传进来的路径可能一边解析过一边没有，
    # 两边都归一化后再算相对路径，否则 relative_to 会直接抛错。
    resolved_root = root_dir.resolve()
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
        for entry in entries:
            if not entry.exists():
                continue
            paths = [entry] if entry.is_file() else [path for path in entry.rglob("*") if path.is_file()]
            for path in paths:
                archive.write(path, path.resolve().relative_to(resolved_root))
    os.chmod(archive_path, 0o600)
    return archive_path


def live_photo_status() -> dict[str, Any]:
    tools = {name: command_path(name) for name in ("ffmpeg", "ffprobe", "uvx")}
    missing = [name for name, path in tools.items() if not path]
    macos = sys.platform == "darwin"
    ready = macos and not missing
    if not macos:
        message = "Live Photo 发布包需要在 macOS 本地版生成。"
    elif missing:
        message = f"本机缺少生成工具：{', '.join(missing)}。"
    else:
        message = "本机 Live Photo 生成服务已就绪。首次生成会准备打包组件。"
    return {
        "ok": True,
        "ready": ready,
        "macos": macos,
        "missing": missing,
        "message": message,
        "output_root": str(LIVE_PHOTO_OUTPUT_ROOT),
    }


def local_lan_ip() -> str:
    for interface in ("en0", "en1"):
        try:
            result = subprocess.run(
                ["/usr/sbin/ipconfig", "getifaddr", interface],
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
            )
            address = result.stdout.strip()
            if address.startswith("10.") or address.startswith("192.168.") or re.match(r"^172\.(1[6-9]|2\d|3[01])\.", address):
                return address
        except (OSError, subprocess.TimeoutExpired):
            pass
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("8.8.8.8", 80))
        address = str(probe.getsockname()[0])
    except OSError:
        try:
            address = socket.gethostbyname(socket.gethostname())
        except OSError:
            return ""
    finally:
        probe.close()
    return address if address and not address.startswith("127.") else ""


def parse_float(value: Any, label: str, minimum: float, maximum: float) -> float:
    try:
        number = float(str(value).strip())
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{label}格式错误。") from exc
    if number < minimum or number > maximum:
        raise ValueError(f"{label}需要在 {minimum:g} 到 {maximum:g} 之间。")
    return number


def safe_live_photo_stem(value: str, fallback: str) -> str:
    cleaned = re.sub(r"[^\w\u3400-\u9fff-]+", "-", str(value or ""), flags=re.UNICODE)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-_")
    return (cleaned[:36] or fallback).strip("-_")


def write_uploaded_file(field: Any, destination: Path, max_bytes: int, kind: str) -> bytes:
    source = getattr(field, "file", None)
    if source is None:
        raise ValueError(f"{kind}没有可读取的文件数据。")
    source.seek(0)
    header = source.read(16)
    source.seek(0)
    written = 0
    with destination.open("wb") as target:
        while True:
            chunk = source.read(1024 * 1024)
            if not chunk:
                break
            written += len(chunk)
            if written > max_bytes:
                raise ValueError(f"{kind}过大。")
            target.write(chunk)
    if written <= 0:
        raise ValueError(f"{kind}为空。")
    os.chmod(destination, 0o600)
    return header


def validate_video_header(header: bytes) -> str:
    if len(header) >= 12 and header[4:8] == b"ftyp":
        return ".mov"
    if header.startswith(b"\x1aE\xdf\xa3"):
        return ".webm"
    raise ValueError("视频格式无法识别，请上传 MP4、MOV 或 WebM。")


def run_media_command(command: list[str], timeout: int, failure_message: str) -> subprocess.CompletedProcess[str]:
    process = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    if process.returncode != 0:
        detail = redact_error(process.stderr or process.stdout).strip()
        raise ValueError(f"{failure_message}{f'：{detail[-600:]}' if detail else ''}")
    return process


def probe_video(path: Path) -> dict[str, Any]:
    process = run_media_command(
        [
            command_path("ffprobe"),
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=codec_type,width,height,avg_frame_rate",
            "-of",
            "json",
            str(path),
        ],
        45,
        "无法读取视频信息",
    )
    try:
        payload = json.loads(process.stdout)
        duration = float(payload.get("format", {}).get("duration", 0))
        video_stream = next(stream for stream in payload.get("streams", []) if stream.get("codec_type") == "video")
    except (json.JSONDecodeError, TypeError, ValueError, StopIteration) as exc:
        raise ValueError("视频缺少可用画面轨道。") from exc
    if duration <= 0 or duration > 1800:
        raise ValueError("视频时长需要大于 0 秒且不超过 30 分钟。")
    try:
        numerator, denominator = str(video_stream.get("avg_frame_rate", "0/0")).split("/", 1)
        fps = float(numerator) / float(denominator)
    except (ValueError, ZeroDivisionError):
        fps = 30.0
    fps = min(60.0, max(1.0, fps))
    return {
        "duration": duration,
        "width": int(video_stream.get("width") or 0),
        "height": int(video_stream.get("height") or 0),
        "fps": fps,
    }


def package_live_photo(jpg_path: Path, mov_path: Path) -> dict[str, Any]:
    script = """
import json
import sys
from pathlib import Path
from makelive import is_live_photo_pair, live_id, save_live_photo_pair_as_pvt

asset_id, package_path = save_live_photo_pair_as_pvt(sys.argv[1], sys.argv[2])
package = Path(package_path)
photo = next(path for path in package.iterdir() if path.suffix.lower() in {'.jpg', '.jpeg'})
movie = next(path for path in package.iterdir() if path.suffix.lower() == '.mov')
valid = bool(is_live_photo_pair(str(photo), str(movie)))
photo_id = str(live_id(str(photo)))
movie_id = str(live_id(str(movie)))
print(json.dumps({
    'asset_id': str(asset_id),
    'package_path': str(package),
    'valid': valid and photo_id == movie_id == str(asset_id),
    'photo_id': photo_id,
    'movie_id': movie_id,
}))
""".strip()
    cache_dir = Path(os.environ.get("UV_CACHE_DIR") or "/private/tmp/write-then-publish-uv-cache")
    tool_dir = Path(os.environ.get("UV_TOOL_DIR") or "/private/tmp/write-then-publish-uv-tools")
    cache_dir.mkdir(parents=True, exist_ok=True)
    tool_dir.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env["UV_CACHE_DIR"] = str(cache_dir)
    env["UV_TOOL_DIR"] = str(tool_dir)
    # 云端 runner 会预先把 makelive 装进一个可缓存的解释器里；makelive 拖着整套 pyobjc，
    # 冷装一次要十几秒，而 setup-uv 的缓存会 prune 掉纯 wheel，等于每个任务都白装一遍。
    prepared_python = str(os.environ.get("WRITE_THEN_PUBLISH_MAKELIVE_PYTHON") or "").strip()
    if prepared_python and Path(prepared_python).is_file():
        command = [prepared_python, "-c", script, str(jpg_path), str(mov_path)]
    else:
        command = [
            command_path("uvx"),
            "--from",
            "makelive==0.7.0",
            "python",
            "-c",
            script,
            str(jpg_path),
            str(mov_path),
        ]
    process = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=240,
        check=False,
        env=env,
    )
    if process.returncode != 0:
        detail = redact_error(process.stderr or process.stdout).strip()
        raise ValueError(f"Live Photo 打包失败{f'：{detail[-600:]}' if detail else ''}")
    try:
        result = json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError) as exc:
        raise ValueError("Live Photo 打包完成，但没有返回有效校验结果。") from exc
    package_path = Path(str(result.get("package_path", ""))).resolve()
    if not result.get("valid") or not package_path.is_dir():
        raise ValueError("Live Photo 配对校验失败，没有生成可发布的实况包。")
    return result


def render_live_photo(form: Any) -> dict[str, Any]:
    status = live_photo_status()
    if not status["ready"]:
        raise ValueError(status["message"])

    platform_key = str(form.getfirst("platform", "xhs")).strip().lower()
    fallback = LIVE_PHOTO_PLATFORMS.get(platform_key, {"duration": 5.0})
    raw_duration = form.getfirst("duration")
    duration_value = float(raw_duration) if raw_duration not in (None, "") else fallback["duration"]
    if duration_value not in LIVE_PHOTO_DURATIONS:
        raise ValueError("实况时长只能是 3、5 或 8 秒。")
    raw_speed = form.getfirst("speed")
    speed_value = float(raw_speed) if raw_speed not in (None, "") else 1.0
    if speed_value not in LIVE_PHOTO_SPEEDS:
        raise ValueError("倍速只能是 1、1.5、2 或 3。")
    platform = {"duration": duration_value, "speed": speed_value}
    start = parse_float(form.getfirst("start", "0"), "开始时间", 0, 1800)
    cover_offset = parse_float(
        form.getfirst("cover_offset", "0.2"),
        "封面帧",
        0,
        float(platform["duration"]) - 0.05,
    )
    focus_x = parse_float(form.getfirst("focus_x", "50"), "横向画面位置", 0, 100)
    focus_y = parse_float(form.getfirst("focus_y", "50"), "纵向画面位置", 0, 100)
    crop_values: tuple[float, float, float, float] | None = None
    if all(name in form for name in ("crop_x", "crop_y", "crop_width", "crop_height")):
        crop_x = parse_float(form.getfirst("crop_x", "0"), "裁剪横向位置", 0, 1)
        crop_y = parse_float(form.getfirst("crop_y", "0"), "裁剪纵向位置", 0, 1)
        crop_width = parse_float(form.getfirst("crop_width", "1"), "裁剪宽度", 0.01, 1)
        crop_height = parse_float(form.getfirst("crop_height", "1"), "裁剪高度", 0.01, 1)
        if crop_x + crop_width > 1.0001 or crop_y + crop_height > 1.0001:
            raise ValueError("裁剪框超出了视频画面，请返回编辑器重新调整。")
        crop_values = (crop_x, crop_y, crop_width, crop_height)
    title = str(form.getfirst("title", "")).strip()[:48]
    reveal = str(form.getfirst("reveal", "1")).strip() != "0"
    keep_sound = str(form.getfirst("sound", "1")).strip() != "0"
    video_field = form["video"] if "video" in form else None
    if video_field is None or isinstance(video_field, list):
        raise ValueError("请选择一个视频。")

    job_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    stem = safe_live_photo_stem(title, "live-photo")
    speed_tag = "" if platform["speed"] == 1 else f"_{platform['speed']:g}X".replace(".", "_")
    file_stem = f"{stem}_{platform['duration']:g}S{speed_tag}_LIVE"
    job_dir = LIVE_PHOTO_OUTPUT_ROOT / f"{timestamp}-{job_id[:6]}-{stem}"
    job_dir.mkdir(parents=True, mode=0o700, exist_ok=False)

    try:
        with tempfile.TemporaryDirectory(prefix="write-then-publish-live-") as temp_name:
            temp_dir = Path(temp_name)
            temporary_source = temp_dir / "source.upload"
            header = write_uploaded_file(
                video_field,
                temporary_source,
                MAX_LIVE_PHOTO_REQUEST_BYTES,
                "视频",
            )
            source_extension = validate_video_header(header)
            source_path = temporary_source.with_suffix(source_extension)
            temporary_source.rename(source_path)

            overlay_path: Path | None = None
            if "overlay" in form:
                overlay_field = form["overlay"]
                if not isinstance(overlay_field, list) and getattr(overlay_field, "file", None):
                    overlay_path = temp_dir / "overlay.png"
                    overlay_header = write_uploaded_file(
                        overlay_field,
                        overlay_path,
                        MAX_LIVE_OVERLAY_BYTES,
                        "标题图层",
                    )
                    if not overlay_header.startswith(b"\x89PNG\r\n\x1a\n"):
                        raise ValueError("标题图层不是有效 PNG。")

            page_path: Path | None = None
            mask_path: Path | None = None
            well_geometry: tuple[int, int, int, int] | None = None
            if "page" in form:
                page_field = form["page"]
                if not isinstance(page_field, list) and getattr(page_field, "file", None):
                    page_path = temp_dir / "page.png"
                    page_header = write_uploaded_file(
                        page_field,
                        page_path,
                        MAX_LIVE_OVERLAY_BYTES,
                        "卡片页面",
                    )
                    if not page_header.startswith(b"\x89PNG\r\n\x1a\n"):
                        raise ValueError("卡片页面不是有效 PNG。")
                    well_x = round(parse_float(form.getfirst("well_x", "0"), "实况横向位置", 0, 1080))
                    well_y = round(parse_float(form.getfirst("well_y", "0"), "实况纵向位置", 0, 1440))
                    well_width = round(parse_float(form.getfirst("well_width", "1080"), "实况宽度", 40, 1080))
                    well_height = round(parse_float(form.getfirst("well_height", "1440"), "实况高度", 40, 1440))
                    if well_x + well_width > 1080 or well_y + well_height > 1440:
                        raise ValueError("实况素材超出卡片页面，请返回编辑器调整尺寸。")
                    well_geometry = (well_x, well_y, well_width, well_height)
                    if "mask" in form:
                        mask_field = form["mask"]
                        if not isinstance(mask_field, list) and getattr(mask_field, "file", None):
                            mask_path = temp_dir / "mask.png"
                            mask_header = write_uploaded_file(
                                mask_field,
                                mask_path,
                                MAX_LIVE_OVERLAY_BYTES,
                                "实况圆角遮罩",
                            )
                            if not mask_header.startswith(b"\x89PNG\r\n\x1a\n"):
                                raise ValueError("实况圆角遮罩不是有效 PNG。")

            media = probe_video(source_path)
            target_duration = float(platform["duration"])
            speed = float(platform["speed"])
            # 倍速：成片仍是 target_duration，但要从原片里取用这么长的一段。
            source_span = target_duration * speed
            # iPhone 实况本身就是 30fps，源视频更高帧率只会成倍拉长编码时间和文件体积。
            output_fps = min(LIVE_PHOTO_MAX_FPS, float(media["fps"]))
            if start + source_span > media["duration"] + 0.03:
                raise ValueError(
                    f"所选片段需要 {source_span:g} 秒素材，但视频从当前起点只剩 "
                    f"{max(0, media['duration'] - start):.2f} 秒。"
                )

            speed_filter = "" if speed == 1 else f"setpts=PTS/{speed:g},"
            if speed != 1:
                keep_sound = False
            mov_path = job_dir / f"{file_stem}.MOV"
            jpg_path = job_dir / f"{file_stem}.JPG"
            output_width = well_geometry[2] if well_geometry else 1080
            output_height = well_geometry[3] if well_geometry else 1440
            if crop_values:
                crop_x, crop_y, crop_width, crop_height = crop_values
                base_filter = (
                    f"crop=iw*{crop_width:.8f}:ih*{crop_height:.8f}:iw*{crop_x:.8f}:ih*{crop_y:.8f},"
                    f"scale={output_width}:{output_height}:flags=lanczos,"
                    f"{speed_filter}fps={output_fps:.6f},setsar=1"
                )
            else:
                base_filter = (
                    f"scale={output_width}:{output_height}:force_original_aspect_ratio=increase:flags=lanczos,"
                    f"crop={output_width}:{output_height}:(iw-{output_width})*{focus_x / 100:.6f}:"
                    f"(ih-{output_height})*{focus_y / 100:.6f},{speed_filter}fps={output_fps:.6f},setsar=1"
                )
            command = [
                command_path("ffmpeg"),
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-ss",
                f"{start:.3f}",
                "-i",
                str(source_path),
            ]
            if page_path and well_geometry:
                well_x, well_y, well_width, well_height = well_geometry
                command.extend(["-loop", "1", "-i", str(page_path)])
                if mask_path:
                    command.extend(["-loop", "1", "-i", str(mask_path)])
                    page_filter = (
                        f"[0:v]{base_filter},format=rgba[well];"
                        f"[2:v]scale={well_width}:{well_height}:flags=lanczos,format=gray[mask];"
                        "[well][mask]alphamerge[rounded];"
                        "[1:v]scale=1080:1440:flags=lanczos,format=rgba[page];"
                        f"[page][rounded]overlay={well_x}:{well_y}:format=auto,fps={output_fps:.6f},format=yuv420p[outv]"
                    )
                else:
                    page_filter = (
                        f"[0:v]{base_filter}[well];[1:v]scale=1080:1440:flags=lanczos,format=rgba[page];"
                        f"[page][well]overlay={well_x}:{well_y}:format=auto,fps={output_fps:.6f},format=yuv420p[outv]"
                    )
                command.extend(
                    [
                        "-filter_complex",
                        page_filter,
                        "-map",
                        "[outv]",
                    ]
                )
            elif overlay_path:
                command.extend(["-loop", "1", "-i", str(overlay_path)])
                command.extend(
                    [
                        "-filter_complex",
                        f"[0:v]{base_filter}[base];[1:v]format=rgba[overlay];"
                        "[base][overlay]overlay=0:0:format=auto,format=yuv420p[outv]",
                        "-map",
                        "[outv]",
                    ]
                )
            else:
                command.extend(["-vf", base_filter, "-map", "0:v:0"])
            # 实况默认带声音；用户在编辑器里关掉时整条音轨都不写进成片。
            command.extend(["-map", "0:a?"] if keep_sound else ["-an"])
            command.extend(
                [
                    "-t",
                    f"{target_duration:.3f}",
                    "-c:v",
                    "libx264",
                    "-preset",
                    LIVE_PHOTO_PRESET,
                    "-crf",
                    LIVE_PHOTO_CRF,
                    "-pix_fmt",
                    "yuv420p",
                ]
            )
            if keep_sound:
                command.extend(["-c:a", "aac", "-b:a", "192k"])
            command.extend(["-movflags", "+faststart", str(mov_path)])
            run_media_command(command, 600, "实况视频生成失败")
            run_media_command(
                [
                    command_path("ffmpeg"),
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-y",
                    "-ss",
                    f"{cover_offset:.3f}",
                    "-i",
                    str(mov_path),
                    "-frames:v",
                    "1",
                    "-q:v",
                    "2",
                    str(jpg_path),
                ],
                90,
                "封面帧生成失败",
            )

            packaged = package_live_photo(jpg_path, mov_path)
            package_path = Path(str(packaged["package_path"])).resolve()
            # .pvt 里已经各有一份，这两个中间产物留在导出目录只会让用户以为
            # 自己拿到的是「一张图 + 一段视频」，而不是一张实况。
            jpg_path.unlink(missing_ok=True)
            mov_path.unlink(missing_ok=True)
        archive_path = make_stored_zip(
            job_dir.with_name(f"{job_dir.name}-实况照片.zip"),
            job_dir,
            [package_path],
        )
        handoff_token = uuid.uuid4().hex
        LIVE_PHOTO_JOBS[job_id] = {
            "package_path": package_path,
            "archive_path": archive_path,
            "job_dir": job_dir,
            "token": handoff_token,
            "platform_label": f"{platform['duration']:g} 秒",
            "duration": target_duration,
        }
        if reveal:
            subprocess.Popen(
                ["/usr/bin/open", "-R", str(package_path)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        lan_ip = local_lan_ip()
        return {
            "ok": True,
            "job_id": job_id,
            "platform": platform_key,
            "platform_label": f"{platform['duration']:g} 秒",
            "duration": target_duration,
            "asset_id": packaged["asset_id"],
            "output_dir": str(job_dir),
            "package_path": str(package_path),
            "photo_path": str(package_path / jpg_path.name),
            "movie_path": str(package_path / mov_path.name),
            "archive_name": archive_path.name,
            "archive_url": f"/api/live-photo/download/{handoff_token}",
            "archive_bytes": archive_path.stat().st_size,
            "handoff_url": f"http://{lan_ip}:5173/live/{handoff_token}" if lan_ip else "",
        }
    except Exception:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise


def reveal_live_photo(job_id: str) -> dict[str, Any]:
    job = LIVE_PHOTO_JOBS.get(str(job_id or ""))
    package_path = Path(str(job.get("package_path", ""))) if job else None
    if not package_path or not package_path.is_dir():
        raise ValueError("生成记录已经失效，请重新生成发布包。")
    subprocess.Popen(
        ["/usr/bin/open", "-R", str(package_path)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return {"ok": True, "package_path": str(package_path)}


def ensure_airdrop_helper() -> Path:
    if not AIR_DROP_HELPER_SOURCE.is_file():
        raise ValueError("AirDrop 辅助程序缺失，请重新下载本地版。")
    needs_compile = not AIR_DROP_HELPER_BINARY.is_file()
    if not needs_compile:
        needs_compile = AIR_DROP_HELPER_BINARY.stat().st_mtime < AIR_DROP_HELPER_SOURCE.stat().st_mtime
    if needs_compile:
        compiler = command_path("xcrun")
        if not compiler:
            raise ValueError("本机缺少 macOS 开发工具，无法打开 AirDrop 分享面板。")
        with AIR_DROP_LOCK:
            if not AIR_DROP_HELPER_BINARY.is_file() or AIR_DROP_HELPER_BINARY.stat().st_mtime < AIR_DROP_HELPER_SOURCE.stat().st_mtime:
                process = subprocess.run(
                    [compiler, "swiftc", str(AIR_DROP_HELPER_SOURCE), "-framework", "AppKit", "-o", str(AIR_DROP_HELPER_BINARY)],
                    capture_output=True,
                    text=True,
                    timeout=90,
                    check=False,
                )
                if process.returncode != 0:
                    detail = redact_error(process.stderr or process.stdout).strip()
                    raise ValueError(f"AirDrop 辅助程序准备失败{f'：{detail[-400:]}' if detail else ''}")
                os.chmod(AIR_DROP_HELPER_BINARY, 0o700)
    return AIR_DROP_HELPER_BINARY


def airdrop_live_photo(job_id: str) -> dict[str, Any]:
    job = LIVE_PHOTO_JOBS.get(str(job_id or ""))
    package_path = Path(str(job.get("package_path", ""))) if job else None
    if not package_path or not package_path.is_dir():
        raise ValueError("生成记录已经失效，请重新生成发布包。")
    helper = ensure_airdrop_helper()
    subprocess.Popen(
        [str(helper), str(package_path)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    return {"ok": True, "package_path": str(package_path)}


def prepare_live_photo_batch(form: Any) -> dict[str, Any]:
    try:
        requested_jobs = json.loads(str(form.getfirst("jobs", "[]")))
    except json.JSONDecodeError as exc:
        raise ValueError("批量实况记录格式错误。") from exc
    if not isinstance(requested_jobs, list) or len(requested_jobs) > 24:
        raise ValueError("批量导出最多支持 24 页。")

    live_items: list[tuple[int, dict[str, Any]]] = []
    seen_pages: set[int] = set()
    for item in requested_jobs:
        if not isinstance(item, dict):
            raise ValueError("批量实况记录格式错误。")
        job_id = str(item.get("job_id", ""))
        try:
            page_index = int(item.get("page_index", -1))
        except (TypeError, ValueError) as exc:
            raise ValueError("批量页码格式错误。") from exc
        job = LIVE_PHOTO_JOBS.get(job_id)
        package_path = Path(str(job.get("package_path", ""))) if job else None
        if page_index < 0 or page_index > 999 or page_index in seen_pages:
            raise ValueError("批量页码重复或超出范围。")
        if not package_path or not package_path.is_dir():
            raise ValueError("部分实况生成记录已经失效，请重新导出。")
        seen_pages.add(page_index)
        live_items.append((page_index, job))

    static_fields: list[tuple[int, Any]] = []
    for field in form.list or []:
        name = str(getattr(field, "name", ""))
        if not name.startswith("static_"):
            continue
        try:
            page_index = int(name.removeprefix("static_"))
        except ValueError as exc:
            raise ValueError("普通图片页码格式错误。") from exc
        if page_index < 0 or page_index > 999 or page_index in seen_pages:
            raise ValueError("批量页码重复或超出范围。")
        seen_pages.add(page_index)
        static_fields.append((page_index, field))

    if not live_items and not static_fields:
        raise ValueError("没有可整理的导出内容。")
    if len(live_items) + len(static_fields) > 24:
        raise ValueError("批量导出最多支持 24 页。")

    title = safe_live_photo_stem(str(form.getfirst("title", "")), "写了就发")
    batch_id = uuid.uuid4().hex[:12]
    token = uuid.uuid4().hex
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    batch_dir = BATCH_OUTPUT_ROOT / f"{timestamp}-{batch_id[:6]}-{title}"
    batch_dir.mkdir(parents=True, mode=0o700, exist_ok=False)
    airdrop_paths: list[Path] = []

    try:
        for page_index, job in sorted(live_items, key=lambda item: item[0]):
            package_path = Path(str(job["package_path"]))
            destination = batch_dir / f"{page_index + 1:02d}-实况.pvt"
            shutil.copytree(package_path, destination)
            airdrop_paths.append(destination)

        for page_index, field in sorted(static_fields, key=lambda item: item[0]):
            destination = batch_dir / f"{page_index + 1:02d}-图片.png"
            header = write_uploaded_file(field, destination, MAX_IMAGE_BYTES, f"第 {page_index + 1} 页图片")
            if not header.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValueError(f"第 {page_index + 1} 页不是有效 PNG。")
            airdrop_paths.append(destination)

        archive_path = make_stored_zip(
            batch_dir.with_suffix(".zip"),
            batch_dir,
            sorted(batch_dir.iterdir()),
        )
    except Exception:
        shutil.rmtree(batch_dir, ignore_errors=True)
        raise

    BATCH_EXPORTS[batch_id] = {
        "batch_dir": batch_dir,
        "archive_path": archive_path,
        "airdrop_paths": airdrop_paths,
        "token": token,
    }
    return {
        "ok": True,
        "batch_id": batch_id,
        "output_dir": str(batch_dir),
        "archive_name": archive_path.name,
        "archive_url": f"/api/live-photo/batch-download/{token}",
        "archive_bytes": archive_path.stat().st_size,
        "count": len(airdrop_paths),
    }


def live_photo_batch_by_token(token: str) -> dict[str, Any] | None:
    clean_token = str(token or "").strip()
    if not re.fullmatch(r"[a-f0-9]{32}", clean_token):
        return None
    return next((batch for batch in BATCH_EXPORTS.values() if batch.get("token") == clean_token), None)


def reveal_live_photo_batch(batch_id: str) -> dict[str, Any]:
    batch = BATCH_EXPORTS.get(str(batch_id or ""))
    batch_dir = Path(str(batch.get("batch_dir", ""))) if batch else None
    if not batch_dir or not batch_dir.is_dir():
        raise ValueError("批量导出记录已经失效，请重新导出。")
    subprocess.Popen(
        ["/usr/bin/open", str(batch_dir)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return {"ok": True, "output_dir": str(batch_dir)}


def airdrop_live_photo_batch(batch_id: str) -> dict[str, Any]:
    batch = BATCH_EXPORTS.get(str(batch_id or ""))
    paths = [Path(str(path)) for path in batch.get("airdrop_paths", [])] if batch else []
    if not paths or any(not path.exists() for path in paths):
        raise ValueError("批量导出记录已经失效，请重新导出。")
    helper = ensure_airdrop_helper()
    subprocess.Popen(
        [str(helper), *[str(path) for path in paths]],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    return {"ok": True, "count": len(paths)}


def live_photo_job_by_token(token: str) -> dict[str, Any] | None:
    clean_token = str(token or "").strip()
    if not re.fullmatch(r"[a-f0-9]{32}", clean_token):
        return None
    return next((job for job in LIVE_PHOTO_JOBS.values() if job.get("token") == clean_token), None)


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
        origin = str(self.headers.get("Origin", ""))
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(encoded)

    def do_OPTIONS(self) -> None:
        path = self.path.split("?", 1)[0]
        origin = str(self.headers.get("Origin", ""))
        client_ip = str(self.client_address[0])
        if client_ip not in {"127.0.0.1", "::1"} or not path.startswith("/api/live-photo/") or origin not in ALLOWED_ORIGINS:
            self.send_error(403, "Local request only")
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def send_live_photo_handoff(self, token: str, job: dict[str, Any]) -> None:
        package_path = Path(str(job.get("package_path", "Live-Photo.pvt")))
        platform_label = html_module.escape(str(job.get("platform_label", "发布平台")))
        duration = html_module.escape(f"{float(job.get('duration', 0)):g}")
        safe_token = html_module.escape(token, quote=True)
        page = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>领取 Live Photo</title><style>
body{{margin:0;background:#f4f6f8;color:#17202f;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}}
main{{max-width:560px;margin:0 auto;padding:28px 20px 48px}}.card{{background:#fff;border:1px solid #e3e7ec;border-radius:18px;padding:24px;box-shadow:0 16px 40px rgba(20,30,45,.08)}}
.badge{{display:inline-flex;padding:6px 9px;border-radius:999px;background:#17202f;color:#fff;font-size:12px;font-weight:800}}h1{{font-size:25px;margin:16px 0 8px}}p{{line-height:1.7;color:#556172}}a{{display:block;margin:20px 0 12px;padding:15px 18px;border-radius:12px;background:#17202f;color:#fff;text-decoration:none;text-align:center;font-weight:800}}
.warn{{padding:14px;border-radius:12px;background:#fff5d8;color:#6b4b00;font-size:14px;line-height:1.65}}ol{{padding-left:22px;line-height:1.8}}small{{display:block;color:#7a8797;line-height:1.6}}
</style></head><body><main><div class="card"><span class="badge">LIVE</span><h1>Live Photo 已生成</h1>
<p>{platform_label} · {duration} 秒 · {html_module.escape(package_path.name)}</p>
<div class="warn">扫码下载的是完整备份 ZIP，不会仅凭网页下载就自动进入 iPhone 相册。要保留“实况”识别，推荐在 Mac 的 Finder 中把整个 .pvt 通过 AirDrop 发到 iPhone。</div>
<a href="/api/live-photo/download/{safe_token}">下载 JPG + MOV + .pvt 备份</a>
<ol><li>回到 Mac，在导出完成弹窗点击“Finder 中显示”。</li><li>选中整个 .pvt，使用 AirDrop 发送到 iPhone。</li><li>在照片中确认左上角显示“实况”后，再去平台发布。</li></ol>
<small>本页面只在当前局域网和本次写了就发进程运行期间有效。</small></div></main></body></html>"""
        encoded = page.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def send_live_photo_archive(self, job: dict[str, Any]) -> None:
        archive_path = Path(str(job.get("archive_path", "")))
        if not archive_path.is_file():
            self.send_error(404, "Live Photo backup not found")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Length", str(archive_path.stat().st_size))
        self.send_header("Content-Disposition", f'attachment; filename="{archive_path.name.encode("ascii", "ignore").decode() or "live-photo-backup.zip"}"')
        self.send_header("Cache-Control", "no-store")
        origin = str(self.headers.get("Origin", ""))
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
            self.send_header("Vary", "Origin")
        self.end_headers()
        with archive_path.open("rb") as source:
            shutil.copyfileobj(source, self.wfile)

    def do_GET(self) -> None:
        path = self.path.split("?", 1)[0]
        if path.startswith("/live/"):
            token = path.removeprefix("/live/")
            job = live_photo_job_by_token(token)
            if not job:
                self.send_error(404, "Live Photo handoff expired")
                return
            self.send_live_photo_handoff(token, job)
            return
        if path.startswith("/api/live-photo/download/"):
            token = path.removeprefix("/api/live-photo/download/")
            job = live_photo_job_by_token(token)
            if not job:
                self.send_error(404, "Live Photo handoff expired")
                return
            self.send_live_photo_archive(job)
            return
        if path.startswith("/api/live-photo/batch-download/"):
            token = path.removeprefix("/api/live-photo/batch-download/")
            batch = live_photo_batch_by_token(token)
            if not batch:
                self.send_error(404, "Batch export expired")
                return
            self.send_live_photo_archive(batch)
            return
        client_ip = str(self.client_address[0])
        if client_ip not in {"127.0.0.1", "::1"}:
            self.send_error(403, "Local handoff only")
            return
        if path == "/api/wechat/status":
            self.send_json(200, wechat_status())
            return
        if path == "/api/live-photo/status":
            self.send_json(200, live_photo_status())
            return
        super().do_GET()

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        if path not in {
            "/api/wechat/drafts",
            "/api/live-photo/render",
            "/api/live-photo/reveal",
            "/api/live-photo/airdrop",
            "/api/live-photo/batch",
            "/api/live-photo/batch-reveal",
            "/api/live-photo/batch-airdrop",
        }:
            self.send_json(404, {"ok": False, "error": "接口不存在。"})
            return
        if str(self.client_address[0]) not in {"127.0.0.1", "::1"}:
            self.send_json(403, {"ok": False, "error": "只允许在当前 Mac 上生成和管理发布包。"})
            return
        origin = str(self.headers.get("Origin", ""))
        if origin not in ALLOWED_ORIGINS:
            self.send_json(403, {"ok": False, "error": "只允许从本机写了就发页面同步。"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if path == "/api/live-photo/render":
            request_limit = MAX_LIVE_PHOTO_REQUEST_BYTES + MAX_LIVE_OVERLAY_BYTES + 1024 * 1024
        elif path == "/api/live-photo/batch":
            request_limit = MAX_BATCH_EXPORT_BYTES
        else:
            request_limit = MAX_REQUEST_BYTES
        if length <= 0 or length > request_limit:
            if path == "/api/live-photo/render":
                message = "视频上传内容为空或超过 350MB。"
            elif path == "/api/live-photo/batch":
                message = "批量导出内容为空或超过 300MB。"
            else:
                message = "同步内容为空或超过 80MB。"
            self.send_json(413, {"ok": False, "error": message})
            return
        try:
            if path in {"/api/live-photo/render", "/api/live-photo/batch"}:
                content_type = str(self.headers.get("Content-Type", ""))
                if not content_type.lower().startswith("multipart/form-data"):
                    raise ValueError("实况导出请求格式错误。")
                if not LIVE_PHOTO_LOCK.acquire(blocking=False):
                    self.send_json(409, {"ok": False, "error": "已有实况导出正在处理，请稍后再试。"})
                    return
                try:
                    form = cgi.FieldStorage(
                        fp=self.rfile,
                        headers=self.headers,
                        environ={
                            "REQUEST_METHOD": "POST",
                            "CONTENT_TYPE": content_type,
                            "CONTENT_LENGTH": str(length),
                        },
                        keep_blank_values=True,
                    )
                    result = render_live_photo(form) if path == "/api/live-photo/render" else prepare_live_photo_batch(form)
                finally:
                    LIVE_PHOTO_LOCK.release()
            else:
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("请求格式错误。")
                if path == "/api/live-photo/reveal":
                    result = reveal_live_photo(str(payload.get("job_id", "")))
                elif path == "/api/live-photo/airdrop":
                    result = airdrop_live_photo(str(payload.get("job_id", "")))
                elif path == "/api/live-photo/batch-reveal":
                    result = reveal_live_photo_batch(str(payload.get("batch_id", "")))
                elif path == "/api/live-photo/batch-airdrop":
                    result = airdrop_live_photo_batch(str(payload.get("batch_id", "")))
                else:
                    result = sync_wechat_draft(payload)
        except subprocess.TimeoutExpired:
            message = "实况照片处理超时，没有生成发布包。" if path.startswith("/api/live-photo/") else "同步等待超时，请稍后检查公众号草稿箱。"
            self.send_json(504, {"ok": False, "error": message})
            return
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            self.send_json(400, {"ok": False, "error": redact_error(str(exc))})
            return
        except Exception as exc:
            self.log_message("%s failed: %s", path, redact_error(str(exc)))
            message = "本机实况照片服务异常，没有生成发布包。" if path.startswith("/api/live-photo/") else "本机同步服务异常，没有确认草稿写入。"
            self.send_json(500, {"ok": False, "error": message})
            return
        self.send_json(200, result)

    def log_message(self, format_string: str, *args: Any) -> None:
        sys.stderr.write(f"[write-then-publish] {format_string % args}\n")


def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", 5173), AppHandler)
    print("写了就发已启动：http://127.0.0.1:5173/", flush=True)
    lan_ip = local_lan_ip()
    if lan_ip:
        print(f"手机交接地址：http://{lan_ip}:5173/（只开放带随机口令的实况领取页）", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
