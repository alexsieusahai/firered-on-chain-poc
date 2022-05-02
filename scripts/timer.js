export class Timer {
    constructor() {
        this.cooldowns = {
            'movement' : 100,
            'dialog' : 100,
            'menu' : 100,
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
