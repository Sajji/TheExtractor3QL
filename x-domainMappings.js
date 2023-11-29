const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Read and parse the domains and community mappings data
const domains = JSON.parse(fs.readFileSync(path.join('extractedData', 'domains.json'), 'utf8'));
const communityMappings = JSON.parse(fs.readFileSync(path.join('extractedData', 'communityMappings.json'), 'utf8'));

let updatedDomains = [];
let domainMappings = [];

for (let domain of domains) {
    // Generate a new UUID
    let newUuid = uuidv4();

    // Add the mapping from the old UUID to the new UUID
    domainMappings.push({ oldId: domain.id, newId: newUuid });

    // Replace the domain's id with the new UUID
    domain.id = newUuid;

    // Replace the domain's communityId with the new UUID from the community mappings
    let mapping = communityMappings.find(mapping => mapping.oldId === domain.communityId);
    if (mapping) {
        domain.communityId = mapping.newId;
    }

    // Add the updated domain to the new array
    updatedDomains.push(domain);
}

// Write the updated domain data to domains.json
fs.writeFileSync(path.join('extractedData', 'domains.json'), JSON.stringify(updatedDomains, null, 2), 'utf8');

// Write the UUID mappings to domainMappings.json
fs.writeFileSync(path.join('extractedData', 'domainMappings.json'), JSON.stringify(domainMappings, null, 2), 'utf8');