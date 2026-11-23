"""Time the chapters, mix their narration with recorded cues, and prepare the composition."""
from hashlib import sha256
import json
from pathlib import Path
import subprocess
import wave

import imageio_ffmpeg
import numpy as np

HERE = Path(__file__).resolve().parent
FPS, RATE, SECONDS = 24, 48000, 300
SAMPLES_PER_FRAME = RATE // FPS
FF = imageio_ffmpeg.get_ffmpeg_exe()

# chapter, offset, asset, source offset, duration, peak before final loudness normalization
SCORE = [
    ("hook", .1, "fast-pass", 4, 4.8, .092), ("speed", .1, "whoosh-127197", 0, .6, .075),
    ("speed", 3.4, "impact-177242", 0, .52, .08), ("overview", .2, "whoosh-264777", 0, 1.9, .07),
    ("regional", .2, "whoosh-169867", 0, 1.5, .062), ("regional", 3.2, "pop-447910", 0, .34, .067),
    ("stops", .25, "platform-ambience", 4, 6, .07), ("stops", 6.5, "tick-528561", 0, .24, .064),
    ("distance", .28, "click-788933", 0, .6, .062), ("history", .30, "impact-222517", 0, 1, .068),
    ("time", .35, "tick-384187", 0, .6, .063), ("profile", 1.2, "riser-396161", 0, 2.3, .06),
    ("curve", .1, "whoosh", 0, 1.2, .06), ("radius", .65, "pop-467951", 0, .5, .063),
    ("land", 1.6, "fast-pass", 7.5, 4.5, .073), ("tunnel", 3, "platform-pass", 5, 5.0, .07),
    ("signal", 2.7, "click-788933", 0, .52, .063), ("brake", .3, "riser-685256", 0, 3.1, .058),
    ("cab", .4, "tick-384187", 0, .62, .057), ("factory", 1.5, "impact-347561", 0, .9, .07),
    ("girder", 5.1, "impact-177242", .04, .75, .095), ("station", 1.2, "station-crossing", 29, 5.4, .063),
    ("recap", .24, "platform-pass", 8.0, 4.8, .05), ("cta", 4.7, "pop-447910", 0, .38, .065),
]


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def pcm(source, *options):
    decoded = subprocess.run(
        [FF, "-hide_banner", "-v", "error", "-i", str(source), *options, "-ac", "1",
         "-ar", str(RATE), "-f", "f32le", "pipe:1"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(decoded, dtype="<f4").copy()


def main():
    script = read(HERE / "script.json")
    tracks = {item["id"]: HERE / "narration" / (item["id"] + ".wav") for item in script}
    seconds = {}
    for name, track in tracks.items():
        with wave.open(str(track), "rb") as stream:
            seconds[name] = stream.getnframes() / stream.getframerate()

    gap = .16
    speed = sum(seconds.values()) / (SECONDS - len(script) * gap - .55)
    dry = [pcm(tracks[item["id"]], "-af", f"atempo={speed:.8f},highpass=f=65") for item in script]
    frame_budget = SECONDS * FPS
    tracks_at_frames = []
    cursor = 0
    raw_mix = np.zeros(frame_budget * SAMPLES_PER_FRAME, dtype=np.float32)
    for index, (item, voice) in enumerate(zip(script, dry)):
        frames = round((voice.size / RATE + gap) * FPS)
        if index == len(script) - 1:
            frames = frame_budget - cursor
        elif frames * SAMPLES_PER_FRAME < voice.size:
            raise ValueError("Chapter audio exceeds its duration")
        start = cursor * SAMPLES_PER_FRAME
        cut = min(voice.size, frames * SAMPLES_PER_FRAME)
        if cut < voice.size:
            raise ValueError("Final chapter did not fit")
        raw_mix[start:start + cut] = voice
        tracks_at_frames.append({"id": item["id"], "title": item["title"], "start": cursor, "frames": frames})
        cursor += frames
    raw_mix *= .72 / max(float(np.max(np.abs(raw_mix))), .01)
    starts = {item["id"]: item["start"] / FPS for item in tracks_at_frames}
    receipts = {item["name"]: item for item in read(HERE / "sfx/download-receipts.json")}
    cues = []
    for chapter, offset, sound, source_offset, duration, peak in SCORE:
        source = HERE / "sfx" / receipts[sound]["file"]
        if sha256(source.read_bytes()).hexdigest() != receipts[sound]["sha256"]:
            raise ValueError(f"Sound receipt mismatch for {sound}")
        effect = pcm(source, "-ss", str(source_offset), "-t", str(duration), "-af", "highpass=f=65")
        if not effect.size:
            raise ValueError(f"Empty sound cue for {sound}")
        effect *= peak / max(.035, float(np.max(np.abs(effect))))
        fade = min(round(RATE * (.26 if duration > 2 else .035)), effect.size // 3)
        if fade:
            effect[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
            effect[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
        second = round(starts[chapter] + offset, 3)
        i = round(second * RATE)
        raw_mix[i:i + effect.size] += effect
        cues.append({"chapter": chapter, "seconds": second, "sound": sound, "sourceIn": source_offset,
                     "duration": round(effect.size / RATE, 3), "source": receipts[sound]["source"]})
    wav = HERE / "mix-unscaled.wav"
    with wave.open(str(wav), "wb") as stream:
        stream.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
        stream.writeframes((np.clip(raw_mix, -.999, .999) * 32767).astype("<i2").tobytes())
    map_data = read(HERE.parent / "r02-map/map-props.json")
    geography_path = HERE / "rail-geography.json"
    geography = read(geography_path) if geography_path.is_file() else {"rail": [], "rivers": []}
    write(HERE / "props.json", {"shots": tracks_at_frames, "stations": map_data["stations"],
                               "overview": map_data["overview"], **geography})
    write(HERE / "cues.json", cues)
    write(HERE / "timing.json", {"fps": FPS, "durationSeconds": SECONDS, "voice": "nhat-phong-local",
                                 "tempo": speed, "chapters": tracks_at_frames})
    print(len(tracks_at_frames), "chapters", len(cues), "sound cues", f"{speed:.3f}x tempo", flush=True)


if __name__ == "__main__":
    main()
