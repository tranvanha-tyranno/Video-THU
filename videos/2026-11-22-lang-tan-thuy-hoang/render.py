"""Assemble the exact narration takes, render the film, then validate the master."""

from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
import wave
from tempfile import TemporaryDirectory
from time import monotonic, sleep

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RENDERER = ROOT / "workflows/reference-video/cinematic"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 24
RATE = 48000
DURATION = 600
FRAME_SAMPLES = RATE // FPS
FINAL = HERE / "lang-tan-thuy-hoang-10-phut.mp4"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def script():
    for cell in (HERE / "script.txt").read_text(encoding="utf-8").strip().split("\n\n"):
        heading, *lines = cell.splitlines()
        key, title = heading.split(" | ")
        yield key, title, lines


def ffmpeg(*args, log="error"):
    return subprocess.run([FFMPEG, "-hide_banner", "-v", log, "-xerror", *map(str,args)],
                          capture_output=True, check=True)


def track_frames(path):
    with wave.open(str(path), "rb") as stream:
        return stream.getnframes()


def event(samples, second, kind):
    size = round((.64 if kind == "chapter" else .29)*RATE)
    t = np.arange(size, dtype=np.float32)/RATE
    f = 146.83 if kind == "chapter" else 220
    s = np.sin(2*np.pi*f*t)+.33*np.sin(2*np.pi*1.49*f*t)
    envelope = np.minimum(1,t/.03)*np.exp(-8*t)*(1-t/(size/RATE))
    start=round(second*RATE)
    end=min(len(samples), start+size)
    samples[start:end] += (.066 if kind == "chapter" else .030)*(s*envelope)[:end-start]


def prepare():
    sections = list(script())
    inputs = [HERE/"narration"/f"{key}-{i}.wav" for key, _, lines in sections for i in range(len(lines))]
    seconds = np.array([track_frames(path)/RATE for path in inputs])
    planned_gaps = np.array([.19 if i<len(lines)-1 else .37 for _, _, lines in sections for i in range(len(lines))])
    # Each narration cue has an explicit slot. Rounding cumulative boundaries avoids timing drift.
    voice_seconds = DURATION - planned_gaps.sum() - .75
    speed = float(seconds.sum()/voice_seconds)
    boundaries = np.rint(FPS*np.r_[0,np.cumsum(seconds/speed + planned_gaps)]).astype(int)
    boundaries[-1] = DURATION*FPS
    mixed = np.zeros(DURATION*RATE, np.float32)
    index = 0
    shots = []
    for key, title, lines in sections:
        start = int(boundaries[index])
        cues = []
        for _ in lines:
            frame = int(boundaries[index])
            cues.append(frame-start)
            pcm = ffmpeg("-i", inputs[index], "-af", f"atempo={speed:.8f},highpass=f=65",
                         "-ac","1","-ar",RATE,"-f","f32le","pipe:1").stdout
            audio = np.frombuffer(pcm, dtype="<f4")
            available=int(boundaries[index+1]-frame)*FRAME_SAMPLES
            if len(audio)>available:
                tail = audio[available:]
                if len(tail)>RATE*.04 and np.max(np.abs(tail))>.02:
                    raise ValueError(f"Speech exceeds allocated cue {inputs[index].name}")
                audio=audio[:available]
            offset=frame*FRAME_SAMPLES
            mixed[offset:offset+len(audio)]=audio
            index+=1
        end=int(boundaries[index])
        shots.append({"id":key,"title":title,"start":start,"frames":end-start,"cues":cues})
    if np.max(np.abs(mixed)) < .05:
        raise ValueError("Voice track is silent")
    mixed *= .79 / np.max(np.abs(mixed))
    for shot in shots:
        begin = shot["start"]/FPS
        event(mixed,begin,"chapter")
        if shot["id"] in {"hook","map","discovery","pit1","color","mercury","restore","cta"}:
            for cue in shot["cues"][1:]:
                event(mixed,begin+cue/FPS,"detail")
    with wave.open(str(HERE/"mix.wav"), "wb") as output:
        output.setparams((1,2,RATE,0,"NONE","not compressed"))
        output.writeframes((np.clip(mixed,-.999,.999)*32767).astype("<i2").tobytes())
    props = {"shots":shots,"maps":read(HERE/"maps.json")}
    write(HERE/"props.json",props)
    write(HERE/"timing.json",{"durationSeconds":DURATION,"fps":FPS,"voiceTempo":speed,
                             "voice":"Nhật Phong · local VieNeu","shots":shots})
    print(f"Prepared {len(shots)} scenes and {len(inputs)} audio cues at {speed:.3f}x",flush=True)


def cli(action, output, *flags):
    subprocess.run(["node","node_modules/@remotion/cli/remotion-cli.js",action,"src/qin-entry.tsx",
                    "QinMausoleum",str(output),f"--props={HERE/'props.json'}",f"--public-dir={HERE/'public'}",
                    "--is-production=false","--log=warn",*flags],cwd=RENDERER,check=True)


