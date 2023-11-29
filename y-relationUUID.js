const fs = require('fs');
const path = require('path');

// Read and parse the relations and asset mappings data
const relations = JSON.parse(fs.readFileSync(path.join(__dirname, 'extractedData', 'allRelations.json'), 'utf8'));
const assetMappings = JSON.parse(fs.readFileSync(path.join(__dirname, 'extractedData','assetMappings.json'), 'utf8'));

let updatedRelations = [];

for (let relation of relations) {
    // Find the correct asset mapping for sourceId
    let sourceMapping = assetMappings.find(mapping => mapping.oldId === relation.sourceId);

    // If a mapping was found, replace the relation's sourceId with the new UUID from the asset mappings
    if (sourceMapping) {
        relation.sourceId = sourceMapping.newId;
    }

    // Find the correct asset mapping for targetId
    let targetMapping = assetMappings.find(mapping => mapping.oldId === relation.targetId);

    // If a mapping was found, replace the relation's targetId with the new UUID from the asset mappings
    if (targetMapping) {
        relation.targetId = targetMapping.newId;
    }

    // Add the updated relation to the new array
    updatedRelations.push(relation);
}

// Write the updated relations data to allRelations.json
fs.writeFileSync(path.join(__dirname, 'extractedData', 'allRelations.json'), JSON.stringify(updatedRelations, null, 2), 'utf8');