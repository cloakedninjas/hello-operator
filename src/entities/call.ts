import Port from './port';
import * as config from '../config.json';

export default class Call {
    scene: Phaser.Scene;
    source: Port;
    destination: Port;
    script: string;

    active = true;
    connected = false;
    complete = false;
    successful = false;

    constructor(scene: Phaser.Scene, source: Port, destination: Port) {
        this.scene = scene;
        this.source = source;
        this.destination = destination;
        this.script = `Hello, put me through to ${destination.number}`;

        // call timeline

        // flash source port

        // when connected try playing script

        // start timeout for successful connection

        scene.time.addEvent({
            delay: Phaser.Math.Between(config.calls.giveUpWaitingTime.min, config.calls.giveUpWaitingTime.min),
            callback: this.giveUpWaiting,
            callbackScope: this
        })
    }

    private giveUpWaiting(): void {
        console.log('grew bored');
        this.active = false;
        this.connected = false;
        this.successful = false;
        this.connected = false;

        this.source.removeCaller();
        this.destination.removeCaller();
    }
}