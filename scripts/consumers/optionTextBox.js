import { Consumer } from './consumer.js';
import { Constants } from '../constants.js';
import { createTextBox, getBBcodeText } from '../textBox.js';
let constants = new Constants();

const GetValue = Phaser.Utils.Objects.GetValue;
export class OptionTextBox extends Consumer {
    constructor(parentScene, options, config) {
        super();
        this.parent = parentScene;
        this.options = options;
        this.config = config;
        this.current = 0;
        this.columns = GetValue(config, 'columns', 1);
        this.columnWidth = GetValue(config, 'columnWidth', 0);
    }

    getCurrentOption() {
        return this.options[this.current];
    }

    construct() {
        if (typeof this.textBox !== 'undefined' && this.textBox.active) this.textBox.destroy();

        var content = '';
        for (var i in this.options) {
            i = Number(i);
            content += (this.current == i ? '*' : ' ') + this.options[i];
            if (((i + 1) % this.columns) == 0) {
                content += '\n';
            } else {
                content += ' '.repeat(this.columnWidth - this.options[i].length);
            }
        }

        this.textBox = createTextBox(this.parent,
                                     this.config['x'],
                                     this.config['y'],
                                     this.config)
            .start(content, 0)
            .setScrollFactor(0, 0);
    }

    currentDelta(delta) {
        this.current += delta;
        if (this.current < 0) this.current += this.options.length;
        if (this.current >= this.options.length) this.current -= this.options.length;
    }

    consumeW() {
        if (this.parent.timer.timer('menu')) {
            this.currentDelta(-this.columns);
            this.construct();
        }
    }

    consumeA() {
        if (this.parent.timer.timer('menu')) {
            this.currentDelta(-1);
            this.construct();
        }
    }


    consumeS() {
        if (this.parent.timer.timer('menu')) {
            this.currentDelta(this.columns);
            this.construct();
        }
    }

    consumeD() {
        if (this.parent.timer.timer('menu')) {
            this.currentDelta(1);
            this.construct();
        }
    }

    destroy() {
        this.textBox.destroy();
    }

    isActive() {
        return (typeof this.textBox === 'undefined') ? false : this.textBox.active;
    }
}
