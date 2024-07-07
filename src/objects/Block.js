export default class Block extends Phaser.GameObjects.Sprite {
  constructor(scene, gridX, gridY, cellSize, collectionID) {
    super(scene, gridX * cellSize, gridY * cellSize, 'block');
    scene.add.existing(this);

    this.gridX = gridX;
    this.gridY = gridY;
    this.cellSize = cellSize;
    this.collectionID = collectionID;

    this.setDisplaySize(this.cellSize, this.cellSize);
  }
}
