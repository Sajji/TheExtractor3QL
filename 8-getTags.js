const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');
const fsPromises = require('fs').promises;
const fsSync = require('fs');

// Let's keep a count of the total number of assets discovered and tags, tags, and tags.

let totalAssets = 0;
const uniqueTags = new Set();

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
        tags(limit: 50) {
          id
          name
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

        allData.push({
          tags: asset.tags
          });

          asset.tags.forEach(tag => uniqueTags.add(JSON.stringify(tag)));
      });
    }
      }
      if (uniqueTags.size > 0) {
        const tagsDomainPath = path.join(baseDirectory, `tags.json`);
        const allTagsOutput = JSON.stringify([...uniqueTags].map(JSON.parse), null, 2);
        fsSync.writeFileSync(tagsDomainPath, allTagsOutput);
        console.log(`Data saved to ${tagsDomainPath}. Total tags: ${uniqueTags.size}`);
      }
      else {
        console.log(`No tags found for for any of the domains`);
      }

  } catch (error) {
    console.error(error);
  }
  console.log(`Total assets: ${totalAssets}`);
}

//module.exports = getGraphQLData;
getGraphQLData("extractedData");