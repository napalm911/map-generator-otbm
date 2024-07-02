import json
from otbm2json import read_otbm, write_otbm, HEADERS, node_to_dict

WHITE_TILE = 406
BLACK_TILE = 407

# Read the map data using the otbm2json library
map_data = read_otbm("/home/max/napalm911/map-generator-otbm/js/examples/void.otbm")

# Print the size of the map
map_header = next(node for node in map_data["data"].nodes if node.type == HEADERS["OTBM_MAP_HEADER"])
print(f"Map size: {map_header.mapWidth}x{map_header.mapHeight}")

# Modify the map data to fill the entire map with alternating tiles
for node in map_data["data"].nodes:
    for feature in getattr(node, 'features', []):
        if feature.type != HEADERS["OTBM_TILE_AREA"]:
            continue
        for tile in getattr(feature, 'tiles', []):
            if tile.type != HEADERS["OTBM_TILE"]:
                continue
            # Alternate between WHITE_TILE and BLACK_TILE based on tile coordinates
            tile.tileid = WHITE_TILE if (tile.x + tile.y) % 2 == 0 else BLACK_TILE

# Write the output to OTBM using the library
write_otbm("/home/max/napalm911/map-generator-otbm/js/examples/chess.otbm", map_data)

# Write the output to JSON
with open("/home/max/napalm911/map-generator-otbm/js/examples/chess.json", "w") as json_file:
    json.dump(map_data, json_file, indent=2, default=node_to_dict)
