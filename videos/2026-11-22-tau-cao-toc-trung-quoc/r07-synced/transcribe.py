"""Measure the words on the same tempo-adjusted narration used in the master."""

import json
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory

from faster_whisper import WhisperModel
import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "r04-long"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def main():
    timing = json.loads((SOURCE / "timing.json").read_text(encoding="utf-8"))
    model = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=6,
                         local_files_only=True)
    take = {}
    with TemporaryDirectory() as folder:
        wav = Path(folder) / "speech.wav"
        for shot in timing["chapters"]:
            name = shot["id"]
            subprocess.run([
                FFMPEG, "-v", "error", "-y", "-i", str(SOURCE / "narration" / f"{name}.wav"),
                "-af", f"atempo={timing['tempo']:.8f},highpass=f=65", "-ar", "16000", str(wav),
            ], check=True)
            segments, _ = model.transcribe(str(wav), language="vi", beam_size=3,
                                            condition_on_previous_text=False, word_timestamps=True)
            take[name] = [[round(word.start, 3), round(word.end, 3), word.word.strip()]
                          for segment in segments for word in (segment.words or [])]
            print(name, len(take[name]), flush=True)
    (HERE / "word-times.json").write_text(json.dumps(take, ensure_ascii=False, indent=2),
                                          encoding="utf-8")


if __name__ == "__main__":
    main()
