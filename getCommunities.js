const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const fetchCommunities = async (communityName) => {
    const query = {
      query: `
        query Communities {
          communities(where: { name: { contains: "${communityName}" } }) {
            id
            name
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
  
      return response.data.data.communities;
    } catch (error) {
      console.error('Error fetching communities:', error.message);
      return null;
    }
  };
  

const selectCommunity = async (communities) => {
  console.log('Please select a community by entering the corresponding number:');
  communities.forEach((community, index) => {
    console.log(`${index + 1}: ${community.name}`);
  });

  const index = parseInt(await question('Enter your choice: '), 10) - 1;
  if (index >= 0 && index < communities.length) {
    return communities[index];
  } else {
    console.log('Invalid selection. Please try again.');
    return await selectCommunity(communities);
  }
};

const start = async () => {
  const communityName = await question('Enter the name of the community to search for: ');
  const communities = await fetchCommunities(communityName);

  if (communities && communities.length > 0) {
    const selectedCommunity = await selectCommunity(communities);
    console.log(`You have selected: ${selectedCommunity.name}`);

    // Save the selected community to a file or variable as needed.
    // This example just logs it to the console.
    console.log('Selected community details:', selectedCommunity);

    // Here you could write the selectedCommunity to a file or handle it as needed for your application.

  } else {
    console.log('No communities found with that name.');
  }

  rl.close();
};

start();
