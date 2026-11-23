"""Mux the approved sound and check the new picture and its chapter timings."""
from hashlib import sha256
import json
from pathlib import Path
import subprocess

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
PREVIOUS = HERE.parent / "r04-long"
SOURCE = PREVIOUS / "tau-cao-toc-trung-quoc-5-phut.mp4"
FINAL = HERE / "tau-cao-toc-trung-quoc-ban-do-dong.mp4"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 24


def ffmpeg(*args):
    return subprocess.run([FFMPEG, "-hide_banner", "-v", "error", "-xerror",
                           *map(str, args)], check=True, capture_output=True)


def audio_hash(movie):
    output = ffmpeg("-i", movie, "-map", "0:a:0", "-c:a", "copy", "-f", "hash",
                    "-hash", "sha256", "pipe:1")
    return output.stdout.decode().strip()


def sample_frames(movie, samples):
    video = cv2.VideoCapture(str(movie))
    try:
        for number in samples:
            video.set(cv2.CAP_PROP_POS_FRAMES, number)
            ok, frame = video.read()
            if not ok:
                raise RuntimeError(f"Cannot decode frame {number}")
            yield cv2.cvtColor(cv2.resize(frame, (640, 360)), cv2.COLOR_BGR2RGB)
    finally:
        video.release()


def main():
    partial = HERE / "pending.mp4"
    ffmpeg("-y", "-i", HERE / "hinh.mp4", "-i", SOURCE, "-map", "0:v:0", "-map", "1:a:0",
           "-c", "copy", "-movflags", "+faststart", partial)
    decoded = ffmpeg("-progress", "pipe:1", "-i", partial, "-f", "null", "-")
    if int(decoded.stdout.rsplit(b"frame=", 1)[-1].splitlines()[0]) != 7200:
        raise ValueError("Expected 7200 decoded frames")
    exact = audio_hash(partial)
    if exact != audio_hash(SOURCE):
        raise ValueError("The audio stream differs from the previous export")
    chapters = {item["id"]: item["start"] for item in json.loads(
        (PREVIOUS / "props.json").read_text(encoding="utf-8"))["shots"]}
    sections = {
        "overview": [1, 5, 11], "regional": [3, 7.25, 9.6],
        "stops": [7.9, 9.55, 12.3], "distance": [4.4, 7.2, 11],
        "profile": [3.7, 6.5, 10.1], "curve": [2.6, 6.6, 10.7],
        "signal": [6.4, 8.2, 11.2], "brake": [3.8, 7.25, 12.4],
        "factory": [4.9, 6.8, 12.4], "station": [2.3, 4.2, 13],
    }
    changes = []
    sheet = Image.new("RGB", (1152, 1296))
    for row, (name, offsets) in enumerate(sections.items()):
        numbers = [chapters[name] + round(offset * FPS) for offset in offsets]
        frames = list(sample_frames(partial, numbers))
        differences = [round(float(np.mean(np.abs(a.astype("int16") - b.astype("int16")))), 3)
                       for a, b in zip(frames, frames[1:])]
        if min(differences) < .09:
            raise ValueError(f"Sampled frames are too similar in {name}: {differences}")
        changes.append({"chapter": name, "frames": numbers, "pixelDifference": differences})
        if row < 6:
            for col, frame in enumerate(frames):
                sheet.paste(Image.fromarray(frame).resize((384, 216)), (col * 384, row * 216))
    sheet.save(HERE / "kiem-tra-chuyen-dong.jpg", quality=93)
    partial.replace(FINAL)
    start = chapters["overview"] / FPS
    duration = (chapters["history"] - chapters["overview"]) / FPS
    ffmpeg("-y", "-ss", start, "-i", FINAL, "-t", duration, "-vf", "scale=1280:720",
           "-c:v", "libx264", "-crf", "20", "-preset", "fast", "-c:a", "aac",
           "-b:a", "160k", "-movflags", "+faststart", HERE / "ban-do-chuyen-dong.mp4")
    (HERE / "qa.json").write_text(json.dumps({"duration": 300, "decodedFrames": 7200,
        "audioPacketHash": exact, "sampledMotion": changes,
        "sha256": sha256(FINAL.read_bytes()).hexdigest()}, indent=2), encoding="utf-8")
    print(f"Verified 7200 frames, retained audio {exact}, {len(changes)} sampled motion sequences")


if __name__ == "__main__":
    main()
