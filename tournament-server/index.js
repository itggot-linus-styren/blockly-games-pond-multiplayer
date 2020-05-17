var fs = require('fs')
var FFA = require('FFA')
var express = require('express')
var bodyParser = require('body-parser')
var Filter = require('bad-words'),
    filter = new Filter()

var app = express()
var port = 3000;

var ipToPlayer = {}
var tournamentStarted = false;
var numParticipants = 0;
var ffa = null;

var currentMatchID = null;
var currentMatchNum = 0;
var currentPlayers = [];

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Handle CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, PATCH, GET, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, charset");
    next();
});

function playerInFile(playerTag) {
    var hasPlayer = false;
    var data = fs.readFileSync("player.txt", "utf8");

    if (data.split("\n").find(line => line.trim() === playerTag)) {
        hasPlayer = true;
    }

    return hasPlayer;
}

function advanceTournament() {
    for (const [iMatch, match] of ffa.matches.entries()) {
        if (ffa.isPlayable(match) && !match.m) {
            console.log("Playing match " + JSON.stringify(match));

            currentPlayers = []

            match.p.forEach((pId) => {
                var bot = fs.readFileSync("bots/" + pId + ".js", "utf8");
                var sourceLines = bot.split(/\r\n|\r|\n/);
                currentPlayers.push({
                    playerTag: sourceLines[0].split(":")[1],
                    pId: pId,
                    code: sourceLines.slice(1).join("\n")
                });
            })

            combinedCode = "";
            currentPlayers.forEach((player, order) => {
                combinedCode += "\n//player" + (order + 1) + ":" + player.playerTag + "\n" + player.code
            })

            fs.writeFileSync("tournament.js", combinedCode);

            currentMatchID = match.id;
            currentMatchNum = iMatch + 1;
            return;
        }
    }
}

function standingsFor(players, useIndex=false) {
    var fres = ffa.results();
    return players
        .sort(
            (a, b) => {
                var ares = fres.find((r) => r.seed == a.pId);
                var bres = fres.find((r) => r.seed == b.pId);

                if (ares.wins < bres.wins) return 1;
                if (ares.wins > bres.wins) return -1;
                return bres.pos - ares.pos;
            }
        )
        .map(
            (player, index) =>
            "[" +
            player.playerTag +
            "]: pos " +
            (useIndex ? (index + 1) : fres.find((result) => result.seed == player.pId).pos) +
            (useIndex ? ", wins " + fres.find((result) => result.seed == player.pId).wins : "")
        )
        .join("\n");
}

function finalStandings() {
    listOfPlayers = [];

    if (Object.keys(ipToPlayer) == numParticipants) {
        listOfPlayers = Object.values(ipToPlayer);
    } else { // parse from bots files
        for (var pId = 1; pId <= numParticipants; pId++) {
            var bot = fs.readFileSync("bots/" + pId + ".js", "utf8");
            var sourceLines = bot.split(/\r\n|\r|\n/);
            listOfPlayers.push({
                playerTag: sourceLines[0].split(":")[1],
                pId: pId,
                code: sourceLines.slice(1).join("\n")
            });
        }
    }

    return standingsFor(listOfPlayers, true);
}

app.post('/score', function (req, res) {
    if (process.env.NODE_ENV !== 'remote' && (req.headers['x-forwarded-for'] || !["::ffff:127.0.0.1", "::1"].includes(req.connection.remoteAddress))) {
        res.status(400).send('Sorry, you are not localhost.');
        return;
    }

    if (!tournamentStarted) {
        res.status(400).send('Tournament not started yet.');
        return;
    }

    if (!req.body || !req.body.score) {
        console.dir(req.body);
        res.status(400).send('Sorry, invalid format of payload.');
        return;
    }

    if (ffa.isDone()) {
        res.status(400).send('Tournament is over.');
        return;
    }

    /*
    {
        score: {
            'pelle': 8,
            'rudolf': 5,
            'marko': 4,
        }
    }*/
    var scoreMap = currentPlayers.map((player) => req.body.score[player.playerTag]); // [8, 4, 5]

    if (!ffa.score(currentMatchID, scoreMap)) {
        res.status(400).send('Unable to score: ' + scoreMap);
        return;
    }    

    if (ffa.isDone()) {
        console.log("Tournament is done");
        res.send("Final standings:\n" + finalStandings());
    } else {
        var standings = standingsFor(currentPlayers);
        console.log("[" + currentMatchNum + "/" + ffa.matches.length + "]: " + standings.replace(/\r\n|\r|\n/g, ', '));
        res.send("Scored match [" + currentMatchNum + "/" + ffa.matches.length + "] " + currentMatchID + ", results:\n" + standings);
        advanceTournament();
    }
});

app.get('/start', function (req, res) {
    if (process.env.NODE_ENV !== 'remote' && (req.headers['x-forwarded-for'] || !["::ffff:127.0.0.1", "::1"].includes(req.connection.remoteAddress))) {
        res.status(400).send('Sorry, you are not localhost.');
        return;
    }

    if (tournamentStarted) {
        res.status(400).send('Tournament already started. Restart script to reset.');
        return;
    }

    numParticipants = 9;//Object.keys(ipToPlayer).length;

    if (numParticipants < 9) {
        res.status(400).send('Too few participants (< 9).');
        return;
    }

    tournamentStarted = true;
    ffa = new FFA(numParticipants, { sizes: [4, 4, 4, 2], advancers: [2, 2, 2] });

    advanceTournament();

    console.log("starting tournament: " + numParticipants);
    res.send("Starting tournament now with " + numParticipants + " participants!");
});

app.post('/tournament', function (req, res) {
    // TODO check player is in file players.txt
    // sanity check code, no urls or anything malicious
    // send back verification to participant
    // create bots/<nextPlayerID>.js with heading //player:<gamerTag>

    //console.dir(req, { depth: 1 });

    if (tournamentStarted) {
        res.status(400).send('Sorry, tournament is on-going.');
        return;
    }

    var ip = /*'' + Math.floor(Math.random() * 10000000); */req.headers['x-forwarded-for'];

    if (!req.body || Object.keys(req.body).length > 1) {
        console.dir(req.body);
        res.status(400).send('Sorry, invalid format of payload.');
        return;
    }

    let playerTag = Object.keys(req.body)[0].trim();

    if (filter.isProfane(playerTag)) {
        console.log(playerTag);
        res.status(400).send("Sorry, let's keep this family friendly :)");
        return;
    }

    if (!playerInFile(playerTag)) {
        console.log("Not admitting " + playerTag);
        res.status(400).send("Sorry, couldn't find " + playerTag + " in list of applied participants :(");
        return;
    }

    if (!ipToPlayer[ip]) {
        if (Object.values(ipToPlayer).find((p) => p.playerTag == playerTag)) {
            console.warn("CATFISHING DETECTED!!: " + playerTag);
            res.status(400).send("Sorry, someone has already used this tag!");
            return;
        }

        ipToPlayer[ip] = {
            pId: Object.keys(ipToPlayer).length + 1,
            playerTag: playerTag
        }
    } else if (ipToPlayer[ip].playerTag != playerTag) {
        res.status(400).send("Sorry, only one bot per player!");
        return;
    }

    code = req.body[playerTag];
    code = filter.clean(code.replace(/\/\/player/g, '// Player'));

    fs.writeFileSync("bots/" + ipToPlayer[ip].pId + ".js", "//player:" + playerTag + "\n" + code);
    console.log("[" + ip + "] Updated participant " + playerTag + ", code length: " + code.trim().split(/\r\n|\r|\n/).length);
    res.send('Bot code for ' + playerTag + ' has been updated!');
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))