import { GameObjects } from 'phaser';

export default class Station extends GameObjects.Group {

    bg: GameObjects.Sprite
    knob: GameObjects.Sprite
    bell: GameObjects.Sprite
    in: GameObjects.Sprite
    out: GameObjects.Sprite

    cableInUse: GameObjects.Sprite;
    floatingCableEnd: GameObjects.Sprite;
    activeInCableLine: GameObjects.Graphics;
    activeOutCableLine: GameObjects.Graphics;
    canPlugIn: boolean;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, {
            runChildUpdate: true
        });

        this.bg = new GameObjects.Sprite(scene, x, y, 'station');
        this.bg.setOrigin(0);
        this.add(this.bg, true);

        this.knob = new GameObjects.Sprite(scene, x + 10, y + 90, 'knob');
        this.knob.setOrigin(0);
        this.add(this.knob, true);

        this.bell = new GameObjects.Sprite(scene, x + 60, y + 90, 'bell');
        this.bell.setOrigin(0);
        this.add(this.bell, true);

        this.in = new GameObjects.Sprite(scene, x + 10, y, 'cable');
        this.in.setOrigin(0, 1);
        this.in.setInteractive();
        this.in.on('pointerdown', this.grabCable.bind(this, this.in));
        this.add(this.in, true);

        this.out = new GameObjects.Sprite(scene, x + 60, y, 'cable');
        this.out.setOrigin(0, 1);
        this.out.setInteractive();
        this.out.on('pointerdown', this.grabCable.bind(this, this.out));
        this.add(this.out, true);

        this.floatingCableEnd = new GameObjects.Sprite(scene, 0, 0, 'cable');
        this.floatingCableEnd.setOrigin(0, 0);
        this.floatingCableEnd.visible = false;
        this.add(this.floatingCableEnd, true);

        this.activeInCableLine = new GameObjects.Graphics(scene);
        this.add(this.activeInCableLine, true);

        this.activeOutCableLine = new GameObjects.Graphics(scene);
        this.add(this.activeOutCableLine, true);

        this.scene.input.on('pointerup', this.releaseCable, this);
        this.scene.input.on('pointermove', this.pullCable, this);
    }

    grabCable(cable: GameObjects.Sprite, pointer: Phaser.Input.Pointer): void {
        this.cableInUse = cable;
        this.cableInUse.visible = false;
        this.floatingCableEnd.visible = true;
        this.floatingCableEnd.setPosition(pointer.x, pointer.y);
        this.canPlugIn = true;

        this.drawCableLine();
    }

    releaseCable(): void {
        if (!this.cableInUse) {
            return;
        }

        const activeCableLine = this.cableInUse === this.in ? this.activeInCableLine : this.activeOutCableLine;

        this.cableInUse = null;
        this.floatingCableEnd.visible = false;

        if (this.canPlugIn) {
            // cable got plugged in
        } else {
            // cable springs back to origin
            activeCableLine.clear();
            this.cableInUse.visible = true;
        }
    }

    pullCable(pointer: Phaser.Input.Pointer): void {
        if (!this.cableInUse) {
            return;
        }

        this.floatingCableEnd.setPosition(pointer.x, pointer.y);
        this.drawCableLine();
    }

    private drawCableLine(): void {
        const activeCableLine = this.cableInUse === this.in ? this.activeInCableLine : this.activeOutCableLine;

        activeCableLine.clear();
        activeCableLine.lineStyle(5, 0xff0000);

        // todo set fixed offsets
        activeCableLine.lineBetween(
            this.cableInUse.x + (this.cableInUse.width / 2), this.cableInUse.y,
            this.floatingCableEnd.x + (this.floatingCableEnd.width / 2), this.floatingCableEnd.y + this.floatingCableEnd.height
        );
    }
}