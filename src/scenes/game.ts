import { Scene } from 'phaser';
import Port from '../entities/port';
import Station from '../entities/station';
import * as config from '../config.json';

export class Game extends Scene {
  switchBoard: Phaser.GameObjects.Image;
  ports: Port[][];
  people: Phaser.GameObjects.Sprite[][];
  stations: Station[];

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

    for (let i = 0; i < config.portsX; i++) {
      this.ports[i] = [];

      for (let j = 0; j < config.portsY; j++) {
        this.ports[i].push(new Port(this, i, j));
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
}
