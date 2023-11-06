const axios = require('axios');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const communitiesPath = path.join(__dirname, 'extractedData', 'communities.json');
const domainsPath = path.join(__dirname, 'extractedData', 'domains.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const communities = JSON.parse(fs.readFileSync(communitiesPath, 'utf8'));

// Helper function to perform GraphQL query for domains
const fetchDomains = async (id) => {
  const query = {
    query: `
      query Domains {
        domains(where: { parent: { id: { eq: "${id}" } } }) {
          id
          name
          description
          parent {
            communityId: id
          }
        }
      }
    `
  };

  // Encode username and password for basic authentication
  const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');

  try {
    const response = await axios({
      url: config.graphURL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      data: JSON.stringify(query),
    });

    return response.data.data.domains.map(domain => ({
      id: domain.id,
      name: domain.name,
      description: domain.description,
      communityId: domain.parent.communityId
    }));
  } catch (error) {
    console.error(`Error fetching domains for community ${id}:`, error.message);
    return [];
  }
};

// Main function to process all communities and save domains
const processCommunities = async () => {
  let allDomains = [];

  for (const community of communities) {
    const domains = await fetchDomains(community.id);
    allDomains = allDomains.concat(domains);
  }

  // Write the domains data to a file
  fs.writeFileSync(domainsPath, JSON.stringify(allDomains, null, 2), 'utf8');
  console.log(`Domains data saved to ${domainsPath}`);
};

processCommunities();
