"""Replace the five map scenes and retain the previous film's audio packets."""

from hashlib import sha256
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
RENDERER = HERE.parents[2] / "workflows" / "reference-video" / "cinematic"
SOURCE = HERE.parent / "r05-motion" / "tau-cao-toc-trung-quoc-ban-do-dong.mp4"
FRAME_RANGES = ((872, 2155), (6524, 6878))
MAP_SHOTS = {"overview", "regional", "stops", "distance", "recap"}
FINAL = HERE / "tau-cao-toc-trung-quoc-ban-do-giao-thong.mp4"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def prepare_props():
    sound_timeline = HERE.parent / "r04-long" / "props.json"
    props = json.loads((HERE / "map-data.json").read_text(encoding="utf-8"))
    props["shots"] = [shot for shot in json.loads(sound_timeline.read_text(encoding="utf-8"))["shots"]
                      if shot["id"] in MAP_SHOTS]
    (HERE / "props.json").write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")


def remotion(command, output, *options):
    subprocess.run([
        "node", "node_modules/@remotion/cli/remotion-cli.js", command,
        "src/china-rail/road-map-entry.tsx", "ChinaRailRoadMap", str(output),
        "--props=" + str(HERE / "props.json"), "--public-dir=" + str(HERE / "public"),
        "--is-production=false", "--log=warn", *options,
    ], cwd=RENDERER, check=True)


def ffmpeg(*args):
    return subprocess.run([FFMPEG, "-hide_banner", "-v", "error", "-xerror", *map(str, args)],
                          check=True, capture_output=True)


def count_frames(movie):
    report = ffmpeg("-progress", "pipe:1", "-i", movie, "-an", "-f", "null", "-").stdout
    return int(report.rsplit(b"frame=", 1)[1].splitlines()[0])


def audio_hash(movie):
    return ffmpeg("-i", movie, "-map", "0:a:0", "-c:a", "copy", "-f", "hash",
                  "-hash", "sha256", "pipe:1").stdout.decode().strip()


def render_and_join(temporary):
    patches = [temporary / f"map-segment-{index}.mp4" for index in range(1, 3)]
    for patch, (start, stop) in zip(patches, FRAME_RANGES):
        remotion("render", patch, f"--frames={start}-{stop-1}", "--quiet", "--codec=h264",
                 "--pixel-format=yuv420p", "--image-format=jpeg", "--jpeg-quality=94",
                 "--crf=17", "--concurrency=8", "--muted")
        if count_frames(patch) != stop - start:
            raise RuntimeError(f"Wrong frame count in {patch}")
    (start_1, end_1), (start_2, end_2) = FRAME_RANGES
    filter_graph = (
        f"[0:v]trim=end_frame={start_1},setpts=PTS-STARTPTS[head];"
        "[1:v]setpts=PTS-STARTPTS[map1];"
        f"[0:v]trim=start_frame={end_1}:end_frame={start_2},setpts=PTS-STARTPTS[middle];"
        "[2:v]setpts=PTS-STARTPTS[map2];"
        f"[0:v]trim=start_frame={end_2},setpts=PTS-STARTPTS[tail];"
        "[head][map1][middle][map2][tail]concat=n=5:v=1:a=0[v]"
    )
    partial = temporary / "pending.mp4"
    ffmpeg("-y", "-i", SOURCE, "-i", patches[0], "-i", patches[1],
           "-filter_complex", filter_graph, "-map", "[v]", "-map", "0:a:0", "-r", "24",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p",
           "-c:a", "copy", "-movflags", "+faststart", partial)
    audio = audio_hash(partial)
    frames = count_frames(partial)
    if frames != 7200 or audio != audio_hash(SOURCE):
        raise RuntimeError("The revision changed the film's length or audio")
    partial.replace(FINAL)
    ffmpeg("-y", "-ss", start_1 / 24, "-i", FINAL, "-t", (end_1 - start_1) / 24,
           "-vf", "scale=1280:720", "-c:v", "libx264", "-preset", "fast", "-crf", "19",
           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", HERE / "xem-thu-ban-do.mp4")
    (HERE / "qa.json").write_text(json.dumps({
        "durationSeconds": 300, "decodedFrames": frames, "fps": 24, "audioPacketHash": audio,
        "replacedFramesEndExclusive": FRAME_RANGES,
        "mapDataHash": sha256((HERE / "map-data.json").read_bytes()).hexdigest(),
        "sha256": sha256(FINAL.read_bytes()).hexdigest(),
    }, indent=2) + "\n", encoding="utf-8")
    print(f"Verified {frames} frames and retained audio {audio}", flush=True)


if __name__ == "__main__":
    prepare_props()
    if len(sys.argv) > 1:
        for frame in map(int, sys.argv[1:]):
            remotion("still", HERE / f"frame-{frame}.png", f"--frame={frame}", "--scale=0.75")
    else:
        with TemporaryDirectory(prefix="render-", dir=HERE) as folder:
            render_and_join(Path(folder))
