import HighScoreManager from "../objects/highScoreManager.js";

export default class EndingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndingScene' });

        this.highScoreManager = new HighScoreManager();
    }

    init(data) {
        this.score = data.score;
        this.playerName = data.playerName;
    }

    preload() {

    }

    create() {
        // スコアを追加
        this.highScoreManager.addScore(this.playerName, this.score);

        // 全てのスコアを取得
        const allScores = this.highScoreManager.getAllScores();
        
        // 自分のスコアが何位かを確認
        let playerRank = -1;
        allScores.forEach((score, index) => {
            if (score.name === this.playerName && score.score === this.score) {
                playerRank = index + 1; // 1位から始まる順位にするため、indexに1を加算
            }
        });

        // トップ10のスコアを取得
        const topScores = allScores.slice(0, 10);

        // トップ10位のスコアを表示
        topScores.forEach((score, index) => {
            const scoreText = this.add.text(100, 100 + index * 30, `${index + 1}. ${score.name}: ${score.score}`);

            // 自分のスコアがトップ10内にある場合、点滅処理を追加
            if (playerRank === index + 1) {
                this.tweens.add({
                    targets: scoreText,
                    alpha: 0.3,            // 透明度を変化
                    duration: 500,       // 0.5秒で消える
                    ease: 'Linear',      // 線形アニメーション
                    yoyo: true,          // 往復アニメーション
                    repeat: -1           // 無限に繰り返す
                });
            }
        });

        // 自分のスコアの順位が10位以内にない場合、圏外表示を追加
        if (playerRank > 10) {
            
            const outOfRankingText = this.add.text(100, 100 + topScores.length * 30 + 30, `${playerRank}. ${this.playerName}: ${this.score}`);

            // 圏外スコアも点滅させる
            this.tweens.add({
                targets: outOfRankingText,
                alpha: 0.3,
                duration: 500,
                ease: 'Linear',
                yoyo: true,
                repeat: -1
            });
        }
        console.log(this.scale.width, this.scale.height);
        const backButton = this.add.text(this.scale.width / 2, this.scale.height - 100, 'Back to Start', { fontSize: '24px', fill: '#0000ff' })
            .setInteractive()
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.input.manager.canvas.style.cursor = 'default';
                this.scene.start('NameInputScene');
            });

        backButton.on('pointerover', () => {
            backButton.setStyle({ fill: '#ffffff' });
            this.input.manager.canvas.style.cursor = 'pointer';
        });
        backButton.on('pointerout', () => {
            backButton.setStyle({ fill: '#0000ff' });
            this.input.manager.canvas.style.cursor = 'default';
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('NameInputScene');
        });
    }
}