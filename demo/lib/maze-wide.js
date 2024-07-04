function generateMaze(width, height, pathWidth) {
  let maze = Array.from({ length: width }, () => Array(height).fill(1));

  function carve(x, y) {
    const stack = [];
    stack.push([x, y]);

    while (stack.length > 0) {
      const [cx, cy] = stack.pop();
      const directions = [
        [-pathWidth * 2, 0], [pathWidth * 2, 0], [0, -pathWidth * 2], [0, pathWidth * 2]
      ];

      shuffle(directions);

      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;
        const mx = cx + dx / 2;
        const my = cy + dy / 2;

        if (nx >= 0 && ny >= 0 && nx < width && ny < height && maze[nx][ny] === 1) {
          for (let i = 0; i < pathWidth; i++) {
            for (let j = 0; j < pathWidth; j++) {
              if (cx + i < width && cy + j < height) {
                maze[cx + i][cy + j] = 0;
              }
              if (mx + i < width && my + j < height) {
                maze[mx + i][my + j] = 0;
              }
              if (nx + i < width && ny + j < height) {
                maze[nx + i][ny + j] = 0;
              }
            }
          }
          stack.push([nx, ny]);
        }
      }
    }
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  maze[pathWidth][pathWidth] = 0;
  carve(pathWidth, pathWidth);

  const start = [pathWidth, pathWidth];
  const end = [width - pathWidth - 1, height - pathWidth - 1];

  return { maze, start, end };
}

module.exports = {
  generateMaze,
};