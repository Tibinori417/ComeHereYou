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
        this.highScoreManager.addScore(this.playerName, this.score);
        const topScores = this.highScoreManager.getTopScores();
        topScores.forEach((score, index) => {
            this.add.text(100, 100 + index * 30, `${index + 1}. ${score.name}: ${score.score}`);
        });
    }

}