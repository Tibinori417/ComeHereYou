import Block from '../objects/Block.js';
import BlockCollection from '../objects/blockCollection.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('block', 'assets/block.png');
    this.load.image('backgroundTile', 'assets/background.png');
    this.load.image('setting', 'assets/setting1.png');
    this.load.audio('rotateSE', 'assets/rotateSound.mp3');
    this.load.audio('joinSE', 'assets/joinSound.mp3');
  }

  create() {
    this.score = 0;
    this.blockCollectionCount = 1000;
    this.freshID = 0;
    this.marginGrid = 4;
    this.checkOffset = -2;
    this.otherBlockSpacing = 5;
    this.lastMoveTime = 0.0;

    // グリッドのサイズを設定
    this.gridWidth = 500;
    this.gridHeight = 500;
    this.cellSize = 25;

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

    // 設定ボタン(歯車)画像を設定
    this.setting = this.add.image(790, 10, 'setting').setInteractive();
    this.setting.setDisplaySize(50, 50);
    this.setting.setTint(0xbbbbbb);
    this.setting.setOrigin(1, 0);
    this.setting.setScrollFactor(0);
    this.setting.on('pointerdown', this.toggleSettingsMenu, this);
    this.setting.on('pointerover', () => {
      this.input.manager.canvas.style.cursor = 'pointer';
    });
    this.setting.on('pointerout', () => {
      this.input.manager.canvas.style.cursor = 'default';
    });

    // 設定値を初期化
    this.registry.set('movespeed', 0.5); // 移動速度
    this.moveSpeed = this.registry.get('movespeed');
    this.registry.set('soundvolume', 0.5);
    this.sound.volume = this.registry.get('soundvolume') / 10; // 効果音量

    // スコア表示
    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { fontSize: '24px', fill: '#FFFFFF' }).setScrollFactor(0);

    // ブロックのグループを初期化
    this.blocks = [];
    this.otherBlockCollections = [];

    // 入力のハンドリング
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 初期の一つのブロック
    this.createBlock(Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2), 'wall');

    // カメラの設定
    this.cameras.main.setZoom(1.0); // 必要に応じてズームを調整
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

    // 移動処理1
    let moveDirection = null;
    const moveSpeed = 60 - this.moveSpeed * 50;
    if (this.lastMoveTime + moveSpeed < time) {
      if (left.isDown) {
        moveDirection = { x: -1, y: 0 };
      } else if (right.isDown) {
        moveDirection = { x: 1, y: 0 };
      } else if (up.isDown) {
        moveDirection = { x: 0, y: -1 };
      } else if (down.isDown) {
        moveDirection = { x: 0, y: 1 };
      } else {
        this.lastMoveTime = 0.0;
      }
    }

    const hitGrids = [];
  
    if (moveDirection) {
      let gridOut = false;
      this.lastMoveTime = time;

      // 全ての自分のブロックの行き先グリッドを確認し、他のブロックがあればhitGrid配列に追加
      this.blocks.forEach(block => {
        const checkGrid = {
          x:block.gridX + moveDirection.x,
          y:block.gridY + moveDirection.y
        };

        if (checkGrid.x < 1 || checkGrid.x >= this.gridWidth || checkGrid.y < 1 || checkGrid.y >= this.gridHeight) {
          gridOut = true;
        } else if (this.grid[checkGrid.x][checkGrid.y]) {
          hitGrids.push({ x: checkGrid.x, y:checkGrid.y });
        }
      });

      // hitGrid要素がない場合は移動先に移動、ある場合はhitGridにあるブロックを合体させる
      if (hitGrids.length == 0) {
        if (!gridOut) {
          this.moveMyBlock(moveDirection);
        }
      } else {
        this.joinBlock(hitGrids);
        this.checkAndMarkBlocks(this.blocks, this.gridWidth, this.gridHeight);
        this.blocks = this.removeMarkedBlocks(this.blocks);
        this.separateBlocks();
      }
    }

    if (spaceJustDown) this.rotateMyBlock();

    // 設定値を更新
    this.moveSpeed = this.registry.get('movespeed');
    this.sound.volume = this.registry.get('soundvolume') / 10;

    // 設定ボタンやスコアテキストを最前面に設定
    this.children.bringToTop(this.setting);
    this.children.bringToTop(this.settingsMenu);
    this.children.bringToTop(this.scoreText);

    // カメラの位置に基づいて背景を更新
    this.updateBackground();
    this.updateCamera();
  }

  createBlock(gridX, gridY, type) {   // 自分のブロックを生成する
    const block = new Block(this, gridX, gridY, this.cellSize, null, type);
    block.addEffect('brightness');
    this.blocks.push(block);
    return block;
  }

  createOtherBlocks() {   // 他のブロックをマップ上に生成する
    for (let id = this.freshID; id < this.blockCollectionCount; id++) {
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

      this.freshID++;
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

  rotateMyBlock(){    // 回転処理
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

  checkAndMarkBlocks(blocks, gridWidth, gridHeight) {   // 3x3の範囲で自分のブロックが存在したらスコア加算
    let completeCnt = 0;
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
        completeCnt++;
        for (let x = block.gridX; x < block.gridX + removeRange; x++) {
          for (let y = block.gridY; y < block.gridY + removeRange; y++) {
            const b = blocks.find(b => b.gridX === x && b.gridY === y);
            if (b) b.toBeRemoved = true;
          }
        }
      }
    });

    if (completeCnt > 0) {
      const addScorePoint = completeCnt * completeCnt + 2;
      this.updateScore(addScorePoint);
    }
    
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

  separateBlocks() {    // 分離処理　wallブロックと接していないブロック群を分離する　深さ優先探索
    let visited = Array(this.gridHeight).fill(null).map(() => Array(this.gridWidth).fill(false));
    let groups = [];

    const dfs = (x, y, currentGroup) => {
      if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight || visited[x][y]) {
        return;
      }

      const dfsBlock = this.blocks.find(b => b.gridX === x && b.gridY === y);

      if (dfsBlock !== undefined) {
        visited[x][y] = true;
        currentGroup.push(dfsBlock);

        dfs(x - 1, y, currentGroup);
        dfs(x + 1, y, currentGroup);
        dfs(x, y - 1, currentGroup);
        dfs(x, y + 1, currentGroup);
      }
    }

    this.blocks.forEach(block => {
      if (!visited[block.gridX][block.gridY]) {
        let currentGroup = [];
        dfs(block.gridX, block.gridY, currentGroup);
        groups.push(currentGroup);
      }
    });
    
    let hasWallGroup = [];

    groups.forEach(group => {
      const hasWall = group.some(block => block.type === 'wall');

      if (hasWall) {
        hasWallGroup = group;
      } else {
        const blockCollection = new BlockCollection(this, { x: 0, y: 0}, this.cellSize, this.freshID, 'other', false);

        group.forEach(block => {
          blockCollection.formOtherBlocks(this, block);
        });

        this.otherBlockCollections.push(blockCollection);
        group.forEach(block => {
          block.toBeRemoved = true;
        });
        group = this.removeMarkedBlocks(group);

        this.freshID++;
      }
      
    });

    this.blocks = hasWallGroup;
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
  
  toggleSettingsMenu() {    // 設定ボタンを押した時のイベント
    this.input.manager.canvas.style.cursor = 'default';
    this.scene.launch('SettingScene');
    this.scene.pause();
  }
}