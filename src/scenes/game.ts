import { Scene } from 'phaser';
import Port from '../entities/port';
import Station from '../entities/station';
import Call from '../entities/call';
import * as config from '../config.json';
import { ScoreData } from './score';

export class Game extends Scene {
  switchBoard: Phaser.GameObjects.Image;
  ports: Port[][];
  people: Phaser.GameObjects.Sprite[][];
  stations: Station[];
  previousPortBeingHovered: Port;
  calls: Call[];
  minute: number;
  gameTimer: Phaser.Time.TimerEvent;
  conversations: string[];
  nextGeneratedCall: Phaser.Time.TimerEvent;
  music: Phaser.Sound.BaseSound;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    // todo remove
    window['scene'] = this;

    this.music = this.sound.add('maintheme');

    const introMusic = this.sound.get('titlescreen');

    this.tweens.add({
      targets: introMusic,
      props: {
        volume: 0
      },
      duration: 300,
      onComplete: () => {
        this.music.play({ loop: true });
      }
    });

    this.switchBoard = this.add.image(0, 0, 'background');
    this.switchBoard.setOrigin(0.5, 0);
    this.switchBoard.setPosition(this.cameras.main.centerX, 0);

    this.calls = [];
    this.minute = 0;

    // generate people
    //this.people = this.generatePeople();

    // generate ports
    this.ports = [];

    for (let i = 0; i < config.ports.cols; i++) {
      this.ports[i] = [];

      for (let j = 0; j < config.ports.rows; j++) {
        const port = new Port(this, i, j);

        this.ports[i].push(port);
        this.add.existing(port);
      }
    }

    // add stations
    this.stations = [];

    const stationX = 425;
    const stationY = 628;
    const stationWidth = 100;
    const colours = ['green', 'white', 'red'];

    for (let i = 0; i < config.stations; i++) {
      const x = (stationWidth * i) + stationX;

      const station = new Station(this, x, stationY, colours[i % 3]);
      this.stations.push(station);
      this.add.existing(station);
    }

    // add labels

