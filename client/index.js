const { SnapshotInterpolation } = Snap;
const SI = new SnapshotInterpolation(30); // 30 FPS

// okay, so the client should handle the rendering and THAT'S IT

class MainScene extends Phaser.Scene {
    constructor() {
        super();

        this.dudes = new Map();
        this.cursors;

        this.socket = io('http://localhost:3000');
        this.socket.on('connect', () => {
            console.log('id:', this.socket.id);
        });

    }
}
