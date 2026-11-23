"""Render the complete narration-timed composition, then mux its approved audio."""

from hashlib import sha256
import json
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
from time import monotonic, sleep

import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
RENDERER = HERE.parents[2] / "workflows" / "reference-video" / "cinematic"
LONG = HERE.parent / "r04-long"
ROAD = HERE.parent / "r06-road-map"
SOURCE = ROAD / "tau-cao-toc-trung-quoc-ban-do-giao-thong.mp4"
FINAL = HERE / "tau-cao-toc-trung-quoc-hoan-chinh.mp4"
FPS = 24
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def prepare(directory):
    source = read(LONG / "props.json")
    shots = source["shots"]
    cues = read(HERE / "action-cues.json")
    words = read(HERE / "word-times.json")
    cursor = 0
    for shot in shots:
        name = shot["id"]
        if shot["start"] != cursor or not words[name] or max(cues[name].values()) >= shot["frames"] / FPS:
            raise ValueError(f"Invalid narration timeline for {name}")
        cursor += shot["frames"]
    if cursor != 7200:
        raise ValueError(f"Invalid film duration: {cursor}")
    road = read(ROAD / "props.json")
    props = {"shots": shots, "overview": source["overview"], "roadMap": road, "cues": cues}
    public = directory / "public"
    public.mkdir()
    for asset, folder in [
        ("roads-beijing-tianjin.webp", ROAD), ("shanghai-train.jpg", LONG), ("china-overview.jpg", LONG),
    ]:
        shutil.copyfile(folder / "public" / asset, public / asset)
    props_path = directory / "props.json"
    write(props_path, props)
    return shots, cues, public, props_path


def ffmpeg(*args):
    return subprocess.run([FFMPEG, "-hide_banner", "-v", "error", "-xerror", *map(str, args)],
                          capture_output=True, check=True)


def audio_hash(movie):
    return ffmpeg("-i", movie, "-map", "0:a:0", "-c:a", "copy", "-f", "hash",
                  "-hash", "sha256", "pipe:1").stdout.decode().strip()


def render_picture(picture, public, props, *options):
    subprocess.run([
        "node", "node_modules/@remotion/cli/remotion-cli.js", "render",
        "src/china-rail/documentary-entry.tsx", "ChinaRailSynced", str(picture),
        f"--props={props}", f"--public-dir={public}", "--is-production=false", "--quiet",
        "--codec=h264", "--pixel-format=yuv420p", "--crf=18", "--image-format=jpeg",
        "--jpeg-quality=92", "--concurrency=8", "--muted", "--log=warn", *options,
    ], cwd=RENDERER, check=True)


def verify(partial, shots, cues):
    report = ffmpeg("-progress", "pipe:1", "-i", partial, "-f", "null", "-").stdout
    frames = int(report.rsplit(b"frame=", 1)[1].splitlines()[0])
    audio = audio_hash(partial)
    if frames != 7200 or audio != audio_hash(SOURCE):
        raise ValueError("The master changed the audio or length of the cut")
    partial.replace(FINAL)
    timeline = [{"id": shot["id"], "startFrame": shot["start"], "frames": shot["frames"],
                 "actions": {key: shot["start"] + round(seconds*FPS)
                             for key, seconds in cues[shot["id"]].items()}} for shot in shots]
    write(HERE / "qa.json", {
        "decodedFrames": frames, "durationSeconds": frames / FPS, "fps": FPS,
        "audioPacketHash": audio, "sha256": sha256(FINAL.read_bytes()).hexdigest(),
        "actionFrames": timeline,
    })
    print(f"Verified {frames} frames, {len(shots)} chapters, {sum(len(cue) for cue in cues.values())} cue points.", flush=True)


def main(directory):
    shots, cues, public, props = prepare(directory)
    picture = directory / "picture.mp4"
    render_picture(picture, public, props)
    print("Picture ready. Muxing audio and verifying the master.", flush=True)
    partial = directory / "master.mp4"
    ffmpeg("-y", "-i", picture, "-i", SOURCE, "-map", "0:v:0", "-map", "1:a:0",
           "-c", "copy", "-movflags", "+faststart", partial)
    verify(partial, shots, cues)


def render_corrections(directory):
    shots, cues, public, props = prepare(directory)
    by_id = {shot["id"]: shot for shot in shots}
    cuts = []
    for name, first_cue in [("speed", "wheels"), ("stops", "approach"), ("land", "train"), ("signal", None)]:
        shot = by_id[name]
        start = shot["start"]
        stop = start + shot["frames"]
        if first_cue:
            start += max(0, int((cues[name][first_cue] - .5) * FPS))
        patch = directory / f"{name}.mp4"
        render_picture(patch, public, props, f"--frames={start}-{stop-1}")
        cuts.append((start, stop, patch))
        print(f"Reviewed scene {name} rendered", flush=True)

    deadline = monotonic() + 600
    while not (FINAL.exists() and (HERE / "qa.json").exists()):
        if monotonic() > deadline:
            raise TimeoutError("The complete draft did not finish rendering")
        sleep(10)

    filter_parts = []
    connections = []
    previous = 0
    for index, (start, stop, _) in enumerate(cuts, 1):
        filter_parts.extend([
            f"[0:v]trim=start_frame={previous}:end_frame={start},setpts=PTS-STARTPTS[old{index}]",
            f"[{index}:v]setpts=PTS-STARTPTS[new{index}]",
        ])
        connections.append(f"[old{index}][new{index}]")
        previous = stop
    filter_parts.append(f"[0:v]trim=start_frame={previous},setpts=PTS-STARTPTS[end]")
    filter_parts.append("".join(connections) + f"[end]concat=n={len(cuts)*2+1}:v=1:a=0[v]")
    inputs = [arg for _, _, patch in cuts for arg in ("-i", patch)]
    corrected = directory / "corrected.mp4"
    ffmpeg("-y", "-i", FINAL, *inputs, "-filter_complex", ";".join(filter_parts),
           "-map", "[v]", "-map", "0:a:0", "-r", FPS, "-c:v", "libx264", "-preset", "veryfast",
           "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", corrected)
    verify(corrected, shots, cues)


if __name__ == "__main__":
    with TemporaryDirectory(prefix="render-", dir=HERE) as folder:
        (render_corrections if "--corrections" in sys.argv else main)(Path(folder))
