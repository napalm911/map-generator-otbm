const otbm2json = require("./lib/otbm2json");
const { GRASS_TILE } = require("./constants/walkable-tiles");
const { generateForest } = require("./lib/forest");
const { generateCave, doSimulationStep } = require("./lib/procedural-cave-gen");
const { generateMaze } = require("./lib/maze");

// Define constants for tile and item IDs
const TREE_IDS = [2701, 2702, 2703, 2704, 2705, 2706];
const HOLE = 384;
const OPEN_HOLE = 469;

// Cellular Automata parameters
const caveChanceToStartAlive = 0.45;
const caveBirthLimit = 4;
const caveDeathLimit = 3;
const numberOfSteps = 5;
const mapWidth = 512; // Change as needed
const mapHeight = 512; // Change as needed
const zLevels = [6, 7, 8]; // Define Z levels for the dungeon

// Function to get a random tree ID
function randomTree() {
  return TREE_IDS[Math.floor(Math.random() * TREE_IDS.length)];
}

function generateTileArea(
  xChunk,
  yChunk,
  chunkSize,
  mapWidth,
  mapHeight,
  zLevel,
  mazeMap,
) {
  const tileArea = {
    type: otbm2json.HEADERS.OTBM_TILE_AREA,
    x: xChunk,
    y: yChunk,
    z: zLevel,
    tiles: [],
  };

  for (let x = 0; x < chunkSize; x++) {
    for (let y = 0; y < chunkSize; y++) {
      const tileX = xChunk + x;
      const tileY = yChunk + y;

      if (tileX < mapWidth && tileY < mapHeight) {
        const tile = {
          type: otbm2json.HEADERS.OTBM_TILE,
          x: tileX % 256,
          y: tileY % 256,
          tileid: GRASS_TILE,
          items: [],
        };

        // Add forest generation
        generateForest(tile, mazeMap, tileX, tileY);

        tileArea.tiles.push(tile);
      }
    }
  }

  return tileArea;
}

function generateMazePaths(mapWidth, mapHeight) {
  const mazeMap = generateMaze(mapWidth, mapHeight);
  return mazeMap;
}

function generateTerrain(mapData, zLevels, chunkSize, mapWidth, mapHeight) {
  const mazeMap = generateMazePaths(mapWidth, mapHeight);

  let tileAreas = [];

  for (let xChunk = 0; xChunk < mapWidth; xChunk += chunkSize) {
    for (let yChunk = 0; yChunk < mapHeight; yChunk += chunkSize) {
      zLevels.forEach((zLevel) => {
        const tileArea = generateTileArea(
          xChunk,
          yChunk,
          chunkSize,
          mapWidth,
          mapHeight,
          zLevel,
          mazeMap,
        );
        tileAreas.push(tileArea);

        // Generate holes and open holes for dungeon levels
        tileArea.tiles.forEach((tile) => {
          if (Math.random() < 0.01) {
            // Adjust this value to control hole density
            tile.items.push({
              type: otbm2json.HEADERS.OTBM_ITEM,
              id: HOLE,
            });
          } else if (Math.random() < 0.01) {
            // Adjust this value to control open hole density
            tile.items.push({
              type: otbm2json.HEADERS.OTBM_ITEM,
              id: OPEN_HOLE,
            });
          }
        });
      });
    }
  }

  return tileAreas;
}

// Main script execution
const mapData = otbm2json.read("lava.otbm");
const chunkSize = 256;
const newTileAreas = generateTerrain(
  mapData,
  zLevels,
  chunkSize,
  mapWidth,
  mapHeight,
);

// Replace existing tile areas with new ones
mapData.data.nodes.forEach(function (node) {
  node.features = node.features.filter((feature) => {
    return !(
      feature.type === otbm2json.HEADERS.OTBM_TILE_AREA &&
      zLevels.includes(feature.z)
    );
  });

  node.features = node.features.concat(newTileAreas);
});

// Write the output to OTBM using the library
otbm2json.write("dungeon.otbm", mapData);
console.log("Dungeon map has been written to dungeon.otbm");
