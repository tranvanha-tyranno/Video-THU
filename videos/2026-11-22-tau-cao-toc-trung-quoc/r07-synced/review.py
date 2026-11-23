"""Capture the actual image at narration cues for a visual review."""

from io import BytesIO
from PIL import Image, ImageDraw

from render import FINAL, FPS, HERE, ffmpeg, read, write


def still(movie, frame):
    encoded = ffmpeg("-ss", frame / FPS, "-i", movie, "-frames:v", 1,
                     "-vf", "scale=480:270", "-f", "image2pipe", "-c:v", "png", "pipe:1").stdout
    return Image.open(BytesIO(encoded)).convert("RGB")


def sheet(movie, samples, output):
    columns = 4
    picture = Image.new("RGB", (480 * columns, 296 * ((len(samples) + columns - 1) // columns)), "#172e36")
    draw = ImageDraw.Draw(picture)
    for index, (label, frame) in enumerate(samples):
        x, y = index % columns * 480, index // columns * 296
        picture.paste(still(movie, frame), (x, y))
        draw.text((x + 11, y + 275), f"{frame/FPS:06.2f}s  {label}", fill="#ffffff")
    picture.save(output, quality=92)


if __name__ == "__main__":
    report = read(HERE / "qa.json")
    chapters = {item["id"]: item for item in report["actionFrames"]}
    samples = [(name, item["startFrame"] + item["frames"] // 2) for name, item in chapters.items()]
    sheet(FINAL, samples, HERE / "kiem-tra-22-canh.jpg")
    actions = {
        "regional": ("zoom", "origin", "wuqing", "tianjin"),
        "stops": ("focus", "brake", "boarding", "depart"),
        "signal": ("ground", "send", "receive", "position"),
        "girder": ("move", "hold", "lower", "next"),
        "cta": ("station", "bridge", "comment", "subscribe"),
    }
    exact = [(f"{name} / {cue}", chapters[name]["actions"][cue] + (6 if cue in ("boarding","subscribe") else 10))
             for name, cues in actions.items() for cue in cues]
    sheet(FINAL, exact, HERE / "kiem-tra-hanh-dong.jpg")
    report["reviewedFrames"] = [frame for _, frame in samples + exact]
    write(HERE / "qa.json", report)
