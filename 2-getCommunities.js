const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let allCommunities = [];

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
  
//console.log(JSON.stringify(response.data, null, 2)); // Log the full response data

const childCommunities = response.data.data?.communities;
if (!childCommunities) {
  throw new Error('No child communities data returned by the server.');
}
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

// Recursive function to fetch all child communities of a given community ID
const fetchChildCommunities = async (parentId) => {
  const query = {
    query: `
      query ChildCommunities {
        communities(where: { parent: { id: { eq: "${parentId}" } } }) {
          id
          name
          description
          parent {
            id
        }
        }
      }
    `
  };
  

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

    const childCommunities = response.data.data.communities;

    for (const child of childCommunities) {
      const children = {
        id: child.id,
        name: child.name,
        description: child?.description,
        parentId: child.parent.id
      }
      console.log(JSON.stringify(children, null, 2));
      allCommunities.push(children);
      // Fetch the children of this child recursively
      await fetchChildCommunities(child.id);
    }
  } catch (error) {
    console.error('Error fetching child communities:', error.message);
  }
};

// Start function
const getCommunities = async () => {
  const communityName = await question('Enter the name of the community to search for: ');
  const communities = await fetchCommunities(communityName);

  if (communities && communities.length > 0) {
    const selectedCommunity = await selectCommunity(communities);
    const selectedCommunityObject = {
      id: selectedCommunity.id,
      name: selectedCommunity.name
    }
    console.log(`You have selected: ${selectedCommunity.name}`);
    console.log('Fetching child communities...');
    allCommunities.push(selectedCommunityObject);
    await fetchChildCommunities(selectedCommunity.id);
    console.log(allCommunities)
    saveCommunitiesToFile(allCommunities, 'extractedData', 'communities.json');
    
  } else {
    console.log('No communities found with that name.');
  }

  rl.close();
};

// New function to save the data
const saveCommunitiesToFile = (data, folderName, fileName) => {
  const dirPath = path.join(__dirname, folderName);

  // Check if the directory exists
  if (!fs.existsSync(dirPath)) {
    // Create the directory if it does not exist
    fs.mkdirSync(dirPath);
  } else {
    // If the directory exists, clear its contents
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      fs.unlinkSync(curPath); // Delete file
    });
  }

  // Write the communities data to a file in the directory
  const filePath = path.join(dirPath, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Data saved to ${filePath}`);
};

getCommunities();