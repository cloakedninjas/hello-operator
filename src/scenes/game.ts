import { Scene } from 'phaser';
import Port from '../entities/port';
import Station from '../entities/station';
import Call from '../entities/call';
import * as config from '../config.json';

export class Game extends Scene {
  switchBoard: Phaser.GameObjects.Image;
  ports: Port[][];
  people: Phaser.GameObjects.Sprite[][];
  stations: Station[];
  previousPortBeingHovered: Port;
  calls: Call[];
  minute = 0;
  gameTimer: Phaser.Time.TimerEvent;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    window['scene'] = this;
    this.switchBoard = this.add.image(0, 0, 'background');
    this.switchBoard.setOrigin(0.5, 0);
    this.switchBoard.setPosition(this.cameras.main.centerX, 0);

    this.calls = [];

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
    const labelStyle: any = { // Partial<Phaser.GameObjects.TextStyle>
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

    // start game

    this.gameTimer = this.time.addEvent({
      delay: 60000, // 1min
      repeat: config.gameTime - 1,
      callback: this.updateClock,
      callbackScope: this
    });

    this.generateCallWithDelay(0);
  }

  getPortAt(x: number, y: number): Port {
    this.clearPortHighlight();

    const offsetX = config.ports.width / 2;
    const offsetY = config.ports.height / 2;

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

    if (delay === undefined) {
      const band = this.minute >= config.calls.spawnDelay.fastThreshold
        ? config.calls.spawnDelay.fast
        : config.calls.spawnDelay.normal;

      delay = Phaser.Math.Between(band.min, band.max);
    }

    console.log('spawn in', delay);

    this.time.addEvent({
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

    while (!gotAvailableCaller) {
      srcX = Phaser.Math.Between(0, config.ports.cols - 1);
      srcY = Phaser.Math.Between(0, config.ports.rows - 1);

      sourcePort = this.ports[srcX][srcY];
      gotAvailableCaller = !sourcePort.callInProgress;
    }

    let gotDifferentDestination = false;
    let destX;
    let destY;

    while (!gotDifferentDestination) {
      destX = Phaser.Math.Between(0, config.ports.cols - 1);
      destY = Phaser.Math.Between(0, config.ports.rows - 1);

      gotDifferentDestination = !(destX === srcX && destY === srcY);
    }

    const destPort = this.ports[destX][destY];

    this.calls.push(new Call(this, sourcePort, destPort));
  }

  updateCallStatus(status?: string): void {
    // maybe multiple calls?
    this.generateCallWithDelay();
  }

  private updateClock(): void {
    console.log('tick', this.minute);
    this.minute++;

    if (this.minute === config.gameTime) {
      console.log('game over');
      this.getScores();
      //this.scene.start('results');
    }
  }

  private getScores(): void {
    const maxAllowedWaitTime = config.calls.giveUpWaitingConnect.max + config.calls.giveUpWaitingOperatorTime.max;
    let total = 0;

    this.calls.forEach((call) => {
      if (call.connected) {
        // end all ongoing calls as successful
        call.completeCall();
      }

      if (call.successful) {
        const timeSpentWaiting = call.endTime - call.initTime;
        total += (1 - (timeSpentWaiting / maxAllowedWaitTime)) * config.scoring.successfulCallMaxScore;
      } else {
        total -= config.scoring.failPenalty;
      }
    });

    total = Math.round(total);
    console.log(total);
  }
}
