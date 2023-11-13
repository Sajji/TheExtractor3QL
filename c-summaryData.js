const fs = require('fs');
const path = require('path');

const extractedDataPath = path.join(__dirname, 'extractedData');
const configPath = path.join(extractedDataPath, 'config.json');

const calculateTotal = (filename) => {
  const filePath = path.join(extractedDataPath, `${filename}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.length;
  }
  return 0;
};

const updateConfigWithSummary = () => {
  const summary = {
    domains: calculateTotal('domains'),
    assets: calculateTotal('assets'),
    attributes: calculateTotal('attributes'),
    relations: calculateTotal('relations'),
    tags: calculateTotal('tags')
  };

  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  config.summary = summary;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  console.log('Updated config.json with summary data.');
};

updateConfigWithSummary();
