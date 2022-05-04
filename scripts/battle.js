// generic battle scene
import { Constants } from './constants.js';
import { Timer } from './timer.js';
import { createTextBox, getBBcodeText } from './textbox.js';
import { PartyUI } from './consumers/partyUI.js';
import { makeMonObject } from './utils.js';
import { MoveTextBox } from './consumers/moveTextBox.js';
import { BattleDialog } from './consumers/battleDialog.js';
import { padString } from './utils.js';
var constants = new Constants();


const MON_NAME_LENGTH = 12;
const MOVE_STRING_LENGTH = 13;
const MOVESET_BOX_HEIGHT = 80;

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
        this.signer = data.signer;
        console.log('signer ingested in battle is', this.signer);
        this.menuSelection = 0;
        this.loadedImages = false;
        this.partyUI = new PartyUI(this, this.socket);
        this.moveTextBox = new MoveTextBox(this, ['?', '?', '?', '?'], this.partyUI, this.socket);
        this.dialog = new BattleDialog(this);
        this.consumers = [this.moveTextBox, this.dialog, this.partyUI];

        // grab the data from the backend
        this.socket.on('battleUI', (data) => {
            console.log('got battle UI data!');

            if (!data['inBattle'] && !this.dialog.isActive()) {
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
                this.events.emit('battleDialog', "A wild " + enemyNamesParty[0] + " has appeared!");
                this.loadedImages = true;
            }

            this.add.image(constants.width / 2,
                           (constants.height - MOVESET_BOX_HEIGHT) / 2 - 20,
                           'background')
                .setDisplaySize(constants.width, constants.height - MOVESET_BOX_HEIGHT);


            // make sure not to draw over partyUI
            if (!this.partyUI.isActive()) {
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

        this.socket.on('attack', (addr, attackerId, defenderId, slot, critical, typeDamageMultiplier) => {
            slot = Number(slot.hex);
            attackerId = Number(attackerId.hex);
            typeDamageMultiplier = Number(typeDamageMultiplier.hex);
            if (addr === this.signer) {
                var mon = this.myParty[0]['id'] === attackerId ? this.myParty[0] : this.enemyParty[0];
                this.events.emit('battleDialog', mon['name'] + ' used ' + mon['moveset'][slot] + '!');
                console.log(critical, typeDamageMultiplier);
                if (critical) this.events.emit('battleDialog', 'It was a critical hit!');
                if (typeDamageMultiplier === 20) this.events.emit('battleDialog', 'It was super effective!');
                else if (typeDamageMultiplier === 5) this.events.emit('battleDialog', 'It was not very effective...');
                else if (typeDamageMultiplier === 0) this.events.emit('battleDialog', 'It had no effect...');
            }
        });

        this.add.image(constants.width / 2,
                        (constants.height - MOVESET_BOX_HEIGHT) / 2 - 20,
                        'background')
            .setDisplaySize(constants.width, constants.height - MOVESET_BOX_HEIGHT);

        this.socket.emit('battleUI');
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

        var consumer = undefined;
        for (var i in this.consumers) {
            this.consumers[i].beforeConsume();
            if (this.consumers[i].isActive()) consumer = this.consumers[i];
        }
        if      (keyS.isDown) consumer.consumeS();
        else if (keyW.isDown) consumer.consumeW();
        else if (keyA.isDown) consumer.consumeA();
        else if (keyD.isDown) consumer.consumeD();
        else if (keyZ.isDown) consumer.consumeZ();
        else if (keyX.isDown) consumer.consumeX();
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
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this.socket.emit('battleUI');
        });

        // after load, send out battleUI
    }
}
