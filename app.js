// load express
const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv')
const { BlobServiceClient } = require("@azure/storage-blob");
const storage = multer.memoryStorage();
dotenv.config();
const upload = multer({ 
    storage,
    limits: { fileSize : 10 * 1024 * 1024 * 1024 } // 10GB
}).single('file');
const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

async function uploadBlob(file) {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = 'test-blob' + new Date().getTime();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.uploadData(file.buffer, {
        onProgress: progress => console.log('bytes transfered', progress.loadedBytes)
    })
    console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId)
    return blockBlobClient.url
}

const app = express();
app.post('/file', async(req, res) => {
    upload(req, res, async(err) => {
     if(err) {
        console.error(err)
        res.status(400).send('Something went wrong!');
     }
     console.log('buffer (file) length', req.file.size)
     const response = await uploadBlob(req.file)
     res.send(response);
   });
 });
app.listen(4000, () => { 
    console.log('Started on port 4000');
});
