import Port from './port';
import { Game as GameScene } from '../scenes/game';
import * as config from '../config.json';

const speechX = 200;
const personASpeechY = 480;
const personBSpeechY = 100;
const avatarOffsetY = 180;
const avatarPersonAX = 100;
const avatarPersonBX = 285;

export default class Call {
    scene: GameScene;
    source: Port;
    destination: Port;
    conversation: string[];
    personASpeaking: boolean;

    speechBubble: Phaser.GameObjects.Sprite;
    speechText: Phaser.GameObjects.Text;
    speechTimer: Phaser.Time.TimerEvent;
    avatar: Phaser.GameObjects.Sprite;

    callerTimer: Phaser.Time.TimerEvent;
    failTimer: Phaser.Time.TimerEvent;

    initTime: number;
    endTime: number;

    active = true; // call in progress, but not yet connected
    connected = false;
    complete = false;
    successful = false;
    answered = false;
    dropped: boolean;

    words: string[];
    characters: number[];
    chatter: Phaser.Sound.BaseSound;

    constructor(scene: GameScene, source: Port, destination: Port, conversation: string) {
        this.scene = scene;
        this.source = source;
        this.destination = destination;

        this.personASpeaking = true;
        this.conversation = conversation.split('\r\n');

        this.initTime = scene.time.now;
        this.source.receiveIncommingCall(this);
        this.destination.expectCall();

        this.speechBubble = new Phaser.GameObjects.Sprite(scene, speechX, personASpeechY, 'speech_bubble');
        this.speechText = new Phaser.GameObjects.Text(scene, speechX, personASpeechY, '', {
            fontFamily: 'Josefin Sans',
            fontSize: '24px',
            fontStyle: 'italic',
            color: '#000',
            align: 'center',
            wordWrap: {
                width: 350
            }
        });
        this.speechBubble.setOrigin(0.5, 0.4);
        this.speechText.setOrigin(0.5);

        this.characters = [Phaser.Math.Between(1, config.characters)];

        let personB: number;

        while (personB === undefined || personB === this.characters[0]) {
            personB = Phaser.Math.Between(1, config.characters);
        }

        this.characters.push(personB);
        this.avatar = new Phaser.GameObjects.Sprite(scene, avatarPersonAX, personASpeechY + avatarOffsetY, `character_${this.characters[0]}`);

        this.speechBubble.visible = false;
        this.speechText.visible = false;
        this.avatar.visible = false;

        // start them flipped
        this.speechBubble.toggleFlipX();
        this.avatar.toggleFlipX();

        scene.add.existing(this.speechBubble);
        scene.add.existing(this.speechText);
        scene.add.existing(this.avatar);

        // timeout for successful connection to be made
        this.failTimer = scene.time.addEvent({
            delay: Phaser.Math.Between(config.calls.giveUpWaitingOperatorTime.min, config.calls.giveUpWaitingOperatorTime.max),
            callback: this.giveUpWaiting,
            callbackScope: this
        });
    }

    operatorListening(isOperatorListening: boolean): void {
        this.showDialog(isOperatorListening);

        if (!(this.active && this.connected)) {
            this.answered = true;
            this.failTimer.destroy();
            this.failTimer = this.scene.time.addEvent({
                delay: Phaser.Math.Between(config.calls.giveUpWaitingConnect.min, config.calls.giveUpWaitingConnect.max),
                callback: this.giveUpWaiting,
                callbackScope: this
            });

            this.textType(`Hello, put me through to ${this.destination.number}`)
        }
    }

    destinationRung(portConnectedTo: Port): void {
        // after short delay, connect call
        this.failTimer.destroy();
        this.callerTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(config.calls.ringDelay.min, config.calls.ringDelay.max),
            callback: this.connectCall.bind(this, portConnectedTo)
        });
        this.endTime = this.scene.time.now;
    }

    disconnect(): void {
        this.dropped = true;

        if (this.failTimer) {
            this.failTimer.destroy();
        }

        if (this.callerTimer) {
            this.callerTimer.destroy();
        }

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
        this.avatar.visible = show;

        if (this.chatter) {
            (this.chatter as any).setVolume(1);
        }
    }

    private playConversation(): void {
        const text = this.conversation.shift();

        // alternate speaker
        this.speechText.text = '';
        this.personASpeaking = !this.personASpeaking;

        this.scene.children.bringToTop(this.speechBubble);
        this.scene.children.bringToTop(this.speechText);

        this.speechBubble.toggleFlipX();
        this.avatar.toggleFlipX();

        const avatarIndex = this.personASpeaking ? 0 : 1;
        this.avatar.setTexture(`character_${this.characters[avatarIndex]}`);

        if (this.personASpeaking) {
            this.speechBubble.y = personASpeechY;
            this.speechText.y = personASpeechY;
            this.avatar.x = avatarPersonAX;
        } else {
            this.speechBubble.y = personBSpeechY;
            this.speechText.y = personBSpeechY;
            this.avatar.x = avatarPersonBX;
        }

        this.avatar.y = this.speechBubble.y + avatarOffsetY;

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
        if (this.speechTimer) {
            this.speechTimer.destroy();
        }

        this.words = sentence.split(' ');
        this.speechText.text = '';
        this.textTypeAddWord(done);

        let chatterID: number
        if (this.words.length === 1 && this.words[0] === '...') {
            // do nothing
        } else if (this.words.length < 5) {
            chatterID = Phaser.Math.Between(6, 12);
        } else {
            chatterID = Phaser.Math.Between(1, 2);
        }
        this.chatter = this.scene.sound.get(`chatter${chatterID}`);
        this.chatter.play({
            volume: (this.speechBubble && this.speechBubble.visible) ? 1 : 0
        });
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

        this.successful = success;
        this.active = false;
        this.connected = false;
        this.complete = true;

        // clean up game objects
        if (this.callerTimer) {
            this.callerTimer.destroy();
            this.callerTimer = null;
        }

        if (this.failTimer) {
            this.failTimer.destroy();
            this.failTimer = null;
        }

        if (this.speechTimer) {
            this.speechTimer.destroy();
            this.speechTimer = null;
        }

        this.speechBubble.destroy();
        this.speechBubble = null;
        this.speechText.destroy();
        this.speechText = null;
        this.avatar.destroy();
        this.avatar = null;

        this.source.removeCall();
        this.destination.removeCall();

        if (this.source.stationHandlingCall) {
            this.source.stationHandlingCall.toggleLight('in', false);
            this.source.stationHandlingCall.toggleLight('out', false);
        }
    }
}