export default class CreditsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CreditsScene' });
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
            ja: "クレジット",
            en: "Credits"
        };
        this.add.text(400, 100, text1[window.currentLanguage], {
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
            fontSize: '32px',
            fill: '#555'
        }).setOrigin(0.5);

        // ルール説明テキスト
        const text2 = {
            ja: `
            【ゲーム制作】
            プログラミング: ちびのり
            デザイン: ちびのり
            サウンドエフェクト: 魔王魂
            BGM: 魔王魂

            【使用技術】
            ゲームエンジン: Phaser 3 (https://phaser.io)

            【ライセンス】
            Phaser 3はMITライセンスの下で提供されています。
            詳細は https://opensource.org/licenses/MIT をご覧ください。
            `,
            en: `
            【Game Development】
            Programming: ChibiNori
            Design: ChibiNori
            Sound Effects: Maou Damashii
            BGM: Maou Damashii

            【Technologies Used】
            Game Engine: Phaser 3 (https://phaser.io)

            【License】
            Phaser 3 is provided under the MIT License.
            For more details, please see https://opensource.org/licenses/MIT.
            `
        };
            

        this.add.text(70, 150, text2[window.currentLanguage], {
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
            fontSize: '18px',
            fill: '#000'
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