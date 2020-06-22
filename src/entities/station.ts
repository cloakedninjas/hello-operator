import { GameObjects } from 'phaser';
import { Game as GameScene } from '../scenes/game';
import Port from './port';
import * as config from '../config.json';

const cableEndOffset = 68;
const gapBetweenSockets = 40;

export default class Station extends GameObjects.Group {
    scene: GameScene;
    socketIn: GameObjects.Sprite
    socketOut: GameObjects.Sprite
    switch: GameObjects.Sprite
    bell: GameObjects.Sprite

    sourceLight: GameObjects.Sprite;
    destLight: GameObjects.Sprite;

    sourceCable: GameObjects.Sprite
    destCable: GameObjects.Sprite
    pluggedInIn: GameObjects.Sprite
    pluggedInOut: GameObjects.Sprite

    colour: string;
    operatorWiredIn = false;
    cableInHand: string;
    floatingCableEnd: GameObjects.Sprite;
    activeInCableLine: GameObjects.Graphics;
    activeOutCableLine: GameObjects.Graphics;
    portBeingHovered: Port;

    connectedInPort: Port;
    connectedOutPort: Port;

    bellSound: Phaser.Sound.BaseSound;

    cableOutineColour = {
        'red': 0x3c0803,
        'white': 0x303030,
        'green': 0x001e11
    };

    cableColour = {
        'red': 0xba3d2e,
        'white': 0xc0c0c0,
        'green': 0x00704f
    };

    constructor(scene: GameScene, x: number, y: number, colour: string) {
        super(scene, {
            runChildUpdate: true
        });

        this.scene = scene;
        this.colour = colour;

        const componentX = x + 16;
        const lightY = y + 40;
        const switchY = y + 70;

        this.socketIn = new GameObjects.Sprite(scene, componentX, y, 'plug_socket');
        this.socketIn.setOrigin(0.5, 1);
        this.add(this.socketIn, true);

        this.socketOut = new GameObjects.Sprite(scene, componentX + gapBetweenSockets, y, 'plug_socket');
        this.socketOut.setOrigin(0.5, 1);
        this.add(this.socketOut, true);

        this.sourceLight = new GameObjects.Sprite(scene, componentX, lightY, `light_${colour}_unlit`);
        this.sourceLight.setOrigin(0.5, 1);
        this.add(this.sourceLight, true);

        this.destLight = new GameObjects.Sprite(scene, componentX + gapBetweenSockets, lightY, `light_${colour}_unlit`);
        this.destLight.setOrigin(0.5, 1);
        this.add(this.destLight, true);

        this.switch = new GameObjects.Sprite(scene, componentX, switchY, 'switch_left');
        this.switch.setInteractive();
        this.switch.on('pointerdown', this.flipSwitch, this);
        this.add(this.switch, true);

        this.bell = new GameObjects.Sprite(scene, componentX + gapBetweenSockets, switchY, 'button');
        this.bell.setOrigin(0.5, 0.4);
        this.bell.setInteractive();
        this.bell.on('pointerdown', this.ringDestination, this);
        this.bell.on('pointerup', () => {
            this.bell.setTexture('button');
            scene.tweens.add({
                targets: this.bellSound,
                props: {
                    volume: 0
                },
                duration: 100
            });
        });
        this.add(this.bell, true);

        this.sourceCable = new GameObjects.Sprite(scene, componentX, y, `plug_${colour}`);
        this.sourceCable.setOrigin(0.5, 1);
        this.sourceCable.setInteractive();
        this.sourceCable.on('pointerdown', this.grabCable.bind(this, 'in'));
        this.add(this.sourceCable, true);

        this.destCable = new GameObjects.Sprite(scene, componentX + gapBetweenSockets, y, `plug_${colour}`);
        this.destCable.setOrigin(0.5, 1);
        this.destCable.setInteractive();
        this.destCable.on('pointerdown', this.grabCable.bind(this, 'out'));
        this.add(this.destCable, true);

        this.pluggedInIn = new GameObjects.Sprite(scene, x + 60, y, `plugged_${this.colour}`);
        this.pluggedInIn.setOrigin(0.5, 0.65);
        this.pluggedInIn.setInteractive();
        this.pluggedInIn.visible = false;
        this.pluggedInIn.on('pointerdown', this.unplugCable.bind(this, 'in'));
        this.add(this.pluggedInIn, true);

        this.pluggedInOut = new GameObjects.Sprite(scene, x + 60, y, `plugged_${this.colour}`);
        this.pluggedInOut.setOrigin(0.5, 0.65);
        this.pluggedInOut.setInteractive();
        this.pluggedInOut.visible = false;
        this.pluggedInOut.on('pointerdown', this.unplugCable.bind(this, 'out'));
        this.add(this.pluggedInOut, true);

        this.floatingCableEnd = new GameObjects.Sprite(scene, 0, 0, `plug_${this.colour}_cursor`);
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
        this.floatingCableEnd.setPosition(
            pointer.x - config.cablePointerOffset.x,
            pointer.y - config.cablePointerOffset.y);

        this.scene.children.bringToTop(this.floatingCableEnd);
        this.scene.children.bringToTop(this.activeOutCableLine);

        this.drawCableLine({
            x: this.floatingCableEnd.x + cableEndOffset,
            y: this.floatingCableEnd.y + cableEndOffset
        });
    }

