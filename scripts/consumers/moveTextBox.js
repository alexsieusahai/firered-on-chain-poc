import { OptionTextBox } from './optionTextBox.js';
import { createTextBox } from '../textbox.js';
import { Constants } from '../constants.js';
import { getTypeString } from '../utils.js';
let constants = new Constants();

const MOVESET_BOX_HEIGHT = 80;
export class MoveTextBox extends OptionTextBox {
    constructor(parentScene, moves, partyUI, socket) {
        super(parentScene,
              moves,
              {
                  x: 5,
                  y: constants.height - 5,
                  fixedWidth: constants.width * 2/3 - 20,
                  fixedHeight: MOVESET_BOX_HEIGHT,
                  fontSize: '20px',
                  lineSpacing: 20,
                  columns: 2,
                  columnWidth: 12
              });
        this.state = 'ACTION';
        this.partyUI = partyUI;
        this.socket = socket;

        this.parent.events.on('currentMon', mon =>
            {
                this.mon = mon;
                this.construct();
            });
    }

    construct() {
        switch (this.state) {
        case "FIGHT":
            this.options = this.mon["moveset"];
            break;
        case "ACTION":
            this.options = ["FIGHT", "BAG", "MONS", "FLEE"];
            break;
        default:
            this.options = ['?', '?', '?', '?'];
            break;
        }

        super.construct();

        var currentMove = this.current;
        var currentPP = this.mon['currentPP'][currentMove];
        var maxPP = this.mon['maxPP'][currentMove];
        var typeInt = this.mon['movesetTypes'][currentMove];
        var content = '\n';
        if (this.state === "FIGHT") {
            content = "PP " + String(currentPP);
            content += '/' + + String(maxPP) + '\nTYPE:' + getTypeString(typeInt);
        }
        createTextBox(this.parent, constants.width * 2/3, constants.height - 5, {
            wrapWidth: constants.width * 1/3 - 20,
            fixedWidth: constants.width * 1/3 - 20,
            fixedHeight: MOVESET_BOX_HEIGHT,
            fontSize: constants.BATTLE_FONTSIZE,
            lineSpacing: 15
        })
            .start(content, 0);
    }

    consumeZ() {
        if (this.parent.timer.timer('menu')) {
            if (this.state === "ACTION") {
                switch (this.current) {
                case 0:
                    this.state = "FIGHT";
                    break;
                case 1:
                    // this.state = "BAG";
                    console.warn("BAG NOT IMPLEMENTED IN UI");
                    break;
                case 2:
                    this.state = "MONS";
                    this.partyUI.construct();
                    this.partyUI.state = 'BATTLE';
                    this.parent.events.on('partyUISelected', () => {
                        console.log('mon selected; ingesting SWAP action on chain...');
                        this.socket.emit('battleIngestAction', {'action' : 3, 'slot' : this.partyUI.selectedMon});
                        this.partyUI.destroy();
                        this.state = "ACTION";
                    }, this);
                    break;
                case 3:
                    this.socket.emit('battleIngestAction', {'action' : 4, 'slot' : this.current});
                    this.ingestFlee();
                    break;
                default:
                    console.warn("menuState is in an invalid state");
                    break;
                }
            } else if (this.state === "FIGHT") {
                this.socket.emit('battleIngestAction', {'action' : 1, 'slot' : this.current});
            } else if (this.state === "MONS") {
            } else {
                console.warn("menuState", this.state, "NOT IMPLEMENTED IN UI");
            }
            this.construct();
        }
    }

    consumeX() {
        if (this.parent.timer.timer('menu')) {
            this.state = "ACTION";
            this.construct();
        }
    }

    ingestFlee() {
        // we handle this one on the frontend to avoid a race condition
        this.parent.events.emit('battleDialog', "Successfully fled!");
    }
}
