function generateMaze(width, height) {
    // Initialize the maze map
    let maze = Array.from({ length: width }, () => Array(height).fill(1));
  
    function carve(x, y) {
      const stack = [];
      stack.push([x, y]);
  
      while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        const directions = [
          [-2, 0], [2, 0], [0, -2], [0, 2]
        ];
  
        shuffle(directions);
  
        for (const [dx, dy] of directions) {
          const nx = cx + dx;
          const ny = cy + dy;
          const mx = cx + dx / 2;
          const my = cy + dy / 2;
  
          if (nx >= 0 && ny >= 0 && nx < width && ny < height && maze[nx][ny] === 1) {
            maze[nx][ny] = 0;
            maze[mx][my] = 0;
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
  
    maze[1][1] = 0;
    carve(1, 1);
  
    return maze;
  }
  
  module.exports = {
    generateMaze,
  };