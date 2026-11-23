"""Download 14 verified Wikimedia Commons photographs and build OpenStreetMap corridor maps."""

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
HEADERS = {"User-Agent": "AutoTyrannoAPEC/1.0 (https://commons.wikimedia.org/wiki/User:AutoTyranno; educational-doc@localhost)"}

PHOTOS = {
    "apec2026": ("33rd APEC Economic Leaders' Meeting (APEC China 2026) group photo.jpg", "Presidential Communications Office (PH)", "Public domain"),
    "shenzhen": ("Skyline of Futian District in 2018.5.jpg", "Sparktour", "CC BY-SA 4.0"),
    "civic": ("Night of Civic Center Shenzhen from Lianhua Mountain.jpg", "Sparktour", "CC BY-SA 4.0"),
    "gba": ("Skyline of Shenzhen Bay Port From the South.jpg", "Charlie fong", "CC BY-SA 4.0"),
    "hanoi": ("Hanoi Skyline - NKS.jpg", "NKSTTSSHNVN", "CC BY-SA 4.0"),
    "palace": ("Presidential Palace, Hanoi, Vietnam.jpg", "RB Photo", "CC BY 4.0"),
    "greathall": ("Great Hall of the People (20200825114146).jpg", "N509FZ", "CC BY-SA 4.0"),
    "haiphong": ("Container Ship at the Hai Phong International Container Terminal 01.jpg", "Nathan.cima", "CC BY-SA 4.0"),
    "border": ("The main gate of Friendship Pass in China.jpg", "TSVC1190", "CC BY-SA 4.0"),
    "laocai": ("Hekou-Lao Cai Bridge - P1380381.JPG", "Vmenkov", "CC BY-SA 3.0"),
    "train": ("CR400AF-2001@BJN (20170626110730).jpg", "N509FZ", "CC BY-SA 4.0"),
    "durian": ("Durian fruit opened PJ DSC 0802.jpg", "Kembangraps", "CC0 1.0"),
    "phuquoc": ("Kem Beach aerial view Phu Quoc Island Vietnam.jpg", "Vivu Vietnam", "CC BY-SA 4.0"),
    "pqairport": ("Phu Quoc International Airport at night.jpg", "FrogsLegs71", "CC BY-SA 3.0"),
}

POINTS_REGION = {
    "shenzhen": (114.0579, 22.5431),
    "nanning": (108.3661, 22.8172),
    "kunming": (102.8329, 24.8801),
    "laocai": (103.9755, 22.4809),
    "langson": (106.7615, 21.8537),
    "hanoi": (105.8342, 21.0278),
    "haiphong": (106.6881, 20.8449),
    "danang": (108.2022, 16.0544),
    "hcmc": (106.6297, 10.8231),
    "phuquoc": (103.9840, 10.2899),
}

POINTS_RAIL = {
    "laocai": (103.9755, 22.4809),
    "phutho": (105.2046, 21.3227),
    "hanoi": (105.8342, 21.0278),
    "bacninh": (106.0710, 21.1861),
    "hungyen": (106.0511, 20.6464),
    "haiphong": (106.6881, 20.8449),
    "lachhuyen": (106.9050, 20.8150),
    "langson": (106.7615, 21.8537),
    "mongcai": (107.9660, 21.5240),
}

POINTS_PHUQUOC = {
    "duongdong": (103.9610, 10.2190),
    "airport": (103.9931, 10.1698),
    "anthoi": (104.0110, 10.0250),
    "baidai": (103.8540, 10.3350),
}


def photo(item):
    import time
    name, (file, author, license_name) = item
    file = file.replace(" ", "_")
    prefix = md5(file.encode()).hexdigest()
    path = PUBLIC / f"{name}.webp"
    file_path = f"{prefix[0]}/{prefix[:2]}/{quote(file)}"
    urls = [
        f"https://thumb.wikimedia.org/wikipedia/commons/thumb/{file_path}/1280px-{quote(file)}",
        f"https://upload.wikimedia.org/wikipedia/commons/thumb/{file_path}/1280px-{quote(file)}",
        f"https://upload.wikimedia.org/wikipedia/commons/{file_path}",
    ]
    used_url = urls[0]
    if not path.exists():
        content = None
        for url in urls:
            for attempt in range(4):
                time.sleep(1.0 + attempt * 2.0)
                try:
                    response = requests.get(url, headers=HEADERS, timeout=30)
                except requests.RequestException:
                    continue
                if response.status_code == 429:
                    time.sleep(5.0 + attempt * 3.0)
                    continue
                if response.ok:
                    content = response.content
                    used_url = url
                    break
            if content is not None:
                break
        if content is None:
            raise RuntimeError(f"Failed to download {name} ({file})")
        image = Image.open(BytesIO(content)).convert("RGB")
        image.thumbnail((2000, 1400), Image.Resampling.LANCZOS)
        image.save(path, quality=92, method=5)
        print(f"Photo OK: {name} ({image.size[0]}x{image.size[1]})", flush=True)
    return name, {
        "page": f"https://commons.wikimedia.org/wiki/File:{quote(file)}",
        "author": author,
        "license": license_name,
        "download": used_url,
        "sha256": sha256(path.read_bytes()).hexdigest(),
    }


