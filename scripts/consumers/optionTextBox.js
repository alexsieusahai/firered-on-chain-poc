import { Consumer } from './consumer.js';
import { Constants } from '../constants.js';
import { createTextBox, getBBcodeText } from '../textBox.js';
let constants = new Constants();

export class OptionTextBox extends Consumer {
    constructor(parentScene, options, config) {
        super();
        this.parent = parentScene;
        this.options = options;
        this.config = config;
        this.current = 0;
    }

    construct() {
        if (typeof this.textBox !== 'undefined' && this.textBox.active) this.textBox.destroy();

        var content = '';
        for (var i in this.options) {
            content += (this.current == i ? '*' : ' ') + this.options[i] + '\n';
        }

        this.textBox = createTextBox(this.parent,
                                     this.config['x'],
                                     this.config['y'],
                                     this.config)
            .start(content, 0);
    }

    consumeW() {
        if (this.parent.timer.timer('menu')) {
            this.current -= 1;
            if (this.current < 0) this.current += this.options.length;
            this.construct();
        }
    }

    consumeS() {
        if (this.parent.timer.timer('menu')) {
            this.current = (this.current + 1) % this.options.length;
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
