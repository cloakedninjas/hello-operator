import { Scene } from 'phaser';

export default class Menu extends Scene {
    constructor() {
        super({
            key: 'MenuScene'
        });
    }

    create(): void {
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
    }

    showUI(): void {
        this.add.image(500, 320, 'speech_title');

        this.time.addEvent({
            delay: 500,
            callback: () => {
                const clickMe = {
                    cursor: 'pointer'
                };
                const playButton = this.add.image(500, 600, 'speech_play');
                playButton.setInteractive(clickMe);

                playButton.on('pointerdown', () => {
                    this.scene.start('GameScene');
                });

                this.add.image(665, 70, 'speech_credits');

                const x = 670;
                const y = 34
                const width = 150;
                const height = 35;

                const dj = this.add.rectangle(x, y, width, height);
                dj.setInteractive(clickMe);
                dj.on('pointerdown', this.creditClick.bind(this, 'cloakedninjas'));

                const jk = this.add.rectangle(x, dj.y + height, width, height);
                jk.setInteractive(clickMe);
                jk.on('pointerdown', this.creditClick.bind(this, 'thedorkulon'));

                const al = this.add.rectangle(x, jk.y + height, width, height);
                al.setInteractive(clickMe);
                al.on('pointerdown', this.creditClick.bind(this, 'treslapin'));
            }
        });
    }

    private creditClick(person: string): void {
        window.open('https://twitter.com/' + person);
    }
}
