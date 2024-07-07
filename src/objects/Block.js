export default class Block extends Phaser.GameObjects.Sprite {
  constructor(scene, gridX, gridY, cursors, cellSize) {
    super(scene, gridX * cellSize, gridY * cellSize, 'block');
    scene.add.existing(this);

    this.gridX = gridX;
    this.gridY = gridY;
    this.cursors = cursors;
    this.cellSize = cellSize;

    this.setDisplaySize(this.cellSize, this.cellSize); // キャラクターのサイズをグリッドのサイズと同じにする

    this.initialMoveDelay = 300; // 初回の移動と2回目の移動の間の待機時間
    this.repeatMoveDelay = 100; // それ以降の連続移動の待機時間
    this.moveDelay = this.initialMoveDelay; // 現在の移動待機時間
    this.lastMoveTime = 0; // 最後の移動時間
    this.isMoving = false; // 移動中かどうかのフラグ
  }

  update(time) {
    const { left, right, up, down } = this.cursors;
    const isAnyKeyDown = left.isDown || right.isDown || up.isDown || down.isDown;
    
    if (!isAnyKeyDown) {
      // どのキーも押されていない場合、移動フラグをリセット
      this.isMoving = false;
      this.moveDelay = this.initialMoveDelay;
    } else {
      // どのキーかが押されている場合、移動を実行
      if (time - this.lastMoveTime >= this.moveDelay) {
        let moved = false;

        if (left.isDown) {
          this.gridX -= 1;
          moved = true;
        } else if (right.isDown) {
          this.gridX += 1;
          moved = true;
        }

        if (up.isDown) {
          this.gridY -= 1;
          moved = true;
        } else if (down.isDown) {
          this.gridY += 1;
          moved = true;
        }

        if (moved) {
          this.lastMoveTime = time;
          this.moveDelay = this.isMoving ? this.repeatMoveDelay : this.initialMoveDelay;
          this.isMoving = true;

          // スプライトの位置を更新
          this.setPosition(this.gridX * this.cellSize, this.gridY * this.cellSize);
        }
      }
    }
  }
}
