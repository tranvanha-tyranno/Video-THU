"""Build two offline Web Mercator images from NASA GIBS Blue Marble."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
from itertools import product
from pathlib import Path
import json
import math

from PIL import Image
import requests

HERE = Path(__file__).resolve().parent
PUBLIC = HERE / "public"
TILES = (
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/"
    "BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8"
)
WIDTH, HEIGHT = 1920, 1080


def project(lon, lat, zoom):
    world = 256 * 2**zoom
    return (lon + 180) / 360 * world, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * world


def make_image(name, lon, lat, span, zoom):
    center_x, center_y = project(lon, lat, zoom)
    crop_width = span / 360 * 256 * 2**zoom
    crop_height = crop_width * HEIGHT / WIDTH
    left, top = center_x - crop_width / 2, center_y - crop_height / 2
    x0, y0 = math.floor(left / 256), math.floor(top / 256)
    x1, y1 = math.floor((left + crop_width) / 256), math.floor((top + crop_height) / 256)
    mosaic = Image.new("RGB", ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256))
    used = []

    def fetch(tile):
        col, row = tile
        url = f"{TILES}/{zoom}/{row}/{col}.jpg"
        response = requests.get(url, timeout=18)
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert("RGB")
        if image.size != (256, 256):
            raise ValueError(f"Unexpected tile size at {url}")
        return col, row, image, {"url": url, "sha256": sha256(response.content).hexdigest()}

    with ThreadPoolExecutor(max_workers=5) as pool:
        for col, row, image, receipt in pool.map(fetch, product(range(x0, x1 + 1), range(y0, y1 + 1))):
            mosaic.paste(image, ((col - x0) * 256, (row - y0) * 256))
            used.append(receipt)

    crop = (left - 256 * x0, top - 256 * y0, left - 256 * x0 + crop_width, top - 256 * y0 + crop_height)
    output = PUBLIC / name
    mosaic.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS, box=crop).save(output, quality=94, subsampling=0)

    def locate(longitude, latitude):
        x, y = project(longitude, latitude, zoom)
        return [round((x - left) / crop_width * 1280, 2), round((y - top) / crop_height * 720, 2)]

    return locate, {"file": name, "sha256": sha256(output.read_bytes()).hexdigest(), "tiles": used}


def main():
    PUBLIC.mkdir(exist_ok=True)
    overview, overview_source = make_image("china-overview.jpg", 106.5, 35.7, 66, 6)
    detail, detail_source = make_image("beijing-tianjin.jpg", 117.08, 39.52, 2.58, 8)
    stations = [(116.37639, 39.86583), (117.00990, 39.37106), (117.21118, 39.13693)]
    data = {
        "overview": overview(116.83, 39.50),
        "stations": [detail(*station) for station in stations],
        "gulf": detail(117.95, 39.23),
    }
    (HERE / "map-props.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    (HERE / "map-sources.json").write_text(json.dumps({
        "dataset": "NASA Blue Marble, August 2004, Shaded Relief and Bathymetry",
        "projection": "EPSG:3857",
        "images": [overview_source, detail_source],
        "stationOrder": ["Beijing South", "Wuqing", "Tianjin"],
        "stationsLonLat": stations,
        "routeRepresentation": "Simplified line through station locations. Not surveyed track geometry.",
    }, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
