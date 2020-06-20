import { Scene } from 'phaser';
import Port from '../entities/port';
import Station from '../entities/station';
import * as config from '../config.json';

export class Game extends Scene {
  switchBoard: Phaser.GameObjects.Image;
  ports: Port[][];
  people: Phaser.GameObjects.Sprite[][];
  stations: Station[];
  previousPortBeingHovered: Port;

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create(): void {
    this.switchBoard = this.add.image(0, 0, 'switchboard');
    this.switchBoard.setOrigin(0.5, 0);
    this.switchBoard.setPosition(this.cameras.main.centerX, 0);

    // generate people
    //this.people = this.generatePeople();

    // generate ports
    this.ports = [];

    for (let i = 0; i < config.ports.cols; i++) {
      this.ports[i] = [];

      for (let j = 0; j < config.ports.rows; j++) {
        const x = (i * (config.ports.width + config.ports.padding)) + config.ports.x;
        const y = (j * (config.ports.height + config.ports.padding)) + config.ports.y;
        const port = new Port(this, x, y);

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
          const rand = Phaser.Math.Between(0, config.peopleParts[peoplePart]);
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
}
