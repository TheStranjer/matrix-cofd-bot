// requirements
const Matrix = require("matrix-bot-sdk");
const fs     = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const storage = new Matrix.SimpleFsStorageProvider(config.matrix.syncFile);
const client = new Matrix.MatrixClient(config.matrix.homeserverUrl, config.matrix.accessToken, storage);

Matrix.AutojoinRoomsMixin.setupOnClient(client);
