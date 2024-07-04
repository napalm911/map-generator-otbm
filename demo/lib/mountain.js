const otbm2json = require("../lib/otbm2json");
const MOUNTAIN = require("../constants/mountain");
const GRASS_TILE = require("../constants/walkable-tiles").GRASS_TILE;

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function addMountain(tile, id) {
  tile.items.push({
    type: otbm2json.HEADERS.OTBM_ITEM,
    id: id
  });
}

function addMountainBorder(tileAreas, x, y, id, mapWidth, mapHeight) {
  if (x >= 0 && y >= 0 && x < mapWidth && y < mapHeight) {
    const tile = {
      type: otbm2json.HEADERS.OTBM_TILE,
      x: x % 256,
      y: y % 256,
      tileid: GRASS_TILE,
      items: []
    };
    addMountain(tile, id);
    tileAreas.push(tile);
  }
}

function generateMountain(xChunk, yChunk, mapWidth, mapHeight, zLevel, tileAreas) {
  const mountainMinSize = 5;
  const mountainMaxSize = 20;
  const size = mountainMinSize + Math.floor(Math.random() * (mountainMaxSize - mountainMinSize));
  const startX = Math.max(xChunk, 0);
  const startY = Math.max(yChunk, 0);
  const endX = Math.min(xChunk + size, mapWidth);
  const endY = Math.min(yChunk + size, mapHeight);

  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      const tileX = x % 256;
      const tileY = y % 256;

      const tile = {
        type: otbm2json.HEADERS.OTBM_TILE,
        x: tileX,
        y: tileY,
        tileid: GRASS_TILE, // Set grass tile
        items: []
      };

      // Determine the appropriate mountain tile based on position
      if (x === startX && y === startY) {
        addMountain(tile, MOUNTAIN.cNW);
      } else if (x === endX - 1 && y === startY) {
        addMountain(tile, MOUNTAIN.cNE);
      } else if (x === startX && y === endY - 1) {
        addMountain(tile, MOUNTAIN.cSW);
      } else if (x === endX - 1 && y === endY - 1) {
        addMountain(tile, MOUNTAIN.cSE);
      } else if (x === startX) {
        addMountain(tile, MOUNTAIN.W);
      } else if (x === endX - 1) {
        addMountain(tile, MOUNTAIN.E);
      } else if (y === startY) {
        addMountain(tile, MOUNTAIN.N);
      } else if (y === endY - 1) {
        addMountain(tile, MOUNTAIN.S);
      } else {
        addMountain(tile, randomElement(MOUNTAIN.Flor));
      }

      tileAreas.push(tile);
    }
  }

  // Add borders around the mountain
  for (let x = startX - 1; x <= endX; x++) {
    for (let y = startY - 1; y <= endY; y++) {
      if (x === startX - 1 && y === startY - 1) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.dNW, mapWidth, mapHeight);
      } else if (x === endX && y === startY - 1) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.dNE, mapWidth, mapHeight);
      } else if (x === startX - 1 && y === endY) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.dSW, mapWidth, mapHeight);
      } else if (x === endX && y === endY) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.dSE, mapWidth, mapHeight);
      } else if (x === startX - 1) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.W, mapWidth, mapHeight);
      } else if (x === endX) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.E, mapWidth, mapHeight);
      } else if (y === startY - 1) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.N, mapWidth, mapHeight);
      } else if (y === endY) {
        addMountainBorder(tileAreas, x, y, MOUNTAIN.S, mapWidth, mapHeight);
      }
    }
  }
}

module.exports = {
  generateMountain,
};