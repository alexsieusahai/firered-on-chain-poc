// generic battle scene
import { Constants } from './constants.js';
import { Timer } from './timer.js';
import { createTextBox, getBBcodeText } from './textbox.js';


function makeMonObject(monArray) {
    function convert(bignum) {
        return Number(bignum.hex);
    }
    return {
        "speciesId": convert(monArray[0]),
        "currentHP": convert(monArray[1]),
        "maxHP": convert(monArray[2]),
        "level": convert(monArray[3]),
        "gender": convert(monArray[4]),
        "moveset": monArray[5].map(x => x === '' ? '-' : x),
        "movesetTypes": monArray[6].map(convert),
        "currentPP": monArray[7].map(convert),
        "maxPP": monArray[8].map(convert),
    };
}

function padString(string, amount, padchar=' ') {
    return string + padchar.repeat(amount - string.length);
}

const MOVE_STRING_LENGTH = 10;
function movesetTextbox(scene, mon, moveSelection) {
    var content = '';
    var moveset;
    switch (scene.menuState) {
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
    for (var i in moveset) {
        if (i == 2) {
            content += '\n';
        }
        var prefix = (i == moveSelection) ? '*' : ' ';
        content += padString(prefix + moveset[i], MOVE_STRING_LENGTH);
        i++;
    }
    createTextBox(scene, 5, 155, {
        wrapWidth: 130,
        fixedWidth: 130,
    })
        .start(content, 0);
}

function currentMoveTextbox(scene, mon, currentMove) {
    var currentPP = mon['currentPP'][currentMove];
    var maxPP = mon['maxPP'][currentMove];
    var typeInt = mon['movesetTypes'][currentMove];
    var content = '\n';
    if (scene.menuState === "FIGHT") {
        content = "PP " + String(currentPP);
        content += '/' + + String(maxPP) + '\nTYPE:' + getTypeString(typeInt);
    }
    createTextBox(scene, 150, 155, {
        wrapWidth: 60,
        fixedWidth: 60
    })
        .start(content, 0);
}

const MON_NAME_LENGTH = 12;
function playerMonTextbox(scene, mon) {
    var content = padString(mon['name'], MON_NAME_LENGTH);
    content += "Lv" + String(mon['level']) + '\n';
    content += 'HP: ' + String(mon['currentHP'] / 100) + '/' + String(mon['maxHP'] / 100);
    createTextBox(scene, 120, 120, {
        wrapWidth: 90,
        fixedWidth: 90
    })
        .start(content, 0);
}

function enemyMonTextbox(scene, mon) {
    var content = '';
    content = padString(mon['name'], MON_NAME_LENGTH);
    content += "Lv" + String(mon['level']) + '\n';
    content += 'HP: ' + String(mon['currentHP'] / 100) + '/' + String(mon['maxHP'] / 100);
    createTextBox(scene, 15, 50, {
        wrapWidth: 90,
        fixedWidth: 90
    })
        .start(content, 0);
}

var timer;
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
        // load the mons in both parties
        this.load.image('mon_1_back', 'assets/pokemon/main-sprites/firered-leafgreen/back/1.png');
        this.load.image('mon_16_front', 'assets/pokemon/main-sprites/firered-leafgreen/16.png');
    }

    create(socket) {
        this.socket = socket;
        this.menuSelection = 0;
        this.menuState = "ACTION";

        // grab the data from the backend
        this.socket.on('battleUI', (data) => {
            console.log('got battle UI data!');

            if (!data['inBattle']) {
                // if battle done, transition back to overworld
                console.log("jump back to overworld");
                // this.scene.transition({
                //     target: 'Overworld',
                //     duration: 1000,
                // });
                // this.scene.start('Overworld');
                this.scene.stop('Battle');
                this.scene.wake('Overworld');
            }

            // setup all of the textboxes
            this.myParty = data["party"]["mons"].map(makeMonObject);
            var monNamesParty = data["party"]["names"];
            for (var i = 0; i < this.myParty.length; ++i) {
                this.myParty[i]['name'] = monNamesParty[i];
            }
            this.enemyParty = data["partyAI"]["mons"].map(makeMonObject);
            var enemyNamesParty = data["partyAI"]["names"];;
            for (var i = 0; i < this.enemyParty.length; ++i) {
                this.enemyParty[i]['name'] = enemyNamesParty[i];
            }
            // console.log("myParty[0]", myParty[0]);
            movesetTextbox(this, this.myParty[0], this.menuSelection);
            currentMoveTextbox(this, this.myParty[0], this.menuSelection);
            playerMonTextbox(this, this.myParty[0]);
            enemyMonTextbox(this, this.enemyParty[0]);
        });

        // after action has completed, ask for new UI data and subsequently redraw upon ingestion
        this.socket.on('battleIngestActionCompleted', () => {
            socket.emit('battleUI');
        });

        this.add.image(70, 110, 'mon_1_back');
        this.add.image(160, 50, 'mon_16_front');
    }

    redrawMoveTextboxes() {
        if (typeof this.myParty !== 'undefined') {
            movesetTextbox(this, this.myParty[0], this.menuSelection);
            currentMoveTextbox(this, this.myParty[0], this.menuSelection);
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
        if (keyS.isDown && timer.timer('movement')) {
            menuDelta = 2;
        }
        if (keyW.isDown && timer.timer('movement')) {
            menuDelta = -2;
        }
        if (keyA.isDown && timer.timer('movement')) {
            menuDelta = -1;
        }
        if (keyD.isDown && timer.timer('movement')) {
            menuDelta = 1;
        }
        if (menuDelta !== 0) {
            this.menuSelection = (this.menuSelection + menuDelta) % 4;
            if (this.menuSelection < 0) {
                this.menuSelection += 4;
            }
            this.redrawMoveTextboxes();
        }

        // handle state transitions and sending actions to backend
        if (keyZ.isDown && timer.timer('movement')) {
            if (this.menuState === "ACTION") {
                switch (this.menuSelection) {
                case 0:
                    this.menuState = "FIGHT";
                    break;
                case 1:
                    // this.menuState = "BAG";
                    console.warn("BAG NOT IMPLEMENTED IN UI");
                    break;
                case 2:
                    // this.menuState = "MONS";
                    console.warn("MONS NOT IMPLEMENTED IN UI");
                    break;
                case 3:
                    this.socket.emit('battleIngestAction', {'action' : 4, 'slot' : this.menuSelection});
                    break;
                default:
                    console.warn("menuState is in an invalid state");
                    break;
                }
            }
            else if (this.menuState === "FIGHT") {
                this.socket.emit('battleIngestAction', {'action' : 1, 'slot' : this.menuSelection});
            } else {
                console.warn("menuState", this.menuState, "NOT IMPLEMENTED IN UI");
            }
            this.redrawMoveTextboxes();
        }

        // handle "back to main" state transition
        if (keyX.isDown && timer.timer('movement')) {
            console.log("escape pushed; going back to main menu...");
            this.menuState = "ACTION";
            this.redrawMoveTextboxes();
        }
    }
}

function getTypeString(typeInt) {
    console.warn("type string should just be a JSON file");
    switch (typeInt) {
    case 0:
        return "NORMAL";
    case 1:
        return "FIRE";
    case 2:
        return "WATER";
    case 3:
        return "GRASS";
    case 4:
        return "ELECTRIC";
    case 5:
        return "ICE";
    case 6:
        return "FIGHTING";
    case 7:
        return "POISON";
    case 8:
        return "GROUND";
    case 9:
        return "FLYING";
    case 10:
        return "PSYCHIC";
    case 11:
        return "BUG";
    case 12:
        return "ROCK";
    case 13:
        return "GHOST";
    case 14:
        return "DRAGON";
    case 15:
        return "DARK";
    case 16:
        return "STEEL";
    default:
        console.warn("getTypeString has encountered an invalid typeInt");
        return "?";
    }
}
