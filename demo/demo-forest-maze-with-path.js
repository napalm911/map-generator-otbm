const otbm2json = require("./lib/otbm2json");
const { DIRT_TILE, GRASS_TILE } = require("./constants/walkable-tiles");
const { generateForest } = require("./lib/forest");
const { generateCave, doSimulationStep } = require("./lib/procedural-cave-gen");
const { generateMaze } = require("./lib/maze-wide");

const TREE_IDS = [2701, 2702, 2703, 2704, 2705, 2706];
const HOLE = 384;
const OPEN_HOLE = 469;

const caveChanceToStartAlive = 0.45;
const caveBirthLimit = 4;
const caveDeathLimit = 3;
const numberOfSteps = 5;
const mapWidth = 512;
const mapHeight = 512;
const zLevels = [6, 7, 8];
const pathWidth = 3;

function randomTree() {
  return TREE_IDS[Math.floor(Math.random() * TREE_IDS.length)];
}

function aStarSearch(maze, start, end) {
  const [startX, startY] = start;
  const [endX, endY] = end;

  const rows = maze.length;
  const cols = maze[0].length;
  const closedSet = new Set();
  const openSet = new Set([start.toString()]);
  const cameFrom = {};
  const gScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
  const fScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));

  gScore[startX][startY] = 0;
  fScore[startX][startY] = heuristic(start, end);

  function heuristic(a, b) {
    const [ax, ay] = a;
    const [bx, by] = b;
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  function getLowestFScore() {
    let lowest = Infinity;
    let lowestNode = null;
    for (const node of openSet) {
      const [x, y] = node.split(",").map(Number);
      if (fScore[x][y] < lowest) {
        lowest = fScore[x][y];
        lowestNode = [x, y];
      }
    }
    return lowestNode;
  }

  function getNeighbors([x, y]) {
    const neighbors = [];
    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < rows && ny < cols && maze[nx][ny] === 0) {
        neighbors.push([nx, ny]);
      }
    }
    return neighbors;
  }

  while (openSet.size > 0) {
    const current = getLowestFScore();

    if (current[0] === endX && current[1] === endY) {
      const path = [];
      let [cx, cy] = current;
      while (cameFrom[`${cx},${cy}`]) {
        path.push([cx, cy]);
        [cx, cy] = cameFrom[`${cx},${cy}`];
      }
      return path.reverse();
    }

    openSet.delete(current.toString());
    closedSet.add(current.toString());

    for (const neighbor of getNeighbors(current)) {
      const [nx, ny] = neighbor;
      if (closedSet.has(neighbor.toString())) continue;

      const tentativeGScore = gScore[current[0]][current[1]] + 1;

      if (!openSet.has(neighbor.toString())) openSet.add(neighbor.toString());

      if (tentativeGScore >= gScore[nx][ny]) continue;

      cameFrom[neighbor.toString()] = current;
      gScore[nx][ny] = tentativeGScore;
      fScore[nx][ny] = gScore[nx][ny] + heuristic(neighbor, end);
    }
  }

  return [];
}

function generateTileArea(xChunk, yChunk, chunkSize, mapWidth, mapHeight, zLevel, mazeMap, path) {
  const tileArea = {
    type: otbm2json.HEADERS.OTBM_TILE_AREA,
    x: xChunk,
    y: yChunk,
    z: zLevel,
    tiles: []
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
          items: []
        };

        // Place dirt tiles on the path
        if (path.some(([px, py]) => px === tileX && py === tileY)) {
          tile.tileid = DIRT_TILE;
        } else {
          generateForest(tile, mazeMap, tileX, tileY);
        }

        tileArea.tiles.push(tile);
      }
    }
  }

  return tileArea;
}

function generateMazePaths(mapWidth, mapHeight, pathWidth) {
  const { maze, start, end } = generateMaze(mapWidth, mapHeight, pathWidth);
  const path = aStarSearch(maze, start, end);
  return { maze, path, start, end };
}

function generateTerrain(mapData, zLevels, chunkSize, mapWidth, mapHeight, pathWidth) {
  let tileAreas = [];

  zLevels.forEach(zLevel => {
    const { maze, path, start, end } = generateMazePaths(mapWidth, mapHeight, pathWidth);
    for (let xChunk = 0; xChunk < mapWidth; xChunk += chunkSize) {
      for (let yChunk = 0; yChunk < mapHeight; yChunk += chunkSize) {
        const tileArea = generateTileArea(xChunk, yChunk, chunkSize, mapWidth, mapHeight, zLevel, maze, path);
        tileAreas.push(tileArea);

        tileArea.tiles.forEach(tile => {
          if (Math.random() < 0.01) {
            tile.items.push({
              type: otbm2json.HEADERS.OTBM_ITEM,
              id: HOLE
            });
          } else if (Math.random() < 0.01) {
            tile.items.push({
              type: otbm2json.HEADERS.OTBM_ITEM,
              id: OPEN_HOLE
            });
          }
        });
      }
    }
  });

  return tileAreas;
}

const mapData = otbm2json.read("lava.otbm");
const chunkSize = 256;
const newTileAreas = generateTerrain(mapData, zLevels, chunkSize, mapWidth, mapHeight, pathWidth);

mapData.data.nodes.forEach(function(node) {
  node.features = node.features.filter(feature => {
    return !(feature.type === otbm2json.HEADERS.OTBM_TILE_AREA && zLevels.includes(feature.z));
  });

  node.features = node.features.concat(newTileAreas);
});

otbm2json.write("dungeon.otbm", mapData);
console.log("Dungeon map has been written to dungeon.otbm");