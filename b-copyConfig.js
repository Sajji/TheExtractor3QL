const fs = require('fs');
const path = require('path');


const copyConfigToExtractedData = () => {
    const configPath = path.join(__dirname, 'config.json');
    const extractedDataPath = path.join(__dirname, 'extractedData');
    const sourceConfigPath = configPath; // Assuming this is the correct path to the source config.json
    const destinationConfigPath = path.join(extractedDataPath, 'config.json');
  
    // Ensure the extractedData directory exists
    if (!fs.existsSync(extractedDataPath)) {
      fs.mkdirSync(extractedDataPath);
    }
  
    // Check if the source config.json exists before copying
    if (fs.existsSync(sourceConfigPath)) {
      // Copy the config.json file to the extractedData directory
      fs.copyFileSync(sourceConfigPath, destinationConfigPath);
      console.log(`config.json copied to ${destinationConfigPath}`);
    } else {
      console.error(`Source config.json not found at ${sourceConfigPath}`);
    }
  };
  
    copyConfigToExtractedData();