#!/usr/bin/env python3
"""Static server plus a small disk-backed project store shared by all browsers."""

from __future__ import annotations

import json
import os
import threading
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "runtime-data"
STORE_FILE = DATA_DIR / "project-store.json"
MAX_BODY_BYTES = 64 * 1024 * 1024
STORE_LOCK = threading.Lock()


def empty_store() -> dict:
    return {"activeId": None, "projects": []}


def read_store() -> dict:
    if not STORE_FILE.exists():
        return empty_store()
    try:
        payload = json.loads(STORE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return empty_store()
    if not isinstance(payload, dict) or not isinstance(payload.get("projects"), list):
        return empty_store()
    return payload


def project_timestamp(project: dict) -> float:
    try:
        return float(project.get("updatedAt") or 0)
    except (TypeError, ValueError):
        return 0


def merge_store(current: dict, incoming: dict) -> dict:
    merged: dict[str, dict] = {}
    for project in [*(current.get("projects") or []), *(incoming.get("projects") or [])]:
        if not isinstance(project, dict) or not isinstance(project.get("id"), str):
            continue
        previous = merged.get(project["id"])
        if previous is None or project_timestamp(project) >= project_timestamp(previous):
            merged[project["id"]] = project

    projects = sorted(merged.values(), key=project_timestamp, reverse=True)[:24]
    project_ids = {project["id"] for project in projects}
    incoming_active = incoming.get("activeId")
    current_active = current.get("activeId")
    active_id = incoming_active if incoming_active in project_ids else current_active if current_active in project_ids else (projects[0]["id"] if projects else None)
    return {"activeId": active_id, "projects": projects}


def write_store(payload: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temporary = STORE_FILE.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    os.replace(temporary, STORE_FILE)


class WriteThenPublishHandler(SimpleHTTPRequestHandler):
    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802 - stdlib handler API
        if urlparse(self.path).path != "/api/project-store":
            return super().do_GET()
        with STORE_LOCK:
            payload = read_store()
        self.send_json(payload)

    def do_PUT(self) -> None:  # noqa: N802 - stdlib handler API
        if urlparse(self.path).path != "/api/project-store":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self.send_json({"error": "草稿数据大小无效"}, HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            return
        try:
            incoming = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json({"error": "草稿 JSON 无效"}, HTTPStatus.BAD_REQUEST)
            return
        if not isinstance(incoming, dict) or not isinstance(incoming.get("projects"), list):
            self.send_json({"error": "草稿结构无效"}, HTTPStatus.BAD_REQUEST)
            return
        with STORE_LOCK:
            merged = merge_store(read_store(), incoming)
            write_store(merged)
        self.send_json(merged)


if __name__ == "__main__":
    handler = partial(WriteThenPublishHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 5173), handler)
    print("Write Then Publish: http://127.0.0.1:5173/", flush=True)
    print(f"共享草稿库: {STORE_FILE}", flush=True)
    server.serve_forever()
