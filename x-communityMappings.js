const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Read and parse the communities data
const data = JSON.parse(fs.readFileSync(path.join('extractedData', 'communities.json'), 'utf8'));

let updatedData = [];
let mappings = [];

for (let community of data) {
    // Generate a new UUID
    let newUuid = uuidv4();

    // Add the mapping from the old UUID to the new UUID
    mappings.push({ oldId: community.id, newId: newUuid });

    // Replace the community's id with the new UUID
    community.id = newUuid;

    // If the community has a parentId, replace it with the new UUID from the mappings
    if (community.parentId) {
        let mapping = mappings.find(mapping => mapping.oldId === community.parentId);
        if (mapping) {
            community.parentId = mapping.newId;
        }
    }

    // Add the updated community to the new array
    updatedData.push(community);
}

// Write the updated community data to communities.json
fs.writeFileSync(path.join('extractedData', 'communities.json'), JSON.stringify(updatedData, null, 2), 'utf8');

// Write the UUID mappings to communityMappings.json
fs.writeFileSync(path.join('extractedData', 'communityMappings.json'), JSON.stringify(mappings, null, 2), 'utf8');