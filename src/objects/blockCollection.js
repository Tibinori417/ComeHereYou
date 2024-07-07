export default class BlockCollection {
    constructor() {
        this.blocks = [];
    }

    destroy() {
        this.blocks.forEach( block => block.destroy());
        this.blocks = [];
    }
}