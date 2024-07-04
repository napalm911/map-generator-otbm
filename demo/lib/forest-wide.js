const otbm2json = require("../lib/otbm2json");

const TREE_IDS = [2701, 2702, 2703, 2704, 2705, 2706];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function addTree(tile) {
  tile.items.push({
    type: otbm2json.HEADERS.OTBM_ITEM,
    id: randomElement(TREE_IDS),
  });
}

function generateForest(tile, mazeMap, tileX, tileY) {
  if (mazeMap[tileX] && mazeMap[tileX][tileY] === 1) {
    addTree(tile);
  }
}

module.exports = {
  generateForest,
};
