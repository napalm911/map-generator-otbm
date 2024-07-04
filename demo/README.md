# OTBM to JSON Converter

This project is designed to read OTBM (Open Tibia Binary Map) files and transform them into JSON using JavaScript. It provides various utilities and generators for handling different elements and structures within the map.

## Project Structure

```
/demo
  /src
    /constants
      border.js
      cave.js
      mountain.js
      non-walkable-tiles.js
      trees.js
      walkable-tiles.js
    /lib
      /generators
        forest.js
        forest-wide.js
        maze.js
        maze-wide.js
        mountain.js
        procedural-cave-gen.js
      /utils
        pathfinder.js
        header.js
        otbm2json.js
    demo.js
    reader.js
  /test
    /lib
      /generators
        forest.test.js
        forest-wide.test.js
        maze.test.js
        maze-wide.test.js
        mountain.test.js
        procedural-cave-gen.test.js
      /utils
        pathfinder.test.js
        header.test.js
        otbm2json.test.js
  README.md
  package.json
```

## Installation

1. Clone the repository:

   ```sh
   git clone <repository-url>
   cd project-root
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

## Usage

To run the entire map generation demo, use the following command:

```sh
node --max-old-space-size=8192 demo.js
```

### Scripts

- `demo.js`: Main entry point for running the demo.
- `reader.js`: Script for reading OTBM files.

### Constants

- `border.js`: Contains border tile constants.
- `cave.js`: Contains cave tile constants.
- `mountain.js`: Contains mountain tile constants.
- `non-walkable-tiles.js`: Contains non-walkable tile constants.
- `trees.js`: Contains tree tile constants.
- `walkable-tiles.js`: Contains walkable tile constants.

### Generators

- `forest.js`: Generates forest structures.
- `forest-wide.js`: Generates wide forest structures.
- `maze.js`: Generates maze structures.
- `maze-wide.js`: Generates wide maze structures.
- `mountain.js`: Generates mountain structures.
- `procedural-cave-gen.js`: Generates procedural cave structures.

### Utils

- `pathfinder.js`: Pathfinding utilities.
- `header.js`: Handles OTBM file headers.
- `otbm2json.js`: Converts OTBM files to JSON.

## Testing

To run tests, use the following command:

```sh
npm test
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss changes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
