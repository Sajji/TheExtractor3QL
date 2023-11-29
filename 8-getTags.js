const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');

let totalAssets = 0;

async function fetchGraphQLData(domainId) {
  const endpoint = config.graphURL;
  const username = config.username;
  const password = config.password;

  const query = `
    query {
      assets(
        where: { domain: { id: { eq: "${domainId}" } } 
        tags: { all: { id: { null: false } } }
      }, limit: 1000) 
      {
          tags(limit: 50) {
            id
            name
        }
        id
    }
  }
  `;

  try {
    const response = await axios.post(endpoint, { query }, {
      auth: {
        username,
        password
      }
    });
    const responseData = response.data.data.assets;
    return responseData;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    return null;
  }
}

async function getGraphQLData(baseDirectory) {
  console.log(baseDirectory);

  try {
    const domainFilePath = path.join(baseDirectory, 'domains.json');
    console.log("Attempting to load JSON from:", domainFilePath);
    const rawData = await fs.readFile(domainFilePath, 'utf8');
    const domainList = JSON.parse(rawData);

    const allData = [];

    for (const domain of domainList) {
      console.log("Fetching data for domain:", domain.id);

      const responseData = await fetchGraphQLData(domain.id);
 
      responseData.forEach(asset => {
        totalAssets++;

        asset.tags.forEach(tag => {
          allData.push({
            id: tag.id,
            name: tag.name,
            assetId: asset.id
          });
        });
      });
    }
    const tagsDomainPath = path.join(baseDirectory, `tags.json`);
    const allTagsOutput = JSON.stringify(allData, null, 2);
    await fs.writeFile(tagsDomainPath, allTagsOutput);
    console.log(`Data saved to ${tagsDomainPath}. Total tags: ${allData.length}`);
  } catch (error) {
    console.error(error);
  }
  console.log(`Total assets: ${totalAssets}`);
}

getGraphQLData("extractedData");