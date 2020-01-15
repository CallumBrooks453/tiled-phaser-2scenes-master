class BaseScene extends Phaser.Scene {
    map;
    player;
    cursors;
    camera;
    exitLayer;
    score;
    gems;
    skulls;

    constructor(key) {
        super(key);
    }
    create() {
        //Create tilemap and attach tilesets

        this.map.landscape = this.map.addTilesetImage('tilesheet_complete', 'landscape-image');

        //Set world bounds
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        //Create background and platform layers
        this.map.createStaticLayer('Background1', [this.map.landscape], 0, 0);
        this.map.createStaticLayer('Background2', [this.map.landscape], 0, 0);
        this.map.createStaticLayer('Platforms', [this.map.landscape], 0, 0);
        this.exitLayer = this.map.createStaticLayer('Exit', [this.map.landscape], 0, 0);

        //Create groups
        this.gems = this.physics.add.staticGroup();
        this.skulls = this.physics.add.group();

        //Create from object layer(s)
        let objectLayer = this.map.getObjectLayer("objects")
        if (objectLayer) {
            objectLayer.objects.forEach(function (object) {
                object = this.retrieveCustomProperties(object); //Check if the object has any custom properties in Tiled and assign them to the object
                if (object.type === "playerSpawn") {
                    //Create player
                    this.createPlayer(object);
                } else if (object.type === "pickups") {
                    //Create gem
                    this.createGem(object);
                } else if (object.type === "enemySpawner") {
                    //Create enemy
                    this.createSkull(object);
                }
            }, this);

            //Create player
            //this.createPlayer();
            this.player.setSize(22, 40).setOffset(18, 5);


            //Create foreground layers
            this.map.createStaticLayer('Foreground', [this.map.landscape, this.map.props], 0, 0);

            //Set up camera (can be in a createCamera() function)
            this.camera = this.cameras.getCamera("");
            this.camera.startFollow(this.player);
            this.camera.setBounds(0, 0, this.map.widthInPixels, this.map.height * this.map.tileHeight);
            this.camera.zoom = 2;

            //Create collision
            this.createCollision();

            //Enable cursors
            this.cursors = this.input.keyboard.createCursorKeys();
        }
        //Collision Between Player and Gem + Score
        this.physics.add.overlap(this.player, this.gems, this.collectGems, null, this);

        this.scoreText = this.add.text(160, 160, 'Score: '  + this.score , {
            fontSize: '20px',
            fill: '#000'
        }).setScrollFactor(0);
    }

    update() {
        //Check arrow keys
        if (this.cursors.right.isDown) {
            this.player.setVelocityX(100);
            // this.player.flipX = false;
        } else if (this.cursors.left.isDown) {
            this.player.setVelocityX(-100);
            // this.player.flipX = true;
        } else {
            this.player.setVelocityX(0);
        }

        //Check for space bar press
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.player.setVelocityY(-200);
        }
    }

    collectGems(player, gems) {
        gems.disableBody(true, true);
        this.score += 1;
        this.scoreText.setText('Score: ' + this.score);
    }

    createPlayer(object) {
        //Add sprite to world
        this.player = this.physics.add.sprite(object.x, object.y, 'player', 1);
        this.player.setCollideWorldBounds(true);
    }

    createGem(object) {
        //Add sprite 
        this.gems.create(object.x, object.y, object.sprite);
    }

    createSkull(object) {
        let origin = {
            x: object.x,
            y: object.y + object.height
        };
        let dest = {
            x: object.x + object.width,
            y: object.y + object.height
        };
        let line = new Phaser.Curves.Line(origin, dest);
        let skull = this.add.follower(line, origin.x, origin.y, 'skull');
        this.physics.add.existing(skull);
        this.skulls.add(skull);

        skull.startFollow({
            duration: 1000,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        })
    }

    createCollision() {
        //Set collision for all tiles in the "platforms" layer
        this.collisionLayer = this.map.getLayer('Platforms').tilemapLayer;
        this.collisionLayer.setCollisionBetween(0, 10000);

        //Enable collision between player and "platforms" layer
        this.physics.add.collider(this.player, this.collisionLayer);

    }

    retrieveCustomProperties(object) {
        if (object.properties) { //Check if the object has custom properties
            if (Array.isArray(object.properties)) { //Check if from Tiled v1.3 and above
                object.properties.forEach(function (element) { //Loop through each property
                    this[element.name] = element.value; //Create the property in the object
                }, object); //Assign the word "this" to refer to the object
            } else { //Check if from Tiled v1.2.5 and below
                for (var propName in object.properties) { //Loop through each property
                    object[propName] = object.properties[propName]; //Create the property in the object
                }
            }

            delete object.properties; //Delete the custom properties array from the object
        }

        return object; //Return the new object w/ custom properties
    }
}





class SceneA extends BaseScene {
    constructor() {
        super('sceneA');
    }
    preload() {
        //Load assets
        this.load.image('landscape-image', 'assets/tilesheet_complete.png');
        this.load.image('gems', 'assets/gem.png');
        // this.load.image('props-image', 'assets/props-tileset.png');
        this.load.spritesheet('player', 'assets/Goat.png', {
            frameWidth: 40,
            frameHeight: 45
        });
        //Load Tiled JSON
        this.load.tilemapTiledJSON('level1', 'assets/level1new.json');
    }
    create() {
        this.score = 0;
        this.map = this.make.tilemap({
            key: 'level1'
        });
        super.create();
    }
    update() {
        super.update();
        let tile = this.exitLayer.getTileAtWorldXY(this.player.x, this.player.y);
        if (tile) {
            switch (tile.index) {
                case 2873:
                case 2874:
                case 2875:
                case 2876:
                case 2961:
                case 2962:
                case 2963:
                case 2964:
                case 3049:
                case 3050:
                case 3051:
                case 3052:
                case 3137:
                case 3138:
                case 3139:
                case 3140:
                    this.processExit();
                    break;
            }
        }
    }
    processExit() {
        console.log('player reached exit');
        this.scene.start('sceneB', {
            score: this.score
        });
    }
}


class SceneB extends BaseScene {
    constructor() {
        super('sceneB');
    }
    init(data) {
        this.score = data.score;
    }
    preload() {
        //Load assets
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 24,
            frameHeight: 24
        });
        //Load Tiled JSON
        this.load.tilemapTiledJSON('level2', 'assets/level2.json');
    }
    create() {
        console.log('this.score = ' + this.score);
        this.map = this.make.tilemap({
            key: 'level2'
        });
        super.create();
    }
}