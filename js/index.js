var DEFAULT_TERRAIN_VARIABILITY = 75;
var DEFAULT_TILE_SIZE = 2;

var TILE_TYPES = [
    "DarkBlue",
    "Blue", 
    "Khaki",
    "YellowGreen", 
    "YellowGreen",
    "Green",
    "DarkGrey", 
    "White"
    ]

/** 
 * 'Wrap' the value so it falls within the range [min, max], respecting the 'direction'
 * of the wrap.
 *      e.g. with a range [0, 10]: 12 'wraps' to 8 while 24 'wraps' to 4 
 */
function wrapNumber(min, max, value) {
    var remainder = Math.abs(value) % max;
    var numWraps = Math.floor(Math.abs(value)/max);
    var val = 0;
    if (numWraps % 2 == 0)
        val = min+remainder;
    else
        val = max-remainder;   
        
    return val;
}

/**
 * The 'square' step of diamond square.
 * 
 * Takes the 4 corners of a square of size 'size', which has the center (col, row).
 * Averages those 4 corners, applies some random perturbation, and then sets that as
 * the new height for the center point.
 */
function squareStep(map, col, row, size, scale) {
    var NW = map[row - size/2][col - size/2];
    var NE = map[row - size/2][col + size/2];
    var SW = map[row + size/2][col - size/2];
    var SE = map[row + size/2][col + size/2];

    var avg = (NW + NE + SW + SE) / 4
    map[row][col] = wrapNumber(0, TILE_TYPES.length, avg + (Math.random() * scale * 2 - scale));
}

/**
 * The 'diamond' step of diamond square.
 * 
 * Takes the 4 points of a diamond of size 'size', which has the center (col, row).
 * Averages those 4 points, applies some random perturbation, and then sets that as
 * the new height for the center point.
 */
function diamondStep(map, col, row, size, scale, maxSize) {
    var sum = 0;
    var numSamples = 0;
    if (row - size/2 >= 0) {
        sum += map[row - size/2][col];
        numSamples++;
    }
    if (col + size/2 < maxSize) {
        sum += map[row][col + size/2];
        numSamples++;
    }
    if (row + size/2 < maxSize) {
        sum += map[row + size/2][col];
        numSamples++;
    }
    if (col - size/2 >= 0) {
        sum += map[row][col - size/2];
        numSamples++;
    }
    var avg = sum/numSamples;
    map[row][col] = wrapNumber(0, TILE_TYPES.length, avg + (Math.random() * scale * 2 - scale));
}

/**
 * Generate a height map using the diamond-square method.
 */
function generateHeightMap(width, height, variability) {

    // Diamond-square needs a square grid of size 2^n + 1, so we take the longest side and 
    // scale our map to the next largest power of 2
    var largestCanvasSide = width > height ? width : height;
    var size = Math.pow(2, Math.ceil(Math.log2(largestCanvasSide - 1))) + 1;

    // Initialize Map
    var map = Array(size);
    for (var i = 0; i < size; i++)
        map[i] = Array(size);

    // Seed the map corners
    map[0][0] = Math.random() * TILE_TYPES.length;
    map[0][size - 1] = Math.random() * TILE_TYPES.length;
    map[size - 1][0] = Math.random() * TILE_TYPES.length;
    map[size - 1][size - 1] = Math.random() * TILE_TYPES.length;

    var stepSize = size - 1;
    var scale = variability;

    // Do diamond-square
    while (stepSize > 1) {

        var halfStep = stepSize / 2;

        for (var r=halfStep; r < size; r += stepSize) {
            for (var c=halfStep; c < size; c += stepSize) {
                squareStep(map, c, r, stepSize, scale);
            }
        }

        for (var r=0; r < size; r += halfStep) {
            for (var c=(r + halfStep) % stepSize; c < size; c += stepSize) {
                diamondStep(map, c, r, stepSize, scale, size);
            }
        }

        stepSize /= 2;
        scale /= 2;
    }

    // Trim map back to the requested size
    var trimmedMap = map.slice(0, height);
    for (var r = 0; r < height; r++)
        trimmedMap[r] = map[r].slice(0, width);

    return trimmedMap;
}

function generateTerrain() {
    // Initialize our canvas to cover the entire window
    var canvas = document.getElementsByTagName("canvas")[0];

    var width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    var height = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");

    // Get the configurable vars
    var variability = document.getElementById("variability").value || DEFAULT_TERRAIN_VARIABILITY;
    var tileSize = document.getElementById("tileSize").value || DEFAULT_TILE_SIZE;

    // Get our heightmap
    var numRowTiles = Math.ceil(height / tileSize);
    var numColTiles = Math.ceil(width / tileSize);

    var map = generateHeightMap(numColTiles, numRowTiles, variability);

    // Draw our heightmap
    for (var r = 0; r < numRowTiles; r ++) {
        for (var c = 0; c < numColTiles; c++) {
            ctx.fillStyle = TILE_TYPES[Math.floor(map[r][c])];
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
        }
    }
}

function run() {

    document.getElementById("variability").value = DEFAULT_TERRAIN_VARIABILITY;
    document.getElementById("tileSize").value = DEFAULT_TILE_SIZE;

    generateTerrain();
}
