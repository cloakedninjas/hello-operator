export default class Port extends Phaser.GameObjects.Sprite {
    inUse: boolean;
    cableType: string;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'port');
        this.setOrigin(0, 0);
        this.setInteractive();
        this.input.dropZone = true;
    }

    canBeUsed(): boolean {
        return !this.inUse;
    }

    setInUse(cableType: string): void {
        this.inUse = true;
        this.cableType = cableType;
    }

    unplug(): void {
        this.inUse = false;
        this.cableType = null;
    }

    highlight(): void {
        this.tint = 0x422241;
    }

    removeHighlight(): void {
        this.clearTint();
    }
}