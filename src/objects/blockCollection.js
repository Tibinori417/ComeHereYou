import Block from "./Block.js";

export default class BlockCollection {
    constructor(scene, base, cellSize, id, type) {
        this.blocks = [];
        this.base = base;
        this.cellSize = cellSize;
        this.id = id;
        this.type = type;
        this.shape = this.type2Shape(this.type);
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

    rotateShape(shape, times = 0) {       // 90度回転をtimesの回数だけ適用する関数
        return shape.map(block => {
            for (let i = 0; i < times; i++) {
                const { x, y } = block;
                block = { x: -y, y: x };
            }
            return block;
        });
    }

    centerShape(shape) {        // 形状の左上を原点に移動
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

    type2Shape(type) {
        let shape;

        switch (type) {
            case 'I':
                shape = [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                    { x: 0, y: 2 },
                    { x: 0, y: 3 }
                  ];
                break;
            case 'O':
                shape = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 0, y: 1 },
                    { x: 1, y: 1 }
                  ];
                break;
            case 'S':
                shape = [
                    { x: 1, y: 0 },
                    { x: 1, y: 1 },
                    { x: 0, y: 1 },
                    { x: 0, y: 2 }
                  ];
                break;
            case 'Z':
                shape = [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                    { x: 1, y: 1 },
                    { x: 1, y: 2 }
                  ];
                break;
            case 'J':
                shape = [
                    { x: 1, y: 0 },
                    { x: 1, y: 1 },
                    { x: 1, y: 2 },
                    { x: 0, y: 2 }
                  ];
                break;
            case 'L':
                shape = [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                    { x: 0, y: 2 },
                    { x: 1, y: 2 }
                  ];
                break;
            case 'T':
                shape = [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 2, y: 0 },
                    { x: 1, y: 1 }
                  ];
                break;
            default:
                console.log("Type is Nothing in CollectionClass.");
                break;
        }

        return shape;
    }
}