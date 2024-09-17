export default class NameInputScene extends Phaser.Scene {
    constructor() {
        super('NameInputScene');
        this.maxNameLength = 10;
    }

    init() {
        this.playerName = '';
    }

    create() {
        this.add.text(400, 150, 'Enter Your Name', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // テキスト入力フィールドの作成
        this.textEntry = this.add.text(400, 250, '', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 入力フィールドの下線
        const line = this.add.line(400, 290, 0, 0, 200, 0, 0xffffff);
        line.setOrigin(0.5, 0);

        // 文字数カウンターの表示
        this.charCountText = this.add.text(500, 300, '0 / ' + this.maxNameLength, {
            fontSize: '18px',
            fill: '#cccccc'
        }).setOrigin(0, 0);

        // エラーメッセージ（初期状態は非表示）
        this.errorText = this.add.text(400, 330, '', {
            fontSize: '18px',
            fill: '#ff0000'
        }).setOrigin(0.5).setVisible(false);

        // テキスト入力の設定
        this.input.keyboard.on('keydown', this.handleInput, this);

        // スタートボタン
        const startButton = this.add.text(400, 400, 'Start Game', {
            fontSize: '24px',
            fill: '#0000ff',
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ffffff' });
            this.input.manager.canvas.style.cursor = 'pointer'
        });
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#0000ff' });
            this.input.manager.canvas.style.cursor = 'default'
        });
        startButton.on('pointerdown', () => {
            this.startGame();
        });
    }

    handleInput(event) {
        if (event.keyCode === 8 && this.playerName.length > 0) {
            // バックスペースキー
            this.playerName = this.playerName.substring(0, this.playerName.length - 1);
        } else if (event.keyCode === 13) {
            // Enterキー
            this.startGame();
        } else if (this.playerName.length < this.maxNameLength &&
                   ((event.keyCode >= 48 && event.keyCode <= 90) || // 数字とアルファベット
                    (event.keyCode >= 96 && event.keyCode <= 105))) { // テンキー
            this.playerName += event.key;
        }

        this.updateDisplay();
    }

    updateDisplay() {
        this.textEntry.setText(this.playerName);
        this.charCountText.setText(`${this.playerName.length} / ${this.maxNameLength}`);
        
        if (this.playerName.length >= this.maxNameLength) {
            this.charCountText.setColor('#ff0000');
        } else {
            this.charCountText.setColor('#cccccc');
        }

        this.errorText.setVisible(false);
    }

    startGame() {
        if (this.playerName.length > 0) {
            this.input.manager.canvas.style.cursor = 'default';
            this.scene.start('GameScene', { playerName: this.playerName });
        } else {
            this.errorText.setText('Please enter a name').setVisible(true);
        }
    }
}