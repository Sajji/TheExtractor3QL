const fs = require('fs');
const path = require('path');

// Read and parse the attributes and asset mappings data
const attributes = JSON.parse(fs.readFileSync(path.join(__dirname, 'extractedData', 'allAttributes.json'), 'utf8'));
const assetMappings = JSON.parse(fs.readFileSync(path.join(__dirname, 'extractedData','assetMappings.json'), 'utf8'));

let updatedAttributes = [];

for (let attribute of attributes) {
    // Find the correct asset mapping
    let assetMapping = assetMappings.find(mapping => mapping.oldId === attribute.assetId);

    // If a mapping was found, replace the attribute's assetId with the new UUID from the asset mappings
    if (assetMapping) {
        attribute.assetId = assetMapping.newId;
    }

    // Add the updated attribute to the new array
    updatedAttributes.push(attribute);
}

// Write the updated attribute data to allAttributes.json
fs.writeFileSync(path.join(__dirname, 'extractedData', 'allAttributes.json'), JSON.stringify(updatedAttributes, null, 2), 'utf8');