    moveCable(pointer: Phaser.Input.Pointer): void {
        if (!this.cableInHand) {
            return;
        }

        this.floatingCableEnd.setPosition(
            pointer.x - config.cablePointerOffset.x,
            pointer.y - config.cablePointerOffset.y);

        this.drawCableLine({
            x: this.floatingCableEnd.x + cableEndOffset,
            y: this.floatingCableEnd.y + cableEndOffset
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

        if (this.portBeingHovered && !this.portBeingHovered.stationHandlingCall) {
            // cable got plugged in
            this.plugCableIn(this.cableInHand, this.portBeingHovered);

        } else {
            // cable springs back to origin
            this.getCable(this.cableInHand).visible = true;
            this.getActiveCableLine(this.cableInHand).visible = false;
            this.scene.sound.play('releaseplug');
        }

        this.cableInHand = null;
    }

    private drawCableLine(toPos: Phaser.Types.Math.Vector2Like): void {
        const activeCable = this.getCable(this.cableInHand);
        const activeCableLine = this.getActiveCableLine(this.cableInHand);

        activeCableLine.clear();
        activeCableLine.lineStyle(7, this.cableOutineColour[this.colour]);
        activeCableLine.lineBetween(
            activeCable.x, activeCable.y - 2,
            toPos.x, toPos.y
        );

        activeCableLine.lineStyle(5, this.cableColour[this.colour]);
        activeCableLine.lineBetween(
            activeCable.x, activeCable.y - 2,
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
        const cable = this.getCable(cableInHand);

        // inform Port they have cable
        port.plugCableIn(this, this.cableInHand);

        if (cableInHand === 'in') {
            this.connectedInPort = port;

            if (port.callInProgress) {
                this.toggleLight('in', true);
                this.scene.updateCallStatus('connect_to_caller');

                port.callInProgress.operatorListening(this.operatorWiredIn);
            }
        } else {
            this.connectedOutPort = port;
        }

        end.visible = true;
        end.setPosition(this.portBeingHovered.x, this.portBeingHovered.y);

        this.drawCableLine({
            x: end.x,
            y: end.y - 5
        });
        this.scene.children.bringToTop(cable);
        this.scene.clearPortHighlight();

        this.scene.sound.play(`plugin${Phaser.Math.Between(1, 2)}`);
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

        this.toggleLight(cable, false);
        this.scene.sound.play('releaseplug');
    }

    private ringDestination(): void {
        this.bell.setTexture('button_pressed');
        if (this.connectedInPort && this.connectedOutPort && this.connectedInPort.callInProgress) {
            // only allow ring when both connected
            this.connectedInPort.callInProgress.destinationRung(this.connectedOutPort);
        }

        if (this.bellSound) {
            this.bellSound.stop();
        }
        this.bellSound = this.scene.sound.get('ringerloop');
        this.bellSound.play({
            volume: 1,
            loop: true
        });
    }

    private flipSwitch(): void {
        this.operatorWiredIn = !this.operatorWiredIn;

        this.switch.setTexture(this.operatorWiredIn ? 'switch_right' : 'switch_left');

        if (this.connectedInPort && this.connectedInPort.callInProgress) {
            this.connectedInPort.callInProgress.operatorListening(this.operatorWiredIn);
        }

        if (this.operatorWiredIn) {
            this.scene.sound.play('talkswitchon');
        } else {
            this.scene.sound.play('talkswitchoff');
        }
    }

    toggleLight(whichLight: string, on: boolean): void {
        const light = whichLight === 'in' ? this.sourceLight : this.destLight;
        const texture = on ? `light_${this.colour}_lit` : `light_${this.colour}_unlit`;
        light.setTexture(texture);
    }
}