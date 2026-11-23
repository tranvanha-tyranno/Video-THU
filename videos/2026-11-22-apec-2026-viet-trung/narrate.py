"""Generate isolated Nhật Phong local narration cues so visuals lock to exact spoken timing."""

import json
from pathlib import Path
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
    voice = json.loads((ROOT / "audio/voice-clones/nhat-phong/voice-preset.json").read_text(encoding="utf-8"))
    preset = {
        key: np.asarray(value, dtype=np.float32 if key == "speaker_emb" else np.int64)
        for key, value in voice["preset"].items()
    }
    tts = Vieneu(mode="v3turbo", device="cpu", backend="onnx", threads=4)
    folder = HERE / "narration"
    folder.mkdir(exist_ok=True)
    for key, _, lines in script():
        for index, line in enumerate(lines):
            target = folder / f"{key}-{index}.wav"
            if target.exists():
                continue
            if len(line) > 240:
                raise ValueError(f"Narration cue is too long ({len(line)}): {key}-{index}")
            audio = np.asarray(tts.infer(line, voice=preset, max_chars=240, temperature=0.62), dtype=np.float32)
            if audio.ndim != 1 or audio.size < RATE * 2 or not np.isfinite(audio).all():
                raise ValueError(f"Invalid narration for {target.name}")
            pending = target.with_suffix(".partial")
            with wave.open(str(pending), "wb") as output:
                output.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
                output.writeframes((np.clip(audio, -0.999, 0.999) * 32767).astype("<i2").tobytes())
            pending.replace(target)
        print(key, flush=True)


if __name__ == "__main__":
    main()
