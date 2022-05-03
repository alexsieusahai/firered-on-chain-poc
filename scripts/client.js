import { Timer } from './timer.js';
import { Constants } from './constants.js';
import { Battle } from './battle.js';
import { Player } from './consumers/player.js';
import { Dialog } from './consumers/dialog.js';
import { Bag } from './consumers/bag.js';
import { Menu } from './consumers/menu.js';
import { MonSwap } from './consumers/monSwap.js';
import { createTextBox, getBBcodeText } from './textbox.js';

var constants = new Constants();
var timer;
let cursors;
let controls;
let player;
let facingCoords;
let currentMenu;
let consumers;
let socket = io('http://localhost:3000');
let signerAddressAck = false;

function makeMenu(scene) {
    var graphics = scene.add.graphics();
    let rect = scene.add.rectangle(60, constants.height - 145, 70, constants.height - 140, constants.COLOR_PRIMARY);
    rect.setScrollFactor(0, 0);
    console.warn('menu needs to consider scene.menuSelection');
    var textBox = scene.rexUI.add.textBox({
        x: 35,
        y: 80,
        text: getBBcodeText(scene, 50, 50, 50),
    })
        .setOrigin(0, 1)
        .layout()
        .start(' MONS\n BAG\n TRAINER\n OPTION\n EXIT', 0);
    textBox.setScrollFactor(0, 0);

    return {'rect' : rect, 'textBox' : textBox, 'currentSelection' : 0};
}

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

        this.bag = new Bag(this);
        this.monSwap = new MonSwap(this);

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
        this.socket.on('signerAddressAck', () => {
            console.log('signer address acknowledged by server...');
            signerAddressAck = true;
            this.socket.emit('inventory', '');
            this.socket.emit('getParty', '');
        });

        this.socket.on('getParty', party => {
            this.monSwap.ingestParty(party);
        });
        this.socket.on('inventory', inventory => {
            for (var i in inventory) inventory[i] = Number(inventory[i].hex);
            this.bag.ingestInventory(inventory);
        });

        this.socket.emit('random', '');

        this.timer = new Timer();
        this.load.image("tiles_" + this.tileset_name, "../assets/tilesets/" + this.tileset_name + ".png");
        this.load.tilemapTiledJSON("map_" + this.tileset_name, "../assets/tilesets/" + this.tilemap_name + ".json");
        this.load.atlas("atlas", "../assets/atlas/atlas.png", "../assets/atlas/atlas.json");
        consumers = [];
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

        worldLayer.setScale(2, 2);

        this.dialog = new Dialog(this);
        this.menu = new Menu(this, this.bag, this.monSwap);
        this.player = new Player(this, worldLayer, this.dialog, this.menu);
        consumers.push(this.player);
        consumers.push(this.dialog);
        consumers.push(this.menu);
        consumers.push(this.bag);
        consumers.push(this.monSwap);

        const camera = this.cameras.main;
        camera.startFollow(this.player.sprite);
        camera.setBounds(0, 0, this.map.widthInPixels * 2, this.map.heightInPixels * 2);

        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    }

    handleNewTile() {
        if (this.player.currentTile.properties['tallGrass']
            && typeof this.prng !== 'undefined'
            && this.prng() < constants.wildEncounterChance
            && signerAddressAck) {
            this.socket.emit('wildEncounter', '');
        }
        if (this.player.currentTile.properties['to']) {
            console.log('go to world', this.player.currentTile.properties['to']);
            this.scene.add('route_1', Overworld, false, {tileset: 'route_1', tilemap: 'route_1'});
            this.scene.start('route_1');
        }
        this.player.prevTile = this.player.currentTile;
    }

    update(time, delta) {
        var keyboardConsumer = undefined;
        for (var i in consumers) {
            consumers[i].beforeConsume();
            if (consumers[i].isActive()) keyboardConsumer = consumers[i];
        }

        if (typeof this.player.prevTile === 'undefined' || this.player.currentTile.index !== this.player.prevTile.index) {
            this.handleNewTile();
        }

        if      (this.keyA.isDown) keyboardConsumer.consumeA();
        else if (this.keyD.isDown) keyboardConsumer.consumeD();
        else if (this.keyW.isDown) keyboardConsumer.consumeW();
        else if (this.keyS.isDown) keyboardConsumer.consumeS();
        else if (this.keyZ.isDown) keyboardConsumer.consumeZ();
        else if (this.keyX.isDown) keyboardConsumer.consumeX();
        else if (this.keyC.isDown) keyboardConsumer.consumeC();
        else keyboardConsumer.consumeNothing();

        for (i in consumers) {
            if (keyboardConsumer !== consumers[i]) consumers[i].consumeNothing();
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

