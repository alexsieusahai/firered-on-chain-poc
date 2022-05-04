import { OptionTextBox } from './optionTextBox.js';
import { Constants } from '../constants.js';
import { PartyUI } from './partyUI.js';
let constants = new Constants();

export class PartyUIOption extends OptionTextBox {
    constructor(parentScene, partyUI) {
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
        this.partyUI = partyUI;
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.destroy();
    }

    consumeZ() {
        // take in the selection and change the state of monswap accordingly
        if (this.parent.timer.timer('menu')) {
            if (this.getCurrentOption() === "SWAP") {
                if (this.partyUI.state === 'SELECT') {
                    this.partyUI.selectedMon = this.partyUI.current;
                    this.partyUI.state = 'SWAP';
                    this.destroy();
                } else {
                    console.warn("partyUIOption currently does not support the selected partyUI.state!");
                }
            } else {
                console.warn("partyUIOption currently does not support the selected menu option!");
            }
        }
    }
}
