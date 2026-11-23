"""Render the 10-minute APEC 2026 3D WebGL cinematic documentary (r02), mux verified audio, and run QA."""

from hashlib import sha256
from io import BytesIO
import json
import os
from pathlib import Path
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
BATCH = HERE.parent
ROOT = HERE.parents[2]
RENDERER = ROOT / "workflows/reference-video/cinematic"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

PROPS = BATCH / "props.json"
MIX_WAV = BATCH / "mix.wav"
PUBLIC_DIR = HERE / "public"
FINAL = HERE / "apec-2026-viet-trung-3d-r02.mp4"
CONTACT_SHEET = HERE / "kiem-tra-canh-3d.jpg"
QA_JSON = HERE / "qa-3d.json"

FPS = 24
RATE = 48000
DURATION = 600
EXPECTED_FRAMES = FPS * DURATION
PROOF_SHOTS = [
    "hook",
    "map_bridge",
    "trade_surge",
    "rail_specs",
    "smart_border",
    "phu_quoc_map",
]


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ffmpeg(*args, log="error"):
    return subprocess.run(
        [FFMPEG, "-hide_banner", "-v", log, "-xerror", *map(str, args)],
        capture_output=True,
        check=True,
    )


def gl_flags():
    backend = os.environ.get("REMOTION_GL", "angle").strip()
    if not backend or backend.lower() == "default":
        return []
    return [f"--gl={backend}"]


def remotion_cli(action: str, output: Path, *flags: str):
    cmd = [
        "node",
        "node_modules/@remotion/cli/remotion-cli.js",
        action,
        "src/apec3d-entry.tsx",
        "Apec3DCinematic",
        str(output),
        f"--props={PROPS}",
        f"--public-dir={PUBLIC_DIR}",
        "--is-production=false",
        "--log=warn",
        *gl_flags(),
        *flags,
    ]
    subprocess.run(cmd, cwd=RENDERER, check=True)


def shot_sample_frame(shot: dict, extra_offset: int = 36) -> int:
    mid_cue = shot["cues"][1] if len(shot["cues"]) > 1 else 0
    offset = min(shot["frames"] - 1, mid_cue + extra_offset)
    return shot["start"] + offset


def render_still(name: str, extra_offset: int = 36) -> Path:
    shots = read_json(PROPS)["shots"]
    shot = next(item for item in shots if item["id"] == name)
    frame = shot_sample_frame(shot, extra_offset)
    out = HERE / f"proof-{name}.jpg"
    print(f"Rendering still {name} at frame {frame} -> {out.name}", flush=True)
    remotion_cli(
        "still",
        out,
        f"--frame={frame}",
        "--image-format=jpeg",
        "--jpeg-quality=92",
    )
    return out


def render_proofs():
    for name in PROOF_SHOTS:
        render_still(name)


def build_contact_sheet(movie: Path):
    shots = read_json(PROPS)["shots"]
    cols = 4
    rows = (len(shots) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 384, rows * 238), "#0b1320")
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
    sheet.save(CONTACT_SHEET, quality=93)
    return samples


def verify_and_qa(movie: Path):
    progress = ffmpeg("-progress", "pipe:1", "-i", movie, "-f", "null", "-").stdout
    frames = int(progress.rsplit(b"frame=", 1)[1].splitlines()[0])
    if frames != EXPECTED_FRAMES:
        raise ValueError(f"Expected {EXPECTED_FRAMES} frames, decoded {frames}")

    measure = (
        ffmpeg("-i", movie, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-", log="info")
        .stderr.decode(errors="replace")
        .rsplit("Summary:", 1)[-1]
        .strip()
    )

    picture_report = (
        ffmpeg("-i", movie, "-t", 0.1, "-f", "null", "-", log="info")
        .stderr.decode(errors="replace")
    )
    if "1920x1080" not in picture_report or "Audio: aac" not in picture_report:
        raise ValueError("Master stream parameters did not match 1080p plus AAC audio")

    samples = build_contact_sheet(movie)
    with movie.open("rb") as video:
        identity = sha256()
        for data in iter(lambda: video.read(1024 * 1024), b""):
            identity.update(data)

    qa_data = {
        "file": movie.name,
        "sha256": identity.hexdigest(),
        "sizeBytes": movie.stat().st_size,
        "durationSeconds": frames / FPS,
        "decodedFrames": frames,
        "glBackend": os.environ.get("REMOTION_GL", "angle"),
        "audioMeasurement": measure,
        "contactSheet": CONTACT_SHEET.name,
        "visualSamples": samples,
    }
    write_json(QA_JSON, qa_data)
    print(f"Verified {frames} decoded frames, {len(samples)} visual samples, sha256={qa_data['sha256'][:12]}...", flush=True)
    return qa_data


def render_master():
    if not MIX_WAV.exists():
        raise FileNotFoundError(f"Missing verified narration mix: {MIX_WAV}")
    if not PUBLIC_DIR.exists():
        raise FileNotFoundError(f"Missing staged public dir: {PUBLIC_DIR}")

    concurrency = os.environ.get("REMOTION_CONCURRENCY", "4").strip()
    picture = HERE / "picture-3d.mp4"
    pending = HERE / "pending-3d.mp4"

    print(f"Rendering 14400 frames of Apec3DCinematic (gl={os.environ.get('REMOTION_GL', 'angle')}, concurrency={concurrency})...", flush=True)
    remotion_cli(
        "render",
        picture,
        "--codec=h264",
        "--pixel-format=yuv420p",
        "--crf=18",
        "--image-format=jpeg",
        "--jpeg-quality=91",
        f"--concurrency={concurrency}",
        "--muted",
    )

    print("Muxing with verified Nhật Phong mix.wav (loudnorm I=-16 TP=-2 LRA=10, AAC 160k, 48kHz, +faststart)...", flush=True)
    ffmpeg(
        "-y", "-i", picture, "-i", MIX_WAV,
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "160k",
        "-af", "loudnorm=I=-16:TP=-2:LRA=10",
        "-ar", RATE,
        "-movflags", "+faststart",
        pending,
    )

    pending.replace(FINAL)
    if picture.exists():
        picture.unlink()
    verify_and_qa(FINAL)


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "render"
    if action == "still":
        if len(sys.argv) < 3:
            raise SystemExit("Usage: render3d.py still <shot_id> [frame_offset]")
        offset = int(sys.argv[3]) if len(sys.argv) > 3 else 36
        render_still(sys.argv[2], offset)
    elif action == "proofs":
        render_proofs()
    elif action == "render":
        render_master()
    elif action == "qa":
        verify_and_qa(FINAL)
    else:
        raise SystemExit(f"Unknown action: {action}")
