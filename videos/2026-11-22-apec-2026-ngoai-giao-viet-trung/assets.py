"""Download verified contextual photographs and project OSM OpenFreeMap basemaps for APEC 2026."""

from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from hashlib import md5, sha256
import importlib.util
from io import BytesIO
from itertools import product
import json
from math import floor
from pathlib import Path
import sys
import time
from urllib.parse import quote

from PIL import Image, ImageDraw
import requests

HERE = Path(__file__).resolve().parent
PUBLIC = HERE / "public"
SOURCE = HERE.parent / "2026-11-22-tau-cao-toc-trung-quoc/r06-road-map/build_map.py"
spec = importlib.util.spec_from_file_location("osm_map", SOURCE)
osm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(osm)
HEADERS = {"User-Agent": "AutoTyranno APEC2026 Documentary/1.0 (https://autotyranno.local; educational)"}

PHOTOS = {
    "shenzhen_skyline": ("Skyline of Futian District in 2018.5.jpg", "Sparktour", "CC BY-SA 4.0"),
    "shenzhen_civic": ("Civic Center, Shenzhen Lianhuashan Park (2018.9) Daytime.jpg", "Sparktour", "CC BY-SA 4.0"),
    "shenzhen_bay": ("Shenzhen Bay Bridge aerial view.jpg", "Windmemories", "CC BY-SA 4.0"),
    "yantian_port": ("Chiwan Container Terminal 2006.jpg", "Niels Johannes", "CC BY-SA 4.0"),
    "beijing_hall": ("Great Hall of the People (20200825114146).jpg", "N509FZ", "CC BY-SA 4.0"),
    "hanoi_palace": ("Presidential Palace Hanoi.jpg", "Gary Todd", "CC0 1.0"),
    "apec_2017": ("APEC Vietnam 2017 Leaders Meeting.jpg", "Presidency of the Mexican Republic", "CC BY 2.0"),
    "haiphong_port": ("Container Ship at the Hai Phong International Container Terminal 01.jpg", "Nathan.cima", "CC BY-SA 4.0"),
    "kunming_skyline": ("2026.04.08.112911 View Longmen Kunming Yunnan China.jpg", "Hermann Luyken", "CC0 1.0"),
    "laocai_hekou": ("Hekou-Lao Cai Bridge - P1380383.JPG", "Vmenkov", "CC BY-SA 3.0"),
    "vn_cn_train": ("China Railways HXD3D 0065 with the last Dongdang to Beijing Through Train 20141206.JPG", "Changzhensky", "CC BY-SA 4.0"),
    "phu_quoc_aerial": ("Phu Quoc Island 01.jpg", "Quangpraha", "CC0 1.0"),
    "phu_quoc_sunset": ("An Thoi fishing harbour Sunset Town Sun World Phu Quoc Vietnam.jpg", "Vivu Vietnam", "CC BY-SA 4.0"),
}

REGIONAL_POINTS = {
    "hanoi": (105.8542, 21.0285),
    "haiphong": (106.6881, 20.8449),
    "laocai": (103.9755, 22.4856),
    "kunming": (102.8329, 24.8801),
    "shenzhen": (114.0579, 22.5431),
    "guangzhou": (113.2644, 23.1291),
    "hongkong": (114.1694, 22.3193),
    "danang": (108.2022, 16.0544),
    "phuquoc": (103.9840, 10.2899),
    "hcmc": (106.6297, 10.8231),
    "nanning": (108.3665, 22.8170),
}

GBA_POINTS = {
    "shenzhen": (114.0579, 22.5431),
    "futian": (114.0550, 22.5415),
    "yantian": (114.2367, 22.5568),
    "shenzhen_bay": (113.9450, 22.4850),
    "hongkong": (114.1694, 22.3193),
    "guangzhou": (113.2644, 23.1291),
    "zhuhai": (113.5767, 22.2710),
    "dongguan": (113.7518, 23.0207),
    "macau": (113.5439, 22.1987),
}


def download_photo(item):
    name, (filename, author, license_name) = item
    fname = filename.replace(" ", "_")
    digest = md5(fname.encode("utf-8")).hexdigest()
    path = PUBLIC / f"{name}.webp"
    rel = f"{digest[0]}/{digest[:2]}/{quote(fname)}"
    thumb = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{rel}/1600px-{quote(fname)}"
    orig = f"https://upload.wikimedia.org/wikipedia/commons/{rel}"
    used_url = thumb
    if not path.exists():
        for url in (thumb, orig):
            for attempt in range(3):
                try:
                    resp = requests.get(url, headers=HEADERS, timeout=25)
                    if resp.status_code == 429:
                        time.sleep(2 + attempt * 2)
                        continue
                    if resp.ok and len(resp.content) > 10000:
                        used_url = url
                        img = Image.open(BytesIO(resp.content)).convert("RGB")
                        img.thumbnail((2048, 1440), Image.Resampling.LANCZOS)
                        img.save(path, quality=91, method=5)
                        print(f"OK photo {name}: {img.size}", flush=True)
                        break
                except Exception as exc:
                    if attempt == 2:
                        print(f"WARN {name} ({url}): {exc}", flush=True)
                    time.sleep(1.5)
            if path.exists():
                break
        if not path.exists():
            raise RuntimeError(f"Failed to download photo {name}: {filename}")
    else:
        img = Image.open(path)
        print(f"CACHED photo {name}: {img.size}", flush=True)
    return name, {
        "file": filename,
        "page": f"https://commons.wikimedia.org/wiki/File:{quote(fname)}",
        "author": author,
        "license": license_name,
        "download": used_url,
        "sha256": sha256(path.read_bytes()).hexdigest(),
    }