def render():
    picture=HERE/"picture.mp4"
    pending=HERE/"pending.mp4"
    cli("render",picture,"--quiet","--codec=h264","--pixel-format=yuv420p","--crf=18","--image-format=jpeg",
        "--jpeg-quality=91","--concurrency=9","--muted")
    ffmpeg("-y","-i",picture,"-i",HERE/"mix.wav","-map","0:v:0","-map","1:a:0","-c:v","copy",
           "-c:a","aac","-b:a","160k","-af","loudnorm=I=-16:TP=-2:LRA=10","-ar",RATE,
           "-movflags","+faststart",pending)
    progress=ffmpeg("-progress","pipe:1","-i",pending,"-f","null","-").stdout
    frames=int(progress.rsplit(b"frame=",1)[1].splitlines()[0])
    if frames!=FPS*DURATION:
        raise ValueError(f"Expected 14400 frames, decoded {frames}")
    measure=ffmpeg("-i",pending,"-vn","-af","ebur128=peak=true","-f","null","-",log="info").stderr.decode(
        errors="replace").rsplit("Summary:",1)[-1].strip()
    picture_report=ffmpeg("-i",pending,"-t",.1,"-f","null","-",log="info").stderr.decode(errors="replace")
    if "1920x1080" not in picture_report or "Audio: aac" not in picture_report:
        raise ValueError("Master stream parameters did not match 1080p plus AAC audio")
    pending.replace(FINAL)
    picture.unlink()
    samples=review(FINAL)
    with FINAL.open("rb") as video:
        identity=sha256()
        for data in iter(lambda:video.read(1024*1024),b""):
            identity.update(data)
    write(HERE/"qa.json",{"sha256":identity.hexdigest(),"durationSeconds":frames/FPS,"decodedFrames":frames,
                          "audioMeasurement":measure,"visualSamples":samples})
    print(f"Verified {frames} decoded frames and {len(samples)} visual samples.",flush=True)


def polish(directory):
    shots = {item["id"]: item for item in read(HERE/"props.json")["shots"]}
    opening, mound = shots["hook"], shots["mound"]
    cuts = ((0, opening["cues"][1]),
            (mound["start"]+mound["cues"][1], mound["start"]+mound["frames"]))
    patches = []
    for index, (start, stop) in enumerate(cuts):
        patch=directory/f"part-{index}.mp4"
        cli("render",patch,"--quiet","--codec=h264","--pixel-format=yuv420p","--crf=17",
            "--image-format=jpeg","--jpeg-quality=94","--concurrency=4","--muted",f"--frames={start}-{stop-1}")
        patches.append(patch)
    deadline=monotonic()+1200
    while not (FINAL.exists() and (HERE/"qa.json").exists()):
        if monotonic()>deadline:
            raise TimeoutError("The documentary master did not finish")
        sleep(10)

    (_, opening_end), (mound_start, mound_end)=cuts
    cuts_graph=(
        "[1:v]setpts=PTS-STARTPTS[opening];"
        f"[0:v]trim=start_frame={opening_end}:end_frame={mound_start},setpts=PTS-STARTPTS[body];"
        "[2:v]setpts=PTS-STARTPTS[mound];"
        f"[0:v]trim=start_frame={mound_end},setpts=PTS-STARTPTS[end];"
        "[opening][body][mound][end]concat=n=4:v=1:a=0[v]")
    revised=directory/"master.mp4"
    ffmpeg("-y","-i",FINAL,"-i",patches[0],"-i",patches[1],"-filter_complex",cuts_graph,
           "-map","[v]","-map","0:a:0","-r",FPS,"-c:v","libx264","-preset","veryfast","-crf","17",
           "-pix_fmt","yuv420p","-c:a","copy","-movflags","+faststart",revised)
    progress=ffmpeg("-progress","pipe:1","-i",revised,"-f","null","-").stdout
    frames=int(progress.rsplit(b"frame=",1)[1].splitlines()[0])
    def audio_hash(path):
        return ffmpeg("-i",path,"-map","0:a:0","-c:a","copy","-f","hash","-hash","sha256","pipe:1").stdout
    if frames!=FPS*DURATION or audio_hash(revised)!=audio_hash(FINAL):
        raise ValueError("Polish must preserve all frames and the exact AAC stream")
    report=read(HERE/"qa.json")
    report["visualSamples"]=review(revised)
    report["reviewEdits"]=cuts
    revised.replace(FINAL)
    report["sha256"]=sha256(FINAL.read_bytes()).hexdigest()
    write(HERE/"qa.json",report)
    print("Verified revised master: 14400 frames and unchanged audio.",flush=True)


def review(movie):
    shots=read(HERE/"props.json")["shots"]
    cols=4
    sheet=Image.new("RGB",(cols*384,((len(shots)+cols-1)//cols)*238),"#1b2a28")
    draw=ImageDraw.Draw(sheet)
    samples=[]
    for i,shot in enumerate(shots):
        offset=min(shot["frames"]-1,shot["cues"][1]+round(1.8*FPS))
        frame=shot["start"]+offset
        png=ffmpeg("-ss",frame/FPS,"-i",movie,"-frames:v",1,"-vf","scale=384:216",
                   "-f","image2pipe","-c:v","png","pipe:1").stdout
        point=((i%cols)*384,(i//cols)*238)
        sheet.paste(Image.open(BytesIO(png)).convert("RGB"),point)
        draw.text((point[0]+10,point[1]+220),f"{frame/FPS:06.2f}   {shot['id']}",fill="white")
        samples.append({"id":shot["id"],"frame":frame})
    sheet.save(HERE/"kiem-tra-canh.jpg",quality=93)
    return samples


if __name__ == "__main__":
    if len(sys.argv)<2 or sys.argv[1]=="prepare":
        prepare()
    if len(sys.argv)<2 or sys.argv[1]=="render":
        render()
    if len(sys.argv)>1 and sys.argv[1]=="polish":
        with TemporaryDirectory(prefix="qin-polish-",dir=HERE) as directory:
            polish(Path(directory))
    if len(sys.argv)>2 and sys.argv[1]=="still":
        name=sys.argv[2]
        shot=next(item for item in read(HERE/"props.json")["shots"] if item["id"]==name)
        cli("still",HERE/f"proof-{name}.jpg",f"--frame={shot['start']+shot['cues'][1]+36}",
            "--scale=.75","--image-format=jpeg")
