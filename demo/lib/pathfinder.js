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
  
  module.exports = aStarSearch;