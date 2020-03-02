// library calls
const Matrix    = require("matrix-bot-sdk");
const fs        = require('fs');
const RandomOrg = require('random-org');

// setup
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const storage = new Matrix.SimpleFsStorageProvider(config.matrix.syncFile);
const client = new Matrix.MatrixClient(config.matrix.homeserverUrl, config.matrix.accessToken, storage);

// constant variables for later use
const CMDARY_REGEX = 0x00;
const CMDARY_FUNC  = 0x01;

var random = new RandomOrg({ apiKey: config.random.token, endpoint: 'https://api.random.org/json-rpc/2/invoke' });

var d10s = JSON.parse(fs.readFileSync('./rand.json'));

d10RefillCheck();

function d10() {
        ret = d10s.pop();
	d10RefillCheck();
        if (typeof(ret) == 'undefined') {
		return Math.ceil(Math.random() * 10);
        } else {
                return ret;
	}
}

function d10RefillCheck() {
	if (d10s.length < config.random.minimumCache) {
		console.log(`d10s have ${d10s.length} left. Refilling...`);
		random.generateIntegers({ min: 1, max: 10, n: config.random.minimumCache })
		.then(function (result) {
			d10s = d10s.concat(result.random.data);
			console.log(`d10s now at ${d10s.length}.`);
			fs.writeFile("./rand.json", JSON.stringify(d10s), (err) => {
				if (err) {
					console.error(err);
					return;
				}

				console.log("File has been saved");
			});
		});
	}
}


function rollDice(pool, again, rote_action, ones_botch) {
	var ret = {
		"successes" : 0,
		"botches"   : 0,
		"rerolls"   : 0,
		"results"   : [],
		"notes"     : []
	}

	if (pool == 0) {
		ret.notes.push("Chance Die");

		do {
			var die =  d10();
			ret.results.push(die);
			if (die == 10) {
				ret.rerolls++;
				ret.successes++;
			}
		} while (die == 10);

		return ret;
	}

	if (rote_action) {
		ret.notes.push("Rote Action");
	}

	if (ones_botch) {
		ret.notes.push("1s Botch");
	}

	if (again > 10) {
		ret.notes.push("No Rerolls");
	} else if (again < 10) {
		ret.notes.push(again + "-again");
	}

	for (i = 0; i < pool; i++) {
		var free_rerolls = rote_action ? 1 : 0; // this will start out false if there is no rote action
		do {
			var die = d10();

			ret.results.push(die);

			if (die >= 8) {
				ret.successes++;
			}

			if (ones_botch && die == 1) {
				ret.botches++;
				ret.successes--;
			}

			if (die >= again) {
				ret.rerolls++;
			}
		} while (free_rerolls-- > 0 || die >= again);
	}


	return ret;
}

async function processCmd_cofd(roomId, ev, match) {
	// set up defaults for dice roll function call
	var again       = 10;
	var rote_action = false;
	var ones_botch  = false;
	var dice_pool   = parseInt(match[1]);
	if (dice_pool > 50) {
		dice_pool = 50;
	}
	if (match.length > 2) {
		for (i = 0; i < match[2].length; i++) {
			switch (match[2][i]) {
				case "8":
					again = 8;
					break;
				case "9":
					again = 9;
					break;
				case "n":
					again = 11;
					break;
				case "b":
					ones_botch = true;
					break;
				case "r":
					rote_action = true;
					break;
			}
		}
	}

	var roll_results = rollDice(dice_pool, again, rote_action, ones_botch);

	var textReply = "Rolling " + dice_pool + (roll_results.notes.length > 0 ? " (" + roll_results.notes.join(", ") + ")" : "") + ".\nSuccesses: " + roll_results.successes + "\nIndividual Results: " + roll_results.results.join(", ");

	var htmlReply = "<B>Rolling:</B> " + dice_pool + (roll_results.notes.length > 0 ? " (" + roll_results.notes.join(", ") + ")" : "") + "<BR /><B>Success:</B> ";
	
	if (roll_results.successes > 0) {
		htmlReply += "<FONT COLOR=green>" + roll_results.successes + " successes!</FONT>";
	} else {
		htmlReply += "<FONT COLOR=red>Failure</FONT>";
	}

	htmlReply += "<BR/><B>Individual Results:</B> ";

	var htmlResults = []
	
	for (i = 0; i < roll_results.results.length; i++) {
		if (roll_results.results[i] >= 8) {
			htmlResults.push("<FONT COLOR=green>" + roll_results.results[i] + "</FONT>");
		} else if (ones_botch && roll_results.results[i] == 1) {
			htmlResults.push("<FONT COLOR=red>" + roll_results.results[i] + "</FONT>");
		} else {
			htmlResults.push(roll_results.results[i])
		}
	}

	htmlReply += htmlResults.join(", ");

	var reply = Matrix.RichReply.createFor(roomId, ev, textReply, htmlReply);
	reply["msgtype"] = "m.notice";
	client.sendMessage(roomId, reply);
}

const commands = [
	[/^!cofd (\d+)$/i,        processCmd_cofd],
	[/^!cofd (\d+) (\w+)$/i,  processCmd_cofd]
];

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

	for (i = 0; i < commands.length; i++) {
		var regex = commands[i][CMDARY_REGEX];
		var func  = commands[i][CMDARY_FUNC];
		var result = regex.exec(ev.content.body);

		if (result != null) {
			func(roomId, ev, result);
			break;
		}
	}
}
