import GameScene from './src/scenes/GameScene.js';

let game;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  parent: 'phaser-game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [GameScene],
  audio: {
    disableWebAudio: false
  },
  fps: {
    target: 60, // フレームレートを30fpsに設定
    forceSetTimeOut: true
  },
  dom: {
    createContainer: true
  }
};

// AudioContextの再開を管理する関数
function resumeAudioContext() {
  if (game && game.sound && game.sound.context) {
      console.log('Checking AudioContext state...');
      console.log('Current AudioContext state:', game.sound.context.state);  // 現在の状態をログに表示

      if (game.sound.context.state === 'suspended') {
          game.sound.context.resume().then(() => {
              console.log('AudioContext resumed');
          }).catch(err => {
              console.error('Failed to resume AudioContext:', err);
          });
      } else {
          console.log('AudioContext is not suspended:', game.sound.context.state);
      }
  }
}

// ユーザー操作を検出するためのイベントリスナーを設定
const startMessage = document.getElementById('startMessage');
const phaserGameDiv = document.getElementById('phaser-game');
startMessage.addEventListener('click', startGame);

function startGame() {
  if (!game) {
      game = new Phaser.Game(config);
  }
  resumeAudioContext();

  // メッセージを非表示にしてPhaserの描画エリアを表示
  startMessage.style.display = 'none';
  phaserGameDiv.style.display = 'block';

  startMessage.removeEventListener('click', startGame); // イベントリスナーを解除する
}