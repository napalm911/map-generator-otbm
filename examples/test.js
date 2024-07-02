const fs = require("fs");
const otbm2json = require("../otbm2json");

const TILE_IDS = {
    dirt: 103,
    dirt_lava_border_top_corner_east: 4673,
    dirt_lava_border_top_corner_west: 4674,
    dirt_lava_border_top: 4669,
    dirt_lava_border_east: 4670,
    dirt_lava_border_west: 4668,
    dirt_lava_border_bottom_corner_east: 4672,
    dirt_lava_border_bottom_corner_west: 4671,
    dirt_lava_border_south: 4667,
    dirt_wall_border_south: 356,
    dirt_wall_border_bottom_corner_east: 364,
    dirt_wall_border_north: 357,
    dirt_wall_border_east: 367,
    dirt_wall_border_west: 359,
    dirt_wall_border_bottom_corner_west: 356,
    earth: 101,
    lava: [598, 599, 600, 601]
};

// Initialize map dimensions
const width = 120;
const height = 120;

// Generate a random initial map
function generateRandomMap(width, height, fillPercent) {
    const map = [];
    for (let x = 0; x < width; x++) {
        map[x] = [];
        for (let y = 0; y < height; y++) {
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                map[x][y] = 1;
            } else {
                map[x][y] = Math.random() < fillPercent ? 1 : 0;
            }
        }
    }
    return map;
}

// Smooth the map using cellular automata rules
function smoothMap(map, width, height) {
    const newMap = [];
    for (let x = 0; x < width; x++) {
        newMap[x] = [];
        for (let y = 0; y < height; y++) {
            const wallCount = getSurroundingWallCount(map, x, y, width, height);
            newMap[x][y] = wallCount > 4 ? 1 : wallCount < 4 ? 0 : map[x][y];
        }
    }
    return newMap;
}

function getSurroundingWallCount(map, x, y, width, height) {
    let wallCount = 0;
    for (let nx = x - 1; nx <= x + 1; nx++) {
        for (let ny = y - 1; ny <= y + 1; ny++) {
            if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
                if (nx !== x || ny !== y) {
                    wallCount += map[nx][ny];
                }
            } else {
                wallCount++;
            }
        }
    }
    return wallCount;
}

// Create the map data structure with tiles
function createMapData(map, width, height, startX, startY, startZ) {
    const nodes = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const tileId = map[x][y] === 1 ? TILE_IDS.earth : TILE_IDS.dirt;
            nodes.push({
                type: otbm2json.HEADERS.OTBM_TILE,
                x: startX + x,
                y: startY + y,
                z: startZ,
                tileid: tileId
            });
        }
    }
    return {
        type: otbm2json.HEADERS.OTBM_MAP_DATA,
        features: [{
            type: otbm2json.HEADERS.OTBM_TILE_AREA,
            x: startX,
            y: startY,
            z: startZ,
            tiles: nodes
        }]
    };
}

// Main dungeon generation function
function generateDungeon(filename) {
    let map = generateRandomMap(width, height, 0.45);
    for (let i = 0; i < 5; i++) {
        map = smoothMap(map, width, height);
    }

    const startX = 1000;
    const startY = 1000;
    const startZ = 7;

    const mapData = createMapData(map, width, height, startX, startY, startZ);

    // Write the output to OTBM using the library
    otbm2json.write(filename, { data: mapData });

    // Write the output to JSON
    fs.writeFileSync(filename.replace('.otbm', '.json'), JSON.stringify(mapData, null, 2));
}

// Generate the dungeon and save it
generateDungeon("dungeon.otbm");