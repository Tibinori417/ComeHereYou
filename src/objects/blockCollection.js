import Block from "./Block.js";

export default class BlockCollection {
    constructor(scene, base, cellSize, id, shape) {
        this.blocks = [];
        this.id = id;
        this.shape = shape;
        this.base = base;
        this.cellSize = cellSize;

        console.log(this.shape);
        this.formBlocks(scene);
    }

    formBlocks(scene) {
        this.shape.forEach( offset => {
            const gridX = this.base.x + offset.x;
            const gridY = this.base.y + offset.y;
            const block = new Block(scene, gridX, gridY, this.cellSize, this.id);
            this.blocks.push(block);
            scene.grid[block.gridX][block.gridY] = block;
        });
    }

    destroy(scene) {
        this.blocks.forEach( block => {
            block.destroy();
            scene.grid[block.gridX][block.gridY] = null;
        });
        this.blocks = [];
    }
}