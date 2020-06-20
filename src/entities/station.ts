import { GameObjects } from 'phaser';
import { Game as GameScene } from '../scenes/game';
import Port from './port';

export default class Station extends GameObjects.Group {
    scene: GameScene;
    bg: GameObjects.Sprite
    switch: GameObjects.Sprite
    bell: GameObjects.Sprite

    sourceCable: GameObjects.Sprite
    destCable: GameObjects.Sprite
    pluggedInIn: GameObjects.Sprite
    pluggedInOut: GameObjects.Sprite

    colour: string;
    operatorWiredIn = true;
    cableInHand: string;
    floatingCableEnd: GameObjects.Sprite;
    activeInCableLine: GameObjects.Graphics;
    activeOutCableLine: GameObjects.Graphics;
    portBeingHovered: Port;

    connectedInPort: Port;
    connectedOutPort: Port;

    constructor(scene: GameScene, x: number, y: number, colour: string) {
        super(scene, {
            runChildUpdate: true
        });

        this.scene = scene;
        this.colour = colour;

        this.bg = new GameObjects.Sprite(scene, x, y, 'station');
        this.bg.setOrigin(0);
        this.add(this.bg, true);

        this.switch = new GameObjects.Sprite(scene, x + 10, y + 90, 'switch_left');
        this.switch.setOrigin(0);
        this.switch.setInteractive();
        this.switch.on('pointerdown', this.flipSwitch, this);
        this.add(this.switch, true);

        this.bell = new GameObjects.Sprite(scene, x + 60, y + 90, 'button');
        this.bell.setOrigin(0);
        this.bell.setInteractive();
        this.bell.on('pointerdown', this.ringDestination, this);
        this.add(this.bell, true);

        this.sourceCable = new GameObjects.Sprite(scene, x + 10, y, `plug_${colour}`);
        this.sourceCable.setOrigin(0, 1);
        this.sourceCable.setInteractive();
        this.sourceCable.on('pointerdown', this.grabCable.bind(this, 'in'));
        this.add(this.sourceCable, true);

        this.destCable = new GameObjects.Sprite(scene, x + 60, y, `plug_${colour}`);
        this.destCable.setOrigin(0, 1);
        this.destCable.setInteractive();
        this.destCable.on('pointerdown', this.grabCable.bind(this, 'out'));
        this.add(this.destCable, true);

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
        this.getCable(cable).visible = false;
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
            this.getCable(this.cableInHand).visible = true;
            this.getActiveCableLine(this.cableInHand).visible = false;
        }

        this.cableInHand = null;
    }

    private drawCableLine(toPos: Phaser.Types.Math.Vector2Like): void {
        const sourceCable = this.getCable(this.cableInHand);
        const activeCableLine = this.getActiveCableLine(this.cableInHand);

        activeCableLine.clear();
        activeCableLine.lineStyle(5, 0xff0000);

        activeCableLine.lineBetween(
            sourceCable.x + (sourceCable.width / 2), sourceCable.y,
            toPos.x, toPos.y
        );
    }

    private getCable(cableInHand: string): GameObjects.Sprite {
        return cableInHand === 'in' ? this.sourceCable : this.destCable;
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

            if (port.callInProgress && this.operatorWiredIn) {
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
        this.getCable(cable).visible = true;
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

    private flipSwitch(): void {
        this.operatorWiredIn = !this.operatorWiredIn;

        if (this.connectedInPort && this.connectedInPort.callInProgress && this.operatorWiredIn) {
            this.connectedInPort.callInProgress.operatorListening();
        }
    }
}