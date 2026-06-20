#!/usr/bin/env bash
set -euo pipefail

INPUT_DIR="input"
OUTPUT_DIR="output"
BENTO4_BIN="${BENTO4_BIN:-/opt/bento4/bin}"
MP4FRAGMENT="$BENTO4_BIN/mp4fragment"
MP4DASH="$BENTO4_BIN/mp4dash"
THUMBNAILS_DIR="thumbnails"

append_thumbnails_to_mpd() {
	local mpd="$1"
	local thumb_dir="$OUTPUT_DIR/$THUMBNAILS_DIR"
	local tmp

	if [ ! -d "$thumb_dir" ]; then
		echo "No thumbnail directory found at $thumb_dir; skipping thumbnail AdaptationSet."
		return
	fi

	if ! compgen -G "$thumb_dir/*.jpg" >/dev/null; then
		echo "No JPEG thumbnails found in $thumb_dir; skipping thumbnail AdaptationSet."
		return
	fi

	tmp="$(mktemp)"

	sed '/<\/Period>/i\
    <!-- Thumbnails -->\
    <AdaptationSet id="thumbnails" mimeType="image/jpeg" contentType="image">\
      <EssentialProperty schemeIdUri="http://dashif.org/guidelines/thumbnail_tile" value="10"/>\
      <SegmentTemplate media="$RepresentationID$/thumbnail_$Number$.jpg" timescale="1" duration="10" startNumber="1"/>\
      <Representation id="thumbnails" width="320" height="180" frameRate="1/10"/>\
    </AdaptationSet>' "$mpd" >"$tmp"

	mv "$tmp" "$mpd"
}

copy_thumbnails() {
	if [ ! -d "$INPUT_DIR/$THUMBNAILS_DIR" ]; then
		echo "No thumbnail directory found at $INPUT_DIR/$THUMBNAILS_DIR; skipping thumbnails."
		return
	fi

	cp -R "$INPUT_DIR/$THUMBNAILS_DIR" "$OUTPUT_DIR/$THUMBNAILS_DIR"
}

if [ ! -d "$INPUT_DIR" ]; then
	echo "Input directory not found: $INPUT_DIR" >&2
	exit 1
fi

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
FRAGMENTED_DIR="$OUTPUT_DIR/_fragmented"
mkdir -p "$FRAGMENTED_DIR"
trap 'rm -rf "$FRAGMENTED_DIR"' EXIT

shopt -s nullglob
video_inputs=(
	"$INPUT_DIR"/video/*.mp4
	"$INPUT_DIR"/*.mp4
)
audio_inputs=("$INPUT_DIR"/audio/*.mp4)
subtitle_inputs=("$INPUT_DIR"/subtitles/*.vtt)
mp4_inputs=("${video_inputs[@]}" "${audio_inputs[@]}")
shopt -u nullglob

if [ "${#mp4_inputs[@]}" -eq 0 ]; then
	echo "No MP4 files found in $INPUT_DIR/video, $INPUT_DIR/audio, or $INPUT_DIR." >&2
	echo "Encode/extract MP4 renditions first, then rerun this script." >&2
	exit 1
fi

echo "Fragmenting MP4 inputs..."
dash_inputs=()
for input in "${mp4_inputs[@]}"; do
	base="$(basename "$input")"
	fragmented="$FRAGMENTED_DIR/${base%.mp4}.fragmented.mp4"

	echo "  $input -> $fragmented"
	"$MP4FRAGMENT" "$input" "$fragmented"

	case "$input" in
	"$INPUT_DIR"/audio/*.mp4)
		dash_inputs+=("[type=audio]$fragmented")
		;;
	"$INPUT_DIR"/video/*.mp4)
		dash_inputs+=("[type=video]$fragmented")
		;;
	*)
		dash_inputs+=("$fragmented")
		;;
	esac
done

for input in "${subtitle_inputs[@]}"; do
	base="$(basename "$input" .vtt)"
	lang="${base##*_}"

	echo "Adding subtitle input: $input"
	dash_inputs+=("[+format=webvtt,+language=$lang]$input")
done

echo
echo "Packaging DASH manifest with Bento4..."
mp4dash_args=(
	--force
	--subtitles
	--exec-dir="$BENTO4_BIN"
	--output-dir="$OUTPUT_DIR"
	--mpd-name=manifest.mpd
)

"$MP4DASH" "${mp4dash_args[@]}" "${dash_inputs[@]}"

copy_thumbnails
append_thumbnails_to_mpd "$OUTPUT_DIR/manifest.mpd"

echo
