const fs = require('fs').promises;
const path = require('path');

async function buildDomainTypesTree() {
    try {
        const backupDir = path.join(__dirname, '.', 'extractedData');
        const outputDir = path.join(__dirname, '.', 'extractedData');
        const allDomainTypesFile = path.join(outputDir, 'uniqueDomainTypes.json');
        const domainTypesFile = path.join(backupDir, 'domainTypes.json');
        const outputFile = path.join(outputDir, 'uniqueDomainTypesTree.json');

        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Read and parse input files
        const allDomainTypes = JSON.parse(await fs.readFile(allDomainTypesFile, 'utf8'));
        const domainTypes = JSON.parse(await fs.readFile(domainTypesFile, 'utf8'));

        // Create a map for quick lookup
        const domainTypesMap = new Map();
        domainTypes.forEach(type => domainTypesMap.set(type.id, type));

        // Function to recursively build tree
        function buildTree(node) {
            const parentNode = domainTypesMap.get(node.parentId);
            if (parentNode) {
                return {
                    ...node,
                    parent: buildTree(parentNode)
                };
            }
            return node;
        }

        // Find matching domains and build the tree
        const matchedTypes = allDomainTypes
            .map(type => domainTypesMap.get(type.typeId))
            .filter(type => type) // Remove undefined elements (non-matching)
            .map(buildTree);

        // Write the result to the output file
        await fs.writeFile(outputFile, JSON.stringify(matchedTypes, null, 2));

        console.log('Domain types tree has been generated.');

    } catch (error) {
        console.error('An error occurred during processing:', error.message);
    }
}

buildDomainTypesTree();
