var fs = require('fs')
var FFA = require('ffa')
var express = require('express')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var Filter = require('bad-words'),
  filter = new Filter()

var app = express()
var port = 3000;

var playerList = [];
var tournamentStarted = false;
var numParticipants = 0;
var ffa = null;

var currentMatchID = null;
var currentMatchNum = 0;
var currentPlayers = [];

var masterUserCookie = "";
var localMode = false;

app.use(cookieParser())

// set a cookie
app.use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.cookieName;
  if (cookie === undefined) {
    // no: set a new cookie
    var randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);
    res.cookie('cookieName', randomNumber, { maxAge: 900000, httpOnly: true });
    console.log('cookie created successfully');
  } else {
    // yes, cookie was already present
    //console.log('cookie exists', cookie);
  }
  next(); // <-- important!
});

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Handle CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, PATCH, GET, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, charset");
  next();
});

function restart() {
  playerList = [];
  tournamentStarted = false;
  numParticipants = 0;
  ffa = null;

  currentMatchID = null;
  currentMatchNum = 0;
  currentPlayers = [];

  masterUserCookie = "";

  if (!fs.existsSync("bots/")) {
    fs.mkdirSync("bots/");
  }

  let files = fs.readdirSync('bots/');
  files = files.filter((f) => f.includes(".js"));

  for (const fName of files) {
    let pId = fName.split('.')[0]
    var bot = fs.readFileSync("bots/" + fName, "utf8");
    var sourceLines = bot.split(/\r\n|\r|\n/);
    playerList.push({
      playerTag: sourceLines[0].split(":")[1],
      pId: pId,
      code: sourceLines.slice(1).join("\n")
    });
  }
}

function playerInFile(playerTag) {
  var hasPlayer = false;
  var data = fs.readFileSync("player.txt", "utf8");

  if (data.split("\n").find(line => line.trim() === playerTag)) {
    hasPlayer = true;
  }

  return true//hasPlayer;
}

function advanceTournament() {
  for (const [iMatch, match] of ffa.matches.entries()) {
    if (ffa.isPlayable(match) && !match.m) {
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

      console.log("Playing match " + JSON.stringify(match) + " players:\n" + currentPlayers.reduce((str, p, index) => `${str}\tp${index + 1}: ${p.playerTag}${index < currentPlayers.length - 1 ? "\n" : ""}`, ""));

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

function finalStandings(players, useIndex = false) {
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

app.post('/score', function (req, res) {
  if (localMode && (req.headers['x-forwarded-for'] || !["::ffff:127.0.0.1", "::1"].includes(req.connection.remoteAddress))) {
    res.status(400).send('Sorry, you are not localhost.');
    return;
  }

  console.log(req.cookies.cookieName);
  console.log(masterUserCookie);
  console.log(masterUserCookie == req.cookies.cookieName);

  if (!localMode && masterUserCookie != req.cookies.cookieName) {
    res.status(400).send('Sorry, you are not master user.');
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
    console.log("Tournament is done. Winner: " + playerList.find((p) => ffa.results()[0].seed).playerTag);
    res.send("Final standings:\n" + finalStandings(playerList, true) + "\nGoto https://pond-te4.duckdns.org/reset to reset participants.");

    restart();
  } else {
    console.log("Leader: " + playerList.find((p) => ffa.results()[0].seed).playerTag);
    var standings = finalStandings(currentPlayers);
    console.log("[" + currentMatchNum + "/" + ffa.matches.length + "]: " + standings.replace(/\r\n|\r|\n/g, ', '));
    res.send("Scored match [" + currentMatchNum + "/" + ffa.matches.length + "] " + currentMatchID + ", results:\n" + Object.entries(req.body.score).sort(([_na, scoreA], [_nb, scoreB]) => scoreB - scoreA).map(([name, score]) => name + ": " + score).join("\n"));
    advanceTournament();
  }
});

app.use('/', express.static('..'))

app.get('/reset', function (req, res) {
  if (localMode && (req.headers['x-forwarded-for'] || !["::ffff:127.0.0.1", "::1"].includes(req.connection.remoteAddress))) {
    res.status(400).send('Sorry, you are not localhost.');
    return;
  }

  if (!localMode && tournamentStarted && masterUserCookie != req.cookies.cookieName) {
    res.status(400).send('Sorry, you are not master user.');
    return;
  }

  fs.rmdirSync("bots/", { recursive: true });
  restart();
  res.send("game has been reset\n")
});

app.get('/locklocal', function (req, res) {
  if (process.env.NODE_ENV !== 'remote' && (req.headers['x-forwarded-for'] || !["::ffff:127.0.0.1", "::1"].includes(req.connection.remoteAddress))) {
    res.status(400).send('Sorry, you are not localhost.');
    return;
  }

  localMode = true;
  res.send("localMode = true\n");
});

app.get('/unlocklocal', function (req, res) {
  if (process.env.NODE_ENV !== 'remote' && (req.headers['x-forwarded-for'] || !["::ffff:127.0.0.1", "::1"].includes(req.connection.remoteAddress))) {
    res.status(400).send('Sorry, you are not localhost.');
    return;
  }

  localMode = false;
  res.send("localMode = false\n");
});

app.get('/start', function (req, res) {
  if (localMode && (req.headers['x-forwarded-for'] || !["::ffff:127.0.0.1", "::1"].includes(req.connection.remoteAddress))) {
    res.status(400).send('Sorry, you are not localhost.');
    return;
  }

  if (!localMode && !req.cookies.cookieName) {
    res.status(400).send('Sorry, cookies must be enabled.');
    return;
  }

  masterUserCookie = req.cookies.cookieName;

  console.log(req.cookies.cookieName);
  console.log(masterUserCookie);
  console.log(masterUserCookie == req.cookies.cookieName);

  if (tournamentStarted) {
    res.status(400).send('Tournament already started. Wait 1 hour to reset or restart script.');
    return;
  }

  numParticipants = playerList.length;

  if (numParticipants < 9) {
    res.status(400).send('Too few participants (< 9).');
    return;
  }

  setTimeout(() => {
    if (tournamentStarted) {
      restart();
    }

    localMode = false;
  }, 1000 * 60 * 60);

  tournamentStarted = true;
  ffa = new FFA(numParticipants, { sizes: [4, 4, 4, 2], advancers: [2, 2, 2] });

  advanceTournament();

  console.log("starting tournament with num players: " + numParticipants);
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

  let player = playerList.find((p) => p.playerTag == playerTag)
  if (player) {
    console.log("Updating existing bot [" + player.pId + "]: " + player.playerTag)
  } else {
    if (!playerInFile(playerTag)) {
      console.log("Not admitting " + playerTag);
      res.status(400).send("Sorry, couldn't find " + playerTag + " in list of applied participants :(");
      return;
    }

    code = req.body[playerTag];
    code = filter.clean(code.replace(/\/\/player/g, '// Player'));

    player = {
      pId: playerList.length + 1,
      playerTag,
      code
    }

    playerList.push(player)
  }

  code = req.body[playerTag];
  code = filter.clean(code.replace(/\/\/player/g, '// Player'));

  fs.writeFileSync("bots/" + player.pId + ".js", "//player:" + playerTag + "\n" + code);
  console.log("[" + req.headers['x-forwarded-for'] + "] Updated participant " + playerTag + ", code length: " + code.trim().split(/\r\n|\r|\n/).length);
  res.send('Bot code for ' + playerTag + ' has been updated!');
})

restart();
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
