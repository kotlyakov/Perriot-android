#!/usr/bin/env python3
"""Extract first-party web sources from a working Pierrot APK.

Usage: python3 scripts/extract_pierrot_web.py path/to/pierrot-0.4.5-preview.apk .
This never copies Android binaries, signatures or original Balatro assets.
"""
import argparse
import hashlib
import pathlib
import zipfile

ALLOWED = ("assets/src/", "assets/web/")
EXCLUDED = ("assets/web/fonts/",)
MAX_FILE = 5 * 1024 * 1024

def extract(apk: pathlib.Path, destination: pathlib.Path) -> None:
    with zipfile.ZipFile(apk) as archive:
        entries = [i for i in archive.infolist() if
                   i.filename.startswith(ALLOWED) and
                   not i.filename.startswith(EXCLUDED) and
                   i.filename.endswith((".js", ".css", ".html", ".json"))]
        if not entries:
            raise ValueError("No Pierrot web source files found")
        for entry in entries:
            if entry.file_size > MAX_FILE:
                raise ValueError("Unexpectedly large entry: " + entry.filename)
            relative = pathlib.PurePosixPath(entry.filename).relative_to("assets")
            if ".." in relative.parts:
                raise ValueError("Unsafe entry: " + entry.filename)
            output = destination.joinpath(*relative.parts)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(archive.read(entry))
            print(f"{relative}: {entry.file_size} bytes")
    print("APK SHA-256:", hashlib.sha256(apk.read_bytes()).hexdigest())

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("apk", type=pathlib.Path)
    parser.add_argument("destination", type=pathlib.Path)
    args = parser.parse_args()
    extract(args.apk, args.destination)
