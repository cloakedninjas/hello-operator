import Port from './port';
import { Game as GameScene } from '../scenes/game';
import * as config from '../config.json';

const personASpeechY = 500;
const personBSpeechY = 200;

export default class Call {
    scene: GameScene;
    source: Port;
    destination: Port;
    conversation: string[];
    personASpeaking: boolean;

    speechBubble: Phaser.GameObjects.Sprite;
    speechText: Phaser.GameObjects.Text;
    speechTimer: Phaser.Time.TimerEvent;

    callerTimer: Phaser.Time.TimerEvent;
    initTime: number;
    endTime: number;

    active = true; // call in progress, but not yet connected
    connected = false;
    complete = false;
    successful = false;
    words: string[];

    constructor(scene: GameScene, source: Port, destination: Port, conversation: string) {
        this.scene = scene;
        this.source = source;
        this.destination = destination;

        this.personASpeaking = true;
        this.conversation = conversation.split('\r\n');

        this.initTime = scene.time.now;
        this.source.receiveIncommingCall(this);
        this.destination.expectCall();

        const speechX = 200;
        this.speechBubble = new Phaser.GameObjects.Sprite(scene, speechX, personASpeechY, 'speech_bubble');
        this.speechText = new Phaser.GameObjects.Text(scene, speechX, personASpeechY, '', {
            fontFamily: 'Arial',
            fontSize: 'bold 12px',
            color: '#000',
            align: 'center',
            wordWrap: {
                width: 350
            }
        });
        this.speechBubble.setOrigin(0.5, 0.4);
        this.speechText.setOrigin(0.5);
        this.speechBubble.visible = false;
        this.speechText.visible = false;

        scene.add.existing(this.speechBubble);
        scene.add.existing(this.speechText);

        // timeout for successful connection to be made
        this.callerTimer = scene.time.addEvent({
            delay: Phaser.Math.Between(config.calls.giveUpWaitingOperatorTime.min, config.calls.giveUpWaitingOperatorTime.max),
            callback: this.giveUpWaiting,
            callbackScope: this
        });
    }

    operatorListening(isOperatorListening: boolean): void {
        this.showDialog(isOperatorListening);

        if (!(this.active && this.connected)) {
            this.callerTimer.destroy();
            this.callerTimer = this.scene.time.addEvent({
                delay: Phaser.Math.Between(config.calls.giveUpWaitingConnect.min, config.calls.giveUpWaitingConnect.max),
                callback: this.giveUpWaiting,
                callbackScope: this
            });

            this.textType(`Hello, put me through to ${this.destination.number}`)
            // todo - remove
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
        this.endTime = this.scene.time.now;
    }

    disconnect(): void {
        console.log('operator disconnected live call');
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
            portConnectedTo.connectCall(this);

            this.connected = true;

            this.playConversation();
        }
    }

    completeCall(): void {
        this.endCall(true);
    }

    private showDialog(show: boolean): void {
        this.speechBubble.visible = show;
        this.speechText.visible = show;
    }

    private playConversation(): void {
        const text = this.conversation.shift();

        // alternate speaker
        this.speechText.text = '';
        this.personASpeaking = !this.personASpeaking;
        this.speechBubble.toggleFlipX();
        this.scene.children.bringToTop(this.speechBubble);
        this.scene.children.bringToTop(this.speechText);

        if (this.personASpeaking) {
            this.speechBubble.y = personASpeechY;
            this.speechText.y = personASpeechY;
        } else {
            this.speechBubble.y = personBSpeechY;
            this.speechText.y = personBSpeechY;
        }

        this.textType(text, () => {
            if (this.conversation.length) {
                // still more conversation to have

                this.speechTimer = this.scene.time.addEvent({
                    delay: 1600,
                    callback: this.playConversation,
                    callbackScope: this
                });
            } else {
                // end of conversation
                this.completeCall();
            }
        });
    }

    private textType(sentence: string, done?: () => void): void {
        this.words = sentence.split(' ');
        this.textTypeAddWord(done);
    }

    private textTypeAddWord(done?: () => void): void {
        const word = this.words.shift();

        this.speechText.text += ' ' + word;

        if (this.words.length) {
            this.speechTimer = this.scene.time.addEvent({
                delay: 100,
                callback: this.textTypeAddWord.bind(this, done)
            });
        } else if (done) {
            done();
        }
    }

    private endCall(success: boolean): void {
        if (this.complete) {
            return;
        }

        if (!success) {
            this.scene.updateCallStatus('failed_call');
        }

        console.log('call end', success ? 'success' : 'failure');
        this.successful = success;
        this.active = false;
        this.connected = false;
        this.complete = true;

        // clean up game objects
        this.callerTimer.destroy();
        this.callerTimer = null;

        if (this.speechTimer) {
            this.speechTimer.destroy();
            this.speechTimer = null;
        }

        this.speechBubble.destroy();
        this.speechBubble = null;
        this.speechText.destroy();
        this.speechText = null;

        this.source.removeCall();
        this.destination.removeCall();

        if (this.source.stationHandlingCall) {
            this.source.stationHandlingCall.turnLightOn('in', false);
            this.source.stationHandlingCall.turnLightOn('out', false);
        }
    }
}