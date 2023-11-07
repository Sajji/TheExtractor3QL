const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');
const fsPromises = require('fs').promises;
const fsSync = require('fs');

// Let's keep a count of the total number of assets discovered and attributes, relations, and tags.

let totalAssets = 0;
const uniqueRelations = new Set();
const uniqueRelationTypes = new Set();


async function fetchGraphQLData(domainId, limit, offset) {
  const endpoint = config.graphURL;
  const username = config.username;
  const password = config.password;

  const query = `
  query {
    assets(
      where: { domain: { id: { eq: "${domainId}" } } }
      limit: ${limit},
      offset: ${offset}
      ) {
        outgoingRelations(limit: 200, offset: 0) {
          id
          type {
              id
          }
          source {
              id
          }
          target {
              id
          }
      }
      incomingRelations(limit: 200, offset: 0) {
          id
          type {
              id
          }
          source {
              id
          }
          target {
              id
          }
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
      const limit = 50; // Set the limit of items per page
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
        const relations = [
          ...asset.outgoingRelations,
          ...asset.incomingRelations,
        ].map(relation => ({
          id: relation.id,
          typeId: relation.type.id,
          sourceId: relation.source.id,
          targetId: relation.target.id,
        }));

        const relationTypes = [
          ...asset.outgoingRelations,
          ...asset.incomingRelations,
        ].map(relation => ({
          typeId: relation.type.id,
        }));
        allData.push({
          relations,
          });

          relations.forEach(rel => uniqueRelations.add(JSON.stringify(rel)));
          relationTypes.forEach(relationTypes => uniqueRelationTypes.add(JSON.stringify(relationTypes)));
      });
    }
      }
      if (uniqueRelations.size > 0) {
        const relationsDomainPath = path.join(baseDirectory, `relations.json`);
        const allRelationsOutput = JSON.stringify([...uniqueRelations].map(JSON.parse), null, 2);
        fsSync.writeFileSync(relationsDomainPath, allRelationsOutput);
        console.log(`Data saved to ${relationsDomainPath}. Total relations: ${uniqueRelations.size}`);
      }
      else {
        console.log(`No relations found for any of the domains`);
      }
      const uniqueRelationTypesPath = path.join(baseDirectory, 'uniqueRelationTypes.json');
      const uniqueRelationTypesOutput = JSON.stringify([...uniqueRelationTypes].map(JSON.parse), null, 2);
      fsSync.writeFileSync(uniqueRelationTypesPath, uniqueRelationTypesOutput);
  } catch (error) {
    console.error(error);
  }
  console.log(`Total assets: ${totalAssets}`);
}

//module.exports = getGraphQLData;
getGraphQLData("extractedData");