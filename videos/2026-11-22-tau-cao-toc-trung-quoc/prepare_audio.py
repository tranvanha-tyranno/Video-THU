"""Synthesize the Vietnamese narration and time the composition from the audio."""
import asyncio
import hashlib
import json
import math
from pathlib import Path
import subprocess
import wave

import edge_tts
import imageio_ffmpeg

BATCH = Path(__file__).resolve().parent
FPS = 30
SAMPLE_RATE = 48000
VOICE = "vi-VN-NamMinhNeural"
RATE = "+12%"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


async def synthesize(text, audio):
    communicator = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary",
                                        connect_timeout=10, receive_timeout=16)
    output = bytearray()
    words = []
    async for event in communicator.stream():
        if event["type"] == "audio":
            output.extend(event["data"])
        elif event["type"] == "WordBoundary":
            words.append(event)
    if not output or not words:
        raise RuntimeError("Generation returned no complete take or timing")
    audio.write_bytes(output)
    return words


async def main():
    script = json.loads((BATCH / "script.json").read_text(encoding="utf-8"))
    takes = BATCH / "audio"
    takes.mkdir(exist_ok=True)
    timeline = []
    audio = bytearray()
    start = 0
    samples_per_frame = SAMPLE_RATE // FPS
    for shot in script:
        take = takes / (shot["id"] + ".mp3")
        receipt = take.with_suffix(".json")
        if not take.exists() or not receipt.exists():
            for attempt in range(3):
                try:
                    words = await asyncio.wait_for(synthesize(shot["text"], take), timeout=28)
                    break
                except (TimeoutError, edge_tts.exceptions.NoAudioReceived) as exc:
                    if attempt == 2:
                        raise
                    print("Retrying", shot["id"], type(exc).__name__, flush=True)
            receipt.write_text(json.dumps({
                "voice": VOICE, "rate": RATE, "text": shot["text"],
                "sha256": hashlib.sha256(take.read_bytes()).hexdigest(), "words": words,
            }, ensure_ascii=False, indent=2), encoding="utf-8")
        saved = json.loads(receipt.read_text(encoding="utf-8"))
        if (saved["text"], saved["voice"], saved["rate"], saved["sha256"]) != (
            shot["text"], VOICE, RATE, hashlib.sha256(take.read_bytes()).hexdigest()
        ):
            raise ValueError(f"Stale audio for {shot['id']}")
        pcm = subprocess.run(
            [FFMPEG, "-v", "error", "-i", str(take), "-ac", "1", "-ar", str(SAMPLE_RATE),
             "-f", "s16le", "-"],
            capture_output=True, check=True,
        ).stdout
        lead = 5 if start == 0 else 3
        tail = 17 if shot["id"] == "cta" else 4
        frames = lead + math.ceil(len(pcm) / 2 / samples_per_frame) + tail
        audio += bytes(lead * samples_per_frame * 2) + pcm
        audio += bytes((frames - lead) * samples_per_frame * 2 - len(pcm))
        timeline.append({"id": shot["id"], "start": start, "frames": frames})
        start += frames
        print(shot["id"], f"{frames / FPS:.2f}s", flush=True)
    assets = BATCH / "public"
    assets.mkdir(exist_ok=True)
    with wave.open(str(assets / "narration.wav"), "wb") as output:
        output.setparams((1, 2, SAMPLE_RATE, 0, "NONE", "not compressed"))
        output.writeframes(audio)
    (BATCH / "timeline.json").write_text(
        json.dumps({"shots": timeline, "audio": "narration.wav"}, indent=2), encoding="utf-8",
    )


if __name__ == "__main__":
    asyncio.run(main())
