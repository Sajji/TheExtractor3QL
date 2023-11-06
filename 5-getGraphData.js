const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config.json');
const fsPromises = require('fs').promises;
const fsSync = require('fs');

// Let's keep a count of the total number of assets discovered and attributes, relations, and tags.

let totalAssets = 0;


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
      name: fullName
      displayName: displayName
      type {
        id
        name
      }
      domain {
        id
        name
        parent {
          id
          name
        }
      }
      stringAttributes(limit: 500) {
        id
        type {
          id
          name
        }
        stringValue
      }
      numericAttributes(limit: 500) {
        id
        type {
          id
          name
        }
        numericValue
      }
      multiValueAttributes(limit: 500) {
        id
        type {
          id
          name
        }
        stringValues
      }
      dateAttributes(limit: 500) {
        id
        type {
          id
          name
        }
        dateValue
      }
      booleanAttributes(limit: 500) {
        id
        type {
          id
          name
        }
        booleanValue
      }
  
      outgoingRelations(limit: 500) {
        id
        type {
          id
        }
        source {
          id
          fullName
        }
        target {
          id
          fullName
        }
      }
      incomingRelations(limit: 500) {
        id
        type {
          id
        }
        source {
          id
          fullName
        }
        target {
          id
          fullName
        }
      }
      tags(limit: 500) {
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
      // Initialize unique sets
      const uniqueAssets = new Set();
      const uniqueAttributes = new Set();
      const uniqueRelations = new Set();
      const uniqueTags = new Set();
      console.log("Fetching data for domain:", domain.id);


      let isLastPage = false;
      const limit = 10; // Set the limit of items per page
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
          domainName: asset.domain.name,
          typeId: asset.type.id,
          typeName: asset.type.name
        };


        const processAttributes = (attributes, valueType) => {
          return attributes.map(attribute => {
            return {
              assetId: asset.id,
              id: attribute.id,
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
  
        const relations = [
          ...asset.outgoingRelations,
          ...asset.incomingRelations,
        ].map(relation => ({
          relationId: relation.id,
          relationType: relation.type.id,
          sourceId: relation.source.id,
          sourceName: relation.source.fullName,
          targetId: relation.target.id,
          targetName: relation.target.fullName,
        }));
  
        allData.push({
          ...assetData,
          attributes,
          relations,
          tags: asset.tags,});

          uniqueAssets.add(JSON.stringify(assetData));
          attributes.forEach(attr => uniqueAttributes.add(JSON.stringify(attr)));
          relations.forEach(rel => uniqueRelations.add(JSON.stringify(rel)));
          asset.tags.forEach(tag => uniqueTags.add(JSON.stringify(tag)));
      
      });
    }
      if (uniqueAssets.size > 0) {
        const assetsDomainPath = path.join(baseDirectory, `assets_${domain.name}.json`);
        const allAssetsOutput = JSON.stringify([...uniqueAssets].map(JSON.parse), null, 2);
        fsSync.writeFileSync(assetsDomainPath, allAssetsOutput);
        console.log(`Assets saved: ${totalAssets}`);
      }
      else {
        console.log(`No assets found for ${domain.name}`);
      }

      if (uniqueAttributes.size > 0) {
        const attributesDomainPath = path.join(baseDirectory, `attributes_${domain.name}.json`);
        const allAttributesOutput = JSON.stringify([...uniqueAttributes].map(JSON.parse), null, 2);
        fsSync.writeFileSync(attributesDomainPath, allAttributesOutput);
        console.log(`Data saved to ${attributesDomainPath}. Total attributes: ${allAttributesOutput.length}`);
      }
      else {
        console.log(`No attributes found for ${domain.name}`);
      }

      if (uniqueRelations.size > 0) {
        const relationsDomainPath = path.join(baseDirectory, `relations_${domain.name}.json`);
        const allRelationsOutput = JSON.stringify([...uniqueRelations].map(JSON.parse), null, 2);
        fsSync.writeFileSync(relationsDomainPath, allRelationsOutput);
        console.log(`Data saved to ${relationsDomainPath}. Total relations: ${allRelationsOutput.length}`);
      }
      else {
        console.log(`No relations found for ${domain.name}`);
      }

      if (uniqueTags.size > 0) {
        const tagsDomainPath = path.join(baseDirectory, `tags_${domain.name}.json`);
        const allTagsOutput = JSON.stringify([...uniqueTags].map(JSON.parse), null, 2);
        fsSync.writeFileSync(tagsDomainPath, allTagsOutput);
        console.log(`Data saved to ${tagsDomainPath}. Total Tags: ${allTagsOutput.length}`);
      }
      else {
        console.log(`No tags found for ${domain.name}`);
      }
    }
  } catch (error) {
    console.error(error);
  }
  console.log(`Total assets: ${totalAssets}`);
}

//module.exports = getGraphQLData;
getGraphQLData("extractedData");