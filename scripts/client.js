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
let prevTile;
let facingCoords;
let currentTextBox;
let socket = io('http://localhost:3000');

class Overworld extends Phaser.Scene {
    constructor(config) {
        super(config);
    }

    init(data) {
        console.log('init data', data);
        if (typeof data['tileset'] === 'undefined') {
            this.tileset_name = 'pallet_town';
            this.tilemap_name = 'pallet_town';
        } else {
            this.tileset_name = data['tileset'];
            this.tilemap_name = data['tilemap'];
        }
    }

    preload() {
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });

        // this.socket = io('http://localhost:3000');
        this.socket = socket;
        this.socket.on('connect', () => console.log('connected to server! id:', this.socket.id));
        this.socket.on('random', seed => {this.prng = new Math.seedrandom(seed); });
        this.socket.on('wildEncounter', () => {
            console.log("transitioning to battle with wild mon");
            this.socket.emit('battleUI');
            console.log("NOTIMPLEMENTED: below line shouldn't be default, it should be the name of the scene");
            this.scene.sleep(this.tileset_name);
            this.scene.run('Battle', {socket: this.socket, from: this.tileset_name});
        });
        this.socket.emit('random', '');

        this.socket.on('signerAddressAck', () => {
            console.warn('DEBUG wild encounter');
            this.socket.emit('wildEncounter', '');
        });

        this.timer = new Timer();
        this.load.image("tiles_" + this.tileset_name, "../assets/tilesets/" + this.tileset_name + ".png");
        this.load.tilemapTiledJSON("map_" + this.tileset_name, "../assets/tilesets/" + this.tilemap_name + ".json");
        this.load.atlas("atlas", "../assets/atlas/atlas.png", "../assets/atlas/atlas.json");
    }

    create(config) {
        this.map = this.make.tilemap({ key : "map_" + this.tileset_name });
        this.tileset = this.map.addTilesetImage(this.tileset_name, "tiles_" + this.tileset_name);

        // const belowLayer = map.createLayer("Below Player", this.tileset, 0, 0);
        const worldLayer = this.map.createLayer("World", this.tileset, 0 , 0);
        // const aboveLayer = map.createLayer("Above Player", this.tileset, 0, 0);

        worldLayer.setCollisionByProperty({collision: true });

        var obj, tileAtObj;
        var messageObjects = this.map.getObjectLayer("Messages").objects;
        var i;
        for (i in messageObjects) {
            obj = messageObjects[i];
            tileAtObj = this.map.getTileAtWorldXY(obj.x, obj.y);
            tileAtObj.properties['message'] = obj.properties[0]['value'];
        }

        var mapObjects = this.map.getObjectLayer("MapMovement").objects;
        for (i in mapObjects) {
            obj = mapObjects[i];
            tileAtObj = this.map.getTileAtWorldXY(obj.x, obj.y);
            if (typeof obj.properties !== 'undefined')
                tileAtObj.properties['to'] = obj.properties[0]['value'];
        }

        const spawnPoint = this.map.findObject("MapMovement", obj => obj.name === "SpawnPoint");
        console.log("spawnPoint is", spawnPoint);
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
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

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

        // + 8 magic - we want the tile relative to the player's head, this is a proxy for that
        var currentTile =  this.map.getTileAtWorldXY(player.x, player.y + 8);
        if (typeof prevTile === 'undefined' || currentTile.index !== prevTile.index) {
            // on new tile
            if (currentTile.properties['tallGrass']
                && typeof this.prng !== 'undefined'
                && this.prng() < constants.wildEncounterChance) {
                this.socket.emit('wildEncounter', '');
            }
            if (currentTile.properties['to']) {
                console.log('go to world', currentTile.properties['to']);
                this.scene.add('route_1', Overworld, false, {tileset: 'route_1', tilemap: 'route_1'});
                this.scene.start('route_1');
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
            var facingTile = this.map.getTileAt(currentTile.x + facingCoords[0], currentTile.y + facingCoords[1]);
            if (typeof currentTextBox !== 'undefined' && currentTextBox.active) {
                if (currentTextBox.isTyping) currentTextBox.stop(true);
                else currentTextBox.isLastPage ? currentTextBox.destroy() : currentTextBox.typeNextPage();
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

if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
}

async function f() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    socket.emit('signerAddress', await signer.getAddress());

    // const greeterAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    // const greeterAbi = [
    //     'function greet() public view returns (string memory)'
    // ];
    // const greeterContract = new ethers.Contract(greeterAddress, greeterAbi, provider);
    // var greeting = await greeterContract.greet();
    // console.log('greeting', greeting);
}

const ethereumButton = document.querySelector('.enableEthereumButton');
ethereumButton.addEventListener('click', () => {
    f().then(() => {});
    var game = new Phaser.Game(config);
});

