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

    cableInHand: string;
    floatingCableEnd: GameObjects.Sprite;
    activeInCableLine: GameObjects.Graphics;
    activeOutCableLine: GameObjects.Graphics;
    portBeingHovered: Port;

    connectedInPort: Port;
    connectedOutPort: Port;

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
        this.bell.setInteractive();
        this.bell.on('pointerdown', this.ringDestination, this);
        this.add(this.bell, true);

        this.in = new GameObjects.Sprite(scene, x + 10, y, 'cable');
        this.in.setOrigin(0, 1);
        this.in.setInteractive();
        this.in.on('pointerdown', this.grabCable.bind(this, 'in'));
        this.add(this.in, true);

        this.out = new GameObjects.Sprite(scene, x + 60, y, 'cable');
        this.out.setOrigin(0, 1);
        this.out.setInteractive();
        this.out.on('pointerdown', this.grabCable.bind(this, 'out'));
        this.add(this.out, true);

        this.pluggedInIn = new GameObjects.Sprite(scene, x + 60, y, 'plugged_in');
        this.pluggedInIn.setOrigin(0);
        this.pluggedInIn.setInteractive();
        this.pluggedInIn.visible = false;
        this.pluggedInIn.on('pointerdown', this.unplugCable.bind(this, 'in'));
        this.add(this.pluggedInIn, true);

        this.pluggedInOut = new GameObjects.Sprite(scene, x + 60, y, 'plugged_in');
        this.pluggedInOut.setOrigin(0);
        this.pluggedInOut.setInteractive();
        this.pluggedInOut.visible = false;
        this.pluggedInOut.on('pointerdown', this.unplugCable.bind(this, 'out'));
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
        this.scene.input.on('pointermove', this.moveCable, this);
    }

    grabCable(cable: string, pointer: Phaser.Input.Pointer): void {
        this.cableInHand = cable;
        this.getSourceCable(cable).visible = false;
        this.getActiveCableLine(cable).visible = true;
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

    moveCable(pointer: Phaser.Input.Pointer): void {
        if (!this.cableInHand) {
            return;
        }

        this.floatingCableEnd.setPosition(pointer.x, pointer.y);

        //todo fix
        this.drawCableLine({
            x: this.floatingCableEnd.x + (this.floatingCableEnd.width / 2),
            y: this.floatingCableEnd.y + this.floatingCableEnd.height
        });

        this.portBeingHovered = this.scene.getPortAt(pointer.x, pointer.y);

        if (!this.portBeingHovered) {
            this.scene.clearPortHighlight();
        }
    }

    releaseCable(): void {
        if (!this.cableInHand) {
            return;
        }

        this.floatingCableEnd.visible = false;

        if (this.portBeingHovered && !this.portBeingHovered.isCablePluggedIn) {
            // cable got plugged in
            this.plugCableIn(this.cableInHand, this.portBeingHovered);
            this.portBeingHovered.plugCableIn(this.cableInHand);

        } else {
            // cable springs back to origin
            this.getSourceCable(this.cableInHand).visible = true;
            this.getActiveCableLine(this.cableInHand).visible = false;
        }

        this.cableInHand = null;
    }

    private drawCableLine(toPos: Phaser.Types.Math.Vector2Like): void {
        const sourceCable = this.getSourceCable(this.cableInHand);
        const activeCableLine = this.getActiveCableLine(this.cableInHand);

        activeCableLine.clear();
        activeCableLine.lineStyle(5, 0xff0000);

        activeCableLine.lineBetween(
            sourceCable.x + (sourceCable.width / 2), sourceCable.y,
            toPos.x, toPos.y
        );
    }

    private getSourceCable(cableInHand: string): GameObjects.Sprite {
        return cableInHand === 'in' ? this.in : this.out;
    }

    private getActiveCableLine(cableInHand: string): GameObjects.Graphics {
        return cableInHand === 'in' ? this.activeInCableLine : this.activeOutCableLine;
    }

    private getPluggedInEnd(cableInHand: string): GameObjects.Sprite {
        return cableInHand === 'in' ? this.pluggedInIn : this.pluggedInOut;
    }

    private getPortForCable(cable: string): Port {
        return cable === 'in' ? this.connectedInPort : this.connectedOutPort;
    }

    private plugCableIn(cableInHand: string, port: Port) {
        const end = this.getPluggedInEnd(cableInHand);

        if (cableInHand === 'in') {
            this.connectedInPort = port;

            if (port.callInProgress) {
                port.callInProgress.operatorListening();
            }
        } else {
            this.connectedOutPort = port;
        }

        end.visible = true;
        end.setPosition(this.portBeingHovered.x, this.portBeingHovered.y);

        this.drawCableLine({
            x: end.x + (end.width / 2),
            y: end.y + end.height
        });
        this.scene.clearPortHighlight();
    }

    private unplugCable(cable: string): void {
        this.getActiveCableLine(cable).visible = false;
        this.getPluggedInEnd(cable).visible = false;
        this.getSourceCable(cable).visible = true;
        this.getPortForCable(cable).unplug();

        if (cable === 'in') {
            this.connectedInPort = null;
        } else {
            this.connectedOutPort = null;
        }
    }

    private ringDestination(): void {
        if (this.connectedInPort && this.connectedOutPort && this.connectedInPort.callInProgress) {
            // only allow ring when both connected
            this.connectedInPort.callInProgress.destinationRung(this.connectedOutPort);
        }
    }
}