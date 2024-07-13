import Block from '../objects/Block.js';
import BlockCollection from '../objects/blockCollection.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('block', 'assets/block.png');
    this.load.image('backgroundTile', 'assets/background.png');
    this.load.audio('rotateSE', 'assets/rotateSound.mp3');
    this.load.audio('joinSE', 'assets/joinSound.mp3');
  }

  create() {
    this.score = 0;
    this.blockCollectionCount = 1000;
    this.marginGrid = 4;
    this.checkOffset = -2;
    this.otherBlockSpacing = 5;

    // グリッドのサイズを設定
    this.gridWidth = 500;
    this.gridHeight = 500;
    this.cellSize = 32;

    // グリッドの初期化
    this.grid = [];
    for (let x = 0; x < this.gridWidth; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        this.grid[x][y] = null;
      }
    }

    this.shapeTypes = [ 'I', 'O', 'S', 'Z', 'J', 'L', 'T'];

    // 背景タイルの作成
    const backgroundWidth = this.gridWidth * this.cellSize;
    const backgroundHeight = this.gridHeight * this.cellSize;
    this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'backgroundTile').setOrigin(0, 0);
    this.background.setScrollFactor(0); // 背景がカメラの動きに応じてスクロールするように設定

    // スコア表示
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, { fontSize: '32px', fill: '#FFFFFF' }).setScrollFactor(0);

    // ブロックのグループを初期化
    this.blocks = [];
    this.otherBlockCollections = [];

    // 入力のハンドリング
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 初期の一つのブロック
    this.createBlock(Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2), 'wall');

    // カメラの設定
    this.cameras.main.setZoom(1); // 必要に応じてズームを調整
    this.cameras.main.setBounds(0, 0, backgroundWidth, backgroundHeight); // カメラの境界を設定

    // 音声の設定
    this.rotateSE = this.sound.add('rotateSE');
    this.joinSE = this.sound.add('joinSE');

    // 他のブロックをマップ上に配置
    this.createOtherBlocks();
  }

  update(time) {
    const { left, right, up, down } = this.cursors;
    const spaceJustDown = Phaser.Input.Keyboard.JustDown(this.spaceKey);

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
        const checkGrid = {
          x:block.gridX + moveDirection.x,
          y:block.gridY + moveDirection.y
        };

        if (this.grid[checkGrid.x][checkGrid.y]) {
          hitGrids.push({ x: checkGrid.x, y:checkGrid.y });
        }
      });

      // hitGrid要素がない場合は移動先に移動、ある場合はhitGridにあるブロックを合体させる
      if (hitGrids.length == 0) {
        this.moveMyBlock(moveDirection);
      } else {
        this.joinBlock(hitGrids);
        this.checkAndMarkBlocks(this.blocks, this.gridWidth, this.gridHeight);
        this.blocks = this.removeMarkedBlocks(this.blocks);
        this.updateCamera();
      }
    }

    if (spaceJustDown) this.rotateMyBlock();

    // カメラの位置に基づいて背景を更新
    this.updateBackground();
    this.updateCamera();
  }

  createBlock(gridX, gridY, type) {   // 自分のブロックを生成する
    const block = new Block(this, gridX, gridY, this.cellSize, null, type);
    this.blocks.push(block);
    return block;
  }

  createOtherBlocks() {   // 他のブロックをマップ上に生成する
    for (let id = 0; id < this.blockCollectionCount; id++) {
      let base;
      const shapetypes = this.shapeTypes;
      const shapetype = Phaser.Utils.Array.GetRandom(shapetypes);

      do {
        base = {
          x:Phaser.Math.Between(this.marginGrid, this.gridWidth - this.marginGrid - 5),
          y:Phaser.Math.Between(this.marginGrid, this.gridHeight - this.marginGrid - 5)
          };
      } while (this.canCreateBlockCollection(base));

      const blockCollection = new BlockCollection(this, base, this.cellSize, id, shapetype);
      this.otherBlockCollections.push(blockCollection);
    }
  }

  canCreateBlockCollection(base) {    // 他のブロックコレクションが生成される範囲に既に他のブロックが存在するか確認し、存在する場合Falseを返す
    const checkGridCount = this.otherBlockSpacing;
    for (let x = this.checkOffset; x < checkGridCount - this.checkOffset; x++) {
      for (let y = this.checkOffset; y < checkGridCount - this.checkOffset; y++) {
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
          this.createBlock(block.gridX, block.gridY, block.type);
        });
      }
    });

    this.joinSE.play();
  }

  moveMyBlock(moveDirection){   // 自分のブロックを移動させる
    this.blocks.forEach( block => {
      block.gridX = block.gridX + moveDirection.x;
      block.gridY = block.gridY + moveDirection.y;
      block.setPosition(block.gridX * this.cellSize, block.gridY * this.cellSize);
    });
  }

  rotateMyBlock(){
    const center = this.outputCenter();

    const checkGrid = {
      x: center.x / this.cellSize,
      y: center.y / this.cellSize
    };
    const centerGrid = {
      x: Math.floor(center.x / this.cellSize),
      y: Math.floor(center.y / this.cellSize)
    };
    let adjustmentGrid = { x: 0, y: 0 };
    if (!Number.isInteger(checkGrid.x)) {
      adjustmentGrid = {
        x: 1,
        y: 0
      };
    }
    
    const offsetGrid = this.blocks.map( block => ({
      x: block.gridX - centerGrid.x,
      y: block.gridY - centerGrid.y
    }));
    
    const rotatedGrid = offsetGrid.map(block => ({
      x: -block.y + adjustmentGrid.x,
      y: block.x + adjustmentGrid.y
    }));

    this.blocks.forEach( (block, index) => {
      block.gridX = centerGrid.x + rotatedGrid[index].x;
      block.gridY = centerGrid.y + rotatedGrid[index].y;
      block.setPosition(block.gridX * this.cellSize, block.gridY * this.cellSize);
    });
    
    this.rotateSE.play();
  }

  checkAndMarkBlocks(blocks, gridWidth, gridHeight) {
    function checkRange(baseX, baseY, rangeSize) {
      for (let x = baseX; x < baseX + rangeSize; x++) {
        for (let y = baseY; y < baseY + rangeSize; y++) {
          if (x >= gridWidth || y >= gridHeight) {
            return false;
          }
          const block = blocks.find(b => b.gridX === x && b.gridY === y);
          if (!block) {
            return false;
          } else {
            if (block.type === 'wall') {
              return false;
            }
          }
        }
      }
      return true;
    }
    
    blocks.forEach(block => {
      // 3x3の確認
      let removeRange = 3;
      if (checkRange(block.gridX, block.gridY, removeRange)) {
        for (let x = block.gridX; x < block.gridX + removeRange; x++) {
          for (let y = block.gridY; y < block.gridY + removeRange; y++) {
            const b = blocks.find(b => b.gridX === x && b.gridY === y);
            if (b) b.toBeRemoved = true;
          }
        }
        this.updateScore(1);
      }
    });
  }
  
  removeMarkedBlocks(blocks) {
    const remainingBlocks = blocks.filter(block => {
      if (block.toBeRemoved) {
        block.destroy();
        return false;
      }
      return true;
    });
    return remainingBlocks;
  }

  updateBackground() {
    const camera = this.cameras.main;
    this.background.setTilePosition(camera.scrollX, camera.scrollY);
  }

  updateCamera() {
    const center = this.outputCenter();
    this.cameras.main.centerOn(center.x, center.y);
  }

  updateScore(points) {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  outputCenter() {
    const minX = Math.min(...this.blocks.map(b => b.x));
    const minY = Math.min(...this.blocks.map(b => b.y));
    const maxX = Math.max(...this.blocks.map(b => b.x));
    const maxY = Math.max(...this.blocks.map(b => b.y));
    const centerX = (maxX + minX) / 2;
    const centerY = (maxY + minY) / 2;

    return {
      x: centerX,
      y: centerY
    };
  }
}