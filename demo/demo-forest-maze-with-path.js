const otbm2json = require("./lib/otbm2json");
const { DIRT_TILE, GRASS_TILE } = require("./constants/walkable-tiles");
const BORDERS = require("./constants/borders");
const { generateForest, randomTree } = require("./lib/forest");
const { generateCave, doSimulationStep } = require("./lib/procedural-cave-gen");
const { generateMaze } = require("./lib/maze-wide");
const aStarSearch = require("./lib/pathfinder");

const HOLE = 384;
const OPEN_HOLE = 469;

const caveChanceToStartAlive = 0.45;
const caveBirthLimit = 4;
const caveDeathLimit = 3;
const numberOfSteps = 5;
const mapWidth = 128;
const mapHeight = 128;
const zLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const pathWidth = 3;

function addBorder(tileAreas, x, y, id, mapWidth, mapHeight) {
  if (x >= 0 && y >= 0 && x < mapWidth && y < mapHeight) {
    const tile = {
      type: otbm2json.HEADERS.OTBM_TILE,
      x: x % 256,
      y: y % 256,
      tileid: GRASS_TILE,
      items: [],
    };
    tile.items.push({
      type: otbm2json.HEADERS.OTBM_ITEM,
      id: id,
    });
    tileAreas.push(tile);
  }
}

function generateTileArea(
  xChunk,
  yChunk,
  chunkSize,
  mapWidth,
  mapHeight,
  zLevel,
  mazeMap,
  path,
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

        // Place dirt tiles on the path
        if (
          path.some(
            ([px, py]) => Math.abs(px - tileX) < 2 && Math.abs(py - tileY) < 2,
          )
        ) {
          tile.tileid = DIRT_TILE;
        } else {
          // Block paths with trees
          if (Math.random() < 0.3) {
            tile.items.push({
              type: otbm2json.HEADERS.OTBM_ITEM,
              id: randomTree(),
            });
          }
        }

        tileArea.tiles.push(tile);
      }
    }
  }

  // Add borders around the dirt path
  path.forEach(([px, py]) => {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const borderX = px + dx;
        const borderY = py + dy;

        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue; // Skip inner tiles

        let borderId;
        if (dx === -2 && dy === -2) {
          borderId = BORDERS.CORNER_NW;
        } else if (dx === 2 && dy === -2) {
          borderId = BORDERS.CORNER_NE;
        } else if (dx === -2 && dy === 2) {
          borderId = BORDERS.CORNER_SW;
        } else if (dx === 2 && dy === 2) {
          borderId = BORDERS.CORNER_SE;
        } else if (dx === -2) {
          borderId = BORDERS.WEST;
        } else if (dx === 2) {
          borderId = BORDERS.EAST;
        } else if (dy === -2) {
          borderId = BORDERS.NORTH;
        } else if (dy === 2) {
          borderId = BORDERS.SOUTH;
        }

        if (borderId) {
          addBorder(
            tileArea.tiles,
            borderX,
            borderY,
            borderId,
            mapWidth,
            mapHeight,
          );
        }
      }
    }
  });

  // Add holes and open holes in tree cages
  const treeCages = [];
  path.forEach(([px, py]) => {
    const cage = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const tx = px + dx;
        const ty = py + dy;
        if (!path.some(([px, py]) => px === tx && py === ty)) {
          cage.push([tx, ty]);
        }
      }
    }
    treeCages.push(cage);
  });

  treeCages.forEach((cage) => {
    const [hx, hy] = cage[Math.floor(Math.random() * cage.length)];
    const [ohx, ohy] = cage[Math.floor(Math.random() * cage.length)];
    const tileHole = tileArea.tiles.find(
      (tile) => tile.x === hx % 256 && tile.y === hy % 256,
    );
    const tileOpenHole = tileArea.tiles.find(
      (tile) => tile.x === ohx % 256 && tile.y === ohy % 256,
    );
    if (tileHole) {
      tileHole.items.push({
        type: otbm2json.HEADERS.OTBM_ITEM,
        id: 386,
      });
    }
    if (tileOpenHole) {
      tileOpenHole.items.push({
        type: otbm2json.HEADERS.OTBM_ITEM,
        id: 387,
      });
    }
  });

  return tileArea;
}

function generateMazePaths(mapWidth, mapHeight, pathWidth) {
  const { maze, start, end } = generateMaze(mapWidth, mapHeight, pathWidth);
  const path = aStarSearch(maze, start, end).flatMap(([px, py]) => {
    const points = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        points.push([px + dx, py + dy]);
      }
    }
    return points;
  });
  return { maze, path, start, end };
}

function generateTerrain(
  mapData,
  zLevels,
  chunkSize,
  mapWidth,
  mapHeight,
  pathWidth,
) {
  let tileAreas = [];

  zLevels.forEach((zLevel) => {
    const { maze, path, start, end } = generateMazePaths(
      mapWidth,
      mapHeight,
      pathWidth,
    );
    for (let xChunk = 0; xChunk < mapWidth; xChunk += chunkSize) {
      for (let yChunk = 0; yChunk < mapHeight; yChunk += chunkSize) {
        const tileArea = generateTileArea(
          xChunk,
          yChunk,
          chunkSize,
          mapWidth,
          mapHeight,
          zLevel,
          maze,
          path,
        );
        tileAreas.push(tileArea);
      }
    }
  });

  return tileAreas;
}

const mapData = otbm2json.read("lava.otbm");
const chunkSize = 256;
const newTileAreas = generateTerrain(
  mapData,
  zLevels,
  chunkSize,
  mapWidth,
  mapHeight,
  pathWidth,
);

mapData.data.nodes.forEach(function (node) {
  node.features = node.features.filter((feature) => {
    return !(
      feature.type === otbm2json.HEADERS.OTBM_TILE_AREA &&
      zLevels.includes(feature.z)
    );
  });

  node.features = node.features.concat(newTileAreas);
});

otbm2json.write("dungeon.otbm", mapData);
console.log("Dungeon map has been written to dungeon.otbm");
