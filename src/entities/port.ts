import * as config from '../config.json';
import Call from './call';

export default class Port extends Phaser.GameObjects.Sprite {
    isCablePluggedIn: boolean;
    callInProgress: Call;
    cableType: string;
    indexPosition: Phaser.Types.Math.Vector2Like;
    number: string;

    constructor(scene: Phaser.Scene, posX: number, posY: number) {
        const x = (posX * (config.ports.width + config.ports.padding)) + config.ports.xOffset;
        const y = (posY * (config.ports.height + config.ports.padding)) + config.ports.yOffset;

        super(scene, x, y, 'port');

        this.setOrigin(0, 0);
        this.setInteractive();
        this.indexPosition = {
            x: posX,
            y: posY
        }

        this.number = `${config.numberStartCol + posX}${config.numberStartRow + posY}`;
    }

    plugCableIn(cableType: string): void {
        this.isCablePluggedIn = true;
        this.cableType = cableType;
    }

    unplug(): void {
        this.isCablePluggedIn = false;
        this.cableType = null;

        if (this.callInProgress) {
            this.callInProgress.disconnect();
        }
    }

    highlight(): void {
        this.tint = 0x422241;
    }

    removeHighlight(): void {
        this.clearTint();
    }

    setCall(call: Call): void {
        this.callInProgress = call;
        this.tint = 0x4400ee;
    }

    removeCaller(): void {
        this.clearTint();
        this.callInProgress = null;
    }
}