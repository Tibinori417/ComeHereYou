export default class Block extends Phaser.GameObjects.Sprite {
  constructor(scene, gridX, gridY, cellSize, id, type = 'wall') {
    super(scene, gridX * cellSize, gridY * cellSize, 'block');
    scene.add.existing(this);

    this.gridX = gridX;
    this.gridY = gridY;
    this.id = id;
    this.type = type;
    this.toBeRemoved = false;

    this.coloringByType();

    this.setDisplaySize(cellSize, cellSize);
  }

  coloringByType() {
    switch (this.type) {
      case 'wall':
        this.setTint(0xffffff);
        break;
      case 'I':
        this.setTint(0x00ffff);
        break;
      case 'O':
        this.setTint(0xffff00);
        break;
      case 'S':
        this.setTint(0x00ff00);
        break;
      case 'Z':
        this.setTint(0xff0000);
        break;
      case 'J':
        this.setTint(0x0000ff);
        break;
      case 'L':
        this.setTint(0xffA500);
        break;
      case 'T':
        this.setTint(0x800080);
        break;
      default:
        this.setTint(0x000000);
        console.log("Type is Nothing.");
        break;
    }
  }
}