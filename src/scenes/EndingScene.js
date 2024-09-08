export default class EndingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndingScene' });
    }

    init(data) {
        this.score = data.score;
    }

    preload() {

    }

    create() {
        this.add.text(100, 100, `Score: ${this.score}`, { fontSize: '24px', fill: '#FFFFFF' });
    }

}