import Block from '../objects/Block.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // アセットの読み込み
    this.load.image('block', 'assets/block.png'); // キャラクター用の画像
    this.load.image('backgroundTile', 'assets/background.png'); // 背景画像をタイルとしてロード
  }

  create() {
    this.score = 0;

    // グリッドのサイズを設定
    this.gridWidth = 30; // 大きめのグリッドサイズに変更
    this.gridHeight = 20; // 大きめのグリッドサイズに変更
    this.cellSize = 32;

    // グリッドの初期化
    this.grid = [];
    for (let x = 0; x < this.gridWidth; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        this.grid[x][y] = null;
      }
    }

    // 背景タイルの作成
    const backgroundWidth = this.gridWidth * this.cellSize;
    const backgroundHeight = this.gridHeight * this.cellSize;
    this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'backgroundTile').setOrigin(0, 0);
    this.background.setScrollFactor(0); // 背景がカメラの動きに応じてスクロールするように設定

    // スコア表示
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '32px', fill: '#FFFFFF' }).setScrollFactor(0);

    // ブロックのグループを初期化
    this.blocks = [];
    this.otherBlocks = []; // 他のブロックのグループ

    // 入力のハンドリング
    this.cursors = this.input.keyboard.createCursorKeys();

    // 初期の一つのブロック
    this.playerBlock = this.createBlock(Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2));

    // カメラの設定
    this.cameras.main.startFollow(this.playerBlock, true, 0.05, 0.05); // 最初のブロックを追尾
    this.cameras.main.setZoom(1); // 必要に応じてズームを調整
    this.cameras.main.setBounds(0, 0, backgroundWidth, backgroundHeight); // カメラの境界を設定

    // 他のブロックをマップ上に配置
    this.createOtherBlocks();
  }

  update(time) {
    const { left, right, up, down } = this.cursors;

    let moveDirection = null;
    if (left.isDown) {
      moveDirection = { x: -1, y: 0 };
    } else if (right.isDown) {
      moveDirection = { x: 1, y: 0 };
    } else if (up.isDown) {
      moveDirection = { x: 0, y: -1 };
    } else if (down.isDown) {
      moveDirection = { x: 0, y: 1 };
    }

    const hitGrids = [];

    if (moveDirection) {
      // 全ての自分のブロックの行き先グリッドを確認し、他のブロックがあればhitGrid配列に追加
      this.blocks.forEach(block => {
        const checkGrid = { x:block.gridX + moveDirection.x, y:block.gridY + moveDirection.y };

        if (this.grid[checkGrid.x][checkGrid.y]) {
          hitGrids.push({ x: checkGrid.x, y:checkGrid.y });
        }
      });

      if (hitGrids.length == 0) {
        this.moveMyBlock(moveDirection);
      } else {
        this.joinBlock(hitGrids);
      }
      
    }
    console.log(hitGrids);

    // カメラの位置に基づいて背景を更新
    this.updateBackground();
  }

  createBlock(gridX, gridY) {
    const block = new Block(this, gridX, gridY, this.cursors, this.cellSize); // グリッド座標でブロックを作成
    this.blocks.push(block);
    return block;
  }

  createOtherBlocks() {
    for (let i = 0; i < 10; i++) {
      const gridX = Phaser.Math.Between(0, this.gridWidth - 1);
      const gridY = Phaser.Math.Between(0, this.gridHeight - 1);
      if (!this.grid[gridX][gridY]) {
        const block = new Block(this, gridX, gridY, this.cursors, this.cellSize); // グリッド座標でブロックを作成
        this.otherBlocks.push(block);
        this.grid[gridX][gridY] = block;
      }
    }
  }

  joinBlock(hitGrids) {   // 移動先にある他のブロックを削除し、自分のブロックに合体させる
    hitGrids.forEach( hitGrid => {
      const joinBlock = this.grid[hitGrid.x][hitGrid.y];

      joinBlock.destroy();
      this.grid[hitGrid.x][hitGrid.y] = null;
      
      this.createBlock(hitGrid.x, hitGrid.y);
    });
  }

  moveMyBlock(moveDirection){
    this.blocks.forEach( block => {
      block.gridX = block.gridX + moveDirection.x;
      block.gridY = block.gridY + moveDirection.y;
      block.setPosition(block.gridX * this.cellSize, block.gridY * this.cellSize);
    });
  }

  updateBackground() {
    const camera = this.cameras.main;
    this.background.setTilePosition(camera.scrollX, camera.scrollY);
  }
}