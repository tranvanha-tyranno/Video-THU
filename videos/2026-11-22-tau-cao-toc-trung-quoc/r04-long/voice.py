"""Render the chapter narration offline with the saved project voice."""
import json
from pathlib import Path
import re
import wave

import numpy as np
from vieneu import Vieneu

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
RATE = 48000


def main():
    profile = json.loads((ROOT / "audio/voice-clones/nhat-phong/voice-preset.json").read_text(encoding="utf-8"))
    preset = {key: np.asarray(value, dtype=np.float32 if key == "speaker_emb" else np.int64)
              for key, value in profile["preset"].items()}
    tts = Vieneu(mode="v3turbo", device="cpu", backend="onnx", threads=4)
    output = HERE / "narration"
    output.mkdir(exist_ok=True)
    for shot in json.loads((HERE / "script.json").read_text(encoding="utf-8")):
        target = output / (shot["id"] + ".wav")
        if target.exists():
            continue
        parts = []
        for sentence in re.split(r"(?<=[.!?]) +", shot["text"]):
            audio = np.asarray(tts.infer(sentence, voice=preset, max_chars=180, temperature=.7), dtype=np.float32)
            if audio.ndim != 1 or audio.size < RATE * .3 or not np.isfinite(audio).all():
                raise ValueError(f"Invalid speech for {shot['id']}")
            parts.extend((audio, np.zeros(6000, dtype=np.float32)))
        samples = np.concatenate(parts[:-1])
        pending = target.with_suffix(".partial")
        with wave.open(str(pending), "wb") as file:
            file.setparams((1, 2, RATE, 0, "NONE", "not compressed"))
            file.writeframes((np.clip(samples, -.999, .999) * 32767).astype("<i2").tobytes())
        pending.replace(target)
        print(shot["id"], round(samples.size / RATE, 2), flush=True)


if __name__ == "__main__":
    main()
