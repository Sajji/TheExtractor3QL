const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load the configuration
const configPath = './config.json'; // Adjust the path as needed
const outputFilePath = './extractedData/allRelations.json'; // Adjust the path as needed
const assetsFilePath = './extractedData/assets.json'; // Adjust the path as needed

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const assets = JSON.parse(fs.readFileSync(assetsFilePath, 'utf8'));

const fetchAllRelations = async () => {
    let allRelations = [];
    let offset = 0;
    const limit = 1000; // Adjust based on API limitations

    while (true) {
        const url = `${config.apiURL}/relations?offset=${offset}&limit=${limit}&countLimit=-1`;
        try {
            const response = await axios.get(url, {
                auth: {
                    username: config.username,
                    password: config.password,
                },
            });

            // Filter the results based on the source.id and target.id
            const filteredResults = response.data.results.filter(result => 
                assets.some(asset => asset.id === result.source.id) &&
                assets.some(asset => asset.id === result.target.id)
            );

            // Map the results to the desired format
            const mappedResults = filteredResults.map(result => ({
                sourceId: result.source.id,
                targetId: result.target.id,
                typeId: result.type.id
            }));

            allRelations = allRelations.concat(mappedResults);

            if (filteredResults.length < limit) {
                // Break the loop if there are no more results
                break;
            }

            offset += limit; // Increase offset for next page
        } catch (error) {
            console.error('Error fetching relations:', error.message);
            break; // Break on error
        }
    }

    // Write the collected data to a file
    fs.writeFileSync(outputFilePath, JSON.stringify(allRelations, null, 2), 'utf8');
    console.log(`All relations saved to ${outputFilePath}`);
};

fetchAllRelations();