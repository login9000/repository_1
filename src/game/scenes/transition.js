export default class Transition extends Phaser.Scene {
    constructor() {
        super({ key: "transition" });
    }

    init(data) {
        this.map = data.map
    }

    create() {
        this.width = this.sys.game.config.width;
        this.height = this.sys.game.config.height;
        this.center_width = this.width / 2;
        this.center_height = this.height / 2;

        this.add.image(this.center_width, this.center_height, 'club')

        this.time.delayedCall(
            1000,
            () => {
                this.loadNext();
            },
            null,
            this
        );
    }

    loadNext() {
        this.scene.start("game", { map: this.map });
    }
}