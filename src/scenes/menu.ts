import { Scene } from 'phaser';
import { clickMe } from '../lib/click-me';

export default class Menu extends Scene {
    tutorial = true;
    music: Phaser.Sound.BaseSound;

    constructor() {
        super({
            key: 'MenuScene'
        });
    }

    create(): void {
        this.tutorial = localStorage.getItem('tutorial-seen') === null;

        const bg = this.add.image(0, 0, 'title_background');
        bg.setOrigin(0);

        // animate in characters

        const offRight = this.cameras.main.width;
        const offBottom = this.cameras.main.height;

        const startDelay = 500;
        const charDelay = 300;
        const duration = 400;
        const ease = Phaser.Math.Easing.Sine.Out;

        const bear = this.add.image(offRight + 300, offBottom + 340, 'title_bear');
        bear.angle = 25;

        const croc = this.add.image(offRight + 170, -160, 'title_croc');
        croc.angle = -25;

        const rabbit = this.add.image(-150, offBottom + 260, 'title_rabbit');
        rabbit.angle = -25;

        // start tweens

        this.tweens.add({
            targets: bear,
            props: {
                x: 920,
                y: 614,
                angle: 0
            },
            duration,
            delay: startDelay,
            ease
        });

        this.tweens.add({
            targets: croc,
            props: {
                x: 909,
                y: 108,
                angle: 0
            },
            duration,
            delay: startDelay + charDelay,
            ease
        });

        this.tweens.add({
            targets: rabbit,
            props: {
                x: 132,
                y: 577,
                angle: 0
            },
            duration,
            delay: startDelay + (charDelay * 2),
            ease,
            onComplete: this.showUI,
            onCompleteScope: this
        });

        // 1 more animal....

        this.music = this.sound.add('titlescreen');
        this.music.play({
            loop: true,
            volume: 1
        });

        this.sound.add('operator1');
        this.sound.add('operator2');
        this.sound.add('operator3');
    }

    showUI(): void {
        const title = this.add.image(490, 290, 'speech_title');
        title.alpha = 0;

        const playButton = this.add.image(500, 490, 'play');
        playButton.alpha = 0;

        playButton.on('pointerdown', () => {
            playButton.setTexture('play_pressed');
        });

        playButton.on('pointerout', () => {
            playButton.setTexture('play');
        });

        playButton.on('pointerup', () => {
            playButton.setTexture('play');
            this.scene.start('GameScene');
        });

        /* const tutorialY = 568;
        const tutorial = this.add.image(515, tutorialY, 'tutorial');
        tutorial.alpha = 0;

        const plug = this.add.image(430, tutorialY, 'switchboard_plug');
        plug.alpha = 0;
        plug.setInteractive(clickMe);
        plug.on('pointerdown', () => {
            this.tutorial = !this.tutorial;
            cable.visible = this.tutorial;
        });

        const cable = this.add.image(plug.x, plug.y - 7, 'plugged_red');
        cable.alpha = 0;
        cable.visible = this.tutorial; */

        // credits

        const credits = this.add.image(665, 70, 'speech_credits');
        credits.alpha = 0;

        const x = 670;
        const y = 34
        const width = 150;
        const height = 35;

        const dj = this.add.rectangle(x, y, width, height);
        dj.on('pointerdown', this.creditClick.bind(this, 'cloakedninjas'));

        const jk = this.add.rectangle(x, dj.y + height, width, height);
        jk.on('pointerdown', this.creditClick.bind(this, 'thedorkulon'));

        const al = this.add.rectangle(x, jk.y + height, width, height);
        al.on('pointerdown', this.creditClick.bind(this, 'treslapin'));

        this.tweens.add({
            targets: title,
            props: {
                alpha: 1
            },
            duration: 300,
            onComplete: () => {
                this.sound.play('operator' + Phaser.Math.Between(1, 3));
            }
        });

        this.tweens.add({
            targets: [playButton, /* tutorial, plug, cable,  */credits],
            props: {
                alpha: 1
            },
            duration: 300,
            delay: 800,
            onComplete: () => {
                dj.setInteractive(clickMe);
                jk.setInteractive(clickMe);
                al.setInteractive(clickMe);
                playButton.setInteractive(clickMe);
            }
        });
    }

    private creditClick(person: string): void {
        window.open('https://twitter.com/' + person);
    }
}
