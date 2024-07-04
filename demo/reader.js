const otbm2json = require("./lib/otbm2json");
const fs = require("fs");
const path = require("path");

// Function to get current timestamp in a specific format
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Function to read an OTBM file and write its JSON output
function readAndWriteOTBM(otbmFile) {
  try {
    // Read the OTBM file
    const mapData = otbm2json.read(otbmFile);

    // Get the base name of the OTBM file without extension
    const baseName = path.basename(otbmFile, path.extname(otbmFile));

    // Create the output file name with timestamp
    const timestamp = getTimestamp();
    const outputFileName = `${baseName}_${timestamp}.json`;

    // Write the JSON output to a file
    fs.writeFileSync(outputFileName, JSON.stringify(mapData, null, 2));
    console.log(`JSON output written to ${outputFileName}`);
  } catch (error) {
    console.error("An error occurred while reading the OTBM file:", error);
  }
}

// Example usage
const otbmFilePath = "mountain.otbm"; // Replace with your OTBM file path
readAndWriteOTBM(otbmFilePath);