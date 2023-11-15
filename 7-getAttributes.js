const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');
const fsPromises = require('fs').promises;
const fsSync = require('fs');

// Let's keep a count of the total number of assets discovered and attributes, attributes, and tags.

let totalAssets = 0;
const uniqueAttributes = new Set();
const uniqueAttributeTypes = new Set();


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
        id
        stringAttributes(limit: 100) {
          id
          type {
            id
            name
          }
          stringValue
        }
        numericAttributes(limit: 100) {
          id
          type {
            id
            name
          }
          numericValue
        }
        multiValueAttributes(limit: 100) {
          id
          type {
            id
            name
          }
          stringValues
        }
        dateAttributes(limit: 100) {
          id
          type {
            id
            name
          }
          dateValue
        }
        booleanAttributes(limit: 100) {
          id
          type {
            id
            name
          }
          booleanValue
        }
  }}
  
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

        const processAttributes = (attributes, valueType) => {
          return attributes.map(attribute => {
            return {
              id: attribute.id,
              assetId: asset.id,
              typeId: attribute.type.id,
              name: attribute.type.name,
              [valueType]: attribute[valueType]
            };
          });
        };

        const attributes = [
          ...processAttributes(asset.stringAttributes, 'stringValue'),
          ...processAttributes(asset.numericAttributes, 'numericValue'),
          ...processAttributes(asset.multiValueAttributes, 'stringValues'),
          ...processAttributes(asset.dateAttributes, 'dateValue'),
          ...processAttributes(asset.booleanAttributes, 'booleanValue')
        ];

        const attributeType = attributes.map(attribute => ({
          typeId: attribute.typeId
        }));

        allData.push({
          attributes
          });

          attributes.forEach(rel => uniqueAttributes.add(JSON.stringify(rel)));
          attributeType.forEach(attributeType => uniqueAttributeTypes.add(JSON.stringify(attributeType)));
      });
    }
      }
      if (uniqueAttributes.size > 0) {
        const attributesDomainPath = path.join(baseDirectory, `attributes.json`);
        const allAttributesOutput = JSON.stringify([...uniqueAttributes].map(JSON.parse), null, 2);
        fsSync.writeFileSync(attributesDomainPath, allAttributesOutput);
        console.log(`Data saved to ${attributesDomainPath}. Total attributes: ${uniqueAttributes.size}`);
      }
      else {
        console.log(`No attributes found for any of the domains`);
      }

      const uniqueAttributeTypesPath = path.join(baseDirectory, 'uniqueAttributeTypes.json');
      const uniqueAttributeTypesOutput = JSON.stringify([...uniqueAttributeTypes].map(JSON.parse), null, 2);
      fsSync.writeFileSync(uniqueAttributeTypesPath, uniqueAttributeTypesOutput);

  } catch (error) {
    console.error(error);
  }
  console.log(`Total assets: ${totalAssets}`);
}

//module.exports = getGraphQLData;
getGraphQLData("extractedData");