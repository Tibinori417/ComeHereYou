import Block from '../objects/Block.js';
import BlockCollection from '../objects/blockCollection.js';
import LifeBlocks from '../objects/LifeBlocks.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.playerName = data.playerName;
  }

  preload() {
    this.load.image('block', 'assets/block.png');
    this.load.image('backgroundTile', 'assets/background.png');
    this.load.image('setting', 'assets/setting1.png');
    this.load.image('particle1', 'assets/particle1_pipo-hiteffect010.png');
    this.load.audio('rotateSE', 'assets/rotateSound.mp3');
    this.load.audio('joinSE', 'assets/joinSound.mp3');
    this.load.audio('cantRotateSE', 'assets/cantRotateSound.mp3');
    this.load.audio('completeSE1', 'assets/completeSound1.mp3');
    this.load.audio('completeSE2', 'assets/completeSound2_maou_se_magical02.mp3');
    this.load.audio('completeSE3', 'assets/completeSound3_maou_se_magical21.mp3');
    this.load.audio('completeSE4', 'assets/brackholeSound_maou_se_magic_fire12.mp3');
    this.load.audio('bgm', 'assets/bgm_gameScene3_maou_game_rock52.mp3');
    this.load.spritesheet('blackhole', 'assets/brackhole_pipo-mapeffect015_480.png', {
      frameWidth: 480,
      frameHeight: 480,
      endFrame: 9
    });
  }

  create() {
    this.score = 0;
    this.blockCollectionCount = 2000;
    this.freshID = 0;
    this.marginGrid = 4;
    this.checkOffset = -2;
    this.otherBlockSpacing = 5;
    this.lastMoveTime = 0.0;
    this.lifeBlockSize = 15;
    this.enableInput = true;
    this.energyConsumptionInterval = 2000;  // エネルギー消費間隔、徐々にエネルギー消費が速くなる
    this.additionalEnergyConsumption = 0;   // 本体の大きさによる追加で消費するエネルギー
    this.myBlocksWidth;
    this.myBlocksHeight;
    this.earnedScore;

    // グリッドのサイズを設定
    this.gridWidth = 1000;
    this.gridHeight = 1000;
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
    this.background.setDepth(-999);

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
    this.input.keyboard.on('keydown-ESC', () => {
      this.toggleSettingsMenu(); // ESCキーで設定シーン呼び出し
    });

    // 設定値を初期化
    this.registry.set('movespeed', 0.5); // 移動速度
    this.moveSpeed = this.registry.get('movespeed');
    this.registry.set('soundvolume', 0.5);   // 効果音量
    this.sound.volume = this.registry.get('soundvolume') / 10;

    // 各キーの状態を管理するオブジェクトを初期化
    this.keyStates = {
      left: { isDown: false, lastMoveTime: 0, nextMoveTime: 0 },
      right: { isDown: false, lastMoveTime: 0, nextMoveTime: 0 },
      up: { isDown: false, lastMoveTime: 0, nextMoveTime: 0 },
      down: { isDown: false, lastMoveTime: 0, nextMoveTime: 0 },
    };

    // 初期のキー遅延と連続移動の間隔を設定（ミリ秒）
    this.initialKeyDelay = 200; // 初回の遅延時間（調整可能）
    this.keyRepeatInterval = 60; // 連続移動の間隔（調整可能）

    // スコア表示
    this.scoreText = this.add.text(10, 10, `Score: ${this.score}`, { fontSize: '24px', fill: '#FFFFFF' }).setScrollFactor(0);

    // エネルギーの設定
    this.maxLife = 30; // MAXは30秒分
    this.lifeBlocks = new LifeBlocks(this, 195, 22, this.lifeBlockSize).setScrollFactor(0);
    for (let b = 0; b < this.maxLife; b++) {
      this.lifeBlocks.addBlock(this);
    }
    this.timerEvent = this.time.addEvent({
      delay: this.energyConsumptionInterval,
      callback: this.updateTimer,
      callbackScope: this,
      loop: false
    });

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
    this.cantRotateSE = this.sound.add('cantRotateSE');
    this.completeSE1 = this.sound.add('completeSE1');
    this.completeSE2 = this.sound.add('completeSE2');
    this.completeSE3 = this.sound.add('completeSE3');
    this.completeSE4 = this.sound.add('completeSE4');

    // BGM
    this.bgm = this.sound.add('bgm', { volume: 1.0, loop: true});
    this.bgm.play();

    // ブラックホールのアニメーションを作成
    if (!this.anims.exists('blackhole_anim')) {
      this.anims.create({
        key: 'blackhole_anim',
        frames: this.anims.generateFrameNumbers('blackhole', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // 他のブロックをマップ上に配置
    this.createOtherBlocks();
  }

  update(time) {
    this.keyRepeatInterval = 60 - this.moveSpeed * 50;

    const keys = ['left', 'right', 'up', 'down'];
    const directions = {
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
    };

    let moveDirection = null;

    for (let key of keys) {
      const keyObj = this.cursors[key];
      const keyState = this.keyStates[key];

      if (keyObj.isDown) {
        if (!keyState.isDown) {
          // キーが新たに押されたとき
          keyState.isDown = true;
          keyState.lastMoveTime = time;
          keyState.nextMoveTime = time + this.initialKeyDelay;

          moveDirection = directions[key];
          break; // 一度に一つの方向のみ処理
        } else if (time >= keyState.nextMoveTime) {
          // キーが押し続けられている場合
          keyState.lastMoveTime = time;
          keyState.nextMoveTime = time + this.keyRepeatInterval;

          moveDirection = directions[key];
          break; // 一度に一つの方向のみ処理
        }
      } else {
        // キーが離されたとき
        keyState.isDown = false;
      }
    }

    // ブロック削除エフェクト中は操作不可
    if (this.enableInput) {
      const hitGrids = [];
      
      if (moveDirection) {
        let gridOut = false;

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
          this.completeFX(this.blocks);
        }
      }

      // 回転処理
      const spaceJustDown = Phaser.Input.Keyboard.JustDown(this.spaceKey);
      if (spaceJustDown) this.rotateMyBlock();

    }

    // 設定値を更新
    this.moveSpeed = this.registry.get('movespeed');
    this.sound.volume = this.registry.get('soundvolume');

    // 設定ボタンやスコアテキストを最前面に設定
    this.children.bringToTop(this.setting);
    this.children.bringToTop(this.settingsMenu);
    this.children.bringToTop(this.scoreText);
    this.children.bringToTop(this.lifeBlocks);

    // カメラの位置に基づいて背景を更新
    this.updateBackground();
    this.updateCamera();
  }

  createBlock(gridX, gridY, type) {   // 自分のブロックを生成する
    const block = new Block(this, gridX, gridY, this.cellSize, null, type);
    block.brightColoring();
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

    const rotatedBlocks = this.blocks.map( (block, index) => ({
      ...block,
      gridX: centerGrid.x + rotatedGrid[index].x,
      gridY: centerGrid.y + rotatedGrid[index].y,
    }));
    
    const noOverlap = rotatedBlocks.every( b => this.grid[b.gridX][b.gridY] === null);

    if (noOverlap) {
      this.blocks.forEach( (block, index) => {
        block.gridX = rotatedBlocks[index].gridX;
        block.gridY = rotatedBlocks[index].gridY;
        block.setPosition(block.gridX * this.cellSize, block.gridY * this.cellSize);
      });
      this.rotateSE.play();
    } else {
      const graphics = this.add.graphics();

      rotatedBlocks.forEach( block => {
        graphics.fillStyle(0xFF9999, 0.5);
        graphics.fillRect(block.gridX * this.cellSize - this.cellSize / 2, block.gridY * this.cellSize - this.cellSize / 2, this.cellSize, this.cellSize);
      });

      this.tweens.add({
        targets: graphics,
        alpha: 0,
        duration: 100,
        onComplete: () => {
          graphics.destroy();
        }
      });

      this.cantRotateSE.play();
    }
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
      this.earnedScore = completeCnt * completeCnt + 2;
    }
    
  }
  
  removeMarkedBlocks(energyUP = false) {
    this.blocks = this.blocks.filter(block => {
      if (block.toBeRemoved) {
        if (this.lifeBlocks.length <= 30) {
          if (energyUP) {
            this.lifeBlocks.addBlock(this, block.type);
          }
        }

        block.destroy();
        return false;
      }
      return true;
    });
  }

  completeFX(blocks) {
    const completeBlocks = blocks.filter(b => b.toBeRemoved);

    if (completeBlocks.length > 0) {
      this.timerEvent.paused = true; // 演出中はエネルギー消費ストップ
      this.enableInput = false;

      let effectLevel = 1;
      if (this.earnedScore >= 11) effectLevel = 2;
      if (this.earnedScore >= 27) effectLevel = 3;
      if (this.earnedScore >= 66) effectLevel = 4;

      if (effectLevel === 1) {
        this.completeSE1.play();
      } else if (effectLevel === 2) {
        this.completeSE2.play();
      } else if (effectLevel === 3) {
        this.completeSE3.play();
      } else if (effectLevel === 4) {
        this.completeSE4.play();
        this.triggerBlackholeEffect(completeBlocks);
        return;
      }

      // 通常の消滅アニメーションを実行
      this.animateBlocks(completeBlocks, effectLevel, () => {
        this.updateScore(this.earnedScore);
        this.removeMarkedBlocks(true);
        this.enableInput = true;
        this.timerEvent.paused = false;
        this.separateBlocks();
      });
    }
  }

  animateBlocks(blocks, effectLevel, onCompleteCallback) {
    let tweensCompleted = 0;
    const totalTweens = blocks.length;

    blocks.forEach(b => {
      // レベルに応じたアニメーション設定
      let tweenConfig = {
        targets: b,
        ease: 'Cubic.easeInOut',
        duration: 300,
        repeat: 0,
        yoyo: false,
        onComplete: () => {
          tweensCompleted++;

          if (tweensCompleted === totalTweens) {
            onCompleteCallback();
          }
        }
      };

      // レベルごとのエフェクトを設定
      if (effectLevel === 1) {
        // レベル1：点滅
        tweenConfig.tint = { from: b.tintTopLeft, to: 0x000000 };
        tweenConfig.duration = 50;
        tweenConfig.repeat = 4;
        tweenConfig.yoyo = true;
        tweenConfig.alpha = { from: 1, to: 0.5 };
      } else if (effectLevel === 2) {
        // レベル2：だんだん小さく、回転しながら、ちょっと長め
        tweenConfig.scale = { from: 0.8, to: 0 };
        tweenConfig.angle = 360;
        tweenConfig.duration = 400;
      } else if (effectLevel === 3) {
        // レベル3：パーティクルとカメラシェイクを追加
        tweenConfig.scale = { from: 0.5, to: 0.2 };
        tweenConfig.alpha = { from: 1, to: 0.5 };
        tweenConfig.tint = { from: 0xffffff, to: 0xff4500 }; // オレンジレッド

        // パーティクルエミッターを設定
        const emitterLife = 1500;
        const emitter = this.add.particles(0, 0, 'particle1', {
          x: b.x,
          y: b.y,
          speed: { min: 100, max: 200 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.2, end: 0 },
          lifespan: emitterLife,
          blendMode: 'ADD',
          quantity: 1
        });

        emitter.explode(2);

        this.time.delayedCall(emitterLife, () => {
          emitter.stop();
          emitter.destroy();
        });
      }

      this.tweens.add(tweenConfig);
    });

    // レベル3の場合、カメラシェイクを実行
    if (effectLevel === 3) {
      this.cameras.main.shake(700, 0.01);
    }
  }

  triggerBlackholeEffect(blocks) {
    // ブラックホールの位置を計算（ブロックの中心位置）
    let centerX = 0;
    let centerY = 0;
    blocks.forEach(b => {
      centerX += b.x;
      centerY += b.y;
    });
    centerX /= blocks.length;
    centerY /= blocks.length;

    // ブラックホールのスプライトを作成し、アニメーションを再生
    const blackhole = this.add.sprite(centerX, centerY, 'blackhole').setScale(0);
    blackhole.depth = -500; // 他のスプライトより前面に表示
    blackhole.play('blackhole_anim'); // アニメーションを再生

    // ブラックホールのアニメーション（拡大）
    this.tweens.add({
      targets: blackhole,
      scale: 1,
      duration: 1500,
      angle: 270,
      ease: 'Power1',
      onComplete: () => {
        // ブロックをブラックホールに吸い込む
        this.absorbBlocksIntoBlackhole(blocks, blackhole);
      } 
    });
  }

  absorbBlocksIntoBlackhole(blocks, blackhole) {
    let tweensCompleted = 0;
    const totalTweens = blocks.length;

    blocks.forEach(b => {
      this.tweens.add({
        targets: b,
          x: b.x + (Math.random() < 0.5 ? -2 : 2), // X方向にランダムに-2または2
          y: b.y + (Math.random() < 0.5 ? -2 : 2), // Y方向にランダムに-2または2
          duration: Phaser.Math.Between(100, 110), // 揺れる速度もランダム
          yoyo: true,
          repeat: Phaser.Math.Between(3, 6), // 継続的に揺れる
          onComplete: () => {
            this.tweens.add({
              targets: b,
              x: blackhole.x,
              y: blackhole.y,
              scale: 0,
              alpha: 0,
              angle: 360,
              duration: 700,
              ease: 'Cubic.easeIn',
              onComplete: () => {
                tweensCompleted++;
                if (tweensCompleted === totalTweens) {
                  // ブラックホールを縮小させて消す
                  this.tweens.add({
                    targets: blackhole,
                    scale: 0,
                    duration: 1000,
                    angle: 270,
                    ease: 'Power1',
                    onComplete: () => {
                      blackhole.stop(); // アニメーションを停止
                      blackhole.destroy(); // ブラックホールを削除
                      // スコア更新や他の処理を実行
                      this.updateScore(this.earnedScore);
                      this.removeMarkedBlocks(true);
                      this.enableInput = true;
                      this.timerEvent.paused = false;
                      this.separateBlocks();
                    }
                  });
                }
              }
            });
          }
      })
    });
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
        this.removeMarkedBlocks();

        this.freshID++;
      }
      
    });

    this.blocks = hasWallGroup;
  }

  updateTimer() {   // ブロックエネルギー消費、this.energyConsumptionIntervalの時間毎に呼び出される
    if (this.playerName === "debugmode") {
      return;
    }
    this.energyConsumptionInterval -= 2;
    this.lifeBlocks.removeAt(0);
    this.lifeBlocks.list.forEach((block, index) => {
      this.tweens.add({
        targets: block,
        x: index * this.lifeBlockSize,
        duration: 400,
        ease: 'Power2'
      });
    });

    if (this.lifeBlocks.length <= 0) {
      this.timerEvent.remove();
      this.sound.stopAll();
      this.scene.start('EndingScene', { score: this.score, playerName: this.playerName });
    }

    // エネルギー消費の時間を算出、エネルギー消費間隔を基準に本体のサイズが大きいほどブロック数が多いほど消費が速くなる、サイズは重み2倍
    let energyConsumptionDelay = Phaser.Math.Clamp(this.energyConsumptionInterval - this.myBlocksWidth / this.cellSize * 20 - this.myBlocksHeight / this.cellSize * 20 - this.blocks.length * 2, 1, 1500);

    this.timerEvent = this.time.addEvent({
      delay: energyConsumptionDelay,
      callback: this.updateTimer,
      callbackScope: this,
      loop: false
    });
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
    this.showFloatingScore(points);
    this.scoreText.setText(`Score: ${this.score}`);
  }

  showFloatingScore(score) {
    const wallBlock = this.blocks.find( block => block.type === 'wall' );
    const x = wallBlock.gridX * this.cellSize;
    const y = wallBlock.gridY * this.cellSize;

    const earnedScoreText = this.add.text(x, y, `+${score}`, {
      font: '24px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: earnedScoreText,
      y: y - 100,
      alpha: 0,
      duration: 3000,
      ease: 'Linear',
      onComplete: () => {
        earnedScoreText.destroy();
      }
    });
  }

  outputCenter() {  // 本体の中心座標を求める関数
    const minX = Math.min(...this.blocks.map(b => b.x));
    const minY = Math.min(...this.blocks.map(b => b.y));
    const maxX = Math.max(...this.blocks.map(b => b.x));
    const maxY = Math.max(...this.blocks.map(b => b.y));
    const centerX = (maxX + minX) / 2;
    const centerY = (maxY + minY) / 2;

    this.myBlocksWidth = maxX - minX;
    this.myBlocksHeight = maxY - minY;

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