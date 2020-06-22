import { Scene } from 'phaser';

export default class Score extends Scene {
    scoreData: ScoreData;
    report: Phaser.GameObjects.Image;
    flipper: Phaser.GameObjects.Image;
    backButton: Phaser.GameObjects.Image;
    music: Phaser.Sound.BaseSound;

    constructor() {
        super({
            key: 'ScoreScene'
        });
    }

    init(scoreData: ScoreData): void {
        this.scoreData = scoreData;
    }

    create(): void {
        this.music = this.sound.add('endscreen');
        const mainMusic = this.sound.get('maintheme');

        if (mainMusic) {
            this.tweens.add({
                targets: mainMusic,
                props: {
                    volume: 0
                },
                duration: 300,
                onComplete: () => {
                    this.music.play();
                }
            });
        }

        this.sound.add('sealslap');
        this.sound.add('seal1');
        this.sound.add('seal2');
        this.sound.add('seal3');

        const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xc69c6d);
        bg.setOrigin(0);

        this.backButton = this.add.image(1010, 720, 'backtomenu');
        this.backButton.setOrigin(1);

        this.backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        this.report = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'report');

        const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: 'Rock Salt, cursive',
            fontSize: '45px',
            color: '#000'
        }

        const x = 350;

        this.add.text(x, 160, this.scoreData.points.toString(), textStyle);

        textStyle.fontSize = '27px';

        this.add.text(x, 302, this.scoreData.received.toString(), textStyle);
        this.add.text(x, 407, this.scoreData.answered.toString(), textStyle);
        this.add.text(x, 502, this.scoreData.connected.toString(), textStyle);
        this.add.text(x, 588, this.scoreData.dropped.toString(), textStyle);

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.sound.play('seal' + Phaser.Math.Between(1, 3));

                this.time.addEvent({
                    delay: 400,
                    callback: this.slap,
                    callbackScope: this
                });
            }
        })
    }

    private slap(): void {
        this.flipper = this.add.image(56, 384, 'flipper');

        this.sound.play('sealslap');
        this.tweens.add({
            targets: this.flipper,
            props: {
                x: 273,
                y: 473,
                scale: 0.4
            },
            duration: 200,
            ease: Phaser.Math.Easing.Back.Out,
            onComplete: this.moveOut,
            onCompleteScope: this
        });
    }

    private moveOut(): void {
        this.report.setTexture('report_damaged');

        const seal = 'seal_' + (this.scoreData.approved ? 'approval' : 'seal');
        this.add.image(550, 260, seal);

        this.children.bringToTop(this.flipper);

        this.tweens.add({
            targets: this.flipper,
            props: {
                x: -1024
            },
            delay: 500,
            duration: 700,
            ease: Phaser.Math.Easing.Sine.Out
        });

        this.backButton.setInteractive({
            cursor: 'pointer'
        });
    }
}

export interface ScoreData {
    points: number;
    received: number
    answered: number
    connected: number
    dropped: number,
    approved: boolean
}
