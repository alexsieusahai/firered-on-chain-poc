import { Consumer } from './consumer.js';

export class Dialog extends Consumer {
    constructor(parentScene) {
        super();
        this.parent = parentScene;
    }

    consumeZ() {
        if (this.parent.timer.timer('dialog')) {
            if (this.textBox.isTyping) this.textBox.stop(true);
            else this.textBox.isLastPage ? this.textBox.destroy() : this.textBox.typeNextPage();
        }
    }

    isActive() {
        return typeof this.textBox !== 'undefined' && this.textBox.active;
    }
}
