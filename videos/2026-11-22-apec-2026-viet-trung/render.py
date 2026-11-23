"""Assemble the exact Nhật Phong narration takes, render the 10-minute APEC 2026 documentary, and run QA."""

from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
import wave

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RENDERER = ROOT / "workflows/reference-video/cinematic"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 24
RATE = 48000
DURATION = 600
FRAME_SAMPLES = RATE // FPS
FINAL = HERE / "apec-2026-viet-trung-10-phut.mp4"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def script():
    for cell in (HERE / "script.txt").read_text(encoding="utf-8").strip().split("\n\n"):
        heading, *lines = cell.splitlines()
        key, title = heading.split(" | ")
        yield key, title, lines


def ffmpeg(*args, log="error"):
    return subprocess.run(
        [FFMPEG, "-hide_banner", "-v", log, "-xerror", *map(str, args)],
        capture_output=True,
        check=True,
    )


def track_frames(path):
    with wave.open(str(path), "rb") as stream:
        return stream.getnframes()


def event(samples, second, kind):
    size = round((0.64 if kind == "chapter" else 0.28) * RATE)
    t = np.arange(size, dtype=np.float32) / RATE
    f = 155.56 if kind == "chapter" else 233.08
    s = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(2 * np.pi * 1.498 * f * t)
    envelope = np.minimum(1, t / 0.03) * np.exp(-7.5 * t) * (1 - t / (size / RATE))
    start = round(second * RATE)
    end = min(len(samples), start + size)
    samples[start:end] += (0.062 if kind == "chapter" else 0.028) * (s * envelope)[: end - start]


def prepare():
    sections = list(script())
    inputs = [HERE / "narration" / f"{key}-{i}.wav" for key, _, lines in sections for i in range(len(lines))]
    seconds = np.array([track_frames(path) / RATE for path in inputs])
    planned_gaps = np.array([0.19 if i < len(lines) - 1 else 0.37 for _, _, lines in sections for i in range(len(lines))])
    voice_seconds = DURATION - planned_gaps.sum() - 0.75
    speed = float(seconds.sum() / voice_seconds)
    boundaries = np.rint(FPS * np.r_[0, np.cumsum(seconds / speed + planned_gaps)]).astype(int)
    boundaries[-1] = DURATION * FPS
    mixed = np.zeros(DURATION * RATE, np.float32)
    index = 0
    shots = []
    for key, title, lines in sections:
        start = int(boundaries[index])
        cues = []
        for _ in lines:
            frame = int(boundaries[index])
            cues.append(frame - start)
            pcm = ffmpeg(
                "-i", inputs[index],
                "-af", f"atempo={speed:.8f},highpass=f=65",
                "-ac", "1", "-ar", RATE, "-f", "f32le", "pipe:1",
            ).stdout
            audio = np.frombuffer(pcm, dtype="<f4")
            available = int(boundaries[index + 1] - frame) * FRAME_SAMPLES
            if len(audio) > available:
                tail = audio[available:]
                if len(tail) > RATE * 0.05 and np.max(np.abs(tail)) > 0.025:
                    raise ValueError(f"Speech exceeds allocated cue {inputs[index].name}")
                audio = audio[:available]
            offset = frame * FRAME_SAMPLES
            mixed[offset : offset + len(audio)] = audio
            index += 1
        end = int(boundaries[index])
        shots.append({"id": key, "title": title, "start": start, "frames": end - start, "cues": cues})
    if np.max(np.abs(mixed)) < 0.05:
        raise ValueError("Voice track is silent")
    mixed *= 0.79 / np.max(np.abs(mixed))
    for shot in shots:
        begin = shot["start"] / FPS
        event(mixed, begin, "chapter")
        if shot["id"] in {"hook", "map_bridge", "handover", "trade_surge", "trade_gap", "rail_bottleneck", "rail_map", "smart_border", "phu_quoc_map", "cta"}:
            for cue in shot["cues"][1:]:
                event(mixed, begin + cue / FPS, "detail")
    with wave.open(str(HERE / "mix.wav"), "wb") as output:
        output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        output.writeframes((np.clip(mixed, -0.999, 0.999) * 32767).astype("<i2").tobytes())
    props = {"shots": shots, "maps": read(HERE / "maps.json")}
    write(HERE / "props.json", props)
    write(
        HERE / "timing.json",
        {
            "durationSeconds": DURATION,
            "fps": FPS,
            "voiceTempo": speed,
            "voice": "Nhật Phong · local VieNeu (nhat-phong-local)",
            "shots": shots,
        },
    )
    print(f"Prepared {len(shots)} scenes and {len(inputs)} audio cues at {speed:.3f}x", flush=True)


