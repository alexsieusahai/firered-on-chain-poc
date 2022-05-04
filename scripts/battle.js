// generic battle scene
import { Constants } from './constants.js';
import { Timer } from './timer.js';
import { createTextBox, getBBcodeText } from './textbox.js';
import { PartyUI } from './consumers/partyUI.js';
import { makeMonObject } from './utils.js';
import { MoveTextBox } from './consumers/moveTextBox.js';
import { padString } from './utils.js';
var constants = new Constants();


const MON_NAME_LENGTH = 12;
const MOVE_STRING_LENGTH = 13;
const MOVESET_BOX_HEIGHT = 80;

function changeMoveOptions(scene, mon) {
    var moveset;
    switch (scene.moveTextBox.state) {
    case "FIGHT":
        moveset = mon["moveset"];
        break;
    case "ACTION":
        moveset = ["FIGHT", "BAG", "MONS", "FLEE"];
        break;
    default:
        moveset = ['?', '?', '?', '?'];
        break;
    }
    scene.events.emit('moveTextBoxOptions', moveset);
}

function monTextBox(scene, mon, x, y) {
    var content = padString(mon['name'], MON_NAME_LENGTH);
    content += "Lv" + String(mon['level']) + '\n';
    content += 'HP: ' + String(mon['currentHP'] / 100) + '/' + String(mon['maxHP'] / 100);
    return createTextBox(scene, x, y, {
        wrapWidth: constants.width * 1/3,
        fixedWidth: constants.width * 1/3,
        fixedHeight: 50,
        fontSize: '18px',
        lineSpacing: 8,
    }).start(content, 0);
}

function playerMonTextbox(scene, mon) {
    monTextBox(scene, mon, constants.width * 2/3 - 20, constants.height - MOVESET_BOX_HEIGHT - 40);
    graphics = scene.add.graphics();
    graphics.fillStyle(0x7E879C, 1);
    var expBarWidth = constants.width * 1/3 - 10;
    graphics.fillRoundedRect(constants.width * 2/3,
                             constants.height - MOVESET_BOX_HEIGHT - 40 - 1,
                             expBarWidth,
                             10,
                             2);
    graphics.fillStyle(0x52B9FF, 1);
    graphics.fillRoundedRect(
        constants.width * 2/3,
        constants.height - MOVESET_BOX_HEIGHT - 40 - 1,
        expBarWidth * (mon['currentExp'] / mon['levelRequirement']),
        10,
        2);
}

function enemyMonTextbox(scene, mon) {
    monTextBox(scene, mon, 25, 120);
}

var timer;
var graphics;
export class Battle extends Phaser.Scene {

    constructor() {
        super({key : 'Battle'});
    }

    preload() {
        timer = new Timer(this);

        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        });
        this.load.image('background', 'assets/battle-background.jpg');
    }

    create(data) {
        this.timer = timer;
        this.socket = data.socket;
        this.previousSceneKey = data.from;
        this.menuSelection = 0;
        this.loadedImages = false;
        this.partyUI = new PartyUI(this, this.socket);
        this.moveTextBox = new MoveTextBox(this, ['?', '?', '?', '?'], this.partyUI, this.socket);
        this.consumers = [this.moveTextBox, this.partyUI];

        // grab the data from the backend
        this.socket.on('battleUI', (data) => {
            console.log('got battle UI data!');

            if (!data['inBattle']) {
                // if battle done, transition back to overworld
                this.scene.stop('Battle');
                this.scene.wake(this.previousSceneKey);
                this.socket.emit('getParty', ''); // send the new party data back to the client
            }
            // load the mons in both parties
            // setup all of the textboxes, load the relevant images
            this.partyUI.ingestParty(data['party']);
            this.myParty = data["party"]["mons"].map(makeMonObject);
            var monNamesParty = data["party"]["names"];
            var speciesId;
            for (var i = 0; i < this.myParty.length; ++i) {
                this.myParty[i]['name'] = monNamesParty[i];
            }
            this.events.emit('currentMon', this.myParty[0]);
            this.enemyParty = data["partyAI"]["mons"].map(makeMonObject);
            var enemyNamesParty = data["partyAI"]["names"];;
            for (var i = 0; i < this.enemyParty.length; ++i) {
                this.enemyParty[i]['name'] = enemyNamesParty[i];
            }

            if (!this.loadedImages) {
                this.loadMonImages();
                this.loadedImages = true;
            }

            this.add.image(constants.width / 2,
                           (constants.height - MOVESET_BOX_HEIGHT) / 2 - 20,
                           'background')
                .setDisplaySize(constants.width, constants.height - MOVESET_BOX_HEIGHT);


            // make sure not to draw over partyUI
            if (!this.partyUI.isActive()) {
                changeMoveOptions(this, this.myParty[0]);
                playerMonTextbox(this, this.myParty[0]);
                enemyMonTextbox(this, this.enemyParty[0]);
            }

            // if images not loaded, wait until loaded
            speciesId = this.myParty[0]['speciesId'];
            this.add.image(140, constants.height - MOVESET_BOX_HEIGHT - 70, 'mon_' + String(speciesId) + '_back')
                .setScale(3);
            speciesId = this.enemyParty[0]['speciesId'];
            this.add.image(constants.width - 160, 150, 'mon_' + String(speciesId) + '_front')
                .setScale(3);
        });

        // after action has completed, ask for new UI data and subsequently redraw upon ingestion
        this.socket.on('battleIngestActionCompleted', () => {
            this.socket.emit('battleUI');
        });

        this.add.image(constants.width / 2,
                        (constants.height - MOVESET_BOX_HEIGHT) / 2 - 20,
                        'background')
            .setDisplaySize(constants.width, constants.height - MOVESET_BOX_HEIGHT);

        this.socket.emit('battleUI');
    }

    redrawMoveTextboxes() {
        if (typeof this.myParty !== 'undefined') {
            changeMoveOptions(this, this.myParty[0]);
        } else {
            console.log("still waiting on data from backend...");
        }
    }

    update() {
        // movement for menu selection
        // menu flow and redrawing UI when necessary
        // select action
        let keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        let keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        let keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        let keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        let keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        let keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        var menuDelta = 0;
        var consumer = undefined;
        for (var i in this.consumers) {
            if (this.consumers[i].isActive()) consumer = this.consumers[i];
        }
        if      (keyS.isDown) consumer.consumeS();
        else if (keyW.isDown) consumer.consumeW();
        else if (keyA.isDown) consumer.consumeA();
        else if (keyD.isDown) consumer.consumeD();
        else if (keyZ.isDown) {
            consumer.consumeZ();
            this.redrawMoveTextboxes();
        }
        else if (keyX.isDown) {
            consumer.consumeX();
            this.redrawMoveTextboxes();
        }
    }

    loadMonImages() {
        var i, speciesId;
        for (i = 0; i < this.myParty.length; ++i) {
            speciesId = this.myParty[i]['speciesId'];
            this.load.image('mon_' + String(speciesId) + '_back',
                            'assets/pokemon/main-sprites/firered-leafgreen/back/' + String(speciesId) + '.png');
        }
        for (i = 0; i < this.enemyParty.length; ++i) {
            speciesId = this.enemyParty[i]['speciesId'];
            this.load.image('mon_' + String(speciesId) + '_front',
                            'assets/pokemon/main-sprites/firered-leafgreen/' + String(speciesId) + '.png');
        }
        this.load.start();
    }
}
