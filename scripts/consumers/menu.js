import { Consumer } from './consumer.js';
import { Constants } from '../constants.js';
import { createTextBox, getBBcodeText } from '../textbox.js';
let constants = new Constants();

export class Menu extends Consumer {
    constructor(parentScene) {
        super();
        this.parent = parentScene;
        this.menuOptions = ['MONS', 'BAG', 'TRAINER', 'OPTION', 'EXIT'];
        this.currentSelection = 0;
    }

    _drawMenuTextbox() {
        if (typeof this.textBox !== 'undefined' && this.textBox.active) this.textBox.destroy();

        var menuContent = '';
        for (var i in this.menuOptions) {
            menuContent += (this.currentSelection == i ? '*' : ' ') + this.menuOptions[i] + '\n';
        }
        this.textBox = this.parent.rexUI.add.textBox({
            x: 35,
            y: 80,
            text: getBBcodeText(this.parent, 50, 50, 50),
        })
            .setOrigin(0, 1)
            .layout()
            .start(menuContent, 0);
        this.textBox.setScrollFactor(0, 0);
    }

    constructMenu() {
        var graphics = this.parent.add.graphics();
        this.rect = this.parent.add.rectangle(60, constants.height - 145, 70, constants.height - 140, constants.COLOR_PRIMARY);
        this.rect.setScrollFactor(0, 0);

        this._drawMenuTextbox();
    }

    consumeW() {
        if (this.parent.timer.timer('menu')) {
            this.currentSelection -= 1;
            if (this.currentSelection < 0) this.currentSelection += this.menuOptions.length;
            this._drawMenuTextbox();
        }
    }

    consumeS() {
        if (this.parent.timer.timer('menu')) {
            this.currentSelection = (this.currentSelection + 1) % this.menuOptions.length;
            this._drawMenuTextbox();
        }
    }

    consumeC() {
        if (this.parent.timer.timer('menu'))
        {
            // turn menu off
            console.log('menu destruction...');
            this.rect.destroy();
            this.textBox.destroy();
        }
    }

    isActive() {
        return (typeof this.rect === 'undefined') ? false : this.rect.active;
    }
}
