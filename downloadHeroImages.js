// apiDownloader.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ProgressBar from 'progress';

const apiUrl = 'https://mapi.mobilelegends.com/hero/list?language=en';


async function downloadImages(apiUrl) {
  try {
    const response = await axios.get(apiUrl);

    if (response.status !== 200) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = response.data;

    if (data.code !== 2000 || data.message !== 'SUCCESS') {
      throw new Error(`API response indicates failure: ${data.message}`);
    }

    const collections = data.data;

    if (!collections || collections.length === 0) {
      console.log('No collections found in the API response.');
      return;
    }

    collections.reverse();

    const outputFolder = 'images'; // Folder name
    createFolderIfNotExists(outputFolder);

    // Create a single progress bar for all images
    const totalImages = collections.reduce((total, collection) => total + (collection.key ? 1 : 0), 0);
    const progressBar = new ProgressBar('[:bar] :percent :etas => :name', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: totalImages,
    });

    // Download each image in each collection
    for (const collection of collections) {
      if (collection.key) {
        const imageUrl = `https:${collection.key}`; // Add "https:" prefix
        const imageFileName = `${collection.heroid}-${collection.name}.jpg`;
        const imagePath = path.join(outputFolder, imageFileName);

        try {
          await downloadImage(imageUrl, imagePath);
          progressBar.tick({
            name: imageFileName,
          }); // Increment the progress bar

        } catch (error) {
          console.error(`Error downloading image ${imageUrl}: ${error.message}`);
          progressBar.tick({
            name: imageFileName,
          }); // Increment the progress bar even if there's an error
        }
      }
    }
    
    console.log('\nImages downloaded successfully.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

function createFolderIfNotExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    axios({
      url,
      method: 'GET',
      responseType: 'stream',
    }).then(response => {
      response.data.on('data', chunk => {
        // Update the progress bar dynamically
        writer.write(chunk);
      });

      response.data.on('end', () => {
        writer.end();
        resolve();
      });

      response.data.on('error', error => {
        writer.end();
        reject(error);
      });
    });
  });
}

downloadImages(apiUrl);
