const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');
const fsPromises = require('fs').promises;
const fsSync = require('fs');

// Let's keep a count of the total number of assets discovered and attributes, relations, and tags.

let totalAssets = 0;
const uniqueAssetTypes = new Set();
const uniqueAssets = new Set();


async function fetchGraphQLData(domainId, limit, offset) {
  const endpoint = config.graphURL;
  const username = config.username;
  const password = config.password;

  const query = `
  query {
    assets(
      where: { domain: { 
        id: { eq: "${domainId}" } 
          }
        }
      limit: ${limit},
      offset: ${offset}
    ) {
      id
      name: fullName
      displayName: displayName
      type {
        id
      }
      domain {
        id
      }
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
    const rawData = await fsPromises.readFile(domainFilePath, 'utf8');
    const domainList = JSON.parse(rawData);

    for (const domain of domainList) {
      const allData = [];

      console.log("Fetching data for domain:", domain.id);

      let isLastPage = false;
      const limit = 1000; // Set the limit of items per page
      let offset = 0; // Start at the beginning

    while (!isLastPage) {
      const responseData = await fetchGraphQLData(domain.id, limit, offset);
      
      // If there's no data or the data array is smaller than the limit, we are on the last page
      if (!responseData || responseData.length < limit) {
        isLastPage = true;
      } else {
        // If we receive the full limit of items, increment the offset for the next page
        offset += limit;
        console.log(`Fetched ${offset} assets`)
      }

      // Process the response data as before
      if (!responseData) {
        continue;
      }

      responseData.forEach(asset => {
        totalAssets++;
        const assetData = {
          id: asset.id,
          name: asset.name,
          displayName: asset.displayName,
          domainId: asset.domain.id,
          typeId: asset.type.id,
        };

        const assetType = {
          typeId: asset.type.id
        }
  
        allData.push({
          ...assetData,
          });

          uniqueAssets.add(JSON.stringify(assetData));
          uniqueAssetTypes.add(JSON.stringify(assetType));
      
      });
    }


      }
      if (uniqueAssets.size > 0) {
        const assetsDomainPath = path.join(baseDirectory, `assets.json`);
        const allAssetsOutput = JSON.stringify([...uniqueAssets].map(JSON.parse), null, 2);
        fsSync.writeFileSync(assetsDomainPath, allAssetsOutput);
        console.log(`Assets saved: ${totalAssets}`);
      }
      else {
        console.log(`No assets found for any of the domains`);
      }
    const uniqueAssetTypesPath = path.join(baseDirectory, 'uniqueAssetTypes.json');
    const uniqueAssetTypesOutput = JSON.stringify([...uniqueAssetTypes].map(JSON.parse), null, 2);
    fsSync.writeFileSync(uniqueAssetTypesPath, uniqueAssetTypesOutput);
  } catch (error) {
    console.error(error);
  }
  console.log(`Total assets: ${totalAssets}`);
}

//module.exports = getGraphQLData;
getGraphQLData("extractedData");