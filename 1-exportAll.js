const createConfig = require('./1-getStarted');
const getCommunities = require('./2-getCommunities');
// Import other functions similarly...

async function runExportSequence() {
  try {
    console.log('Starting export sequence...');
    
    // Run each function in sequence
    console.log('Creating configuration...');
    await createConfig();
    
    //console.log('Getting communities...');
    //await getCommunities();
    
    // Call other functions in their respective order here...
    // await getDomains();
    // await getAssets();
    // ... and so on, for each of your functions

    console.log('Export sequence completed successfully.');
  } catch (error) {
    console.error('An error occurred during export:', error);
  }
}

runExportSequence();
