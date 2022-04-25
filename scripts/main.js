// figuring out server stuff

// imports for server
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path');

// imports for phaser
require('@geckos.io/phaser-on-nodejs');
const { SnapshotInterpolation } = require('@geckos.io/snapshot-interpolation');
const SI = new SnapshotInterpolation();
const Phaser = require('phaser');

// end figuring out server stuff

import { Player } from './player.js';
import { Maps } from './maps.js';
import { Timer } from './timer.js';
import { Constants } from './constants.js';

var constants = new Constants();

var config = {
    type: Phaser.AUTO,
    width: constants.tsz * constants.screenTileWidth + 1,
    height: constants.tsz * constants.screenTileHeight,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var maps;
var timer;

function preload ()
{
    maps = new Maps(this);
    timer = new Timer(this);
    maps.loadTiles();
}

function create ()
{
    maps.paintTiles();
}

function update ()
{
    let keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    let keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    let keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    let keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    if (keyS.isDown && timer.timer('movement')) {
        maps.moveTrainer(0, 2);
    }
    if (keyW.isDown && timer.timer('movement')) {
        maps.moveTrainer(0, -2);
    }
    if (keyA.isDown && timer.timer('movement')) {
        maps.moveTrainer(-2, 0);
    }
    if (keyD.isDown && timer.timer('movement')) {
        maps.moveTrainer(2, 0);
    }
}

// server stuff

app.use('/', express.static(path.join(__dirname, '../client')));
server.listen(3000);

// end server stuff
