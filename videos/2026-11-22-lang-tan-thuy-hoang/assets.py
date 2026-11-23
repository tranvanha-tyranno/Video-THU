"""Download the contextual photographs and project OSM roads around the UNESCO sites."""

from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from hashlib import md5, sha256
import importlib.util
from io import BytesIO
from itertools import product
import json
from math import floor
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageDraw
import requests

HERE = Path(__file__).resolve().parent
PUBLIC = HERE / "public"
SOURCE = HERE.parent / "2026-11-22-tau-cao-toc-trung-quoc/r06-road-map/build_map.py"
spec = importlib.util.spec_from_file_location("osm_map", SOURCE)
osm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(osm)
HEADERS = {"User-Agent": "AutoTyranno Qin Documentary/1.0 educational map and photo assets"}

PHOTOS = {
    "pit": ("Terracotta Army - Pit 1 in 2026.jpg", "Renek78", "CC0 1.0"),
    "rows": ("Terracotta Army, View of Pit 1.jpg", "Jmhullot", "CC BY 3.0"),
    "archer": ("Kneeling archer of the Terracotta Army.jpg", "Difference engine", "CC BY-SA 4.0"),
    "figure": ("Terracotta Warrior- Standing Archer.jpg", "Gary Lee Todd", "CC0 1.0"),
    "carriage": ("Qin Dynasty Bronze Chariot.jpg", "Gary Todd", "CC0 1.0"),
    "acrobat": ("Qin Terracotta Warrior - 32553979417.jpg", "Gary Lee Todd", "CC0 1.0"),
    "mound": ("Xian, 1987 (24807541832).jpg", "Nathan Hughes Hamilton", "CC BY 2.0"),
}

POINTS = {
    "mound": (109+15/60+13.2/3600, 34+22/60+53.1/3600),
    "pits": (109+16/60+24.4/3600, 34+23/60+6.7/3600),
    "xian": (108.942, 34.2615),
    "lintong": (109.214, 34.367),
    "mount": (109.247, 34.343),
}


def photo(item):
    name, (file, author, license_name) = item
    file = file.replace(" ", "_")
    prefix = md5(file.encode()).hexdigest()
    path = PUBLIC / f"{name}.webp"
    file_path = f"{prefix[0]}/{prefix[:2]}/{quote(file)}"
    download = f"https://thumb.wikimedia.org/wikipedia/commons/thumb/{file_path}/1280px-{quote(file)}"
    if not path.exists():
        response = requests.get(download, headers=HEADERS, timeout=20)
        if not response.ok:
            download = f"https://upload.wikimedia.org/wikipedia/commons/{file_path}"
            response = requests.get(download, headers=HEADERS, timeout=20)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert("RGB")
        image.thumbnail((2100, 1500), Image.Resampling.LANCZOS)
        image.save(path, quality=92, method=5)
    return name, {"page": f"https://commons.wikimedia.org/wiki/File:{quote(file)}", "author": author,
                  "license": license_name, "download": download, "sha256": sha256(path.read_bytes()).hexdigest()}


def prepare_map(template, name, left, top, scale, zoom):
    osm.WIDTH, osm.HEIGHT, osm.SCALE = 1000, 650, scale
    osm.ORIGIN = osm.world(left, top)
    osm.CACHE_ROOT = HERE.parents[1] / ".cache" / "qin-openfreemap"
    osm.HEADERS = HEADERS
    layers = defaultdict(list)
    for x, y, tile in map_tiles(template, zoom):
        for label in ("water", "waterway", "landcover", "landuse", "transportation"):
            layer = tile.get(label)
            if not layer:
                continue
            for kind, geometry, props in osm.transform(layer["features"], x, y, layer["extent"], zoom):
                category = props.get("class", "")
                if label == "transportation" and category not in osm.ROADS:
                    continue
                layers[label].append((kind, geometry, category))
    image = Image.new("RGB", (2000, 1300), "#f2eedf")
    draw = ImageDraw.Draw(image)

    def pixels(points):
        return [(round(x*2), round(y*2)) for x, y in points]

    for label, colors in [
        ("landcover", {"wood": "#cbdaca", "grass": "#dce4cd", "farmland": "#e9e3c7"}),
        ("landuse", {"residential": "#e8e0cf", "industrial": "#e2d7c4"}),
        ("water", defaultdict(lambda: "#95c5d6")),
        ("waterway", defaultdict(lambda: "#99c9da")),
    ]:
        for kind, geometry, category in layers[label]:
            if category not in colors and not isinstance(colors, defaultdict):
                continue
            if kind == "polygon":
                draw.polygon(pixels(geometry[0]), fill=colors[category])
            elif label == "waterway":
                draw.line(pixels(geometry), fill=colors[category], width=3)
    for category, (casing, fill, width) in osm.ROADS.items():
        roads = [pixels(geometry) for kind, geometry, road in layers["transportation"] if road == category and kind == "line"]
        if name == "site":
            casing = "#b1a388" if category in {"primary","secondary","tertiary"} else "#c9bfa8"
            width = max(width, 1.1)
        for paint, weight in [(casing,width+.85),(fill,width)]:
            for road in roads:
                draw.line(road, fill=paint, width=max(1, round(weight*2)), joint="curve")
    output = PUBLIC / f"map-{name}.webp"
    image.save(output, quality=93, method=5)
    print(name, len(layers["transportation"]), flush=True)
    return {point: osm.locate(*coords) for point, coords in POINTS.items()}


def map_tiles(template, zoom):
    world_size = 2**zoom
    right = osm.ORIGIN[0] + osm.WIDTH / (osm.SCALE * 360)
    bottom = osm.ORIGIN[1] + osm.HEIGHT / (osm.SCALE * 360)
    bounds = [range(floor(a*world_size), floor(b*world_size) + 1)
              for a, b in zip(osm.ORIGIN, (right, bottom))]
    cache = osm.CACHE_ROOT / template.split("/planet/", 1)[1].split("/", 1)[0]
    cache.mkdir(parents=True, exist_ok=True)

    def get(pair):
        x, y = pair
        file = cache / f"{zoom}-{x}-{y}.pbf"
        if not file.exists():
            url = template.format(z=zoom, x=x, y=y)
            for attempt in range(3):
                try:
                    response = requests.get(url, headers=HEADERS, timeout=(6,12))
                    response.raise_for_status()
                    file.write_bytes(response.content)
                    break
                except requests.RequestException:
                    if attempt == 2:
                        raise
        return x, y, osm.decode(file.read_bytes(), default_options={"y_coord_down":True})

    with ThreadPoolExecutor(max_workers=3) as pool:
        yield from pool.map(get, product(*bounds))


def main(mode):
    PUBLIC.mkdir(exist_ok=True)
    if mode == "photos":
        with ThreadPoolExecutor(max_workers=4) as pool:
            receipts = dict(pool.map(photo, PHOTOS.items()))
        (HERE/"photos.json").write_text(json.dumps(receipts, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        response = requests.get(osm.TILEJSON, headers=HEADERS, timeout=20)
        response.raise_for_status()
        template = response.json()["tiles"][0]
        result = {"region": prepare_map(template,"region",108.82,34.50,2040,11),
                  "site": prepare_map(template,"site",109.232,34.397,15700,14), "tiles": template}
        (HERE/"maps.json").write_text(json.dumps(result, indent=2), encoding="utf-8")


if __name__ == "__main__":
    import sys
    main(sys.argv[1])
