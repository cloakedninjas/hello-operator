import * as config from '../config.json';

export default class Port extends Phaser.GameObjects.Sprite {
    isCablePluggedIn: boolean;
    hasCaller: boolean;
    cableType: string;
    indexPosition: Phaser.Types.Math.Vector2Like;
    number: string;

    constructor(scene: Phaser.Scene, posX: number, posY: number) {
        const x = (posX * (config.ports.width + config.ports.padding)) + config.ports.x;
        const y = (posY * (config.ports.height + config.ports.padding)) + config.ports.y;

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
    }

    highlight(): void {
        this.tint = 0x422241;
    }

    removeHighlight(): void {
        this.clearTint();
    }

    removeCaller(): void {
        this.hasCaller = false;
    }
}