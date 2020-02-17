// requirements
const Matrix = require("matrix-bot-sdk");
const fs     = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const storage = new Matrix.SimpleFsStorageProvider(config.matrix.syncFile);
const client = new Matrix.MatrixClient(config.matrix.homeserverUrl, config.matrix.accessToken, storage);

Matrix.AutojoinRoomsMixin.setupOnClient(client);

client.on("room.message", handleCommand);

console.log("Client starting...");

client.start().then(async function () {
	console.log("Client started! Client user id: " + (await client.getUserId()));
});

async function shouldSkipEvent(ev) {
	if (!ev.content) {
		return true;
	}

	if (ev.content.msgtype !== "m.text") {
		return true;
	}

	if (ev.sender === await client.getUserId()) {
		return true;
	}

	return false;
}

async function handleCommand(roomId, ev) {
	if (await shouldSkipEvent(ev)) {
		return;
	}

	console.log(ev);
}
