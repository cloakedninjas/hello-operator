import { Scene } from 'phaser';

export default class Boot extends Scene {
  constructor() {
    super({
      key: 'BootScene'
    });
  }

  preload(): void {
    this.load.image('title_background', 'assets/image/title_background.png');
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
