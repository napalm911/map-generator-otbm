const otbm2json = require("./lib/otbm2json");

// Define constants for tile and item IDs
const GRASS_TILE = 102;
const TREE_IDS = [2701, 2702, 2703, 2704, 2705, 2706];

// Function to get a random tree ID
function randomTree() {
  return TREE_IDS[Math.floor(Math.random() * TREE_IDS.length)];
}

// Read the map data using the otbm2json library
const mapData = otbm2json.read("lava.otbm");

// Get map dimensions
const mapWidth = mapData.data.mapWidth;
const mapHeight = mapData.data.mapHeight;

// Define the Z levels to be modified (for example, levels 7 to 9)
const zLevels = [7, 8, 9];

// Create a new array for tile areas
let tileAreas = [];

// Fill the entire tile area in chunks
const chunkSize = 256;
for (let xChunk = 0; xChunk < mapWidth; xChunk += chunkSize) {
  for (let yChunk = 0; yChunk < mapHeight; yChunk += chunkSize) {
    zLevels.forEach(z => {
      const tileArea = {
        type: otbm2json.HEADERS.OTBM_TILE_AREA,
        x: xChunk,
        y: yChunk,
        z: z,
        tiles: []
      };

      for (let x = 0; x < chunkSize; x++) {
        for (let y = 0; y < chunkSize; y++) {
          const tileX = xChunk + x;
          const tileY = yChunk + y;

          // Ensure x and y are within the map boundaries
          if (tileX < mapWidth && tileY < mapHeight) {
            const tile = {
              type: otbm2json.HEADERS.OTBM_TILE,
              x: tileX % 256,
              y: tileY % 256,
              tileid: GRASS_TILE, // Set grass tile
              items: []
            };

            // On 1/4th of all tiles put a random tree
            if (Math.random() < 0.25) {
              tile.items.push({
                type: otbm2json.HEADERS.OTBM_ITEM,
                id: randomTree()
              });
            }

            tileArea.tiles.push(tile);
          }
        }
      }

      tileAreas.push(tileArea);
    });
  }
}

// Replace existing tile areas with new ones
mapData.data.nodes.forEach(function(node) {
  node.features = tileAreas;
});

// Write the output to OTBM using the library
otbm2json.write("forest.otbm", mapData);

console.log("Forest map has been written to forest.otbm");
