export default class NameInputScene extends Phaser.Scene {
    constructor() {
        super('NameInputScene');
        this.maxNameLength = 10;
    }

    init() {
        this.playerName = '';
    }

    preload() {
        this.load.image('titleJa', 'assets/titleName_ja.png');
        this.load.image('titleEn', 'assets/titleName_en.png');
        this.load.image('markJa', 'assets/mark_ja.png');
        this.load.image('markEn', 'assets/mark_en.png');
        this.load.audio('enterSE', 'assets/enterSound_maou_se_8bit25.mp3');
        this.load.audio('titleBGM', 'assets/bgm_titleScene_maou_game_rock45.mp3');
        this.load.audio('typingSE', 'assets/enterSound_maou_se_system45.mp3');
    }

    create() {
        const titleiamge = {
            ja: 'titleJa',
            en: 'titleEn'
        };
        this.add.image( 400, 100, titleiamge[window.currentLanguage]).setOrigin(0.5);

        const text1 = {
            ja: "名前を入力してください",
            en: "Enter player name"
        };
        this.add.text(400, 200, text1[window.currentLanguage], {
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
            fontSize: '18px',
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
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
            fontSize: '18px',
            fill: '#ff0000'
        }).setOrigin(0.5).setVisible(false);

        // テキスト入力の設定
        this.input.keyboard.on('keydown', this.handleInput, this);

        // スタートボタン
        const text2 = {
            ja: "ゲーム開始",
            en: "Start Game"
        };
        const startButton = this.add.text(400, 400, text2[window.currentLanguage], {
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
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

        // ルールボタン
        const text3 = {
            ja: "ルール",
            en: "Rules"
        };
        const ruleButton = this.add.text(790, 560, text3[window.currentLanguage], {
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
            fontSize: '24px',
            fill: '#0000ff',
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setOrigin(1.0, 1.0).setInteractive();

        ruleButton.on('pointerover', () => {
            ruleButton.setStyle({ fill: '#ffffff' });
            this.input.manager.canvas.style.cursor = 'pointer'
        });
        ruleButton.on('pointerout', () => {
            ruleButton.setStyle({ fill: '#0000ff' });
            this.input.manager.canvas.style.cursor = 'default'
        });
        ruleButton.on('pointerdown', this.toggleRule, this);

        // クレジットボタン
        const text4 = {
            ja: "クレジット",
            en: "Credits"
        };
        const creditsButton = this.add.text(790, 590, text4[window.currentLanguage], {
            fontFamily: '"Meiryo", "MS Gothic", sans-serif',
            fontSize: '24px',
            fill: '#0000ff',
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setOrigin(1.0, 1.0).setInteractive();

        creditsButton.on('pointerover', () => {
            creditsButton.setStyle({ fill: '#ffffff' });
            this.input.manager.canvas.style.cursor = 'pointer'
        });
        creditsButton.on('pointerout', () => {
            creditsButton.setStyle({ fill: '#0000ff' });
            this.input.manager.canvas.style.cursor = 'default'
        });
        creditsButton.on('pointerdown', this.toggleCredits, this);

        // 言語切り替えボタン
        const languageimage = {
            ja: 'markJa',
            en: 'markEn'
        };
        const languageButton = this.add.image(10, 590, languageimage[window.currentLanguage])
            .setOrigin(0, 1.0)
            .setInteractive();
        languageButton.setDisplaySize(20, 15);
        languageButton.on('pointerdown', this.switchLanguage, this);
        languageButton.on('pointerover', () => {
        this.input.manager.canvas.style.cursor = 'pointer';
        });
        languageButton.on('pointerout', () => {
        this.input.manager.canvas.style.cursor = 'default';
        });

        // BGM、効果音
        this.enterSE = this.sound.add('enterSE');
        this.typingSE = this.sound.add('typingSE');
        this.titleBGM = this.sound.add('titleBGM');
        this.titleBGM.play();
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
            this.typingSE.play();
        }

        this.errorText.setVisible(false);
    }

    startGame() {
        const text4 = {
            ja: "名前を入力してください",
            en: "Please enter player name"
        };
        if (this.playerName.length > 0) {
            this.sound.stopAll();
            this.enterSE.play();
            this.input.manager.canvas.style.cursor = 'default';
            this.scene.start('GameScene', { playerName: this.playerName });
        } else {
            this.errorText.setText(text4[window.currentLanguage]).setVisible(true);
        }
    }

    toggleRule() {
        this.input.manager.canvas.style.cursor = 'default';
        this.scene.launch('RuleScene');
        this.scene.pause();
    }

    toggleCredits() {
        this.input.manager.canvas.style.cursor = 'default';
        this.scene.launch('CreditsScene');
        this.scene.pause();
    }

    switchLanguage() {
        window.currentLanguage = window.currentLanguage === 'en' ? 'ja' : 'en';
        this.sound.stopAll();
        this.scene.restart();
    }
}