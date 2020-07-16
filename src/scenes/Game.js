import Phaser from "phaser";
import Carrot from "../game/Carrots";

import background from "../assets/Background/bg_layer1.png";
import platform from "../assets/Environment/ground_grass.png";
import bunnyStand from "../assets/Players/bunny1_stand.png";
import bunnyJump from "../assets/Players/bunny1_jump.png";
import carrot from "../assets/Items/carrot.png";

export default class Game extends Phaser.Scene {

  constructor() {
    super("game");
    this.player;
    this.platforms;
    this.cursors;
    this.carrots;
    this.carrotsCollected;
    this.carrotsCollectedText;
  }
  init() {
    this.carrotsCollected = 0;
  }
  preload() {
    this.load.image("background", background);

    this.load.image("platform", platform);

    this.load.image("bunny-stand", bunnyStand);
    this.load.image("bunny-jump", bunnyJump);

    this.load.image("carrot", carrot);

    this.load.audio("jump", "src/assets/sounds/phaseJump1.ogg");
    this.load.audio("plus", "src/assets/sounds/pepSound3.ogg");

    this.cursors = this.input.keyboard.createCursorKeys();
  }
  create() {
    this.add.image(240, 320, "background").setScrollFactor(1, 0);

    this.platforms = this.physics.add.staticGroup();

    for (let i = 0; i < 5; ++i) {
      const x = Phaser.Math.Between(80, 400);
      const y = 175 * i;

      const platform = this.platforms.create(x, y, "platform");
      platform.scale = 0.5;

      const body = platform.body;
      body.updateFromGameObject();
    }

    this.player = this.physics.add
      .sprite(240, 320, "bunny-stand")
      .setScale(0.5);

    this.physics.add.collider(this.platforms, this.player);

    this.cameras.main.startFollow(this.player);

    this.cameras.main.setDeadzone(this.scale.width * 1.5);

    this.carrots = this.physics.add.group({ classType: Carrot });

    this.physics.add.collider(this.platforms, this.carrots);

    this.physics.add.overlap(
      this.player,
      this.carrots,
      this.handleCollectCarrot,
      undefined,
      this
    );

    const style = { color: "#000", fontSize: 24 };
    this.carrotsCollectedText = this.add
      .text(240, 10, `Carrots: 0`, style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0);
  }

  update() {
    this.platforms.children.iterate((platform) => {
      const { scrollY } = this.cameras.main;

      if (platform.y >= scrollY + 700) {
        platform.y = scrollY - Phaser.Math.Between(50, 100);
        platform.x = Phaser.Math.Between(80, 400);
        platform.body.updateFromGameObject();

        this.addCarrotAbove(platform);
      }
    });

    this.carrots.children.iterate((carrot) => {
      const { scrollY } = this.cameras.main;

      if (carrot.y >= scrollY + 700) {
        this.carrots.killAndHide(carrot);
        this.physics.world.disableBody(carrot.body);
      }
    });

    const touchingDown = this.player.body.touching.down;

    if (touchingDown) {
      this.player.setVelocityY(-300);

      this.sound.play("jump");
    }

    if (this.player.body.velocity.y > 0) {
      this.player.setTexture("bunny-jump");
    } else {
      this.player.setTexture("bunny-stand");
    }

    if (this.cursors.left.isDown && !touchingDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown && !touchingDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    this.player.body.checkCollision.up = false;
    this.player.body.checkCollision.right = false;
    this.player.body.checkCollision.left = false;

    this.horizontalWrap(this.player);

    const bottomPlatform = this.findBottomMostPlatform();
    if (this.player.y > bottomPlatform.y + 200) {
      this.scene.start("game-over");
    }
  }

  addCarrotAbove(sprite) {
    const y = sprite.y - sprite.displayHeight;

    const carrot = this.carrots.get(sprite.x, y, "carrot");

    carrot.setActive(true);
    carrot.setVisible(true);

    this.add.existing(carrot);

    carrot.body.setSize(carrot.width, carrot.height);

    this.physics.world.enable(carrot);

    return carrot;
  }

  horizontalWrap(sprite) {
    const halfWidth = sprite.displayWidth * 0.5;
    const gameWidth = this.scale.width;

    if (sprite.x < -halfWidth) {
      sprite.x = gameWidth + halfWidth;
    } else if (sprite.x > gameWidth + halfWidth) {
      sprite.x = -halfWidth;
    }
  }

  handleCollectCarrot(player, carrot) {
    this.carrots.killAndHide(carrot);
    this.physics.world.disableBody(carrot.body);

    this.carrotsCollected++;

    const value = `Carrots: ${this.carrotsCollected}`;
    this.carrotsCollectedText.text = value;

    this.sound.play("plus");
    }

  findBottomMostPlatform() {
    const platforms = this.platforms.getChildren();
    let bottomPlatform = platforms[0];

    for (let i = 1; i < platforms.length; ++i) {
      const platform = platforms[i];

      if (platform.y < bottomPlatform.y) {
        continue;
      }
      bottomPlatform = platform;
    }

    return bottomPlatform;
  }
}
