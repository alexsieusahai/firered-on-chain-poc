import { Consumer } from './consumer.js';
import { Menu } from './menu.js';
import { createTextBox, getBBcodeText } from '../textbox.js';

const speed = 175;

export class Player extends Consumer {
    constructor(parentScene, colliderLayer, dialog, menu) {
        super();
        this.parent = parentScene;
        this.dialog = dialog;
        this.menu = menu;
        this.facingCoords = [0, 0];
        const spawnPoint = parentScene.map.findObject("MapMovement", obj => obj.name === "SpawnPoint");
        this.sprite = parentScene.physics.add
            .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-back")
            .setSize(30, 40)
            .setDisplaySize(20, 30)
            .setOffset(0, 24);
        parentScene.physics.add.collider(this.sprite, colliderLayer);
        this.setupAnims(parentScene);
    }

    setupAnims(parentScene) {
        const anims = parentScene.anims;
        anims.create({
            key: "misa-left-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-left-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-right-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-right-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-front-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-front-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-back-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-back-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }

    beforeConsume() {
        this.prevVelocity = this.sprite.body.velocity.clone();
        this.sprite.body.setVelocity(0);
        // + 8 magic - we want the tile relative to the player's head, this is a proxy for that
        this.currentTile = this.parent.map.getTileAtWorldXY(this.sprite.x, this.sprite.y + 8);
    }

    consumeA() {
        this.sprite.body.setVelocityX(-speed);
        this.facingCoords = [-1, 0];
        this.sprite.anims.play("misa-left-walk", true);
    }

    consumeD() {
        this.sprite.body.setVelocityX(speed);
        this.facingCoords = [1, 0];
        this.sprite.anims.play("misa-right-walk", true);
    }

    consumeW() {
        this.sprite.body.setVelocityY(-speed);
        this.facingCoords = [0, -1];
        this.sprite.anims.play("misa-back-walk", true);
    }

    consumeS() {
        this.sprite.body.setVelocityY(speed);
        this.facingCoords = [0, 1];
        this.sprite.anims.play("misa-front-walk", true);
    }

    consumeZ() {
        // handle spawning of dialog
        var facingTile = this.getFacingTile();
        if (typeof facingTile.properties['message'] !== 'undefined' && this.parent.timer.timer('dialog')) {
            this.dialog.textBox = createTextBox(this.parent,
                                           facingTile.pixelX - 10,
                                           facingTile.pixelY - 5,
                                           {wrapWidth: 100, fixedWidth: 100, indent: 8, radius: 8})
                .start(facingTile.properties['message'], 5);
        }
    }

    consumeC() {
        if (this.parent.timer.timer('menu')) this.menu.constructMenu();
    }

    isActive() {
        return true;
    }

    consumeNothing() {
        this.sprite.anims.stop();

        // If we were moving, pick and idle frame to use
        if (this.prevVelocity.x < 0)
        {
            this.sprite.setTexture("atlas", "misa-left");
        }
        else if (this.prevVelocity.x > 0)
        {
            this.sprite.setTexture("atlas", "misa-right");
        }
        else if (this.prevVelocity.y < 0) {
            this.sprite.setTexture("atlas", "misa-back");
        }
        else if (this.prevVelocity.y > 0) {
            this.sprite.setTexture("atlas", "misa-front");
        }
    }

    getFacingTile() {
        return this.parent.map.getTileAt(this.currentTile.x + this.facingCoords[0],
                                  this.currentTile.y + this.facingCoords[1]);
    }

};
