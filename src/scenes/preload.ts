import { Scene } from 'phaser';
import ProgressBar from '../lib/progress-bar';
import * as manifest from '../../assets/manifest.json';

export default class Preload extends Scene {
  private downloadedSize: number;
  private progressBar: ProgressBar;

  constructor() {
    super({
      key: 'PreloadScene'
    });
  }

  preload(): void {
    const bg = this.add.image(0, 0, 'title_background');
    bg.setOrigin(0);

    this.downloadedSize = 0;
    this.progressBar = new ProgressBar(this, 0.5, 0.5, manifest.totalSize);

    this.load.on('fileprogress', (file) => {
      const previousLoad = file.previousLoad || 0;

      this.downloadedSize += file.bytesLoaded - previousLoad;
      file.previousLoad = file.bytesLoaded;

      this.progressBar.setProgress(this.downloadedSize / manifest.totalSize);
    });

    const assetList = manifest.assets;

    Object.keys(assetList).forEach((fileType: string) => {
      Object.keys(assetList[fileType]).forEach((key) => {
        const assetVars = assetList[fileType][key];
        const url = manifest.assetRoot + '/' + fileType + '/' + assetVars['file'];

        if (fileType === 'spritesheet') {
          this.load[fileType](key, url, {
            frameWidth: assetVars.frameWidth,
            frameHeight: assetVars.frameHeight
          });
        } else if (fileType === 'audio') {
          const mp3Version = url.replace(/\.ogg$/, '.mp3');
          this.load[fileType](key, [url, mp3Version]);
        }
        else {
          this.load[fileType](key, url);
        }
      });
    });

    this.load.webfont('Rock Salt', 'https://fonts.googleapis.com/css2?family=Rock+Salt&display=swap');
    this.load.webfont('Josefin Sans', 'https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@1,300&display=swap');
  }

  create(): void {
    //this.scene.start('MenuScene');
    this.scene.start('GameScene');
  }
}
