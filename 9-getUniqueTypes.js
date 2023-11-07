const fs = require('fs').promises;
const path = require('path');

async function extractUniqueTypes() {
    try {
        const backupDir = path.join(__dirname, '.', 'extractedData');
        const outputDir = path.join(__dirname, '.', 'extractedData');
        const outputFile = path.join(outputDir, 'allAssetTypes.json');

        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        // Read all files in the backup directory
        const files = (await fs.readdir(backupDir)).filter(file => file.startsWith('assets_'));

        const typeSet = new Set();

        for (const file of files) {
            const content = await fs.readFile(path.join(backupDir, file), 'utf8');
            const assets = JSON.parse(content);

            // Extract and store unique typeId and typeName
            assets.forEach(asset => {
                typeSet.add(JSON.stringify({ typeId: asset.typeId, typeName: asset.typeName }));
            });
        }

        // Convert the set back to an array of objects
        const uniqueTypes = Array.from(typeSet, item => JSON.parse(item));

        // Write the result to the output file
        await fs.writeFile(outputFile, JSON.stringify(uniqueTypes, null, 2));

        console.log('Extraction complete. Data saved.');

    } catch (error) {
        console.error('An error occurred during processing:', error.message);
    }
}

extractUniqueTypes();
