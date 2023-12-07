class Game {
  constructor() {
    this.resetTitle = createElement("h2");
    this.resetButton = createButton("");

    this.leadeboardTitle = createElement("h2");

    this.leader1 = createElement("h2");
    this.leader2 = createElement("h2");
    this.playerMoving = false;
    this.blast = false
    this.leftKeyActive = false;


  }

  getState() {
    var gameStateRef = database.ref("gameState");
    gameStateRef.on("value", function (data) {
      gameState = data.val();
    });
  }
  update(state) {
    database.ref("/").update({
      gameState: state
    });
  }

  start() {
    player = new Player();
    playerCount = player.getCount();

    form = new Form();
    form.display();

    car1 = createSprite(width / 2 - 50, height + 30);
    car1.addImage("car1", car1_img);
    car1.scale = 0.07;
    car1.addImage("blast", blastImage); //C42 //SA

    car2 = createSprite(width / 2 + 100, height - 40);
    car2.addImage("car2", car2_img);
    car2.scale = 0.07;
    car2.addImage("blast", blastImage); //C42//SA

    cars = [car1, car2];

    fuels = new Group();
    powerCoins = new Group();
    obstacle1 = new Group();
    obstacle2 = new Group();
    var obstacle1Positions = [
      { x: width / 2 - 130, y: height - 4350, image: obstacle1Image },
      { x: width / 2 + 250, y: height - 1800, image: obstacle1Image },
      { x: width / 2 - 180, y: height - 3402, image: obstacle1Image },

      { x: width / 2 - 190, y: height - 4789, image: obstacle1Image },
      { x: width / 2, y: height - 3300, image: obstacle1Image },
      { x: width / 2- 200, y: height - 2300, image: obstacle1Image },
    ];

    var obstacle2Positions = [
      { x: width / 2 + 250, y: height - 4900, image: obstacle2Image },
      { x: width / 2 - 140, y: height - 1667, image: obstacle2Image },
      { x: width / 2, y: height - 2800, image: obstacle2Image },

      { x: width / 2 + 180, y: height - 1070, image: obstacle2Image },
      { x: width / 3 + 203, y: height - 3800, image: obstacle2Image },
      { x: width / 2 + 250, y: height - 4207, image: obstacle2Image },
      { x: width / 2 |+ 180, y: height - 500, image: obstacle2Image }
    ];

    // Adicione o sprite de combustível ao jogo
    this.addSprites(fuels, 4, fuelImage, 0.02);

    // Adicione o sprite de moeda ao jogo
    this.addSprites(powerCoins, 18, powerCoinImage, 0.09);

    // Adicione o sprite de obstáculo ao jogo
    this.addSprites(
      obstacle1,
      obstacle1Positions.length,
      obstacle1Image,
      0.04,
      obstacle1Positions
    );
    this.addSprites(
      obstacle2,
      obstacle2Positions.length,
      obstacle2Image,
      0.04,
      obstacle2Positions
    );
  }

  //C41 //SA
  addSprites(spriteGroup, numberOfSprites, spriteImage, scale, positions = []) {
    for (var i = 0; i < numberOfSprites; i++) {
      var x, y;

      //C41 //SA
      if (positions.length > 0) {
        x = positions[i].x;
        y = positions[i].y;
        spriteImage = positions[i].image;
      } else {
        x = random(width / 2 + 150, width / 2 - 150);
        y = random(-height * 4.5, height - 400);
      }
      var sprite = createSprite(x, y);
      sprite.addImage("sprite", spriteImage);

      sprite.scale = scale;
      spriteGroup.add(sprite);
    }
  }

  handleElements() {
    form.hide();
    form.titleImg.position(40, 50);
    form.titleImg.class("gameTitleAfterEffect");

    this.resetTitle.html("Reiniciar");
    this.resetTitle.class("resetText");
    this.resetTitle.position(width / 2 + 200, 40);

    this.resetButton.class("resetButton");
    this.resetButton.position(width / 2 + 230, 100);

    this.leadeboardTitle.html("Placar");
    this.leadeboardTitle.class("resetText");
    this.leadeboardTitle.position(width / 3 - 60, 40);

    this.leader1.class("leadersText");
    this.leader1.position(width / 3 - 50, 80);

    this.leader2.class("leadersText");
    this.leader2.position(width / 3 - 50, 130);
  }

  play() {
    this.handleElements();
    this.handleResetButton();

    Player.getPlayersInfo();
    player.getCarsAtEnd();

    if (allPlayers !== undefined) {
      image(track, 0, -height * 4.5, width, height * 6);

      this.showFuelBar();
      this.showLife();
      this.showLeaderboard();

      //índice da matriz
      var index = 0;
      for (var plr in allPlayers) {
        //adicione 1 ao índice para cada loop
        index = index + 1;

        //use os dados do banco de dados para exibir os carros nas direções x e y
        var x = allPlayers[plr].positionX;
        var y = height - allPlayers[plr].positionY;

        var currentlife = allPlayers[plr].life;

        if (currentlife <= 0) {
          cars[index - 1].changeImage("blast");
          cars[index - 1].scale = 1.8;
        }

        cars[index - 1].position.x = x;
        cars[index - 1].position.y = y;

        if (index === player.index) {
          stroke(10);
          fill("red");
          ellipse(x, y, 60, 60);

          this.handleFuel(index);
          this.handlePowerCoins(index);
          this.handleObstacleCollision(index);
          this.handleCarsCollision(index)
          if (player.life <= 0) {
            this.blast = true
            this.playerMoving = false;
            gameState=2
            this.gameOver()
          }

          // Altere a posição da câmera na direção y
          camera.position.y = cars[index - 1].position.y;
        }
      }

      if (this.playerMoving) {
        player.positionY += 5;
        player.update();
      }

      // manipulação de eventos de teclado
      this.handlePlayerControls();

      // Linha de chegada
      const finshLine = height * 6 - 400;

      if (player.positionY > finshLine) {
        gameState = 2;
        player.rank += 1;
        Player.updateCarsAtEnd(player.rank);
        player.update();
        this.showRank();
      }

      drawSprites();
    }
  }

  handleFuel(index) {
    // Adicione o combustível
    cars[index - 1].overlap(fuels, function (collector, collected) {
      player.fuel = 185;
      //collected (coletado) é o sprite no grupo de colecionáveis que desencadeia
      //o evento
      collected.remove();
    });

    // Reduzir o combustível do carro do jogador
    if (player.fuel > 0 && this.playerMoving) {
      player.fuel -= 0.3;
    }

    if (player.fuel <= 0) {
      gameState = 2;
      this.gameOver();
    }
  }

  handlePowerCoins(index) {
    cars[index - 1].overlap(powerCoins, function (collector, collected) {
      player.score += 21;
      player.update();
      //collected (coletado) é o sprite no grupo de colecionáveis que desencadeia
      //o evento
      collected.remove();
    });
  }

  handleResetButton() {
    this.resetButton.mousePressed(() => {
      database.ref("/").set({
        carsAtEnd: 0,
        playerCount: 0,
        gameState: 0,
        players: {}
      });
      window.location.reload();
    });
  }

  showFuelBar() {
    push();
    image(fuelImage, width / 2 - 130, height - player.positionY -450, 20, 20);
    fill("white");
    rect(width / 2 - 100, height - player.positionY - 450, 185, 20);
    fill("#dbc954");
    rect(width / 2 - 100, height - player.positionY - 450, player.fuel, 20);
    noStroke();
    pop();
  }

  showLife() {
    push();
    image(lifeImage, width / 2 - 130, height - player.positionY - 400, 20, 20);
    fill("white");
    rect(width / 2 - 100, height - player.positionY - 400, 185, 20);
    fill("#ff008c");
    rect(width / 2 - 100, height - player.positionY - 400, player.life, 20);
    noStroke();
    pop();
  }

  showLeaderboard() {
    var leader1, leader2;
    var players = Object.values(allPlayers);
    if (
      (players[0].rank === 0 && players[1].rank === 0) ||
      players[0].rank === 1
    ) {
      // &emsp;    Esta tag é usada para exibir quatro espaços.
      leader1 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;

      leader2 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;
    }

    if (players[1].rank === 1) {
      leader1 =
        players[1].rank +
        "&emsp;" +
        players[1].name +
        "&emsp;" +
        players[1].score;

      leader2 =
        players[0].rank +
        "&emsp;" +
        players[0].name +
        "&emsp;" +
        players[0].score;
    }

    this.leader1.html(leader1);
    this.leader2.html(leader2);
  }


  handlePlayerControls() {


    if (!this.blast) {
      if (keyIsDown(UP_ARROW)) {
        this.playerMoving = true;
        player.positionY += 10;
        player.update();
      }

      if (keyIsDown(LEFT_ARROW) && player.positionX > width / 3 - 50) {
        this.leftKeyActive = true;
        player.positionX -= 5;
        player.update();
      }

      if (keyIsDown(RIGHT_ARROW) && player.positionX < width / 2 + 300) {
        this.leftKeyActive = false;
        player.positionX += 5;
        player.update();
      }
    }

  }
  //C41 //SA
  handleObstacleCollision(index) {
    if (cars[index - 1].collide(obstacle1) || cars[index - 1].collide(obstacle2)) {

      //C41 //TA
      if (this.leftKeyActive) {
        player.positionX += 100;
      } else {
        player.positionX -= 100;
      }

      //C41 //SA
      //Reduzindo a Vida do Jogador
      if (player.life > 0) {
        player.life -= 185 / 4;
      }

      player.update();
    }
  }
  handleCarsCollision(index) {
    if (index == 1) {
      if (cars[index - 1].collide(cars[1])) {
        if (this.leftKeyActive) {
          player.positionX += 100
        } else {
          player.positionY -= 100
        }
        if (player.life > 0) {
         player.life-185/4
        }
       player.update()

      }
    }
    if (index == 2) {
      if (cars[index - 1].collide(cars[0])) {
        if (this.leftKeyActive) {
          player.positionX += 100
        } else {
          player.positionY -= 100
        }
        if (player.life > 0) {
         player.life-185/4
        }
       player.update()

      }
    }


  }
  showRank() {
    swal({
      title: `Incrível!${"\n"}Classificação${"\n"}${player.rank}`,
      text: "Você alcançou a linha de chegada com sucesso",
      imageUrl:
        "https://raw.githubusercontent.com/vishalgaddam873/p5-multiplayer-car-race-game/master/assets/cup.png",
      imageSize: "100x100",
      confirmButtonText: "Ok"
    });
  }

  gameOver() {
    swal({
      title: `Fim de Jogo`,
      text: "Ops, você perdeu a corrida....!!!",
      imageUrl:
        "https://cdn.shopify.com/s/files/1/1061/1924/products/Thumbs_Down_Sign_Emoji_Icon_ios10_grande.png",
      imageSize: "100x100",
      confirmButtonText: "Obrigado por Jogar"
    });
  }

 end() {
  console.log('fim de Jogo')
}
}
