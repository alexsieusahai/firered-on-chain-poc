import { Consumer } from './consumer.js';
import { Constants } from '../constants.js';
import { createTextBox, getBBcodeText } from '../textBox.js';
let constants = new Constants();

function itemName(itemId) {
    switch (itemId) {
    case '1':
        return "POTION";
    default:
        return String(itemId);
    }
}

export class Bag extends Consumer {
    constructor(parentScene) {
        super();
        this.parent = parentScene;
        this.categories = ['CONSUMABLES'];
        this.categorySelection = 0;
        this.itemSelection = 0;
    }

    ingestInventory(inventory) {
        this.inventory = {};
        for (var i = 0; i < inventory.length; ++i) {
            if (inventory[i] > 0) this.inventory[i] = inventory[i];
        }
    }

    _drawBagTextBox() {
        if (typeof this.textBox !== 'undefined' && this.textBox.active) this.textBox.destroy();

        if (this.categories[this.categorySelection] == 'CONSUMABLES') {
            var content = '';
            var whichItem = 0;
            for (var i in this.inventory) {
                content += (this.itemSelection === whichItem ? '*' : ' ') + itemName(i) + ' ' + String(this.inventory[i]) + '\n';
                whichItem++;
            }
            this.textBox = createTextBox(this.parent, 35, 180,
                                         {
                                             'wrapWidth': 100,
                                             'fixedWidth': 100,
                                             'fixedHeight': 80,
                                             'radius': 8,
                                             'fontSize': '14px',
                                             lineSpacing: 3,
                                         })
                .start(content, 0);
        } else console.warn('NOTIMPLEMENTEDWARNING',
                            this.categories[this.categorySelection],
                            'has not been implemented in bag UI');
    }

    consumeW() {
        if (this.parent.timer.timer('menu')) {
            this.itemSelection -= 1;
            if (this.itemSelection < 0) this.itemSelection += Object.keys(this.inventory).length;
            this._drawBagTextBox();
        }
    }

    consumeS() {
        if (this.parent.timer.timer('menu')) {
            this.itemSelection = (this.itemSelection + 1) % Object.keys(this.inventory).length;
            this._drawBagTextBox();
        }
    }

    consumeZ() {
        console.warn("NOTIMPLEMENTED: this should go to mon swap UI to select who to use the item on");
    }

    constructBag() {
        this._drawBagTextBox();
    }

    isActive() {
        return (typeof this.textBox === 'undefined') ? false : this.textBox.active;
    }

    destroy() {
        this.textBox.destroy();
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.destroy();
    }
}
