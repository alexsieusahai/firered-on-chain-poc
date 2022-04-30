import { Timer } from './timer.js';
import { Constants } from './constants.js';
import { Battle } from './battle.js';
import { createTextBox, getBBcodeText } from './textbox.js';

const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;

var constants = new Constants();
var timer;
let cursors;
let controls;
let player;
let map;
let tileset;
let prevTile;
let facingCoords;
let tiledObjects;
let currentTextBox;

class Overworld extends Phaser.Scene {
    constructor() {
        super({key: 'Overworld'});
    }

    preload() {

        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });

        console.log("overworld running preload");
        this.socket = io('http://localhost:3000');
        this.socket.on('connect', () => console.log('connected to server! id:', this.socket.id));
        this.socket.on('random', seed => {this.prng = new Math.seedrandom(seed); });
        this.socket.on('wildEncounter', () => {
            console.log("transitioning to battle with wild mon");
            this.socket.emit('battleUI');

            // this.scene.transition({
            //     target: 'Battle',
            //     duration: 1000,
            //     data: this.socket});
            this.scene.sleep('Overworld');
            this.scene.run('Battle', this.socket);
        });
        this.socket.emit('random', '');

        this.timer = new Timer();
        this.load.image("tiles", "../assets/route_1.png");
        this.load.tilemapTiledJSON("map", "../assets/route_1/untitled.json");
        this.load.atlas("atlas", "../assets/atlas/atlas.png", "../assets/atlas/atlas.json");
    }

    create() {

        map = this.make.tilemap({ key : "map" });
        tileset = map.addTilesetImage("route_1", "tiles");

        // const belowLayer = map.createLayer("Below Player", tileset, 0, 0);
        const worldLayer = map.createLayer("World", tileset, 0 , 0);
        // const aboveLayer = map.createLayer("Above Player", tileset, 0, 0);

        worldLayer.setCollisionByProperty({collision: true });

        var messageObjects = map.getObjectLayer("Messages").objects;
        for (var i in messageObjects) {
            var obj = messageObjects[i];
            var tileAtObj = map.getTileAtWorldXY(obj.x, obj.y);
            tileAtObj.properties['message'] = obj.properties[0]['value'];
        }
        const spawnPoint = map.findObject("MapMovement", obj => obj.name === "SpawnPoint");
        player = this.physics.add
            .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-back")
            .setSize(30, 40)
            .setDisplaySize(20, 30)
            .setOffset(0, 24);
        this.player = player;
        this.physics.add.collider(player, worldLayer);

        const anims = this.anims;
        anims.create({
            key: "misa-left-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-left-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-right-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-right-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-front-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-front-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-back-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-back-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });

        const camera = this.cameras.main;
        camera.startFollow(player);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        this.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    }

    update(time, delta) {
        const speed = 175;
        const prevVelocity = player.body.velocity.clone();

        // - 8 magic because we want the tile at the player's head
        var currentTile =  map.getTileAtWorldXY(player.x, player.y + 8);
        if (typeof prevTile === 'undefined' || currentTile.index !== prevTile.index) {
            // on new tile
            if (currentTile.properties['tallGrass']
                && typeof this.prng !== 'undefined'
                && this.prng() < constants.wildEncounterChance) {
                this.socket.emit('wildEncounter', '');
            }
            prevTile = currentTile;
        }

        player.body.setVelocity(0);
        if (typeof currentTextBox === 'undefined' || !currentTextBox.active) {
            if (this.left.isDown) {
                player.body.setVelocityX(-speed);
                facingCoords = [-1, 0];
            } else if (this.right.isDown) {
                player.body.setVelocityX(speed);
                facingCoords = [1, 0];
            } else if (this.up.isDown) {
                player.body.setVelocityY(-speed);
                facingCoords = [0, -1];
            } else if (this.down.isDown) {
                player.body.setVelocityY(speed);
                facingCoords = [0, 1];
            }
            // Update the animations
            if (this.left.isDown) {
                player.anims.play("misa-left-walk", true);
            } else if (this.right.isDown) {
                player.anims.play("misa-right-walk", true);
            } else if (this.up.isDown) {
                player.anims.play("misa-back-walk", true);
            } else if (this.down.isDown) {
                player.anims.play("misa-front-walk", true);
            } else {
                player.anims.stop();

                // If we were moving, pick and idle frame to use
                // use this to remember what direction we are facing
                if (prevVelocity.x < 0)
                {
                    player.setTexture("atlas", "misa-left");
                }
                else if (prevVelocity.x > 0)
                {
                    player.setTexture("atlas", "misa-right");
                }
                else if (prevVelocity.y < 0) {
                    player.setTexture("atlas", "misa-back");
                }
                else if (prevVelocity.y > 0) {
                    player.setTexture("atlas", "misa-front");
                }
            }
        }

        // handle interaction
        if (this.keyZ.isDown && this.timer.timer('movement')) {
            // if textbox already open, handle interaction
            // otherwise, spin up textbox
            var facingTile = map.getTileAt(currentTile.x + facingCoords[0], currentTile.y + facingCoords[1]);
            if (typeof currentTextBox !== 'undefined' && currentTextBox.active) {
                if (currentTextBox.isTyping) currentTextBox.stop(true);
                else currentTextBox.isLastPage ? currentTextBox.destroy() : currentTypeBox.typeNextPage();
            } else if (typeof facingTile.properties['message'] !== 'undefined') {
                currentTextBox = createTextBox(this,
                                               facingTile.pixelX - 10,
                                               facingTile.pixelY - 5,
                                               {wrapWidth: 100, fixedWidth: 100, indent: 8, radius: 8})
                    .start(facingTile.properties['message'], 5);
            }
        }
    }
}

var config = {
    type: Phaser.AUTO,
    width: constants.width,
    height: constants.height,
    pixelArt: true,
    scene: [
        Overworld,
        Battle
    ],
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 }
        }
    }
};

var game = new Phaser.Game(config);
