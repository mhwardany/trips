#!/usr/bin/env bash
# Packages the plugin as a SketchUp .rbz (a zip with the loader and the
# library folder at the archive root).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(dirname "$here")"
src="$root/src"
version="$(grep -oE "PLUGIN_VERSION = '[^']+'" "$src/ahw_kd.rb" | head -1 | cut -d"'" -f2)"
out="$root/dist"
name="ahw_kitchen_dressing-$version.rbz"

command -v zip >/dev/null || { echo "zip is required" >&2; exit 1; }

mkdir -p "$out"
rm -f "$out/$name"

( cd "$src" && zip -r -q "$out/$name" ahw_kd.rb ahw_kd \
    -x '*.DS_Store' -x '__MACOSX/*' -x '*/data/presets/__test_*' )

echo "built $out/$name"
echo "install in SketchUp: Window > Extension Manager > Install Extension"
