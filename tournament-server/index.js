var fs = require('fs')
var express = require('express')
var bodyParser = require('body-parser')
var Filter = require('bad-words'),
    filter = new Filter()

var app = express()
var port = 3000;

ipToPlayer = {}

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

    if(data.split("\n").find(line => line.trim() === playerTag)){
        hasPlayer = true;
    }

    return hasPlayer;
}

// POST /login gets urlencoded bodies
app.post('/tournament', function (req, res) {
    // TODO check player is in file players.txt
    // sanity check code, no urls or anything malicious
    // send back verification to participant
    // create bots/<nextPlayerID>.js with heading //player:<gamerTag>

    //console.dir(req, { depth: 1 });

    var ip = req.headers['x-forwarded-for'];

    if (!req.body || Object.keys(req.body) > 1) {
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
        if (Object.values(ipToPlayer).includes(playerTag)) {
            console.warn("CATFISHING DETECTED!!: " + playerTag);
            res.status(400).send("Sorry, someone has already used this tag!");
            return;
        }
        ipToPlayer[ip] = playerTag;
    } else if (ipToPlayer[ip] != playerTag) {
        res.status(400).send("Sorry, only one bot per player!");
        return;        
    }

    code = req.body[playerTag];
    code = filter.clean(code.replace(/\/\/player/g, '// Player'));

    var index = Object.values(ipToPlayer).indexOf(playerTag);
    fs.writeFileSync("bots/" + index + ".js", "//player:" + playerTag + "\n" + code);
    console.log("[" + ip + "] Updated participant " + playerTag + ", code length: " + code.trim().split(/\r\n|\r|\n/).length);
    res.send('Bot code for ' + playerTag + ' has been updated!');
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))