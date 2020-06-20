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

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    window['scene'] = this;
    this.switchBoard = this.add.image(0, 0, 'switchboard');
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

    const stationY = 550;
    for (let i = 0; i < config.stations; i++) {
      const x = (110 * i) + 100;
      const station = new Station(this, x, stationY);
      this.stations.push(station);
      this.add.existing(station);
    }
  }

  /* private generatePeople(): Phaser.GameObjects.Sprite[][] {
    this.people = [];

    for (let i = 0; i < config.portsX; i++) {
      this.people[i] = [];

      for (let j = 0; j < config.portsY; j++) {
        const graphics = new Phaser.GameObjects.Graphics(this);

        for (const peoplePart in config.peopleParts) {
          const rand = Phaser.Math.Between(0, config.peopleParts[peoplePart] - 1);
          const spriteName = `${peoplePart}_${rand}`;
          console.log(spriteName);
        }
      }
    }

    return [];
  }
   */

  getPortAt(x: number, y: number): Port {
    this.clearPortHighlight();

    const gridX = Math.floor((x - config.ports.x) / (config.ports.width + config.ports.padding));
    const gridY = Math.floor((y - config.ports.y) / (config.ports.height + config.ports.padding));

    //console.log(gridX, gridY);

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

  generateCall(): void {
    const sourceX = Phaser.Math.Between(0, config.ports.cols - 1);
    const sourceY = Phaser.Math.Between(0, config.ports.rows - 1);

    let gotDifferentDestination = false;
    let destX;
    let destY;

    while (!gotDifferentDestination) {
      destX = Phaser.Math.Between(0, config.ports.cols - 1);
      destY = Phaser.Math.Between(0, config.ports.rows - 1);

      gotDifferentDestination = !(destX === sourceX && destY === sourceY);
    }

    const sourcePort = this.ports[sourceX][sourceY];
    const destPort = this.ports[destX][destY];

    this.calls.push(new Call(this, sourcePort, destPort));
  }
}
