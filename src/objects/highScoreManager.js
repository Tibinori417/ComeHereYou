export default class HighScoreManager {
    constructor() {
        this.highScores = this.loadHighScores();
    }

    loadHighScores() {
        const scores = localStorage.getItem('highScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScores() {
        localStorage.setItem('highScores', JSON.stringify(this.highScores));
    }

    addScore(name, score) {
        this.highScores.push({ name, score });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);  // Keep only top 10
        this.saveHighScores();
    }

    getTopScores(limit = 10) {
        return this.highScores.slice(0, limit);
    }
}