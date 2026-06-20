#!/usr/bin/env bash
set -euo pipefail

# Encode video renditions and extract audio / subtitles / thumbnails from one
# source file into input/{video,audio,subtitles,thumbnails}/ for packaging.

INPUT="$1"

VIDEO_DIR="input/video"
AUDIO_DIR="input/audio"
SUBS_DIR="input/subtitles"
THUMBS_DIR="input/thumbnails"

rm -rf "$VIDEO_DIR" "$AUDIO_DIR" "$SUBS_DIR" "$THUMBS_DIR"
mkdir -p "$VIDEO_DIR" "$AUDIO_DIR" "$SUBS_DIR" "$THUMBS_DIR"

is_valid_lang() {
	[ -n "$1" ] && [ "$1" != "und" ]
}

########################################
# Video renditions (1080p / 720p / 480p)
########################################

SEGMENT_DURATION=6

FPS=$(ffprobe -v error \
	-select_streams v:0 \
	-show_entries stream=avg_frame_rate \
	-of csv=p=0 "$INPUT" |
	awk -F/ '{printf "%.0f", $1/$2}')

FPS=${FPS:-24}

GOP=$((FPS * SEGMENT_DURATION))
KF_EXPR="expr:gte(t,n_forced*${SEGMENT_DURATION})"

echo "================================================="
echo "Encoding video renditions..."
echo "================================================="

ffmpeg -nostdin -hide_banner \
	-loglevel error -stats \
	-y \
	-i "$INPUT" \
	-filter_complex "
        [0:v]split=3[v1080][v720][v480];
        [v1080]fps=${FPS},setsar=1,format=yuv420p[v1080out];
        [v720]fps=${FPS},scale=1280:-2:flags=lanczos,setsar=1,format=yuv420p[v720out];
        [v480]fps=${FPS},scale=854:-2:flags=lanczos,setsar=1,format=yuv420p[v480out]
    " \
	\
	-map "[v1080out]" \
	-c:v libx264 \
	-preset faster \
	-profile:v high \
	-crf 20 \
	-maxrate 8000k \
	-bufsize 16000k \
	-g "$GOP" \
	-keyint_min "$GOP" \
	-sc_threshold 0 \
	-x264-params "keyint=$GOP:min-keyint=$GOP:scenecut=0:open-gop=0" \
	-force_key_frames "$KF_EXPR" \
	-fps_mode cfr \
	-map_metadata -1 \
	-map_chapters -1 \
	-movflags +faststart \
	"$VIDEO_DIR/video_1080p.mp4" \
	\
	-map "[v720out]" \
	-c:v libx264 \
	-preset faster \
	-profile:v high \
	-crf 22 \
	-maxrate 4500k \
	-bufsize 9000k \
	-g "$GOP" \
	-keyint_min "$GOP" \
	-sc_threshold 0 \
	-x264-params "keyint=$GOP:min-keyint=$GOP:scenecut=0:open-gop=0" \
	-force_key_frames "$KF_EXPR" \
	-fps_mode cfr \
	-map_metadata -1 \
	-map_chapters -1 \
	-movflags +faststart \
	"$VIDEO_DIR/video_720p.mp4" \
	\
	-map "[v480out]" \
	-c:v libx264 \
	-preset faster \
	-profile:v high \
	-crf 24 \
	-maxrate 2200k \
	-bufsize 4400k \
	-g "$GOP" \
	-keyint_min "$GOP" \
	-sc_threshold 0 \
	-x264-params "keyint=$GOP:min-keyint=$GOP:scenecut=0:open-gop=0" \
	-force_key_frames "$KF_EXPR" \
	-fps_mode cfr \
	-map_metadata -1 \
	-map_chapters -1 \
	-movflags +faststart \
	"$VIDEO_DIR/video_480p.mp4"

echo
echo "Finished encoding video renditions."

########################################
# Audio tracks (AAC stereo)
########################################

audio_num=0

while IFS=, read -r idx lang; do
	is_valid_lang "$lang" || {
		echo "Skipping audio stream #$idx: undefined language"
		continue
	}

	outfile=$(printf "%s/audio_%02d_%s.mp4" \
		"$AUDIO_DIR" "$audio_num" "$lang")

	echo "================================================="
	echo "Audio $((audio_num + 1))"
	echo "Input stream : #$idx"
	echo "Language     : $lang"
	echo "Codec        : AAC-LC"
	echo "Bitrate      : 160k"
	echo "Channels     : 2"
	echo "Output file  : $(basename "$outfile")"
	echo "Status       : Converting..."
	echo "================================================="

	ffmpeg -nostdin -hide_banner \
		-loglevel error -stats \
		-y \
		-i "$INPUT" \
		-map 0:"$idx" \
		-vn -sn \
		-c:a aac \
		-b:a 160k \
		-ac 2 \
		-map_metadata -1 \
		-map_chapters -1 \
		-metadata:s:a:0 language="$lang" \
		-movflags +faststart \
		"$outfile"

	echo
	echo "Completed: $(basename "$outfile")"

	((++audio_num))

done < <(
	ffprobe -v error \
		-select_streams a \
		-show_entries stream=index:stream_tags=language \
		-of csv=p=0 "$INPUT"
)

echo
echo "Finished converting $audio_num audio track(s)."

########################################
# Subtitle tracks (WebVTT)
########################################

BITMAP_SUBS="hdmv_pgs_subtitle dvd_subtitle dvb_subtitle"

sub_num=0

while IFS=, read -r idx codec lang; do
	is_valid_lang "$lang" || {
		echo "Skipping subtitle stream #$idx: undefined language"
		continue
	}

	[[ " $BITMAP_SUBS " == *" $codec "* ]] && {
		echo "Skipping subtitle stream #$idx ($lang): bitmap subtitle ($codec)"
		continue
	}

	outfile=$(printf "%s/subtitle_%02d_%s.vtt" \
		"$SUBS_DIR" "$sub_num" "$lang")

	echo "================================================="
	echo "Subtitle $((sub_num + 1))"
	echo "Input stream : #$idx"
	echo "Language     : $lang"
	echo "Codec        : $codec"
	echo "Output file  : $(basename "$outfile")"
	echo "Status       : Converting..."
	echo "================================================="

	ffmpeg -nostdin -hide_banner \
		-loglevel error -stats \
		-y \
		-i "$INPUT" \
		-map 0:"$idx" \
		-vn -an -dn \
		-c:s webvtt \
		-map_metadata -1 \
		-map_chapters -1 \
		"$outfile"

	echo
	echo "Completed: $(basename "$outfile")"

	((++sub_num))

done < <(
	ffprobe -v error \
		-select_streams s \
		-show_entries stream=index,codec_name:stream_tags=language \
		-of csv=p=0 "$INPUT"
)

echo
echo "Finished converting $sub_num subtitle track(s)."

########################################
# Thumbnails
########################################

echo "================================================="
echo "Generating thumbnails..."
echo "================================================="

ffmpeg -hide_banner -y -loglevel error -stats \
	-i "$INPUT" \
	-vf "fps=1/10,scale=320:180:flags=lanczos" \
	-q:v 5 \
	-map_metadata -1 \
	-map_chapters -1 \
	"$THUMBS_DIR/thumbnail_%d.jpg"

echo
echo "Finished generating thumbnails."
echo
