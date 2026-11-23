"""Prepare a deterministic road basemap from OpenFreeMap's OSM vector tiles."""

from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from itertools import product
import json
from math import asinh, floor, pi, radians, tan
from pathlib import Path

from mapbox_vector_tile import decode
from PIL import Image, ImageDraw
import requests
from shapely.geometry import shape

HERE = Path(__file__).resolve().parent
PUBLIC = HERE / "public"
CACHE_ROOT = HERE.parents[2] / ".cache" / "rail6-openfreemap"
TILEJSON = "https://tiles.openfreemap.org/planet"
HEADERS = {"User-Agent": "AutoTyranno China Rail Documentary Road Map/1.0"}
WIDTH, HEIGHT = 1000, 760
LEFT, TOP = 115.96, 40.08
SCALE, DENSITY = 490, 2
STATIONS = [(116.37639, 39.86583), (117.00990, 39.37106), (117.21118, 39.13693)]
ROADS = {
    "minor": ("#e5e1d8", "#efebe0", .65),
    "tertiary": ("#d8d3c6", "#fdfbf4", 1.15),
    "secondary": ("#cdc5b5", "#fffdf6", 1.7),
    "primary": ("#cbbb9f", "#fffcf0", 2.2),
    "trunk": ("#b99a67", "#f1cc8a", 2.8),
    "motorway": ("#ac8045", "#eabd71", 3.3),
}
SHIELDS = {
    "G2": [(116.77, 39.54), (116.94, 39.62)],
    "G103": [(117.04, 39.48), (117.15, 39.42)],
    "G1": [(117.36, 39.72)],
    "G45": [(116.54, 39.29)],
    "G2502": [(117.55, 39.55), (117.45, 39.41)],
    "S15": [(116.70, 39.69)],
    "S30": [(117.19, 39.51)],
}


def world(lon, lat):
    return (lon + 180) / 360, (1 - asinh(tan(radians(lat))) / pi) / 2


ORIGIN = world(LEFT, TOP)


def project(x, y):
    return tuple(round((point - edge) * SCALE * 360, 2)
                 for point, edge in zip((x, y), ORIGIN))


def locate(lon, lat):
    return project(*world(lon, lat))


def tiles(template, zoom):
    world_size = 2**zoom
    cache = CACHE_ROOT / template.split("/planet/", 1)[1].split("/", 1)[0]
    cache.mkdir(parents=True, exist_ok=True)
    right = ORIGIN[0] + WIDTH / (SCALE * 360)
    bottom = ORIGIN[1] + HEIGHT / (SCALE * 360)
    bounds = [range(floor(a * world_size), floor(b * world_size) + 1)
              for a, b in zip(ORIGIN, (right, bottom))]

    def fetch(index):
        x, y = index
        path = cache / f"{zoom}-{x}-{y}.pbf"
        if not path.exists():
            response = requests.get(template.format(z=zoom, x=x, y=y), headers=HEADERS, timeout=25)
            response.raise_for_status()
            path.write_bytes(response.content)
        return x, y, decode(path.read_bytes(), default_options={"y_coord_down": True})

    with ThreadPoolExecutor(max_workers=4) as pool:
        yield from pool.map(fetch, product(*bounds))


def transform(features, tile_x, tile_y, extent, zoom):
    def line(coords):
        return [project((tile_x + x / extent) / 2**zoom, (tile_y + y / extent) / 2**zoom)
                for x, y in coords]

    for feature in features:
        geometry = feature["geometry"]
        kind = geometry["type"]
        coords = geometry["coordinates"]
        props = feature["properties"]
        if kind == "LineString":
            yield "line", line(coords), props
        elif kind == "MultiLineString":
            for segment in coords:
                yield "line", line(segment), props
        elif kind in {"Polygon", "MultiPolygon"}:
            for polygon in [coords] if kind == "Polygon" else coords:
                yield "polygon", [line(ring) for ring in polygon], props


def main():
    PUBLIC.mkdir(exist_ok=True)
    response = requests.get(TILEJSON, headers=HEADERS, timeout=15)
    response.raise_for_status()
    template = response.json()["tiles"][0]
    layers = defaultdict(list)
    refs = defaultdict(list)
    for zoom, names in [(10, ["water", "waterway", "landuse", "landcover"]),
                        (12, ["transportation", "transportation_name"])]:
        for x, y, tile in tiles(template, zoom):
            for name in names:
                layer = tile.get(name)
                if not layer:
                    continue
                for kind, geometry, props in transform(layer["features"], x, y, layer["extent"], zoom):
                    road = props.get("class", "")
                    if name == "transportation_name":
                        for ref in props.get("ref", "").split(";"):
                            if ref in SHIELDS and kind == "line":
                                refs[ref].extend(geometry)
                    elif name != "transportation" or road in ROADS:
                        layers[name].append((kind, geometry, road))

    image = Image.new("RGB", (WIDTH * DENSITY, HEIGHT * DENSITY), "#f3f0e6")
    draw = ImageDraw.Draw(image)

    def pixels(points):
        return [(round(x * DENSITY), round(y * DENSITY)) for x, y in points]

    for name, colors in [
        ("landcover", {"wood": "#dce6d8", "grass": "#e4eadb"}),
        ("landuse", {"residential": "#eae5da", "industrial": "#e7e0d6"}),
        ("water", defaultdict(lambda: "#b8d6df")),
        ("waterway", defaultdict(lambda: "#a8cbd7")),
    ]:
        for kind, geometry, category in layers[name]:
            if category not in colors and not isinstance(colors, defaultdict):
                continue
            fill = colors[category]
            if kind == "polygon":
                polygon = shape({"type": "Polygon", "coordinates": geometry})
                if polygon.area >= 1.5:
                    draw.polygon(pixels(geometry[0]), fill=fill)
            elif name == "waterway":
                draw.line(pixels(geometry), fill=fill, width=2)

    for category, (casing, fill, width) in ROADS.items():
        segments = [pixels(line) for _, line, road in layers["transportation"] if road == category]
        for color, line_width in [(casing, width + .9), (fill, width)]:
            for points in segments:
                draw.line(points, fill=color, width=max(1, round(line_width * DENSITY)), joint="curve")
    image.save(PUBLIC / "roads-beijing-tianjin.webp", quality=94, method=6)

    shields = []
    for ref, candidates in SHIELDS.items():
        if not refs[ref]:
            continue
        for place in candidates:
            x, y = locate(*place)
            point = min(refs[ref], key=lambda p: (p[0] - x)**2 + (p[1] - y)**2)
            if (point[0] - x)**2 + (point[1] - y)**2 < 54**2:
                shields.append({"ref": ref, "point": point})
    data = {
        "stations": [locate(*station) for station in STATIONS],
        "shields": shields,
        "source": template,
    }
    (HERE / "map-data.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"{len(layers['transportation'])} road features, {len(shields)} labels")


if __name__ == "__main__":
    main()
