export default class Block extends Phaser.GameObjects.Sprite {
  constructor(scene, gridX, gridY, cellSize, id) {
    super(scene, gridX * cellSize, gridY * cellSize, 'block');
    scene.add.existing(this);

    this.gridX = gridX;
    this.gridY = gridY;
    this.id = id;
    this.toBeRemoved = false;

    this.setDisplaySize(cellSize, cellSize);
  }

  // destroy() {
  //   this.Sprite.destroy();
  // }
}