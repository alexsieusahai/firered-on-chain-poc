import { OptionTextBox } from './optionTextBox.js';
import { Constants } from '../constants.js';
let constants = new Constants();

export class MonSwapOption extends OptionTextBox {
    constructor(parentScene, monSwap) {
        super(parentScene,
              ["MON", "SWAP"],
              {'x': constants.width - 180,
               'y': constants.height - 30,
               'wrapWidth': 150,
               'fixedWidth': 150,
               'fixedHeight' : 80,
               'radius' : 8,
               'fontSize': '20px',
               'lineSpacing': 3});
        this.monSwap = monSwap;
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.destroy();
    }

    consumeZ() {
        // take in the selection and change the state of monswap accordingly
        if (this.parent.timer.timer('menu')) {
            if (this.getCurrentOption() === "SWAP") {
                if (this.monSwap.state === 'SELECT') {
                    this.monSwap.selectedMon = this.monSwap.current;
                    this.monSwap.state = 'SWAP';
                    this.destroy();
                } else {
                    console.warn("monSwapOption currently does not support the selected monSwap.state!");
                }
            } else {
                console.warn("monSwapOption currently does not support the selected menu option!");
            }
        }
    }
}
