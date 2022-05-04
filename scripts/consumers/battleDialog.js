import { Dialog } from './dialog.js';
import { createTextBox } from '../textbox.js';
import { Constants } from '../constants.js';
let constants = new Constants();

export class BattleDialog extends Dialog {
    constructor(parentScene) {
        super(parentScene);
        // listen to battleDialog events and get ready to consume them
        this.toDisplay = [];
        this.parent.events.on('battleDialog', content => {
            console.log('battledialog consumed dialog', content);
            this.toDisplay.push(content);
        });
    }

    beforeConsume() {
        if (this.toDisplay.length && (typeof this.textBox === 'undefined' || !this.textBox.active)) {
            var content = this.toDisplay.shift();
            this.textBox = createTextBox(this.parent,
                                         5,
                                         constants.height - 5,
                                         {
                                             fixedWidth: constants.width - 10,
                                             wrapWidth: constants.width - 10,
                                             fixedHeight: 80,
                                             fontSize: constants.BATTLE_FONTSIZE,
                                         });
            this.textBox.setDepth(1);
            this.textBox.start(content, 10);
        }
    }

    isActive() {
        return (typeof this.textBox !== 'undefined' && this.textBox.active) || this.toDisplay.length;
    }
}
