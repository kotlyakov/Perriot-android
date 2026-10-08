#!/bin/sh
set -eu
cd "$(dirname "$0")"
if ! command -v javac >/dev/null 2>&1; then
    echo 'Full JDK 17 required (javac missing).' >&2
    exit 1
fi
if [ ! -f app/src/main/assets/index.html ]; then
    echo 'Run npm run android:assets from the project root first.' >&2
    exit 1
fi
exec ./gradlew :app:assembleDebug "$@"
