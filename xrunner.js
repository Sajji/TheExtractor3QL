// const extractUniqueTypes = require('./getUniqueTypes');

// async function main() {
//     try {
//         console.log('Starting extraction...');
//         await extractUniqueTypes();
//         console.log('Extraction completed successfully.');
//     } catch (error) {
//         console.error('An error occurred:', error);
//     }
// }

// main();
const extractUniqueTypes = require('./a-getUniqueTypes');
const buildAssetTypesTree = require('./b-buildAssetTree');
async function main() {
    try{
        console.log('Starting extraction...');
        await extractUniqueTypes();
        console.log('Extraction completed successfully.');
        
        console.log('Starting tree build...');
        await buildAssetTypesTree();
        console.log('Tree build completed successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }   
}

main();