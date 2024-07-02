const fs = require("fs");
const otbm2json = require("../otbm2json");

const WHITE_TILE = 406;
const BLACK_TILE = 407;

// Read the map data using the otbm2json library
const mapData = otbm2json.read("lava.otbm");

// Go over all nodes
mapData.data.nodes.forEach(function(node) {

  node.features.forEach(function(feature) {
    
    // Skip anything that is not a tile area
    if(feature.type !== otbm2json.HEADERS.OTBM_TILE_AREA) return; 

    // For each tile area; go over all actual tiles
    feature.tiles.forEach(function(tile) {

      // Skip anything that is not a tile (e.g. house tiles)
      if(tile.type !== otbm2json.HEADERS.OTBM_TILE) return; 

      // Create a chessboard pattern using bitwise operators
      // Replace the id property of each tile
      if(tile.x & 1 ^ tile.y & 1) {
        tile.tileid = BLACK_TILE;
      } else {
        tile.tileid = WHITE_TILE;
      }

    });

  });

});

// Write the output to OTBM using the library
otbm2json.write("chess.otbm", mapData);

// Write the output to JSON
fs.writeFileSync("chess.json", JSON.stringify(mapData, null, 2));