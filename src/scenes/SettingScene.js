export default class SettingScene extends Phaser.Scene {
  constructor() {
      super({ key: 'SettingScene' });
  }

  preload() {
    this.load.image('slider', 'assets/slider.png');
    this.load.image('sliderHandle', 'assets/slider_handle.png');
  }

  create() {
    // 現在の設定値を取得
    let movespeed = this.registry.get('movespeed');
    let soundvolume = this.registry.get('soundvolume');

    // 設定メニュー背景
    const menuBG = { x: 550, y: 400};
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7); // 半透明の黒
    overlay.fillRect(this.scale.width / 2 - menuBG.x / 2, this.scale.height / 2 - menuBG.y / 2, menuBG.x, menuBG.y);

    const text1 = {
      ja: "設定",
      en: "Settings"
    };
    this.add.text(this.scale.width / 2, 130, text1[window.currentLanguage], {
      fontFamily: '"Meiryo", "MS Gothic", sans-serif',
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // 設定項目
    const text2 = {
      ja: "移動速度",
      en: "Movement Speed"
    };
    this.createSlider(510, 210, text2[window.currentLanguage], movespeed, (value) => {
      this.registry.set('movespeed', value);
    });
    const text3 = {
      ja: "音量",
      en: "Sound Volume"
    };
    this.createSlider(510, 290, text3[window.currentLanguage], soundvolume, (value) => {
      this.registry.set('soundvolume', value);
    });

    // タイトルに戻る
    const text4 = {
      ja: "タイトルに戻りますか？",
      en: "Return to title?"
    };
    this.add.text(155, 370, text4[window.currentLanguage], {
      fontFamily: '"Meiryo", "MS Gothic", sans-serif',
      fontSize: '20px',
      fill: '#fff'
    })
      .setOrigin(0, 0.5);
    const text5 = {
      ja: "はい",
      en: "Yes",
    };
    const backButton = this.add.text(510, 370, text5[window.currentLanguage], {
      fontFamily: '"Meiryo", "MS Gothic", sans-serif',
      fontSize: '20px',
      fill: '#fff'
    })
      .setOrigin(0.5)
      .setInteractive();
    backButton.on('pointerdown', this.backToTitle, this);
    backButton.on('pointerover', () => {
      this.input.manager.canvas.style.cursor = 'pointer';
      const text6 = {
        ja: "本当に？",
        en: "Are you sure?"
      };
      backButton.setText(text6[window.currentLanguage]);
    });
    backButton.on('pointerout', () => {
      this.input.manager.canvas.style.cursor = 'default';
      backButton.setText(text5[window.currentLanguage]);
    });

    // 閉じるボタン
    const text7 = {
      ja: "閉じる",
      en: "Close"
    };
    const closeButton = this.add.text(400, 450, 'Close', { fontSize: '24px', fill: '#ffffff' })
      .setOrigin(0.5)
      .setInteractive();
    closeButton.on('pointerdown', this.closeMenu, this);
    closeButton.on('pointerover', () => {
      this.input.manager.canvas.style.cursor = 'pointer';
    });
    closeButton.on('pointerout', () => {
      this.input.manager.canvas.style.cursor = 'default';
    });

    // 設定メニュー外をクリックしたら設定ニューを閉じる
    this.input.on('pointerdown', (pointer) => {
      const { x, y } = pointer;
      if (x < this.scale.width / 2 - menuBG.x / 2 || x > this.scale.width / 2 + menuBG.x / 2 || y < this.scale.height / 2 - menuBG.y / 2 || y > this.scale.height / 2 + menuBG.y / 2) {
        this.closeMenu();
      }
    });

    // Escキーで設定メニューを閉じる
    this.input.keyboard.on('keydown-ESC', () => {
      this.closeMenu();
    });
  }

  createSlider(x, y, label, settingvalue, onValueChange) {    // スライダー生成関数
    this.add.text(x - 355, y, label, {
      fontFamily: '"Meiryo", "MS Gothic", sans-serif',
      fontSize: '20px',
      fill: '#fff'
    }).setOrigin(0, 0.5);
    
    const track = this.add.image(x, y, 'slider').setOrigin(0.5)
    const handle = this.add.image(x, y, 'sliderHandle')
      .setOrigin(0.5)
      .setInteractive({ draggable: true });

    const minX = x - track.width / 2 + handle.width / 2;
    const maxX = x + track.width / 2 - handle.width / 2;

    handle.x = minX + settingvalue * (maxX - minX);

    // スライダーハンドルにカーソルを合わせたら指、離れたら矢印、ドラッグ中は指のまま変更なし、ドラッグ終了時にオブジェクト上なら指のままでオブジェクト外なら矢印
    handle.on('drag', (pointer, dragX) => {
      handle.x = Phaser.Math.Clamp(dragX, minX, maxX);
      const value = (handle.x - minX) / (maxX - minX);
      onValueChange(value);
    });
    handle.on('dragend', (pointer, dropped) => {
      if (!dropped) {
        this.input.manager.canvas.style.cursor = 'default';
      }
    });
    handle.on('pointerover', () => {
      this.input.manager.canvas.style.cursor = 'pointer';
    });
    handle.on('pointerout', () => {
      this.input.manager.canvas.style.cursor = 'default';
    });

  }

  closeMenu() {
    this.input.manager.canvas.style.cursor = 'default';
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  backToTitle() {
    this.sound.stopAll();
    this.scene.stop('GameScene');
    this.scene.start('NameInputScene');
  }
}
