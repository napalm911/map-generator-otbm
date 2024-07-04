const otbm2json = require("./lib/otbm2json");

const WHITE_TILE = 406;
const BLACK_TILE = 407;

// Read the map data using the otbm2json library
const mapData = otbm2json.read("lava.otbm");

// Get map dimensions
const mapWidth = mapData.data.mapWidth;
const mapHeight = mapData.data.mapHeight;

// Go over all nodes
mapData.data.nodes.forEach(function (node) {
  node.features.forEach(function (feature) {
    // Skip anything that is not a tile area
    if (feature.type !== otbm2json.HEADERS.OTBM_TILE_AREA) return;

    // Create a new array for tiles
    feature.tiles = [];

    // Fill the entire tile area
    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        // Ensure x and y are within UInt8 range
        if (x < 256 && y < 256) {
          const tile = {
            type: otbm2json.HEADERS.OTBM_TILE,
            x: x,
            y: y,
            tileid: (x & 1) ^ (y & 1) ? BLACK_TILE : WHITE_TILE,
          };
          feature.tiles.push(tile);
        }
      }
    }
  });
});

// Write the output to OTBM using the library
otbm2json.write("chess.otbm", mapData);
