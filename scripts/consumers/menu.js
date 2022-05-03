import { Consumer } from './consumer.js';
import { Constants } from '../constants.js';
import { createTextBox, getBBcodeText } from '../textBox.js';
let constants = new Constants();

export class Menu extends Consumer {
    constructor(parentScene, bag, monSwap) {
        super();
        this.bag = bag;
        this.monSwap = monSwap;
        this.parent = parentScene;
        this.menuOptions = ['MONS', 'BAG', 'TRAINER', 'OPTION', 'EXIT'];
        this.currentSelection = 0;
    }

    constructMenu() {
        if (typeof this.textBox !== 'undefined' && this.textBox.active) this.textBox.destroy();

        var menuContent = '';
        for (var i in this.menuOptions) {
            menuContent += (this.currentSelection == i ? '*' : ' ') + this.menuOptions[i] + '\n';
        }

        this.textBox = createTextBox(this.parent, 35, 180,
                                     {
                                         'wrapWidth': 80,
                                         'fixedWidth': 80,
                                         'fixedHeight': 80,
                                         'radius': 8,
                                         'fontSize': '14px',
                                         lineSpacing: 3,
                                     })
            .start(menuContent, 0);
    }

    consumeW() {
        if (this.parent.timer.timer('menu')) {
            this.currentSelection -= 1;
            if (this.currentSelection < 0) this.currentSelection += this.menuOptions.length;
            this.constructMenu();
        }
    }

    consumeS() {
        if (this.parent.timer.timer('menu')) {
            this.currentSelection = (this.currentSelection + 1) % this.menuOptions.length;
            this.constructMenu();
        }
    }

    destroy() {
        this.textBox.destroy();
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.destroy();
    }

    consumeZ() {
        if (this.menuOptions[this.currentSelection] === 'BAG') {
            this.destroy();
            console.log('spawning bag UI...');
            this.bag.constructBag();
        } else if (this.menuOptions[this.currentSelection] === 'MONS') {
            this.destroy();
            this.monSwap.construct();
        }
        this.destroy();
        // if selection is on BAG, then destroy this and spawn the bag UI
    }

    isActive() {
        return (typeof this.textBox === 'undefined') ? false : this.textBox.active;
    }
}
