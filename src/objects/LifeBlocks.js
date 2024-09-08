export default class LifeBlocks extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size) {
        super(scene, x, y);

        this.size = size;
        scene.add.existing(this);
    }

    addBlock(scene, type = 'wall') {
        const block = scene.add.image(this.length * this.size, 0, 'block').setDisplaySize(this.size, this.size);
        this.coloringByType(block, type);
        this.add(block);
    }

    coloringByType(block, type) {
        switch (type) {
            case 'wall':
            block.setTint(0xffffff);
            break;
            case 'I':
            block.setTint(0x00ffff);
            break;
            case 'O':
            block.setTint(0xffff00);
            break;
            case 'S':
            block.setTint(0x00ff00);
            break;
            case 'Z':
            block.setTint(0xff0000);
            break;
            case 'J':
            block.setTint(0x0000ff);
            break;
            case 'L':
            block.setTint(0xffA500);
            break;
            case 'T':
            block.setTint(0x800080);
            break;
            default:
            block.setTint(0x000000);
            console.log("Type is Nothing.");
            break;
        }
    }
}