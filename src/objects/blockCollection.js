import Block from "./Block.js";

export default class BlockCollection {
    constructor(scene, base, cellSize, id, shape, type) {
        this.blocks = [];
        this.id = id;
        this.shape = shape;
        this.base = base;
        this.cellSize = cellSize;
        this.type = type;
        this.rotateTimes = Math.floor(Math.random() * 4);
        
        const rotatedShape = this.rotateShape(this.shape, this.rotateTimes);
        this.shape = this.centerShape(rotatedShape);
        this.formBlocks(scene);
    }

    formBlocks(scene) {     // ブロック集合体を形成する
        this.shape.forEach( offset => {
            const gridX = this.base.x + offset.x;
            const gridY = this.base.y + offset.y;
            const block = new Block(scene, gridX, gridY, this.cellSize, this.id, this.type);
            this.blocks.push(block);
            scene.grid[block.gridX][block.gridY] = block;
        });
    }

    rotateShape(shape, times = 0) {       // 90度回転を適用する関数
        return shape.map(block => {
            for (let i = 0; i < times; i++) {
                const { x, y } = block;
                block = { x: -y, y: x };
            }
            return block;
        });
    }

    centerShape(shape) {        // 形状の中心を原点に移動
        const minX = Math.min(...shape.map(b => b.x));
        const minY = Math.min(...shape.map(b => b.y));
        return shape.map(block => ({
        x: block.x - minX,
        y: block.y - minY
        }));
    }

    destroy(scene) {
        this.blocks.forEach( block => {
            scene.grid[block.gridX][block.gridY] = null;
            block.destroy();
        });
        this.blocks = [];
    }
}