"""Mux calibrated speech and effects, then verify the rendered movie."""
from hashlib import sha256
import io
import json
from pathlib import Path
import re
import subprocess

import imageio_ffmpeg
from PIL import Image

HERE = Path(__file__).resolve().parent
FF = imageio_ffmpeg.get_ffmpeg_exe()
VIDEO = HERE / "hinh.mp4"
MIX = HERE / "mix-unscaled.wav"
FINAL = HERE / "tau-cao-toc-trung-quoc-5-phut.mp4"


def ffmpeg(*args):
    return subprocess.run([FF, "-hide_banner", *map(str, args)], check=True, capture_output=True)


def stats(media, mono=False):
    result = ffmpeg("-nostats", "-i", media, "-vn", "-af",
                    "aformat=channel_layouts=mono,ebur128=peak=true" if mono else "ebur128=peak=true",
                    "-f", "null", "-")
    summary = result.stderr.decode(errors="replace").rsplit("Summary:", 1)[-1]
    loudness = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", summary)[-1])
    peak = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", summary)[-1])
    return {"integratedLUFS": loudness, "truePeakDBTP": peak}


def main():
    timeline = json.loads((HERE / "timing.json").read_text(encoding="utf-8"))
    total = sum(shot["frames"] for shot in timeline["chapters"])
    measured = ffmpeg("-nostats", "-i", MIX, "-af", "loudnorm=I=-16:TP=-5:LRA=9:print_format=json", "-f", "null", "-")
    level = json.loads(re.findall(r"\{[^{}]*\}", measured.stderr.decode(errors="replace"))[-1])
    normalizer = ("loudnorm=I=-16:TP=-5:LRA=9:"
                  f"measured_I={level['input_i']}:measured_TP={level['input_tp']}:"
                  f"measured_LRA={level['input_lra']}:measured_thresh={level['input_thresh']}:"
                  f"offset={level['target_offset']}:linear=true")
    ffmpeg("-y", "-v", "error", "-i", VIDEO, "-i", MIX, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
           "-af", normalizer, "-c:a", "aac", "-ar", "48000", "-b:a", "192k", "-movflags", "+faststart", FINAL)
    check = ffmpeg("-v", "error", "-xerror", "-progress", "pipe:1", "-i", FINAL, "-f", "null", "-")
    decoded = int(re.findall(rb"(?m)^frame=(\d+)", check.stdout)[-1])
    if decoded != total:
        raise ValueError(f"Decoded {decoded} frames but expected {total}")
    stereo_or_native = stats(FINAL)
    mono = stats(FINAL, mono=True)
    if max(stereo_or_native["truePeakDBTP"], mono["truePeakDBTP"]) > -4:
        raise ValueError("True peak exceeds -4 dBTP")
    selected = ["hook", "disclaimer", "overview", "regional", "stops", "distance", "time", "profile",
                "land", "signal", "girder", "cta"]
    chapters = {shot["id"]: shot for shot in timeline["chapters"]}
    sheet = Image.new("RGB", (1280, 540))
    for i, name in enumerate(selected):
        shot = chapters[name]
        time = (shot["start"] + shot["frames"] * .62) / timeline["fps"]
        png = ffmpeg("-v", "error", "-ss", f"{time:.3f}", "-i", FINAL, "-frames:v", "1",
                     "-vf", "scale=320:180", "-c:v", "png", "-f", "image2pipe", "pipe:1").stdout
        with Image.open(io.BytesIO(png)) as still:
            sheet.paste(still, ((i % 4) * 320, (i // 4) * 180))
    sheet.save(HERE / "canh-mau.jpg", quality=95)
    region = chapters["regional"]
    ffmpeg("-y", "-v", "error", "-ss", f"{(region['start'] + region['frames'] * .77) / 24:.3f}", "-i", FINAL,
           "-frames:v", "1", "-vf", "scale=1280:720", HERE / "ban-do.jpg")
    report = {"frames": decoded, "fps": timeline["fps"], "durationSeconds": total / timeline["fps"],
              "audio": stereo_or_native, "mono": mono, "samples": selected, "sha256": sha256(FINAL.read_bytes()).hexdigest()}
    (HERE / "qa.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