def map_tiles(template, zoom):
    world_size = 2**zoom
    right = osm.ORIGIN[0] + osm.WIDTH / (osm.SCALE * 360)
    bottom = osm.ORIGIN[1] + osm.HEIGHT / (osm.SCALE * 360)
    bounds = [range(floor(a * world_size), floor(b * world_size) + 1)
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
                    response = requests.get(url, headers=HEADERS, timeout=(8, 15))
                    response.raise_for_status()
                    file.write_bytes(response.content)
                    break
                except requests.RequestException:
                    if attempt == 2:
                        raise
                    time.sleep(1.5)
        return x, y, osm.decode(file.read_bytes(), default_options={"y_coord_down": True})

    with ThreadPoolExecutor(max_workers=4) as pool:
        yield from pool.map(get, product(*bounds))


def prepare_map(template, name, left, top, scale, zoom, points, style="dark"):
    osm.WIDTH, osm.HEIGHT, osm.SCALE = 1000, 650, scale
    osm.ORIGIN = osm.world(left, top)
    osm.CACHE_ROOT = HERE.parents[1] / ".cache" / "apec2026-openfreemap"
    osm.HEADERS = HEADERS
    layers = defaultdict(list)
    wanted = ("water", "waterway", "landcover", "landuse", "boundary", "transportation")
    for x, y, tile in map_tiles(template, zoom):
        for label in wanted:
            layer = tile.get(label)
            if not layer:
                continue
            for kind, geometry, props in osm.transform(layer["features"], x, y, layer["extent"], zoom):
                category = props.get("class", "")
                admin = props.get("admin_level", 0)
                if label == "transportation" and category not in ("motorway", "trunk", "primary", "secondary", "rail"):
                    continue
                if label == "boundary" and (admin not in (2, 4) or props.get("maritime", 0) == 1 or props.get("disputed", 0) == 1):
                    continue
                layers[label].append((kind, geometry, category, admin))

    if style == "dark":
        land_bg = "#203335"
        water_col = "#102127"
        wood_col = "#243b3b"
        urban_col = "#2b4142"
        border2 = "#8ea69a"
        border4 = "#4a6463"
        road_main = "#c8a36a"
        road_sub = "#5d7675"
    else:
        land_bg = "#eee7d4"
        water_col = "#9ec4d4"
        wood_col = "#d4e0cc"
        urban_col = "#e5dbc5"
        border2 = "#8a7860"
        border4 = "#bfb399"
        road_main = "#c79452"
        road_sub = "#b5a68e"

    image = Image.new("RGB", (2000, 1300), land_bg)
    draw = ImageDraw.Draw(image)

    def px(pts):
        return [(round(x * 2), round(y * 2)) for x, y in pts]

    for kind, geom, cat, _ in layers["landcover"]:
        if kind == "polygon" and cat in ("wood", "grass", "forest"):
            draw.polygon(px(geom[0]), fill=wood_col)
    for kind, geom, cat, _ in layers["landuse"]:
        if kind == "polygon" and cat in ("residential", "commercial", "industrial"):
            draw.polygon(px(geom[0]), fill=urban_col)
    for kind, geom, _, _ in layers["water"]:
        if kind == "polygon":
            draw.polygon(px(geom[0]), fill=water_col)
    for kind, geom, _, _ in layers["waterway"]:
        if kind == "line":
            draw.line(px(geom), fill=water_col, width=3)

    # Roads
    for kind, geom, cat, _ in layers["transportation"]:
        if kind != "line":
            continue
        if cat in ("primary", "secondary"):
            draw.line(px(geom), fill=road_sub, width=2)
    for kind, geom, cat, _ in layers["transportation"]:
        if kind != "line":
            continue
        if cat in ("motorway", "trunk"):
            draw.line(px(geom), fill=road_main, width=3)

    # Boundaries
    for kind, geom, _, admin in layers["boundary"]:
        if kind == "line":
            if admin == 4:
                draw.line(px(geom), fill=border4, width=2)
            elif admin == 2:
                draw.line(px(geom), fill=border2, width=4)

    output = PUBLIC / f"map-{name}.webp"
    image.save(output, quality=93, method=5)
    print(f"MAP {name}: water={len(layers['water'])} roads={len(layers['transportation'])} borders={len(layers['boundary'])}", flush=True)
    return {k: list(osm.locate(*v)) for k, v in points.items()}


def main(mode="all"):
    PUBLIC.mkdir(exist_ok=True)
    if mode in ("all", "photos"):
        receipts = {}
        for item in PHOTOS.items():
            k, v = download_photo(item)
            receipts[k] = v
            time.sleep(0.45)
        (HERE / "photos.json").write_text(json.dumps(receipts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if mode in ("all", "maps"):
        resp = requests.get(osm.TILEJSON, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        template = resp.json()["tiles"][0]
        # Regional covers lon ~99..119, lat ~8..27 => scale ~46
        # GBA covers lon ~112.9..114.6, lat ~22.05..23.25 => scale ~560
        result = {
            "regional": prepare_map(template, "regional", 94.5, 27.2, 32.0, 5, REGIONAL_POINTS, style="dark"),
            "gba": prepare_map(template, "gba", 112.95, 23.30, 565, 10, GBA_POINTS, style="light"),
            "tiles": template,
        }
        (HERE / "maps.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "all")
