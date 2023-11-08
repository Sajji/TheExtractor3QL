const fs = require('fs').promises;
const path = require('path');

async function buildAssetTypesTree() {
    try {
        const backupDir = path.join(__dirname, '.', 'extractedData');
        const outputDir = path.join(__dirname, '.', 'extractedData');
        const allAssetTypesFile = path.join(outputDir, 'uniqueAssetTypes.json');
        const assetTypesFile = path.join(backupDir, 'assetTypes.json');
        const outputFile = path.join(outputDir, 'uniqueAssetTypesTree.json');

        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Read and parse input files
        const allAssetTypes = JSON.parse(await fs.readFile(allAssetTypesFile, 'utf8'));
        const assetTypes = JSON.parse(await fs.readFile(assetTypesFile, 'utf8'));

        // Create a map for quick lookup
        const assetTypesMap = new Map();
        assetTypes.forEach(type => assetTypesMap.set(type.id, type));

        // Function to recursively build tree
        function buildTree(node) {
            const parentNode = assetTypesMap.get(node.parentId);
            if (parentNode) {
                return {
                    ...node,
                    parent: buildTree(parentNode)
                };
            }
            return node;
        }

        // Find matching assets and build the tree
        const matchedTypes = allAssetTypes
            .map(type => assetTypesMap.get(type.typeId))
            .filter(type => type) // Remove undefined elements (non-matching)
            .map(buildTree);

        // Write the result to the output file
        await fs.writeFile(outputFile, JSON.stringify(matchedTypes, null, 2));

        console.log('Asset types tree has been generated.');

    } catch (error) {
        console.error('An error occurred during processing:', error.message);
    }
}

buildAssetTypesTree();
