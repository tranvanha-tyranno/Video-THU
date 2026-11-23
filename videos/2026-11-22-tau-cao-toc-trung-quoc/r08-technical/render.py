"""Render the engineering sequences and assemble the 1080p documentary master."""

from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from io import BytesIO
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from time import monotonic, sleep

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
PREVIOUS = HERE.parent / "r07-synced"
spec = spec_from_file_location("synced_render", PREVIOUS / "render.py")
synced = module_from_spec(spec)
spec.loader.exec_module(synced)
FINAL = HERE / "tau-cao-toc-trung-quoc-mo-phong-ky-thuat.mp4"
FPS = synced.FPS


def prepare(directory):
    shots, cues, public, props_path = synced.prepare(directory)
    props = synced.read(props_path)
    props["technical"] = True
    synced.write(props_path, props)
    return {shot["id"]: shot for shot in shots}, cues, public, props_path


def inspect(movie, shots, cues):
    checks = [
        ("speed", "oneSecond", .25), ("profile", "area", .8), ("curve", "tightCenter", .33),
        ("radius", "number", .55), ("land", "both", .2), ("tunnel", "through", 1.85),
        ("signal", "receive", -.21), ("brake", "range", .45), ("cab", "link", .38),
        ("factory", "transport", .55), ("girder", "lower", .28), ("station", "board", .6),
    ]
    width, height = 480, 270
    sheet = Image.new("RGB", (width * 3, (height + 27) * 4), "#132930")
    captions = ImageDraw.Draw(sheet)
    verified = {}
    for index, (name, cue, delta) in enumerate(checks):
        frame = shots[name]["start"] + round((cues[name][cue] + delta) * FPS)
        stdout = synced.ffmpeg("-ss", frame / FPS, "-i", movie, "-frames:v", 1,
                              "-vf", f"scale={width}:{height}", "-f", "image2pipe", "-c:v", "png", "pipe:1").stdout
        image = Image.open(BytesIO(stdout)).convert("RGB")
        anchor = (index % 3 * width, index // 3 * (height + 27))
        sheet.paste(image, anchor)
        captions.text((anchor[0] + 13, anchor[1] + height + 7), f"{frame/FPS:.2f}s  {name}", fill="#edf5ed")
        verified[name] = frame
    sheet.save(HERE / "kiem-tra-mo-phong.jpg", quality=93)
    return verified


def render(directory):
    shots, cues, public, props = prepare(directory)
    picks = ((shots["speed"]["start"], shots["disclaimer"]["start"]),
             (shots["profile"]["start"], shots["cta"]["start"]))
    patches = []
    for start, stop in picks:
        path = directory / f"scene-{start}.mp4"
        synced.render_picture(path, public, props, f"--frames={start}-{stop-1}")
        patches.append(path)
        print(f"Engineering frames rendered: {start}-{stop-1}", flush=True)
    (first, second), (third, fourth) = picks
    filter_graph = (
        f"[0:v]trim=end_frame={first},setpts=PTS-STARTPTS[begin];"
        "[1:v]setpts=PTS-STARTPTS[speed];"
        f"[0:v]trim=start_frame={second}:end_frame={third},setpts=PTS-STARTPTS[map];"
        "[2:v]setpts=PTS-STARTPTS[engineering];"
        f"[0:v]trim=start_frame={fourth},setpts=PTS-STARTPTS[finish];"
        "[begin][speed][map][engineering][finish]concat=n=5:v=1:a=0[v]"
    )
    candidate = directory / "master.mp4"
    synced.ffmpeg("-y", "-i", synced.FINAL, "-i", patches[0], "-i", patches[1], "-filter_complex", filter_graph,
                  "-map", "[v]", "-map", "0:a:0", "-r", FPS, "-c:v", "libx264", "-preset", "veryfast",
                  "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", candidate)
    report = synced.ffmpeg("-progress", "pipe:1", "-i", candidate, "-f", "null", "-").stdout
    frames = int(report.rsplit(b"frame=", 1)[1].splitlines()[0])
    audio_hash = synced.audio_hash(candidate)
    if frames != 7200 or audio_hash != synced.audio_hash(synced.FINAL):
        raise ValueError("The new master changed its length or audio stream")
    verified = inspect(candidate, shots, cues)
    candidate.replace(FINAL)
    synced.write(HERE / "qa.json", {"frames": frames, "seconds": frames / FPS,
        "sha256": sha256(FINAL.read_bytes()).hexdigest(), "audioPacketHash": audio_hash,
        "replacedFrameRanges": picks, "visualSampleFrames": verified})
    print(f"Verified {frames} frames, {len(verified)} visual samples and exact audio packets", flush=True)


def still(directory, name):
    shots, cues, public, props = prepare(directory)
    key = {"land":"both", "girder":"lower", "tunnel":"through", "cab":"speed"}[name]
    frame = shots[name]["start"] + round((cues[name][key] + .37) * FPS)
    synced.subprocess.run([
        "node", "node_modules/@remotion/cli/remotion-cli.js", "still", "src/china-rail/documentary-entry.tsx",
        "ChinaRailSynced", str(HERE / f"{name}.jpg"), f"--props={props}", f"--public-dir={public}",
        "--is-production=false", "--log=warn", "--image-format=jpeg", f"--frame={frame}", "--scale=.75",
    ], cwd=synced.RENDERER, check=True)


def corrections(directory):
    shots, cues, public, props = prepare(directory)
    ranges = [(shots["land"]["start"], shots["signal"]["start"]),
              (shots["factory"]["start"], shots["station"]["start"]),
              (shots["recap"]["start"], shots["cta"]["start"])]
    parts = []
    for index, (start, stop) in enumerate(ranges):
        part = directory / f"refined-{index}.mp4"
        synced.render_picture(part, public, props, f"--frames={start}-{stop-1}")
        parts.append(part)
        print(f"Refined frames {start}-{stop-1}", flush=True)
    deadline = monotonic() + 600
    while not (FINAL.exists() and (HERE / "qa.json").exists()):
        if monotonic() > deadline:
            raise TimeoutError("Waiting for the engineering master to finish")
        sleep(10)
    graph, order = [], []
    previous = 0
    for index, (start, stop) in enumerate(ranges, 1):
        graph.extend([f"[0:v]trim=start_frame={previous}:end_frame={start},setpts=PTS-STARTPTS[old{index}]",
                      f"[{index}:v]setpts=PTS-STARTPTS[new{index}]"])
        order.append(f"[old{index}][new{index}]")
        previous = stop
    graph.append(f"[0:v]trim=start_frame={previous},setpts=PTS-STARTPTS[tail]")
    graph.append("".join(order) + f"[tail]concat=n={2*len(ranges)+1}:v=1:a=0[v]")
    candidate = directory / "refined-master.mp4"
    inputs = [option for part in parts for option in ("-i", part)]
    synced.ffmpeg("-y", "-i", FINAL, *inputs, "-filter_complex", ";".join(graph), "-map", "[v]", "-map", "0:a:0",
                  "-r", FPS, "-c:v", "libx264", "-preset", "veryfast", "-crf", "17",
                  "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", candidate)
    progress = synced.ffmpeg("-progress", "pipe:1", "-i", candidate, "-f", "null", "-").stdout
    count = int(progress.rsplit(b"frame=", 1)[1].splitlines()[0])
    audio = synced.audio_hash(candidate)
    if count != 7200 or audio != synced.audio_hash(synced.FINAL):
        raise ValueError("Corrections changed the full video's length or audio")
    qa = synced.read(HERE / "qa.json")
    qa["visualSampleFrames"] = inspect(candidate, shots, cues)
    qa["refinedFrameRanges"] = ranges
    candidate.replace(FINAL)
    qa["sha256"] = sha256(FINAL.read_bytes()).hexdigest()
    synced.write(HERE / "qa.json", qa)
    print(f"Verified refined master: {count} decoded frames and {audio}", flush=True)


if __name__ == "__main__":
    with TemporaryDirectory(prefix="render-", dir=HERE) as folder:
        if "--corrections" in sys.argv:
            corrections(Path(folder))
        elif len(sys.argv) > 1:
            still(Path(folder), sys.argv[1])
        else:
            render(Path(folder))
