"""Generate one Vietnamese comparison sample per OpenAI Speech API voice."""
from concurrent.futures import ThreadPoolExecutor
from getpass import getpass
from hashlib import sha256
from pathlib import Path
import json
import os
import re

import requests

ROOT = Path(__file__).resolve().parent
VOICES = (
    "alloy", "ash", "ballad", "coral", "echo", "fable", "nova",
    "onyx", "sage", "shimmer", "verse", "marin", "cedar",
)
MODEL = "gpt-4o-mini-tts"
TEXT = ("Một đoàn tàu chạy ba trăm năm mươi ki lô mét một giờ. "
        "Điều gì giữ nó ổn định qua mỗi khúc cua? Hãy nhìn xuống đường ray.")
INSTRUCTIONS = ("Đọc nguyên văn bằng tiếng Việt tự nhiên, rõ chữ, với nhịp vừa phải. "
                "Đọc như lời dẫn video giải thích. Ngắt nhẹ trước câu hỏi.")


def classified_error(response):
    try:
        code = response.json().get("error", {}).get("code")
    except ValueError:
        return "unknown"
    return code if isinstance(code, str) and re.fullmatch(r"[a-z_0-9]{1,64}", code) else "unknown"


def generate(voice, key):
    target = ROOT / "samples" / f"{voice}.mp3"
    if target.is_file():
        return {"voice": voice, "file": f"samples/{target.name}", "sha256": sha256(target.read_bytes()).hexdigest()}
    try:
        response = requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers={"Authorization": f"Bearer {key}"},
            json={"model": MODEL, "voice": voice, "input": TEXT,
                  "instructions": INSTRUCTIONS, "response_format": "mp3", "speed": 1.0},
            timeout=(12, 75),
        )
    except requests.RequestException as exc:
        return {"voice": voice, "error": type(exc).__name__}
    if not response.ok:
        return {"voice": voice, "httpStatus": response.status_code, "error": classified_error(response)}
    if len(response.content) < 500 or not response.headers.get("Content-Type", "").startswith(("audio/", "application/octet-stream")):
        return {"voice": voice, "error": "unrecognized_audio"}
    pending = target.with_suffix(".partial")
    pending.write_bytes(response.content)
    pending.replace(target)
    return {"voice": voice, "file": f"samples/{target.name}", "sha256": sha256(response.content).hexdigest()}


def main():
    key = getpass("OpenAI credential (input hidden): ").strip()
    if not key.startswith("sk-"):
        raise SystemExit("No OpenAI credential provided")
    (ROOT / "samples").mkdir(exist_ok=True)
    first = generate(VOICES[0], key)
    if "error" in first:
        print(json.dumps(first), flush=True)
        raise SystemExit(1)
    with ThreadPoolExecutor(max_workers=3) as pool:
        records = [first, *pool.map(lambda voice: generate(voice, key), VOICES[1:])]
    manifest = {"model": MODEL, "input": TEXT, "instructions": INSTRUCTIONS, "voices": records}
    (ROOT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    for row in records:
        print(row["voice"], row.get("error", "saved"), row.get("httpStatus", ""), flush=True)
    return int(any("error" in row for row in records))


if __name__ == "__main__":
    raise SystemExit(main())
