const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const fs = require('fs');

// local imports
const { Chain } = require("./chain");
var chain = new Chain();


// get phaser to work with nodejs
require('@geckos.io/phaser-on-nodejs');
const Phaser = require('phaser');

// setup "backend" phaser
const config = {
    type: Phaser.HEADLESS,
    banner: false,
    audio: false,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

function preload() {
    console.log("preload");
    var speciesIdToName = JSON.parse(fs.readFileSync(__dirname + "/../data/dex.json"));

    io.on('connection', (socket) => {
        console.log('user connected');
        console.log(socket.id);
        // console.log(socket);
        socket.on('greet', (_) => {
            chain.callGreet().then(greet => socket.emit('greeting', greet));
        });

        socket.on('signerAddress', address => {
            console.log('obtained signerAddress', address);
            chain.setSignerAddress(address);
            socket.emit('signerAddressAck');
        });

        socket.on('random', (_) => {
            chain.getRandom().then(random => socket.emit('random', random));
        });

        socket.on('wildEncounter', (_) => {
            console.log("got wild encounter; handling...");
            // transition to battle and handle battling!
            chain.getWildMon().then(x => {
                socket.emit('wildEncounter');
            });
        });

        socket.on('battleUI', () => {
            console.log("getting data for battle UI...");
            chain.getParty().then( party => {
                chain.getPartyAI().then( partyAI => {
                    chain.inBattle().then( inBattle => {
                        console.log("sending data for battle UI to client...");
                        socket.emit('battleUI', {"party": party, "partyAI": partyAI, "inBattle": inBattle});
                    });
                });
            });
        });

        socket.on('battleIngestAction', (data) => {
            console.log('ingesting action with', data);
            chain.battleIngestAction(data['action'], data['slot']).then( () => {
                socket.emit('battleIngestActionCompleted');
            });
        });

        socket.on('inventory', () => {
            chain.getInventory().then( inventory => socket.emit('inventory', inventory) );
        });
    });
}
function create() {}
function update() {
}


new Phaser.Game(config);
app.use('/', express.static(path.join(__dirname, '..')));
server.listen(3000);
