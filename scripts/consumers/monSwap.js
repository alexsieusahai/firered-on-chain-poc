import { OptionTextBox } from './optionTextBox.js';
import { makeMonObject } from '../utils.js';
import { Constants } from '../constants.js';
let constants = new Constants();

const ALT_MON_RECT_HEIGHT = 70;
const ALT_MON_HEALTH_Y = 35;

export class MonSwap extends OptionTextBox {
    constructor(parentScene, socket) {
        super(parentScene, [0, 1, 2, 3, 4, 5], {});
        this.state = 'SELECT';
        this.socket = socket;
    }

    ingestParty(party) {
        this.partyNames = party['names'];
        this.party = party['mons'].map(makeMonObject);
        for (var i in this.party) {
            var speciesId = this.party[i]['speciesId'];
            this.parent.load.image('mon_' + String(speciesId) + '_front',
                                   'assets/pokemon/main-sprites/firered-leafgreen/' + String(speciesId) + '.png');
        }
        this.parent.load.start();
        if (this.isActive()) {
            this.destroy();
            this.construct();
        }
        console.log('finished party ingestion');
    }

    constructMainMon() {
        var graphics = this.parent.add.graphics();
        var mainMon = this.parent.add.container(80, constants.height * 1 / 3);
        graphics.fillStyle(constants.COLOR_PRIMARY, 1);
        var rect = graphics.fillRoundedRect(0, 0, 200, 100, 8);
        graphics.lineStyle(this.current === 0 ? 3 : 1, constants.COLOR_DARK);
        var border = graphics.strokeRoundedRect(0, 0, 200, 100, 8);
        var name = this.parent.add.text(60, 20, this.partyNames[0], {color:'#454545', fontSize: '18px'});
        var levelText = this.parent.add.text(60,
                                             40,
                                             'Lv' + String(this.party[0]['level']),
                                             {color:'#454545', fontSize: '14px'});

        graphics.fillStyle(0xadadad, 1);
        var spriteEllipse = graphics.fillEllipse(30, 70, 45, 20);
        var sprite = this.parent.add.image(30,
                                           50,
                                           'mon_' + String(this.party[0]['speciesId']) + '_front')
            .setScale(1.2);

        var health = this.party[0].currentHP / 100;
        var maxHealth = this.party[0].maxHP / 100;
        graphics.lineStyle(2, constants.COLOR_DARK);
        var healthBarBorder = graphics.strokeRect(60, 65, 120, 8);
        graphics.fillStyle(constants.COLOR_DARK, 1);
        var healthBarTotal = graphics.fillRect(60, 65, 120, 8);
        graphics.fillStyle(0x9cfa3e, 1);
        var healthBar = graphics.fillRect(60, 65, 120 * health / maxHealth, 8);
        var healthText = this.parent.add.text(60,
                                              80,
                                              String(health) + '/' + String(maxHealth) + ' HP',
                                              {color:'#454545', fontSize: '16px'});

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
        this.container.add([mainMon]);
    }

    constructAltMon(i) {
        var graphics = this.parent.add.graphics();
        var altMon = this.parent.add.container(constants.width * 3 / 5, constants.height * (i - 1) / 5 + 20);
        graphics.fillStyle(constants.COLOR_PRIMARY, 1);
        var rect = graphics.fillRoundedRect(0, 0, 200, ALT_MON_RECT_HEIGHT, 8);
        graphics.lineStyle(this.current === i ? 3 : 1, constants.COLOR_DARK);
        var border = graphics.strokeRoundedRect(0, 0, 200, ALT_MON_RECT_HEIGHT, 8);

        if (this.party[i].speciesId != 0) {
            var name = this.parent.add.text(60, 10, this.partyNames[i], {color:'#454545', fontSize: '16px'});
            var levelText = this.parent.add.text(160, 10, 'Lv5', {color:'#454545', fontSize: '14px'});

            graphics.fillStyle(0xadadad, 1);
            var spriteEllipse = graphics.fillEllipse(30, 50, 45, 20);
            var sprite = this.parent.add.image(30,
                                               30,
                                               'mon_' + String(this.party[i]['speciesId']) + '_front')
                .setScale(1.2);

            graphics.lineStyle(2, constants.COLOR_DARK);
            var healthBarBorder = graphics.strokeRect(60, ALT_MON_HEALTH_Y, 120, 8);
            graphics.fillStyle(constants.COLOR_DARK, 1);
            var healthBarTotal = graphics.fillRect(60, ALT_MON_HEALTH_Y, 120, 8);
            graphics.fillStyle(0x9cfa3e, 1);

            var health = this.party[i].currentHP / 100;
            var maxHealth = this.party[i].maxHP / 100;
            var healthBar = graphics.fillRect(60, ALT_MON_HEALTH_Y, 120 * health / maxHealth, 8);
            var healthText = this.parent.add.text(60,
                                                  50,
                                                  String(health) + '/' + String(maxHealth) + ' HP',
                                                  {color:'#454545', fontSize: '16px'});
            altMon.add([
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
        } else {
            altMon.add([
                rect,
                border,
            ]);
        }

        this.container.add([altMon]);
    }

    construct() {
        if (typeof this.container !== 'undefined') this.destroy();
        this.container = this.parent.add.container(0, 0)
            .setScrollFactor(0, 0);
        this.constructMainMon();
        for (var i = 1; i < 6; ++i) this.constructAltMon(i);
    }

    destroy() {
        this.container.destroy();
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.destroy();
    }

    consumeZ() {
        // spawn the monSwapOption box, which will handle state transitions and action consumption for monSwap
        // flow should be
        // open monSwap -> select mon to swap -> select other mon -> swap mons
        if (this.parent.timer.timer('menu')) {
            if (this.state === 'SELECT') {
                this.monSwapOption.construct();
            } else if (this.state === 'SWAP') {
                // do the swap with the selected mons and cleanup
                console.log('swapping mons', this.selectedMon, this.current);
                this.socket.emit('swapPartyMember', this.selectedMon, this.current);
                this.cleanup();
            } else {
                console.warn("monSwap currently does not support the current state!");
            }
        }
    }

    cleanup() {
        this.state = 'SELECT';
        this.selectedMon = undefined;
        this.current = 0;
    }

    isActive() {
        return (typeof this.container === 'undefined') ? false : this.container.active;
    }
}
