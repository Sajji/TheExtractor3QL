const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Read and parse the assets and domain mappings data
const assets = JSON.parse(fs.readFileSync(path.join(__dirname, 'extractedData', 'assets.json'), 'utf8'));
const domainMappings = JSON.parse(fs.readFileSync(path.join(__dirname, 'extractedData','domainMappings.json'), 'utf8'));

let updatedAssets = [];
let assetMappings = [];

for (let asset of assets) {
    // Generate a new UUID
    let newUuid = uuidv4();

    // Add the mapping from the old UUID to the new UUID
    assetMappings.push({ oldId: asset.id, newId: newUuid });

    // Replace the asset's id with the new UUID
    asset.id = newUuid;

    // Find the correct domain mapping
    let domainMapping = domainMappings.find(mapping => mapping.oldId === asset.domainId);

    // If a mapping was found, replace the asset's domainId with the new UUID from the domain mappings
    if (domainMapping) {
        asset.domainId = domainMapping.newId;
    }

    // Add the updated asset to the new array
    updatedAssets.push(asset);
}

// Write the updated asset data to assets.json
fs.writeFileSync(path.join(__dirname, 'extractedData', 'assets.json'), JSON.stringify(updatedAssets, null, 2), 'utf8');

// Write the UUID mappings to assetMappings.json
fs.writeFileSync(path.join(__dirname, 'extractedData','assetMappings.json'), JSON.stringify(assetMappings, null, 2), 'utf8');