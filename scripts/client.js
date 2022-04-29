import { Player } from './player.js';
import { Maps } from './maps.js';
import { Timer } from './timer.js';
import { Constants } from './constants.js';
import { Battle } from './battle.js';

var constants = new Constants();
var maps;
var timer;

class Overworld extends Phaser.Scene {
    constructor() {
        super({key: 'Overworld'});
    }

    preload ()
    {
        this.socket = io('http://localhost:3000');
        this.socket.on('connect', () => {
            console.log('connected to server! id:', this.socket.id);
        });

        maps = new Maps(this, this.socket);
        timer = new Timer(this);
        maps.loadTiles();

        this.socket.on('random', seed => {
            console.log("seed from dumbRandom", seed);
            maps.prng = new Math.seedrandom(seed);
        });

        this.socket.on('wildEncounter', () => {
            console.log("transitioning to battle with wild mon");
            this.socket.emit('battleUI');
            this.scene.transition({
                target: 'Battle',
                duration: 1000,
                data: this.socket});
        });

        // ask for random number immediately
        this.socket.emit('random', '');
    }

    create ()
    {
        maps.paintTiles();
    }

    update ()
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
}

var config = {
    type: Phaser.AUTO,
    width: constants.tsz * constants.screenTileWidth + 1,
    height: constants.tsz * constants.screenTileHeight,
    scene: [
        Overworld,
        Battle
    ]
};

var game = new Phaser.Game(config);
