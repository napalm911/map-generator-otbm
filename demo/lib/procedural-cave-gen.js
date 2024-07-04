function generateCave(mapWidth, mapHeight, caveChanceToStartAlive = 0.45) {
    let map = [];
    for (let x = 0; x < mapWidth; x++) {
      map[x] = [];
      for (let y = 0; y < mapHeight; y++) {
        map[x][y] = Math.random() < caveChanceToStartAlive ? 1 : 0;
      }
    }
    return map;
  }
  
  function doSimulationStep(map, caveBirthLimit = 4, caveDeathLimit = 3) {
    let newMap = [];
    for (let x = 0; x < map.length; x++) {
      newMap[x] = [];
      for (let y = 0; y < map[x].length; y++) {
        let aliveNeighbours = countAliveNeighbours(map, x, y);
        if (map[x][y] === 1) {
          newMap[x][y] = aliveNeighbours < caveDeathLimit ? 0 : 1;
        } else {
          newMap[x][y] = aliveNeighbours > caveBirthLimit ? 1 : 0;
        }
      }
    }
    return newMap;
  }
  
  function countAliveNeighbours(map, x, y) {
    let count = 0;
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        let neighbourX = x + i;
        let neighbourY = y + j;
        if (i === 0 && j === 0) {
          // Do nothing, it's the current cell
        } else if (neighbourX < 0 || neighbourY < 0 || neighbourX >= map.length || neighbourY >= map[0].length) {
          count = count + 1;
        } else if (map[neighbourX][neighbourY] === 1) {
          count = count + 1;
        }
      }
    }
    return count;
  }
  
  module.exports = {
    generateCave,
    doSimulationStep,
    countAliveNeighbours
  };
  