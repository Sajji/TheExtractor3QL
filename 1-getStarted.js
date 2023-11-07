const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const testConnectivity = async (domain, username, password) => {
  try {
    const response = await axios.post(`https://${domain}/rest/2.0/auth/sessions`, { username, password });
    if (response.status === 200) {
      console.log('Authentication successful.');
      return true;
    }
  } catch (error) {
    console.error('Authentication failed:', error.message);
  }
  return false;
};

const createConfig = async () => {
  try {
    if (fs.existsSync(configPath)) {
      const useExisting = await question('config.json already exists. Do you want to use it? (yes/no) ');
      if (useExisting.toLowerCase() === 'yes') {
        rl.close();
        return;
      }
    }

    const domain = await question('What is the domain name? ');

    let username, password, authenticated = false;

    while (!authenticated) {
      username = await question('Username: ');
      password = await question('Password: ', { hideEchoBack: true }); // Note: 'hideEchoBack' is not supported by `readline` and requires a custom solution or additional package

      authenticated = await testConnectivity(domain, username, password);
      if (!authenticated) {
        console.log('Please enter your credentials again.');
      }
    }

    const config = {
      domain,
      apiURL: `https://${domain}/rest/2.0`,
      graphURL: `https://${domain}/graphql/knowledgeGraph/v1`,
      username,
      password
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('config.json has been created.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
};

module.exports = createConfig;
createConfig();