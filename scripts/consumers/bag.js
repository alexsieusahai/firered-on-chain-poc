import { OptionTextBox } from './optionTextBox.js';
import { Constants } from '../constants.js';
import { createTextBox, getBBcodeText } from '../textBox.js';
let constants = new Constants();

function itemName(itemId) {
    switch (itemId) {
    case 1:
        return "POTION";
    default:
        return String(itemId);
    }
}

export class Bag extends OptionTextBox {
    constructor(parentScene) {
        super(parentScene, [], {'x': 35,
                                'y': 180,
                                'wrapWidth': 100,
                                'fixedWidth': 100,
                                'fixedHeight' : 80,
                                'radius' : 8,
                                'fontSize': '14px',
                                'lineSpacing': 3});
        this.parent = parentScene;
        this.categories = ['CONSUMABLES'];
        this.categorySelection = 0;
        this.itemSelection = 0;
    }

    ingestInventory(inventory) {
        this.options = [];
        for (var i = 0; i < inventory.length; ++i) {
            if (inventory[i] > 0) this.options.push(itemName(i) + ' ' + String(inventory[i]));
        }
    }

    consumeZ() {
        console.warn("NOTIMPLEMENTED: this should go to mon swap UI to select who to use the item on");
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.destroy();
    }
}
