import { Consumer } from './consumer.js';
import { Constants } from '../constants.js';
let constants = new Constants();

export class MonSwap extends Consumer {
    constructor(parentScene) {
        super();
        this.parent = parentScene;
    }

    construct() {
        // draw rect in top left for main mon
        var graphics = this.parent.add.graphics();
        var mainMon = this.parent.add.container(80, constants.height * 1 / 3);
        graphics.fillStyle(constants.COLOR_PRIMARY, 1);
        var rect = graphics.fillRoundedRect(0, 0, 200, 100, 8);
        graphics.lineStyle(3, constants.COLOR_DARK);
        var border = graphics.strokeRoundedRect(0, 0, 200, 100, 8);
        var name = this.parent.add.text(60, 20, 'BULBASAUR', {color:'#454545', fontSize: '18px'});
        var levelText = this.parent.add.text(60, 40, 'Lv5', {color:'#454545', fontSize: '14px'});

        graphics.fillStyle(0xadadad, 1);
        var spriteEllipse = graphics.fillEllipse(30, 70, 45, 20);
        var sprite = this.parent.add.image(30, 50, 'mon_1_front').setScale(1.2);

        graphics.lineStyle(2, constants.COLOR_DARK);
        var healthBarBorder = graphics.strokeRect(60, 65, 120, 8);
        graphics.fillStyle(constants.COLOR_DARK, 1);
        var healthBarTotal = graphics.fillRect(60, 65, 120, 8);
        graphics.fillStyle(0x9cfa3e, 1);
        console.warn('monSwap healthbar should take actual health into account...');
        var healthBar = graphics.fillRect(60, 65, 60, 8);
        var healthText = this.parent.add.text(100, 80, '12/24 HP', {color:'#454545', fontSize: '16px'});

        mainMon.add([
            rect,
            spriteEllipse,
            border,
            healthBarTotal,
            healthBar,
            healthBarBorder,
            healthText,
            name,
            levelText,
            sprite,
        ]);
    }
}
