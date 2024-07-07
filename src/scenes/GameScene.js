import Block from '../objects/Block.js';
import BlockCollection from '../objects/blockCollection.js';

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
    this.blockCollectionCount = 10;
    this.marginGrid = 2;

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

    this.shapes = {
      square: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ],
      tShape: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 1, y: 1 }
      ]
    };

    // 背景タイルの作成
    const backgroundWidth = this.gridWidth * this.cellSize;
    const backgroundHeight = this.gridHeight * this.cellSize;
    this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'backgroundTile').setOrigin(0, 0);
    this.background.setScrollFactor(0); // 背景がカメラの動きに応じてスクロールするように設定

    // スコア表示
    this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '32px', fill: '#FFFFFF' }).setScrollFactor(0);

    // ブロックのグループを初期化
    this.blocks = [];
    this.otherBlockCollections = []; // 他のブロックのグループ

    // 入力のハンドリング
    this.cursors = this.input.keyboard.createCursorKeys();

    // 初期の一つのブロック
    this.createBlock(Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2));

    // カメラの設定
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

      // hitGrid要素がない場合は移動先に移動、ある場合はhitGridにあるブロックを合体させる
      if (hitGrids.length == 0) {
        this.moveMyBlock(moveDirection);
      } else {
        this.joinBlock(hitGrids);
        this.updateCamera();
      }
    }

    // カメラの位置に基づいて背景を更新
    this.updateBackground();
    this.updateCamera();
  }

  createBlock(gridX, gridY) {   // 自分のブロックを生成する
    const block = new Block(this, gridX, gridY, this.cellSize);
    this.blocks.push(block);
    return block;
  }

  createOtherBlocks() {   // 他のブロックをマップ上に生成する
    for (let id = 0; id < this.blockCollectionCount; id++) {
      let base;
      const shapes = [this.shapes.square, this.shapes.tShape];
      const shape = Phaser.Utils.Array.GetRandom(shapes);

      do {
        base = {
          x:Phaser.Math.Between(this.marginGrid, this.gridWidth - this.marginGrid - 5),
          y:Phaser.Math.Between(this.marginGrid, this.gridHeight - this.marginGrid - 5)
          };
      } while (this.canCreateBlockCollection(base));

      const blockCollection = new BlockCollection(this, base, this.cellSize, id, shape);
      this.otherBlockCollections.push(blockCollection);
    }
  }

  canCreateBlockCollection(base) {    // 他のブロックコレクションが生成される範囲に既に他のブロックが存在するか確認し、存在する場合Falseを返す
    const checkGridCount = 4;
    for (let x = 0; x < checkGridCount; x++) {
      for (let y = 0; y < checkGridCount; y++) {
        if (this.grid[base.x + x][base.y + y]) {
          
          return true;
        }
      }
    }
    return false;
  }

  joinBlock(hitGrids) {   // 移動先にある他のブロックを削除し、自分のブロックに合体させる
    hitGrids.forEach( hitGrid => {
      const hitBlock = this.grid[hitGrid.x][hitGrid.y];
      if (hitBlock) {
        const collectionId = hitBlock.id;
        const collection = this.otherBlockCollections[collectionId];
        const collectionBlocks = collection.blocks;
        
        collection.destroy(this);
  
        collectionBlocks.forEach( block => {
          this.createBlock(block.gridX, block.gridY);
        });
      }
    });
  }

  moveMyBlock(moveDirection){   // 自分のブロックを移動させる
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

  updateCamera() {
    const totalX = this.blocks.reduce((sum, block) => sum + block.x, 0);
    const totalY = this.blocks.reduce((sum, block) => sum + block.y, 0);
    const centerX = totalX / this.blocks.length;
    const centerY = totalY / this.blocks.length;
    this.cameras.main.centerOn(centerX, centerY);
  }
}