    const labelX = config.ports.xOffset - 50;
    const labelY = config.ports.yOffset - 35;
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      color: '#000',
      fontStyle: 'bold',
      backgroundColor: '#fff',
      padding: {
        left: 5,
        right: 5,
        top: 3,
        bottom: 3
      }
    };

    for (let i = 0; i < config.ports.cols; i++) {
      const x = (i * (config.ports.width + config.ports.padding.x)) + config.ports.xOffset;
      const label = this.add.text(x, labelY, (config.numberStartCol + i).toString(), labelStyle);
      label.setOrigin(0.5);
    }

    for (let i = 0; i < config.ports.rows; i++) {
      const y = (i * (config.ports.height + config.ports.padding.y)) + config.ports.yOffset;
      const label = this.add.text(labelX, y, (config.numberStartRow + i).toString(), labelStyle);
      label.setOrigin(0.5);
    }

    this.conversations = this.cache.text.get('conversations').split('===\r\n');
    this.conversations = Phaser.Utils.Array.Shuffle(this.conversations);

    // load sounds

    const sounds = [
      'talkswitchon',
      'talkswitchoff',
      'plugin1',
      'plugin2',
      'releaseplug',
      'ringerloop',
      'chatter1',
      'chatter2',
      'chatter6',
      'chatter7',
      'chatter8',
      'chatter9',
      'chatter10',
      'chatter11',
      'chatter12'
    ];

    sounds.forEach(sound => {
      this.sound.add(sound);
    });

    // start game

    this.gameTimer = this.time.addEvent({
      delay: 10000, //60000, // 1min
      repeat: config.gameTime - 1,
      callback: this.updateClock,
      callbackScope: this
    });

    this.generateCallWithDelay(0);
  }

  getPortAt(x: number, y: number): Port {
    this.clearPortHighlight();

    const offsetX = (config.ports.width / 2) - config.cablePointerOffset.x;
    const offsetY = (config.ports.height / 2) - config.cablePointerOffset.y;

    const gridX = Math.floor((x - config.ports.xOffset + offsetX) / (config.ports.width + config.ports.padding.x));
    const gridY = Math.floor((y - config.ports.yOffset + offsetY) / (config.ports.height + config.ports.padding.y));

    if (
      gridX < 0 ||
      gridY < 0 ||
      gridX >= config.ports.cols ||
      gridY >= config.ports.rows
    ) {
      return;
    }

    const port = this.ports[gridX][gridY];

    if (port) {
      port.highlight();
      this.previousPortBeingHovered = port;
      return port;
    }
  }

  clearPortHighlight(): void {
    if (this.previousPortBeingHovered) {
      this.previousPortBeingHovered.removeHighlight();
    }
  }

  generateCallWithDelay(delay?: number): void {
    if (this.minute >= config.gameTime) {
      return;
    }

    if (this.nextGeneratedCall && !this.nextGeneratedCall.hasDispatched) {
      return;
    }

    if (delay === undefined) {
      const band = this.minute >= config.calls.spawnDelay.fastThreshold
        ? config.calls.spawnDelay.fast
        : config.calls.spawnDelay.normal;

      delay = Phaser.Math.Between(band.min, band.max);
    }

    this.nextGeneratedCall = this.time.addEvent({
      delay,
      callback: this.generateCall,
      callbackScope: this
    });
  }

  generateCall(): void {
    let gotAvailableCaller = false;
    let srcX;
    let srcY;
    let sourcePort: Port;
    let destPort: Port;

    while (!gotAvailableCaller) {
      srcX = Phaser.Math.Between(0, config.ports.cols - 1);
      srcY = Phaser.Math.Between(0, config.ports.rows - 1);

      sourcePort = this.ports[srcX][srcY];

      // port can't be in use
      gotAvailableCaller = !sourcePort.stationHandlingCall;
    }

    let gotValidDestination = false;
    let destX;
    let destY;

    while (!gotValidDestination) {
      destX = Phaser.Math.Between(0, config.ports.cols - 1);
      destY = Phaser.Math.Between(0, config.ports.rows - 1);

      if (destX === srcX && destY === srcY) {
        continue;
      }

      destPort = this.ports[destX][destY];
      gotValidDestination = !destPort.stationHandlingCall && !destPort.callInProgress && !destPort.callExpected;
    }

    const conversationIndex = this.calls.length % this.conversations.length;
    this.calls.push(new Call(this, sourcePort, destPort, this.conversations[conversationIndex]));
  }

  updateCallStatus(status?: string): void {
    // maybe multiple calls?
    this.generateCallWithDelay();
  }

  private updateClock(): void {
    this.minute++;

    if (this.minute === config.gameTime) {
      this.scene.start('ScoreScene', this.getScores());
    }
  }

  private getScores(): ScoreData {
    const maxAllowedWaitTime = config.calls.giveUpWaitingConnect.max + config.calls.giveUpWaitingOperatorTime.max;

    const scores: ScoreData = {
      points: 0,
      received: 0,
      answered: 0,
      connected: 0,
      dropped: 0,
      approved: 1
    };

    this.calls.forEach((call) => {
      if (call.connected) {
        // end all ongoing calls as successful
        call.completeCall();
      }

      scores.received++;

      if (call.answered) {
        scores.answered++;
      }

      if (call.dropped) {
        scores.dropped++;
      }

      if (call.successful) {
        const timeSpentWaiting = call.endTime - call.initTime;
        scores.points += (1 - (timeSpentWaiting / maxAllowedWaitTime)) * config.scoring.successfulCallMaxScore;
        scores.connected++;
      } else {
        scores.points -= config.scoring.failPenalty;
      }
    });

    scores.points = Math.round(scores.points);

    return scores;
  }
}
