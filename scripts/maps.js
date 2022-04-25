import { Constants } from './constants.js';
import { pallet_town } from './tilesets/pallet_town.js';
import { hero_home_1f } from './tilesets/hero_home_1f.js';
import { route_1 } from './tilesets/route_1.js';

var constants = new Constants();
var tilesets = {'pallet_town' : pallet_town, 'hero_home_1f' : hero_home_1f, 'route_1' : route_1};

export class Maps {
    constructor(phaser) {
        this.map = pallet_town;
        this.phaser = phaser;
        this.loadTrainer();
    }

    changeMap(map) {
        // console.log('changing map to', map);
        this.map = map;
        // console.log("map is now", this.map);
        this.paintTiles();
    }

    loadTrainer() {
        // TODO not insane way to do this when it comes to animations?
        this.phaser.load.image('trainer_0', 'assets/npcs/0_8.png');
    }

    loadTiles() {
        // TODO how to load entire tileset automatically?
        for (var mapname in tilesets) {
            console.log("loading tiles for", mapname);
            for (let x = 0; x < tilesets[mapname].dimensions[0]; x++) {
                for (let y = 0; y < tilesets[mapname].dimensions[1]; y++) {
                    var filename = x.toString() + '_' + y.toString();
                    this.phaser.load.image(mapname + filename,
                                           'assets/' + mapname + '/' + filename + '.png');
                }
            }
        }
    }

    paintTiles() {
        // character sits in the middle
        // everything else gets painted relative to character, character stays in center
        for (let x = 0; x < constants.screenTileWidth; x++) {
            for (let y = 0; y < constants.screenTileHeight; y++) {
                var relx = x + this.map['hero'][0] - constants.screenCenter[0];
                var rely = y + this.map['hero'][1] - constants.screenCenter[1];
                this.phaser.add.image(
                    x * constants.tsz,
                    y * constants.tsz,
                    this.map.name + relx.toString() + '_' + rely.toString());
            }
        }
        this.phaser.add.image(
            constants.tsz * constants.screenCenter[0] + 4,
            constants.tsz * constants.screenCenter[1] + 4,
            'trainer_0');
        console.log('done painting');
    }

    movementWithinBounds(x, y) {
        // check predefined collision box
        if (typeof this.map['collisions'][this.map['hero'][0] + x] !== 'undefined'
            &&
            typeof this.map['collisions'][this.map['hero'][0] + x][this.map['hero'][1] + y] !== 'undefined')
            return false;
        // this is now false, want to think about tileset size
        // if (this.map['hero'][0] + x >= constants.screenTileWidth || this.map['hero'][0] + x < 0)
        //     return false;
        // if (this.map['hero'][1] + y >= constants.screenTileHeight || this.map['hero'][1] + y < 0)
        //     return false;
        return true;
    }

    portalCheckAndHandle(x, y) {
        // if going to go into portal, just go there instead of moving
        // console.log("currmap", this.map);
        // console.log("portals", this.map['portals']);
        var newX = this.map['hero'][0] + x;
        var newY = this.map['hero'][1] + y;
        if (typeof this.map['portals'][newX] !== 'undefined'
            &&
            typeof this.map['portals'][newX][newY] !== 'undefined')
        {
            this.changeMap(tilesets[this.map['portals'][newX][newY]]);
            return true;
        }
        return false;
    }

    moveTrainer(x, y) {
        if (!this.portalCheckAndHandle(x, y)) {
            if (this.movementWithinBounds(x, y)) {
                // console.log(this.map['collisions'][this.map['hero'][0] + x]);
                this.map['hero'][0] += x;
                this.map['hero'][1] += y;
                this.paintTiles();
            }
        }
        console.log(this.map['hero'][0].toString() + ' ' + this.map['hero'][1].toString());
    }
}
