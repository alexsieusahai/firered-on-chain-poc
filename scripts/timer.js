export class Timer {
    constructor(phaser) {
        this.phaser = phaser;
        this.cooldowns = {
            'movement' : 100,
        };
        this.lastTime = {};
        for (var name in this.cooldowns) {
            this.lastTime[name] = 0;
        };
    }

    timer(key) {
        var delta = Date.now() - this.lastTime[key];
        if ((delta > this.cooldowns[key]) || isNaN(delta)) {
            this.lastTime[key] = Date.now();
            return true;
        }
        return false;
    }
}
