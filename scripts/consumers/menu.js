import { OptionTextBox } from './optionTextBox.js';
import { createTextBox, getBBcodeText } from '../textBox.js';
import { Constants } from '../constants.js';
let constants = new Constants();

export class Menu extends OptionTextBox {
    constructor(parentScene, bag, monSwap) {
        super(parentScene,
              ['MONS', 'BAG', 'TRAINER', 'OPTION', 'EXIT'],
              {'x': 35,
               'y': 180,
               'wrapWidth': 80,
               'fixedWidth': 80,
               'fixedHeight' : 80,
               'radius' : 8,
               'fontSize': '14px',
               'lineSpacing': 3});
        this.bag = bag;
        this.monSwap = monSwap;
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.destroy();
    }

    consumeZ() {
        if (this.options[this.current] === 'BAG') {
            this.destroy();
            console.log('spawning bag UI...');
            this.bag.construct();
        } else if (this.options[this.current] === 'MONS') {
            this.destroy();
            this.monSwap.construct();
        }
        this.destroy();
    }
}
