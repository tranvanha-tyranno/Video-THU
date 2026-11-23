"""Extract the station-to-station alignment from OSM rail route relation 6148942."""

from collections import defaultdict
from heapq import heappop, heappush
import json
from math import dist
from pathlib import Path
import sys

from shapely.geometry import LineString, Point
from shapely.ops import substring

from build_map import HERE, locate

STATION_NAMES = ("Beijingnan", "Wuqing", "Tianjin")
RELATION_ID = 6148942


def shortest_path(graph, starts, ends):
    queue = [(cost, node) for node, cost in starts]
    queue.sort()
    costs = dict(starts)
    previous = {}
    while queue:
        cost, node = heappop(queue)
        if node in ends:
            result = [node]
            while node in previous:
                node = previous[node]
                result.append(node)
            return result[::-1]
        if cost > costs[node]:
            continue
        for neighbor, edge_cost in graph[node]:
            next_cost = cost + edge_cost
            if next_cost < costs.get(neighbor, float("inf")):
                costs[neighbor] = next_cost
                previous[neighbor] = node
                heappush(queue, (next_cost, neighbor))
    raise ValueError("No connected railway path for the three stations")


def main(source_path):
    elements = json.loads(source_path.read_text(encoding="utf-8"))["elements"]
    relation = next(e for e in elements if e["type"] == "relation" and e["id"] == RELATION_ID)
    assert relation["tags"]["route"] == "railway"
    way_ids = {m["ref"] for m in relation["members"] if m["type"] == "way"}
    station_ids = {m["ref"] for m in relation["members"] if m["type"] == "node"}
    nodes = {e["id"]: locate(e["lon"], e["lat"]) for e in elements if e["type"] == "node"}
    names = {e["tags"].get("name:en"): nodes[e["id"]] for e in elements
             if e["type"] == "node" and e["id"] in station_ids
             and e.get("tags", {}).get("railway") == "station"}
    graph = defaultdict(list)
    for way in (e for e in elements if e["type"] == "way" and e["id"] in way_ids):
        for a, b in zip(way["nodes"], way["nodes"][1:]):
            length = dist(nodes[a], nodes[b])
            graph[a].append((b, length))
            graph[b].append((a, length))

    def closest(name):
        return sorted(((node, dist(nodes[node], names[name])) for node in graph),
                      key=lambda pair: pair[1])[:12]

    # Search outwards from either end to make the station projection fall within the path.
    start_nodes, end_nodes = (closest(name) for name in (STATION_NAMES[0], STATION_NAMES[-1]))
    path = shortest_path(graph, [(node, 2 * cost) for node, cost in start_nodes],
                         {node for node, cost in end_nodes if cost <= 5})
    # Extend along long single-track ways when the graph starts very close to a platform.
    railway = LineString([nodes[node] for node in path])
    platforms = [Point(names[name]) for name in STATION_NAMES]
    offsets = [railway.project(point) for point in platforms]
    errors = [round(railway.distance(point), 2) for point in platforms]
    if max(errors) > 4 or not offsets[0] < offsets[1] < offsets[2] or not 610 < offsets[2] - offsets[0] < 710:
        raise ValueError(f"Alignment failed station and distance checks: {errors=}, {offsets=}")
    route = []
    for start, end in zip(offsets, offsets[1:]):
        leg = substring(railway, start, end).simplify(.25)
        route.append([[round(x, 2), round(y, 2)] for x, y in leg.coords])
    data_path = HERE / "map-data.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    data.update({
        "stations": [route[0][0], route[0][-1], route[1][-1]],
        "route": route,
        "railSource": f"https://www.openstreetmap.org/relation/{RELATION_ID}",
        "railVersion": relation.get("version"),
        "railStationSnapPx": errors,
    })
    data_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Track vertices: {[len(leg) for leg in route]}, station offsets in map pixels: {errors}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
