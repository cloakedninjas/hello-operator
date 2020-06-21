import * as config from '../config.json';
import Call from './call';
import Station from './station';

export default class Port extends Phaser.GameObjects.Sprite {
    light: Phaser.GameObjects.Sprite;

    callInProgress: Call;
    stationHandlingCall: Station;
    cableType: string;
    indexPosition: Phaser.Types.Math.Vector2Like;
    number: string;
    lightFlash: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, posX: number, posY: number) {
        const x = (posX * (config.ports.width + config.ports.padding.x)) + config.ports.xOffset;
        const y = (posY * (config.ports.height + config.ports.padding.y)) + config.ports.yOffset;

        super(scene, x, y, 'switchboard_plug');

        this.setInteractive();
        this.indexPosition = {
            x: posX,
            y: posY
        }

        this.number = `${config.numberStartCol + posX}${config.numberStartRow + posY}`;

        this.light = new Phaser.GameObjects.Sprite(scene, x, y + 32, 'switchboard_light_unlit');
        scene.add.existing(this.light);
    }

    plugCableIn(station: Station, cableType: string): void {
        this.stationHandlingCall = station;
        this.cableType = cableType;

        if (this.callInProgress) {
            this.setLight(true);
        }
    }

    unplug(): void {
        this.stationHandlingCall = null;
        this.cableType = null;

        if (this.callInProgress) {
            this.callInProgress.disconnect();
            this.setLight(false);
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
        this.setLight(false);
    }

    flashLight(): void {
        this.lightFlash = this.scene.time.addEvent({
            delay: 300,
            callback: () => {
                this.light.setTexture(this.light.texture.key === 'switchboard_light_unlit' ? 'switchboard_light_lit' : 'switchboard_light_unlit');
            },
            loop: true
        });
    }

    setLight(on: boolean): void {
        if (this.lightFlash) {
            this.lightFlash.destroy();
        }

        this.light.setTexture(on ? 'switchboard_light_lit' : 'switchboard_light_unlit');
    }

    setStationLight(on: boolean): void {
        if (this.callInProgress && this.stationHandlingCall) {
            this.stationHandlingCall.turnLightOn('out', on);
        }
    }
}