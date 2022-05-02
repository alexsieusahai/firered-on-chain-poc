import { Constants } from './constants.js';
var constants = new Constants();

// https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-textbox/
// https://codepen.io/rexrainbow/pen/ExZLoWL?editors=0010

const GetValue = Phaser.Utils.Objects.GetValue;
export function createTextBox(scene, x, y, config) {
    var wrapWidth = GetValue(config, 'wrapWidth', 0);
    var fixedWidth = GetValue(config, 'fixedWidth', 0);
    var fixedHeight = GetValue(config, 'fixedHeight', 0);
    var indent = GetValue(config, 'indent', 0);
    var radius = GetValue(config, 'radius', 0);
    var textBox = scene.rexUI.add.textBox({
        x: x,
        y: y,
        background: createSpeechBubbleShape(scene, constants.COLOR_PRIMARY, constants.COLOR_LIGHT, indent, radius),
        // icon: scene.rexUI.add.roundRectangle(0, 0, 2, 2, 20, constants.COLOR_DARK),
        text: getBBcodeText(scene, wrapWidth, fixedWidth, fixedHeight),
        space: {
            left: 5, right: 5, top: 5, bottom: 10,
        },
        type: {
            wrap: false
        }
    })
        .setOrigin(0, 1)
        .layout();

    return textBox;
};

export function getBBcodeText(scene, wrapWidth, fixedWidth, fixedHeight) {
    return scene.rexUI.add.BBCodeText(0, 0, '', {
        fixedWidth: fixedWidth,
        fixedHeight: fixedHeight,
        fontSize: '10px',
        color: '#454545',
        wrap: {
            mode: 'word',
            width: wrapWidth
        },
        maxLines: 10
    });
};

var createSpeechBubbleShape = function (scene, fillColor, strokeColor, indent = 0, radius = 8) {
    return scene.rexUI.add.customShapes({
        create: { lines: 1 },
        update: function () {
            var left = 0, right = this.width, top = 0, bottom = this.height, boxBottom = bottom - indent;
            this.getShapes()[0]
                .lineStyle(1, strokeColor, 1)
                .fillStyle(fillColor, 1)
            // top line, right arc
                .startAt(left + radius, top).lineTo(right - radius, top).arc(right - radius, top + radius, radius, 270, 360)
            // right line, bottom arc
                .lineTo(right, boxBottom - radius).arc(right - radius, boxBottom - radius, radius, 0, 90)
            // bottom indent
                .lineTo(left + 30, boxBottom).lineTo(left + 20, bottom).lineTo(left + 10, boxBottom)
            // bottom line, left arc
                .lineTo(left + radius, boxBottom).arc(left + radius, boxBottom - radius, radius, 90, 180)
            // left line, top arc
                .lineTo(left, top + radius).arc(left + radius, top + radius, radius, 180, 270)
                .close();
        }
    });
};
