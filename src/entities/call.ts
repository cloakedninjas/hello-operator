import Port from './port';
import * as config from '../config.json';

export default class Call {
    scene: Phaser.Scene;
    source: Port;
    destination: Port;
    script: string;

    callerTimer: Phaser.Time.TimerEvent;

    active = true; // call in progress, but not yet connected
    connected = false;
    complete = false;
    successful = false;

    constructor(scene: Phaser.Scene, source: Port, destination: Port) {
        this.scene = scene;
        this.source = source;
        this.destination = destination;
        this.script = `Hello, put me through to ${destination.number}`;

        this.source.setCall(this);

        // timeout for successful connection to be made
        this.callerTimer = scene.time.addEvent({
            delay: Phaser.Math.Between(config.calls.giveUpWaitingOperatorTime.min, config.calls.giveUpWaitingOperatorTime.max),
            callback: this.giveUpWaiting,
            callbackScope: this
        });
    }

    operatorListening(): void {
        if (this.active && this.connected) {
            // overheard conversation
            // todo
            console.log('overhearing conversation');
        } else {
            this.callerTimer.destroy();
            this.callerTimer = this.scene.time.addEvent({
                delay: Phaser.Math.Between(config.calls.giveUpWaitingConnect.min, config.calls.giveUpWaitingConnect.max),
                callback: this.giveUpWaiting,
                callbackScope: this
            });
            // todo
            console.log(this.script);
            this.destination.tint = 0x333333;
        }
    }

    destinationRung(portConnectedTo: Port): void {
        // after short delay, connect call
        this.callerTimer.destroy();
        this.callerTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(config.calls.ringDelay.min, config.calls.ringDelay.max),
            callback: this.connectCall.bind(this, portConnectedTo)
        });
    }

    disconnect(): void {
        this.callerTimer.destroy();
        this.endCall(false);
    }

    private giveUpWaiting(): void {
        this.endCall(false);
    }

    private connectCall(portConnectedTo: Port): void {
        if (this.destination !== portConnectedTo) {
            // wrong port
            this.endCall(false);
        } else {
            this.connected = true;
            this.callerTimer = this.scene.time.addEvent({
                delay: Phaser.Math.Between(config.calls.callDuration.min, config.calls.callDuration.max),
                callback: this.completeCall,
                callbackScope: this
            });
        }
    }

    private completeCall(): void {
        this.endCall(true);
    }

    private endCall(success: boolean): void {
        if (this.complete) {
            return;
        }

        console.log('call end', success ? 'success' : 'failure');
        this.successful = success;
        this.active = false;
        this.connected = false;
        this.complete = true;

        this.source.removeCaller();
        this.destination.removeCaller();
    }
}