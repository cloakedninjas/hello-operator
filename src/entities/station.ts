import { GameObjects } from 'phaser';
import { Game as GameScene } from '../scenes/game';
import Port from './port';

export default class Station extends GameObjects.Group {
    scene: GameScene;
    bg: GameObjects.Sprite
    knob: GameObjects.Sprite
    bell: GameObjects.Sprite
    in: GameObjects.Sprite
    out: GameObjects.Sprite
    pluggedInIn: GameObjects.Sprite
    pluggedInOut: GameObjects.Sprite

    cableInUse: GameObjects.Sprite;
    floatingCableEnd: GameObjects.Sprite;
    activeInCableLine: GameObjects.Graphics;
    activeOutCableLine: GameObjects.Graphics;
    usablePort: Port;

    constructor(scene: GameScene, x: number, y: number) {
        super(scene, {
            runChildUpdate: true
        });

        this.scene = scene;

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

        this.pluggedInIn = new GameObjects.Sprite(scene, x + 60, y, 'plugged_in');
        this.pluggedInIn.setOrigin(0);
        this.pluggedInIn.setInteractive();
        this.pluggedInIn.visible = false;
        this.pluggedInIn.on('pointerdown', this.unplugCable.bind(this, this.in));
        this.add(this.pluggedInIn, true);

        this.pluggedInOut = new GameObjects.Sprite(scene, x + 60, y, 'plugged_in');
        this.pluggedInOut.setOrigin(0);
        this.pluggedInOut.setInteractive();
        this.pluggedInOut.visible = false;
        this.pluggedInOut.on('pointerdown', this.unplugCable.bind(this, this.out));
        this.add(this.pluggedInOut, true);

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
        this.scene.children.bringToTop(this.activeOutCableLine);
        this.scene.children.bringToTop(this.floatingCableEnd);

        // todo fix
        this.drawCableLine({
            x: this.floatingCableEnd.x + (this.floatingCableEnd.width / 2),
            y: this.floatingCableEnd.y + this.floatingCableEnd.height
        });
    }

    pullCable(pointer: Phaser.Input.Pointer): void {
        if (!this.cableInUse) {
            return;
        }

        this.floatingCableEnd.setPosition(pointer.x, pointer.y);

        //todo fix
        this.drawCableLine({
            x: this.floatingCableEnd.x + (this.floatingCableEnd.width / 2),
            y: this.floatingCableEnd.y + this.floatingCableEnd.height
        });

        this.usablePort = this.scene.getPortAt(pointer.x, pointer.y);

        if (!this.usablePort) {
            this.scene.clearPortHighlight();
        }
    }

    releaseCable(): void {
        if (!this.cableInUse) {
            return;
        }

        this.floatingCableEnd.visible = false;

        if (this.usablePort && this.usablePort.canBeUsed()) {
            // cable got plugged in
            this.plugCableIn(this.cableInUse);
            this.usablePort.setInUse(this.cableInUse === this.in ? 'in' : 'out');

        } else {
            // cable springs back to origin
            this.cableInUse.visible = true;
            this.getActiveCableLine(this.cableInUse).visible = false;
        }

        this.cableInUse = null;
    }

    private drawCableLine(toPos: Phaser.Types.Math.Vector2Like): void {
        const activeCableLine = this.getActiveCableLine(this.cableInUse);

        activeCableLine.clear();
        activeCableLine.lineStyle(5, 0xff0000);

        activeCableLine.lineBetween(
            this.cableInUse.x + (this.cableInUse.width / 2), this.cableInUse.y,
            toPos.x, toPos.y
        );
    }

    private getActiveCableLine(cableInUse: GameObjects.Sprite): GameObjects.Graphics {
        return cableInUse === this.in ? this.activeInCableLine : this.activeOutCableLine;
    }

    private getPluggedInEnd(cableInUse: GameObjects.Sprite): GameObjects.Sprite {
        return cableInUse === this.in ? this.pluggedInIn : this.pluggedInOut;
    }

    private plugCableIn(cableInUse: GameObjects.Sprite) {
        const end = this.getPluggedInEnd(cableInUse);

        end.visible = true;
        end.setPosition(this.usablePort.x, this.usablePort.y);

        this.drawCableLine({
            x: end.x + (end.width / 2),
            y: end.y + end.height
        });
        this.scene.clearPortHighlight();
    }

    private unplugCable(cable: GameObjects.Sprite): void {
        this.getActiveCableLine(cable).visible = false;
        this.getPluggedInEnd(cable).visible = false;
        cable.visible = true;
    }
}