const otbm2json = require("./lib/otbm2json");
const { GRASS_TILE } = require("./constants/walkable-tiles");
const { generateForest } = require("./lib/forest");
const { generateMountain } = require("./lib/mountain");
const { generateCave, doSimulationStep } = require("./lib/procedural-cave-gen");

// Cellular Automata parameters
const caveChanceToStartAlive = 0.45;
const caveBirthLimit = 4;
const caveDeathLimit = 3;
const numberOfSteps = 5;
const mapWidth = 512; // Change as needed
const mapHeight = 512; // Change as needed

function generateTileArea(
  xChunk,
  yChunk,
  chunkSize,
  mapWidth,
  mapHeight,
  zLevel,
  caveMap,
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

        generateForest(tile, caveMap, tileX, tileY);

        tileArea.tiles.push(tile);
      }
    }
  }

  return tileArea;
}

function generateTerrain(mapData, zLevel, chunkSize, mapWidth, mapHeight) {
  let caveMap = generateCave(mapWidth, mapHeight, caveChanceToStartAlive);
  for (let i = 0; i < numberOfSteps; i++) {
    caveMap = doSimulationStep(caveMap, caveBirthLimit, caveDeathLimit);
  }

  let tileAreas = [];

  for (let xChunk = 0; xChunk < mapWidth; xChunk += chunkSize) {
    for (let yChunk = 0; yChunk < mapHeight; yChunk += chunkSize) {
      const tileArea = generateTileArea(
        xChunk,
        yChunk,
        chunkSize,
        mapWidth,
        mapHeight,
        zLevel,
        caveMap,
      );
      tileAreas.push(tileArea);

      if (Math.random() < 0.25) {
        // Adjust this value to control mountain density
        generateMountain(
          xChunk,
          yChunk,
          mapWidth,
          mapHeight,
          zLevel,
          tileArea.tiles,
        );
      }
    }
  }

  return tileAreas;
}

// Main script execution
const mapData = otbm2json.read("lava.otbm");
const zLevel = 7;
const chunkSize = 256;
const newTileAreas = generateTerrain(
  mapData,
  zLevel,
  chunkSize,
  mapWidth,
  mapHeight,
);

mapData.data.nodes.forEach(function (node) {
  node.features = node.features.filter((feature) => {
    return !(
      feature.type === otbm2json.HEADERS.OTBM_TILE_AREA && feature.z === zLevel
    );
  });

  node.features = node.features.concat(newTileAreas);
});

otbm2json.write("border-mountain.otbm", mapData);
console.log(
  "border-mountain map for level 7 has been written to border-mountain.otbm",
);
