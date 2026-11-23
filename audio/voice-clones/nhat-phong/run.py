"""Enroll and reuse the local Vietnamese voice preset with VieNeu-TTS."""
import argparse
from importlib.metadata import version
import json
from pathlib import Path

import numpy as np
from vieneu import Vieneu

ROOT = Path(__file__).resolve().parent
VOICE = "nhat-phong-local"
DEFAULT_TEXT = (
    "Một đoàn tàu chạy ba trăm năm mươi ki lô mét một giờ. "
    "Điều gì giữ nó ổn định qua mỗi khúc cua? Hãy nhìn xuống đường ray."
)


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--text", default=DEFAULT_TEXT)
    cli.add_argument("--output", type=Path, default=ROOT / "mau-clone.wav")
    args = cli.parse_args()
    if not args.text.strip() or args.output.suffix.lower() != ".wav":
        cli.error("provide non-empty text and a WAV output path")
    if args.output.exists():
        cli.error("output already exists")
    print(f"VieNeu {version('vieneu')} | v3 Turbo ONNX", flush=True)
    tts = Vieneu(mode="v3turbo", device="cpu", backend="onnx", threads=4)
    preset_path = ROOT / "voice-preset.json"
    if not preset_path.is_file():
        print("Encoding reference", flush=True)
        tts.add_voice(VOICE, ROOT / "mau-goc.wav", denoise=False)
        encoded = tts.get_preset_voice(VOICE)
        preset = {
            "speaker_emb": np.asarray(encoded["speaker_emb"], dtype=np.float32).tolist(),
            "codes": np.asarray(encoded["codes"], dtype=np.int64).tolist(),
        }
        pending = preset_path.with_suffix(".partial")
        pending.write_text(json.dumps({"model": "v3turbo", "voice": VOICE, "preset": preset}), encoding="utf-8")
        pending.replace(preset_path)
    profile = json.loads(preset_path.read_text(encoding="utf-8"))
    preset = {
        "speaker_emb": np.asarray(profile["preset"]["speaker_emb"], dtype=np.float32),
        "codes": np.asarray(profile["preset"]["codes"], dtype=np.int64),
    }
    print("Synthesizing from saved preset", flush=True)
    audio = tts.infer(args.text, voice=preset, max_chars=160, seed=42)
    samples = np.asarray(audio)
    if not samples.size or not np.isfinite(samples).all() or np.max(np.abs(samples)) < 0.005:
        raise RuntimeError("Generated audio is empty or invalid")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    tts.save(audio, str(args.output))
    print(args.output, flush=True)


if __name__ == "__main__":
    main()
