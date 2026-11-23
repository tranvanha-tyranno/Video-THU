"""Replace the route scene at its original frame boundaries and copy the AAC track."""
from hashlib import sha256
from pathlib import Path
import json
import re
import subprocess

import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
ORIGINAL = HERE.parent / "tau-cao-toc-trung-quoc.mp4"
PATCH = HERE / "map-scene.mp4"
OUTPUT = HERE / "tau-cao-toc-trung-quoc-ban-do.mp4"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def run(*args, **kwargs):
    return subprocess.run([FFMPEG, "-hide_banner", "-v", "error", *map(str, args)], check=True, **kwargs)


def decoded_frames(file):
    result = run("-xerror", "-progress", "pipe:1", "-i", file, "-an", "-f", "null", "-",
                 capture_output=True)
    return int(re.findall(rb"(?m)^frame=(\d+)", result.stdout)[-1])


def audio_hash(file):
    return run("-i", file, "-map", "0:a:0", "-c:a", "copy", "-f", "hash", "-hash",
               "sha256", "-", capture_output=True, text=True).stdout.strip()


def main():
    shots = json.loads((HERE.parent / "timeline.json").read_text(encoding="utf-8"))["shots"]
    route = next(shot for shot in shots if shot["id"] == "route")
    start, frames = route["start"], route["frames"]
    end = start + frames
    total = sum(shot["frames"] for shot in shots)
    if decoded_frames(PATCH) != frames:
        raise ValueError("The new map scene must match the original route duration")
    normalize = "setpts=PTS-STARTPTS,scale=in_range=full:out_range=tv,format=yuv420p"
    graph = (
        "[0:v]split[opening][closing];"
        f"[opening]trim=end_frame={start},{normalize}[a];"
        f"[1:v]{normalize}[b];"
        f"[closing]trim=start_frame={end},{normalize}[c];"
        "[a][b][c]concat=n=3:v=1:a=0[video]"
    )
    temporary = OUTPUT.with_suffix(".partial.mp4")
    run("-y", "-i", ORIGINAL, "-i", PATCH, "-filter_complex", graph, "-map", "[video]",
        "-map", "0:a:0", "-c:a", "copy", "-c:v", "libx264", "-preset", "fast",
        "-crf", "16", "-movflags", "+faststart", temporary)
    count = decoded_frames(temporary)
    narration = audio_hash(temporary)
    if count != total or narration != audio_hash(ORIGINAL):
        raise ValueError("Final frame count or AAC stream differs from the original")
    temporary.replace(OUTPUT)
    run("-y", "-ss", "7.8", "-i", PATCH, "-frames:v", "1", "-vf", "scale=1280:720",
        HERE / "ban-do.jpg")
    (HERE / "qa.json").write_text(json.dumps({
        "decodedFrames": count, "fps": 30, "mapStartFrame": start, "mapFrames": frames,
        "originalAudioHash": narration, "outputAudioHash": narration,
        "outputSHA256": sha256(OUTPUT.read_bytes()).hexdigest(),
    }, indent=2), encoding="utf-8")
    print(f"Verified {count} frames and an identical AAC track")


if __name__ == "__main__":
    main()
