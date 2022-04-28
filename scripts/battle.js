// generic battle scene
import { Constants } from './constants.js';

// https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-textbox/
// https://codepen.io/rexrainbow/pen/ExZLoWL?editors=0010
const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;

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
function movesetTextbox(scene, mon) {
    var content = '';
    // console.log("mon moveset", mon["moveset"]);
    for (var i in mon["moveset"]) {
        // should get move names from the smart contract, when doing the getParty() call
        if (i == 2) {
            content += '\n';
        }
        content += padString(mon["moveset"][i], MOVE_STRING_LENGTH);
        i++;
        createTextBox(scene, 5, 155, {
            wrapWidth: 130,
            fixedWidth: 130,
        })
            .start(content, 0);
    }
}

function currentMoveTextbox(scene, mon, currentMove) {
    var currentPP = mon['currentPP'][currentMove];
    var maxPP = mon['maxPP'][currentMove];
    var typeInt = mon['movesetTypes'][currentMove];
    var content = "PP " + String(currentPP);
    content += '/' + + String(maxPP) + '\nTYPE:' + getTypeString(typeInt);
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
    var content = padString(mon['name'], MON_NAME_LENGTH);
    content += "Lv" + String(mon['level']) + '\n';
    content += 'HP: ' + String(mon['currentHP'] / 100) + '/' + String(mon['maxHP'] / 100);
    createTextBox(scene, 15, 50, {
        wrapWidth: 90,
        fixedWidth: 90
    })
        .start(content, 0);
}

// make and export a scene off of these
export class Battle extends Phaser.Scene {

    constructor() {
        super({key : 'Battle'});
    }

    preload() {
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
        this.currentMove = 0;

        // grab the data from the backend
        socket.on('battleUI', (data) => {
            console.log('got battle UI data!');
            // setup all of the textboxes
            var myParty = data["party"]["mons"].map(makeMonObject);
            var monNamesParty = data["party"]["names"];
            for (var i = 0; i < myParty.length; ++i) {
                myParty[i]['name'] = monNamesParty[i];
            }
            var enemyParty = data["partyAI"]["mons"].map(makeMonObject);
            var enemyNamesParty = data["partyAI"]["names"];;
            for (var i = 0; i < enemyParty.length; ++i) {
                enemyParty[i]['name'] = enemyNamesParty[i];
            }
            console.log("myParty[0]", myParty[0]);
            movesetTextbox(this, myParty[0]);
            currentMoveTextbox(this, myParty[0], this.currentMove);
            playerMonTextbox(this, myParty[0]);
            enemyMonTextbox(this, enemyParty[0]);
        });

        this.add.image(70, 110, 'mon_1_back');
        this.add.image(160, 50, 'mon_16_front');
    }

    update() {
        // on enter, send command
    }
}

const GetValue = Phaser.Utils.Objects.GetValue;
var createTextBox = function (scene, x, y, config) {
    var wrapWidth = GetValue(config, 'wrapWidth', 0);
    var fixedWidth = GetValue(config, 'fixedWidth', 0);
    var fixedHeight = GetValue(config, 'fixedHeight', 0);
    var textBox = scene.rexUI.add.textBox({
        x: x,
        y: y,
        background: CreateSpeechBubbleShape(scene, COLOR_PRIMARY, COLOR_LIGHT),
        // icon: scene.rexUI.add.roundRectangle(0, 0, 2, 2, 20, COLOR_DARK),
        text: getBBcodeText(scene, wrapWidth, fixedWidth, fixedHeight),
        space: {
            left: 5, right: 5, top: 3, bottom: 3,
        },
        type: {
            wrap: false
        }
    })
        .setOrigin(0, 1)
        .layout();

    return textBox;
};

var getBBcodeText = function (scene, wrapWidth, fixedWidth, fixedHeight) {
    return scene.rexUI.add.BBCodeText(0, 0, '', {
        fixedWidth: fixedWidth,
        fixedHeight: fixedHeight,
        fontSize: '9px',
        wrap: {
            mode: 'word',
            width: wrapWidth
        },
        maxLines: 10
    });
};

var CreateSpeechBubbleShape = function (scene, fillColor, strokeColor) {
    return scene.rexUI.add.customShapes({
        create: { lines: 1 },
        update: function () {
            var radius = 8;
            var indent = 0;

            var left = 0, right = this.width, top = 0, bottom = this.height, boxBottom = bottom - indent;
            this.getShapes()[0]
                .lineStyle(2, strokeColor, 1)
                .fillStyle(fillColor, 1)
            // top line, right arc
                .startAt(left + radius, top).lineTo(right - radius, top).arc(right - radius, top + radius, radius, 270, 360)
            // right line, bottom arc
                .lineTo(right, boxBottom - radius).arc(right - radius, boxBottom - radius, radius, 0, 90)
            // bottom indent
                .lineTo(left + 60, boxBottom).lineTo(left + 50, bottom).lineTo(left + 40, boxBottom)
            // bottom line, left arc
                .lineTo(left + radius, boxBottom).arc(left + radius, boxBottom - radius, radius, 90, 180)
            // left line, top arc
                .lineTo(left, top + radius).arc(left + radius, top + radius, radius, 180, 270)
                .close();
        }
    });
};

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
