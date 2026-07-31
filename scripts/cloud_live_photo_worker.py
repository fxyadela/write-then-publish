#!/usr/bin/env python3
"""Process one Supabase Live Photo job on a macOS GitHub Actions runner."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


FUNCTION_URL = os.environ.get("SUPABASE_FUNCTION_URL", "").strip()
WORKER_SECRET = os.environ.get("CLOUD_JOB_SECRET", "").strip()
JOB_ID = os.environ.get("LIVE_PHOTO_JOB_ID", "").strip()


def edge_request(payload: dict[str, Any], timeout: int = 60) -> dict[str, Any]:
    if not FUNCTION_URL or not WORKER_SECRET:
        raise RuntimeError("Cloud worker secrets are missing.")
    request = urllib.request.Request(
        FUNCTION_URL,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-worker-secret": WORKER_SECRET,
            "User-Agent": "write-then-publish-macos-worker",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Cloud coordinator returned HTTP {error.code}: {detail[-500:]}") from error
    if not result.get("ok"):
        raise RuntimeError(str(result.get("error") or "Cloud coordinator rejected the request."))
    return result


def report(status: str, progress: int, stage: str, **extra: Any) -> None:
    edge_request(
        {
            "action": "worker_update",
            "job_id": JOB_ID,
            "status": status,
            "progress": progress,
            "stage": stage,
            **extra,
        }
    )


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "write-then-publish-macos-worker"})
    with urllib.request.urlopen(request, timeout=180) as response, destination.open("wb") as target:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            target.write(chunk)
    if destination.stat().st_size <= 0:
        raise RuntimeError(f"Downloaded input is empty: {destination.name}")


def upload(url: str, source: Path) -> None:
    request = urllib.request.Request(
        url,
        data=source.read_bytes(),
        method="PUT",
        headers={
            "Content-Type": "application/zip",
            "Cache-Control": "max-age=3600",
            "x-upsert": "true",
            "User-Agent": "write-then-publish-macos-worker",
        },
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        if response.status not in {200, 201}:
            raise RuntimeError(f"Result upload returned HTTP {response.status}.")


class UploadField:
    def __init__(self, path: Path, filename: str) -> None:
        self.filename = filename
        self.file = path.open("rb")

    def close(self) -> None:
        self.file.close()


class JobForm:
    def __init__(self, fields: dict[str, Any]) -> None:
        self.fields = fields

    def __contains__(self, key: str) -> bool:
        return key in self.fields

    def __getitem__(self, key: str) -> Any:
        return self.fields[key]

    def getfirst(self, key: str, default: Any = None) -> Any:
        value = self.fields.get(key, default)
        return default if isinstance(value, UploadField) else value


def process_job() -> None:
    if not JOB_ID:
        raise RuntimeError("LIVE_PHOTO_JOB_ID is missing.")
    job = edge_request({"action": "worker_job", "job_id": JOB_ID})
    manifest = job.get("manifest") if isinstance(job.get("manifest"), dict) else {}
    inputs = job.get("inputs") if isinstance(job.get("inputs"), list) else []
    output = job.get("output") if isinstance(job.get("output"), dict) else {}

    with tempfile.TemporaryDirectory(prefix="write-then-publish-cloud-") as temp_name:
        temp_dir = Path(temp_name)
        output_root = temp_dir / "output"
        os.environ["WRITE_THEN_PUBLISH_LIVE_OUTPUT"] = str(output_root)
        os.environ["WRITE_THEN_PUBLISH_BATCH_OUTPUT"] = str(temp_dir / "batch")

        report("processing", 18, "正在下载视频和卡片")
        fields: dict[str, Any] = {str(key): value for key, value in manifest.items()}
        uploaded_fields: list[UploadField] = []
        try:
            for item in inputs:
                if not isinstance(item, dict):
                    continue
                key = str(item.get("key") or "")
                name = str(item.get("name") or f"{key}.bin")
                path = temp_dir / name
                download(str(item.get("signed_url") or ""), path)
                field = UploadField(path, name)
                fields[key] = field
                uploaded_fields.append(field)

            report("processing", 32, "正在检查视频画面")
            sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
            import server  # pylint: disable=import-outside-toplevel

            report("processing", 45, "正在无损裁剪并合成卡片")
            result = server.render_live_photo(JobForm(fields))
            output_dir = Path(str(result.get("output_dir") or ""))
            archive_path = output_dir.parent / str(result.get("archive_name") or "")
            if not archive_path.is_file():
                raise RuntimeError("Live Photo renderer did not return an archive.")

            report("processing", 90, "正在上传完整实况下载包")
            upload(str(output.get("signed_url") or ""), archive_path)
            report(
                "complete",
                100,
                "实况下载包已完成",
                result_name=str(result.get("archive_name") or archive_path.name),
                result_bytes=archive_path.stat().st_size,
            )
        finally:
            for field in uploaded_fields:
                field.close()


def main() -> int:
    try:
        process_job()
        return 0
    except Exception as error:  # noqa: BLE001 - the worker must report every terminal failure
        message = str(error).strip() or "云端实况处理失败。"
        try:
            if JOB_ID and FUNCTION_URL and WORKER_SECRET:
                report("failed", 0, "云端处理失败", error=message[:500])
        except Exception:
            pass
        print(message, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
