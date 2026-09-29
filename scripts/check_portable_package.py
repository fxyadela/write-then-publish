#!/usr/bin/env python3
"""Check one exported 写了就发 draft before calling it a usable backup."""

import json
import sys
from zipfile import ZipFile


def main(path):
    with ZipFile(path) as archive:
        assert archive.testzip() is None, "ZIP CRC mismatch"
        names = set(archive.namelist())
        roots = [name[:-len("manifest.json")] for name in names if name.endswith("/manifest.json")]
        assert len(roots) == 1, "expected exactly one draft folder"
        root = roots[0]
        manifest = json.loads(archive.read(root + "manifest.json"))
        project = json.loads(archive.read(root + "project.json"))
        assert manifest["format"] == "write-then-publish" and manifest["version"] == 1
        media = {item["path"]: item for item in manifest["media"]}
        assert len(media) == len(manifest["media"]), "duplicate media path"
        for relative, item in media.items():
            data = archive.read(root + relative)
            assert len(data) == item["size"], f"size mismatch: {relative}"
            if relative.lower().endswith(".gif"):
                assert data[:6] in (b"GIF87a", b"GIF89a"), f"not a GIF: {relative}"
        for image in project["data"]["images"].values():
            assert image["portableSrcPath"] in media, "missing image"
            if image.get("kind") == "live":
                assert image["portableVideoPath"] in media, "missing live video"
        print(f"OK: {len(media)} original media files in {root}")


if __name__ == "__main__":
    main(sys.argv[1])
