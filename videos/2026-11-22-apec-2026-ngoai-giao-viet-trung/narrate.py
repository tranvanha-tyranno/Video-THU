"""Generate isolated narration cues using the studio's local Nhật Phong VieNeu-TTS preset."""

import json
from pathlib import Path
import time
import wave

import numpy as np
from vieneu import Vieneu

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RATE = 48000


def script():
    for block in (HERE / "script.txt").read_text(encoding="utf-8").strip().split("\n\n"):
        heading, *lines = block.splitlines()
        key, title = heading.split(" | ")
        yield key, title, lines


def main():
    t0 = time.monotonic()
    voice = json.loads((ROOT / "audio/voice-clones/nhat-phong/voice-preset.json").read_text(encoding="utf-8"))
    if voice.get("voice") != "nhat-phong-local":
        raise ValueError(f"Unexpected voice preset: {voice.get('voice')}")
    preset = {
        key: np.asarray(value, dtype=np.float32 if key == "speaker_emb" else np.int64)
        for key, value in voice["preset"].items()
    }
    tts = Vieneu(mode="v3turbo", device="cpu", backend="onnx", threads=6)
    folder = HERE / "narration"
    folder.mkdir(exist_ok=True)
    total_sec = 0.0
    for key, _, lines in script():
        scene_sec = 0.0
        for index, line in enumerate(lines):
            target = folder / f"{key}-{index}.wav"
            if target.exists():
                with wave.open(str(target), "rb") as w:
                    dur = w.getnframes() / w.getframerate()
                scene_sec += dur
                continue
            if len(line) > 240:
                raise ValueError(f"Narration cue is too long ({len(line)}): {key}-{index}")
            audio = np.asarray(
                tts.infer(line, voice=preset, max_chars=240, temperature=0.62, seed=42 + index),
                dtype=np.float32,
            )
            if audio.ndim != 1 or audio.size < RATE * 2 or not np.isfinite(audio).all():
                raise ValueError(f"Invalid narration for {target.name}")
            if float(np.max(np.abs(audio))) < 0.005:
                raise ValueError(f"Near-silent narration for {target.name}")
            pending = target.with_suffix(".partial")
            with wave.open(str(pending), "wb") as output:
                output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
                output.writeframes((np.clip(audio, -0.999, 0.999) * 32767).astype("<i2").tobytes())
            pending.replace(target)
            scene_sec += audio.size / RATE
        total_sec += scene_sec
        print(f"{key}: {scene_sec:.2f}s (cum {total_sec:.1f}s, elapsed {time.monotonic()-t0:.0f}s)", flush=True)
    print(f"DONE all narration: {total_sec:.2f}s raw voice in {time.monotonic()-t0:.1f}s", flush=True)


if __name__ == "__main__":
    main()