def cli(action, output, *flags):
    subprocess.run(
        [
            "node",
            "node_modules/@remotion/cli/remotion-cli.js",
            action,
            "src/apec-entry.tsx",
            "Apec2026VietTrung",
            str(output),
            f"--props={HERE / 'props.json'}",
            f"--public-dir={HERE / 'public'}",
            "--is-production=false",
            "--log=warn",
            *flags,
        ],
        cwd=RENDERER,
        check=True,
    )


def review(movie):
    shots = read(HERE / "props.json")["shots"]
    cols = 4
    sheet = Image.new("RGB", (cols * 384, ((len(shots) + cols - 1) // cols) * 238), "#0f1c29")
    draw = ImageDraw.Draw(sheet)
    samples = []
    for i, shot in enumerate(shots):
        mid_cue = shot["cues"][1] if len(shot["cues"]) > 1 else 0
        offset = min(shot["frames"] - 1, mid_cue + round(1.8 * FPS))
        frame = shot["start"] + offset
        png = ffmpeg(
            "-ss", frame / FPS, "-i", movie, "-frames:v", 1,
            "-vf", "scale=384:216", "-f", "image2pipe", "-c:v", "png", "pipe:1",
        ).stdout
        point = ((i % cols) * 384, (i // cols) * 238)
        sheet.paste(Image.open(BytesIO(png)).convert("RGB"), point)
        draw.text((point[0] + 10, point[1] + 220), f"{frame / FPS:06.2f}   {shot['id']}", fill="white")
        samples.append({"id": shot["id"], "frame": frame})
    sheet.save(HERE / "kiem-tra-canh.jpg", quality=93)
    return samples


def render():
    picture = HERE / "picture.mp4"
    pending = HERE / "pending.mp4"
    cli(
        "render", picture, "--quiet", "--codec=h264", "--pixel-format=yuv420p",
        "--crf=18", "--image-format=jpeg", "--jpeg-quality=91", "--concurrency=8", "--muted",
    )
    ffmpeg(
        "-y", "-i", picture, "-i", HERE / "mix.wav",
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
        "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-16:TP=-2:LRA=10",
        "-ar", RATE, "-movflags", "+faststart", pending,
    )
    progress = ffmpeg("-progress", "pipe:1", "-i", pending, "-f", "null", "-").stdout
    frames = int(progress.rsplit(b"frame=", 1)[1].splitlines()[0])
    if frames != FPS * DURATION:
        raise ValueError(f"Expected 14400 frames, decoded {frames}")
    measure = (
        ffmpeg("-i", pending, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-", log="info")
        .stderr.decode(errors="replace")
        .rsplit("Summary:", 1)[-1]
        .strip()
    )
    picture_report = ffmpeg("-i", pending, "-t", 0.1, "-f", "null", "-", log="info").stderr.decode(errors="replace")
    if "1920x1080" not in picture_report or "Audio: aac" not in picture_report:
        raise ValueError("Master stream parameters did not match 1080p plus AAC audio")
    pending.replace(FINAL)
    picture.unlink()
    samples = review(FINAL)
    with FINAL.open("rb") as video:
        identity = sha256()
        for data in iter(lambda: video.read(1024 * 1024), b""):
            identity.update(data)
    write(
        HERE / "qa.json",
        {
            "sha256": identity.hexdigest(),
            "durationSeconds": frames / FPS,
            "decodedFrames": frames,
            "audioMeasurement": measure,
            "visualSamples": samples,
        },
    )
    print(f"Verified {frames} decoded frames and {len(samples)} visual samples.", flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "prepare":
        prepare()
    if len(sys.argv) < 2 or sys.argv[1] == "render":
        render()
    if len(sys.argv) > 2 and sys.argv[1] == "still":
        name = sys.argv[2]
        shot = next(item for item in read(HERE / "props.json")["shots"] if item["id"] == name)
        mid_cue = shot["cues"][1] if len(shot["cues"]) > 1 else 0
        cli(
            "still", HERE / f"proof-{name}.jpg",
            f"--frame={shot['start'] + mid_cue + 36}", "--scale=.75", "--image-format=jpeg",
        )