def map_tiles(template, zoom):
    world_size = 2 ** zoom
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
        return x, y, osm.decode(file.read_bytes(), default_options={"y_coord_down": True})

    with ThreadPoolExecutor(max_workers=3) as pool:
        yield from pool.map(get, product(*bounds))


def prepare_map(template, name, left, top, scale, zoom, points_dict):
    osm.WIDTH, osm.HEIGHT, osm.SCALE = 1000, 650, scale
    osm.ORIGIN = osm.world(left, top)
    osm.CACHE_ROOT = HERE.parents[1] / ".cache" / "apec-openfreemap"
    osm.HEADERS = HEADERS
    layers = defaultdict(list)
    for x, y, tile in map_tiles(template, zoom):
        for label in ("water", "waterway", "landcover", "landuse", "transportation", "boundary"):
            layer = tile.get(label)
            if not layer:
                continue
            for kind, geometry, props in osm.transform(layer["features"], x, y, layer["extent"], zoom):
                category = props.get("class", "")
                if label == "transportation" and category not in osm.ROADS:
                    continue
                if label == "boundary" and (props.get("admin_level") not in (2, 4) or props.get("maritime") == 1):
                    continue
                layers[label].append((kind, geometry, category))
    image = Image.new("RGB", (2000, 1300), "#ebe7dc")
    draw = ImageDraw.Draw(image)

    def pixels(pts):
        return [(round(x * 2), round(y * 2)) for x, y in pts]

    for label, colors in [
        ("landcover", {"wood": "#cfe0cf", "grass": "#dde6d1", "farmland": "#eae4cc"}),
        ("landuse", {"residential": "#e7dfd0", "industrial": "#dfd5c3"}),
        ("water", defaultdict(lambda: "#9ec8dc")),
        ("waterway", defaultdict(lambda: "#a2ccdf")),
    ]:
        for kind, geometry, category in layers[label]:
            if category not in colors and not isinstance(colors, defaultdict):
                continue
            if kind == "polygon":
                if len(geometry[0]) >= 3:
                    draw.polygon(pixels(geometry[0]), fill=colors[category])
            elif label == "waterway":
                if len(geometry) >= 2:
                    draw.line(pixels(geometry), fill=colors[category], width=3)

    for category, (casing, fill, width) in osm.ROADS.items():
        roads = [pixels(g) for k, g, r in layers["transportation"] if r == category and k == "line" and len(g) >= 2]
        for paint, weight in [(casing, width + 0.7), (fill, width)]:
            for road in roads:
                draw.line(road, fill=paint, width=max(1, round(weight * 1.8)), joint="curve")

    for k, g, _ in layers["boundary"]:
        if k == "line" and len(g) >= 2:
            draw.line(pixels(g), fill="#8d7964", width=3)

    output = PUBLIC / f"map-{name}.webp"
    image.save(output, quality=92, method=5)
    print(f"Map {name}: {len(layers['transportation'])} roads, {len(layers['water'])} water", flush=True)
    return {pt: osm.locate(*coords) for pt, coords in points_dict.items()}


def main(mode="all"):
    PUBLIC.mkdir(exist_ok=True)
    if mode in ("all", "photos"):
        receipts = dict(photo(item) for item in PHOTOS.items())
        (HERE / "photos.json").write_text(json.dumps(receipts, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Downloaded/verified {len(receipts)} photos.", flush=True)
    if mode in ("all", "maps"):
        response = requests.get(osm.TILEJSON, headers=HEADERS, timeout=20)
        response.raise_for_status()
        template = response.json()["tiles"][0]
        result = {
            "region": prepare_map(template, "region", 97.5, 25.8, 34, 5, POINTS_REGION),
            "rail": prepare_map(template, "rail", 103.2, 23.0, 175, 7, POINTS_RAIL),
            "phuquoc": prepare_map(template, "phuquoc", 103.68, 10.48, 1450, 11, POINTS_PHUQUOC),
            "tiles": template,
        }
        (HERE / "maps.json").write_text(json.dumps(result, indent=2), encoding="utf-8")


if __name__ == "__main__":
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else "all")
