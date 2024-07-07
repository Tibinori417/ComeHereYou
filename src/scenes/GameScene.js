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
    this.otherBlocks = this.physics.add.group(); // 他のブロックのグループ

    // 入力のハンドリング
    this.cursors = this.input.keyboard.createCursorKeys();

    // 初期の一つのブロック
    this.playerBlock = this.createBlock(Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2));

    // カメラの設定
    this.cameras.main.startFollow(this.playerBlock, true, 1, 1); // 最初のブロックを追尾
    this.cameras.main.setZoom(1); // 必要に応じてズームを調整
    this.cameras.main.setBounds(0, 0, backgroundWidth, backgroundHeight); // カメラの境界を設定
    this.physics.world.setBounds(0, 0, backgroundWidth, backgroundHeight); // ワールドの境界を設定

    // 他のブロックをマップ上に配置
    this.createOtherBlocks();
  }

  update(time) {
    // キーボード入力に応じたブロックの更新
    this.blocks.forEach(block => {
      block.update(time);
    });
    console.log(this.grid[this.playerBlock.gridX][this.playerBlock.gridY]);
    console.log(this.playerBlock.gridX, this.playerBlock.gridY);
    // カメラの位置に基づいて背景を更新
    this.updateBackground();

    // 他のブロックと接触した際の処理
    this.physics.overlap(this.blocks, this.otherBlocks, this.handleCollision, null, this);
  }

  createBlock(gridX, gridY) {
    const block = new Block(this, gridX, gridY, this.cursors, this.cellSize); // グリッド座標でブロックを作成
    this.blocks.push(block);
    // this.grid[gridX][gridY] = block;
    return block;
  }

  createOtherBlocks() {
    for (let i = 0; i < 10; i++) {
      const gridX = Phaser.Math.Between(0, this.gridWidth - 1);
      const gridY = Phaser.Math.Between(0, this.gridHeight - 1);
      if (!this.grid[gridX][gridY]) {
        const block = new Block(this, gridX, gridY, this.cursors, this.cellSize); // グリッド座標でブロックを作成
        this.otherBlocks.add(block);
        this.grid[gridX][gridY] = block;
      }
    }
  }

  handleCollision(player, otherBlock) {
    // 他のブロックをプレイヤーの一部にする
    const otherBlockGridX = otherBlock.gridX;
    const otherBlockGridY = otherBlock.gridY;
    otherBlock.destroy();
    this.grid[otherBlockGridX][otherBlockGridY] = null;
    
    const gridX = Math.floor(otherBlock.x / this.cellSize);
    const gridY = Math.floor(otherBlock.y / this.cellSize);
    this.createBlock(gridX, gridY);
  }

  updateBackground() {
    const camera = this.cameras.main;
    this.background.setTilePosition(camera.scrollX, camera.scrollY);
  }
}