export default class RuleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RuleScene' });
    }
  
    preload() {
    }
  
    create() {
        // 設定メニュー背景
        const menuBG = { x: 750, y: 450};
        const overlay = this.add.graphics();
        overlay.fillStyle(0xaaaaaa, 1.0);
        overlay.fillRect(this.scale.width / 2 - menuBG.x / 2, this.scale.height / 2 - menuBG.y / 2, menuBG.x, menuBG.y);

        // タイトルテキスト
        const text1 = {
            ja: "ルール",
            en: "Rules"
        };
        this.add.text(400, 100, text1[window.currentLanguage], {
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
            fontSize: '32px',
            fill: '#555'
        }).setOrigin(0.5);

        // ルール説明テキスト
        const text2 = {
            ja: [
                "1. カーソルキーで移動",
                "2. スペースキーで回転",
                "3. 本体を除くブロックで3x3の範囲が埋まると消えます",
                "4. 一度に大きな範囲を消すとスコアを多く獲得できます",
                "5. 画面上部のブロックエネルギーが尽きると活動停止します",
                "6. ブロックをくっつけすぎるとエネルギー消費が速くなります",
                "7. スコア1位を目指せ"
            ],
            en: [
                "1. Move with the arrow keys",
                "2. Rotate with the spacebar",
                "3. Blocks vanish when a 3x3 area is filled (excluding the core block)",
                "4. Clear larger areas at once to earn more points",
                "5. The game stops when top block energy runs out",
                "6. Attaching too many blocks increases energy consumption",
                "7. Aim for the top score"
            ]
        };
            

        text2[window.currentLanguage].forEach((rule, index) => {
            this.add.text(70, 150 + index * 50, rule, {
                fontFamily: '"Meiryo", "MS Gothic", sans-serif',
                fontSize: '18px',
                fill: '#000'
            });
        });

        // 開始ボタン
        const text3 = {
            ja: "戻る",
            en: "Back"
        };
        const startButton = this.add.text(400, 500, text3[window.currentLanguage], { fontSize: '28px', fill: '#0f0' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.startGame());

        // ボタンホバーエフェクト
        startButton.on('pointerover', () => startButton.setStyle({ fill: '#ff0' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#0f0' }));
    }

    startGame() {
        // 名前入力シーンに戻る
        this.input.manager.canvas.style.cursor = 'default';
        this.scene.stop();
        this.scene.resume('NameInputScene');
    }
}