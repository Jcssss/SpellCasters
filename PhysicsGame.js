/*************************************
 * Physics Game
 *
 * Notes: 
 * 1) the applied force is what's being inputted, everything is calculated
 *    based on the applied force
 * 2) damage is based on momentum, that way the mass of the object and the angle at which you throw the *    object will both affect the damage dealt.
 *
 *
 *************************************/

"use strict";

const LOOP_TIME = 15;

const TIME_VALUE = LOOP_TIME / 1000; // time passed in a single frame
const SCALE = 25; // pixels / metre
const GRAVITY = 9.81; // acceleration due to gravity
const MU = 0.6; // coefficient of friction

const MENU = 0;
const INSTRUCTIONS = 1;
const GAME = 2;
const GAME_OVER = 3;

const FIREBALL = 0;
const BOULDER = 1;
const ICE_SHARD = 2;

const RIGHT = true;
const LEFT = false;

var ctx; // context
var c; // canvas

var lastLoopTime;
var turn = 0;
var myShots = new Array (0);
var myPlayers = new Array (2);
var myWall;
var frameNum = 0;
var gameOver;
var level = MENU;
var winner = 0;
const SHOT_MASSES = [10, 15, 5];
const SHOT_NAMES = ["Fireball", "Boulder", "Ice Shard"];
var shotActive = false;

var backgrounds = [new Image(), new Image(), new Image()];
var shotImages = [new Image(), new Image(), new Image()];
var gameOverScreens = [new Image(), new Image];

// key detection
var leftPressed = false;
var rightPressed = false;
var upPressed = false;
var downPressed = false;
var onePressed = false;
var twoPressed = false;
var threePressed = false
var fourPressed = false;
var spacePressed = false;
var enterPressed = false;

function startGame () {	
	
	// identifies and gets the context of the canvas
	c = document.getElementById("myCanvas");
	ctx = c.getContext("2d");
	
	// set canvas dimensions
	c.height = 600;
	c.width = 600;
	
	
	backgrounds[MENU].src = "images/menu.png";
	backgrounds[INSTRUCTIONS].src = "images/instructions.png";
	backgrounds[GAME].src = "images/map1.png";
	
	shotImages[FIREBALL].src = "images/fireball.png";
	shotImages[BOULDER].src = "images/rock.png";
	shotImages[ICE_SHARD].src = "images/frostSpike.png";
	
	gameOverScreens[0].src = "images/gameover1.png";
	gameOverScreens[1].src = "images/gameover2.png";
	
	// adds key listeners
	window.addEventListener("keydown", function (e) {
		
		// gets the value of the key
		// myKey = e.keyCode;
		switch (e.key) {
		case "Up":
		case "ArrowUp":
			upPressed = true;
			break;
		case "Down":
		case "ArrowDown":
			downPressed = true;
			break;
		case "Right":
		case "ArrowRight":
			rightPressed = true;
			break;
		case "Left":
		case "ArrowLeft":
			leftPressed = true;
			break;
		case "Spacebar":
		case " ":
			spacePressed = true;
			break;
		case "Enter":
			enterPressed = true;
			break;
		case "1":
			onePressed = true;
			break;
		case "2":
			twoPressed = true;
			break;
		case "3":
			threePressed = true;
			break;
		case "o":
			console.log(myPlayers[0]);
			console.log(myPlayers[1]);
		} // switch
		
	}) // keydown
	window.addEventListener("keyup", function (e) {
		
		// resets variables
		// myKey = false;
		// keyIsPressed = false;
		switch (e.key) {
		case "Up":
		case "ArrowUp":
			upPressed = false;
			break;
		case "Down":
		case "ArrowDown":
			downPressed = false;
			break;
		case "Right":
		case "ArrowRight":
			rightPressed = false;
			break;
		case "Left":
		case "ArrowLeft":
			leftPressed = false;
			break;
		case "Spacebar":
		case " ":
			spacePressed = false;
			level = (level == MENU) ? INSTRUCTIONS : (level == INSTRUCTIONS) ? MENU : GAME;
			break;
		case "Enter":
			level = (level == GAME_OVER) ? MENU : GAME;
			enterPressed = false;
			break;
		case "1":
			onePressed = false;
			break;
		case "2":
			twoPressed = false;
			break;
		case "3":
			threePressed = false;
		} // switch
		
	}) // keyup
	
	initEntities();
	
	// sets an interval that plays the game
	setInterval(drawScene, LOOP_TIME);
	
} // startGame

function initEntities() {
	myWall = new Wall (c.width / 2, 6);
	myPlayers[0] = new Player(200, "wizard1");
	myPlayers[1] = new Player(400, "wizard2");
} // initEntities

class Player {
	// stats
	life = 100;
	height = 2 * SCALE;
	width = 2 * SCALE;
	mass = 70;
	graphic = new Image ();
	
	// physics
	centerX = 0;
	centerY = c.height - this.height / 2;
	accelX = 0;
	accelY = 0;
	velocityX = 0;
	forceAppX = 0;
	forceNormY = 0;
	forceNetX = 0;
	forceFriction = 0;
	direction = RIGHT; // right: true, left: false
	maxSpeed = 25;
	resting = true;
	rightBound;
	leftBound;
	
	
	// shooting
	shotAngle = 90;
	shotType = 0;
	charge = 0;
	chargeUp = true;
	isCharging = false;
	isAiming = false;
	
	constructor (x, graphic) {
		this.centerX = x;
		this.graphic.src = "images/" + graphic + ".png";
		if (this.centerX < 300) {
			this.leftBound = 0 + this.width / 2;
			this.rightBound = myWall.centerX - myWall.width / 2 - this.width / 2;
		} else {
			this.leftBound = myWall.centerX + myWall.width / 2 + this.width / 2;
			this.rightBound = c.width - this.width / 2;
		} // else
	} // constructor
	
	draw () {
		
		// force of friction = this.forceNormY *  MU
		// net force = this.forceAppX + force of friction
		// accel = net force / mass
		
		// get opposite force from friction
		this.forceFriction = -Math.sign(this.velocityX) * MU * this.mass * GRAVITY;
		
		// get net force
		this.forceNetX = this.forceAppX + this.forceFriction;
		
		// get acceleration
		this.accelX = this.forceNetX / this.mass;
	
		// update direction
		this.direction = this.velocity > 0;
		
		// update velocity
		this.velocityX += this.accelX * TIME_VALUE;
		this.velocityX = (this.velocity > 0) ? Math.min(this.velocityX, this.maxSpeed) : Math.max(this.velocityX, -this.maxSpeed);
		
		// update position
		this.centerX += this.velocityX * TIME_VALUE * SCALE;
		
		// stop at bounds
		if (this.centerX > this.rightBound) {
			this.centerX = this.rightBound;
			this.velocityX = 0;
		} else if (this.centerX < this.leftBound) {
			this.centerX = this.leftBound;
			this.velocityX = 0;
		} // if
		
		ctx.drawImage (this.graphic, this.centerX - this.width / 2, this.centerY - this.height / 2, this.width, this.height);
		
		if (this.isCharging) {
			this.drawShotPath(false);
		} else if (this.isAiming) {
			this.drawShotPath(true)
		} // if
	} // draw
	
	drawShotPath(isAiming) {
		
		var accelX = this.charge / SHOT_MASSES[this.shotType] * Math.cos(this.shotAngle * Math.PI / 180);
		var accelY = this.charge / SHOT_MASSES[this.shotType] * -Math.sin(this.shotAngle * Math.PI / 180);
		var velocityX = accelX;
		var velocityY = accelY + GRAVITY;
		var x = this.centerX;
		var y = this.centerY;
		
		if (isAiming) {
			accelX = 10 * Math.cos(this.shotAngle * Math.PI / 180);
			accelY = 10 * -Math.sin(this.shotAngle * Math.PI / 180);
			velocityX = accelX * TIME_VALUE * SCALE;
			velocityY = accelY * TIME_VALUE * SCALE;
			
			for (var i = 0; i < 3; i++) {
				ctx.fillRect (x + (1 + i) * 5 * velocityX, y + (1 + i) * 5 * velocityY, 5, 5);
			}
		} else {
			for (var i = 0; i < 10; i++) {
				
				x += (velocityX * TIME_VALUE * SCALE * 3);
				y += (velocityY * TIME_VALUE * SCALE * 3) + (1 / 2) * GRAVITY * (TIME_VALUE * 3) ** 2 * SCALE; 

				velocityY += GRAVITY * TIME_VALUE * 3;
				
				ctx.fillRect (x - 2.5, y - 2.5, 5, 5);
			} // for
		} // else
	} // drawShotPath
} // Player

class Wall {
	width = 1 * SCALE;
	height = 8 * SCALE;
	centerX = c.width / 2;
	centerY = c.height - this.height / 2;
	graphic = new Image();
	
	constructor (x, height) {
		this.graphic.src = "images/wall.png";
		this.centerX = x;
		this.height = height * SCALE;
		this.centerY = c.height - this.height / 2;
	}
	
	draw () {
		ctx.drawImage(this.graphic, this.centerX - this.height / 2, this.centerY - this.height / 2, this.height, this.height);
	}
}

class Shot {
	size = 0.5 * SCALE;
	mass = 0;
	direction = 0;
	accelX = 0;
	accelY = 0;
	velocityX = 0
	velocityY = 0;
	force = 0;
	centerX = 0;
	centerY = 575;
	graphic = new Image();
	
	constructor (x, force, angle, mass, graphic) {
		this.mass = mass;
		this.graphic = graphic;
		this.centerX = x;
		this.force = force;
		this.direction = angle * Math.PI / 180;
		this.accelX = this.force / this.mass * Math.cos(this.direction);
		this.accelY = this.force / this.mass * -Math.sin(this.direction);
		
		// mass * change in velocity = net force * change in time
		// change in velocity = accelaration * change in time
		// assume force was applied for 1 sec
		this.velocityY = this.accelY + GRAVITY;
		this.velocityX = this.accelX;
	} // contructor
	
	fire() {
		this.centerX += this.velocityX * TIME_VALUE * SCALE;
	
		if (this.centerY > c.height - this.size / 2) {
			myShots.pop(this);
			shotActive = false;
		} else {
			this.centerY += (this.velocityY * TIME_VALUE * SCALE) + (1 / 2) * GRAVITY * TIME_VALUE ** 2 * SCALE;
			
			this.velocityY += GRAVITY * TIME_VALUE;
		} // if
		
		this.calculateDirection();
		
		ctx.save();
		ctx.translate(this.centerX, this.centerY);
		ctx.rotate(-this.direction);
		ctx.fillStyle = "red";
		ctx.drawImage (this.graphic, -this.size / 2, -this.size / 2, this.size, this.size);
		ctx.restore();
		
		// damage is based off of the final momentum
		for (var i = 0; i < myPlayers.length; i++) {
			if (this.collides(myPlayers[i].centerX, myPlayers[i].centerY, myPlayers[i].width / 2) && (turn - 1) % 2 != i) {
				
				var momentum = Math.sqrt((this.velocityX * TIME_VALUE * SCALE) ** 2 + (this.velocityY * TIME_VALUE * SCALE) ** 2 ) * this.mass;
				
				myPlayers[i].life = Math.max(Math.floor(myPlayers[i].life - momentum), 0);
				myShots.pop(this);
				shotActive = false;
				
				if (myPlayers[i].life == 0) {
					level = GAME_OVER;
					winner = (i == 0)? 1: 0;
				} // if
			} // if
		} // for
		
		if (this.collides(myWall.centerX, myWall.centerY, myWall.width, myWall.height)) {
			myShots.pop(this);
			shotActive = false;
		} else if ((this.centerX > 300 && this.centerX + this.velocityX < 300) || (this.centerX < 300 && this.centerX + this.velocityX > 300)) {
			if (this.centerY > c.height - myWall.height && this.centerY + (this.velocityY * TIME_VALUE * SCALE) + (1 / 2) * GRAVITY * TIME_VALUE ** 2 * SCALE > c.height - myWall.height) {
				myShots.pop(this);
				shotActive = false;
			}
		}
	}
	
	collides (x, y, w, h) {
		return (this.centerX + this.size / 2 > x - w / 2
				&& this.centerX - this.size / 2 < x + w / 2
				&& this.centerY + this.size / 2 > y - h / 2
				&& this.centerY - this.size / 2 < y + h / 2)
	} // collides
	
	collides (x, y, rad) {
		return Math.sqrt((this.centerX - x) ** 2 + (this.centerY - y) ** 2) < this.size + rad;
	} // collides
	
	calculateDirection() {
		this.direction = -Math.atan(this.velocityY / this.velocityX);
		
		if (this.velocityX < 0) {
			this.direction += Math.PI;
		} // if
	} // calculateDirection
}

function drawScene() {
	clear();
	
	if (level == MENU) {
		ctx.drawImage(backgrounds[MENU],0,0);
	} // MENU
	
	else if (level == INSTRUCTIONS) {
		ctx.drawImage(backgrounds[INSTRUCTIONS],0,0);
	} // INSTRUCTIONS
	
	else if (level == GAME_OVER) {
		ctx.drawImage(gameOverScreens[winner],0,0);
		initEntities();
	} // GAME OVER
	
	else if (level == GAME) {
		
		var minForce = 0;
		var maxForce = 300;
		var currentPlayer = turn % 2;
		frameNum++; 
		
		// if shot active, nothing moves
		if (!shotActive) {
			// move player by applying force
			if (leftPressed && !rightPressed) {
				myPlayers[currentPlayer].forceAppX = -2000;
			} else if (rightPressed && !leftPressed) {
				myPlayers[currentPlayer].forceAppX = 2000;
			} else {
				myPlayers[currentPlayer].forceAppX = 0;
			} // else
			
			// aim by changing trajectory
			if (upPressed && !downPressed) {
				myPlayers[currentPlayer].shotAngle = Math.min(myPlayers[currentPlayer].shotAngle + 1, 180);
				myPlayers[currentPlayer].isAiming = true;
			} else if (downPressed && !upPressed) {
				myPlayers[currentPlayer].shotAngle = Math.max(myPlayers[currentPlayer].shotAngle - 1, 0);
				myPlayers[currentPlayer].isAiming = true;	
			} // if
			
			// change shot type
			if (onePressed) {
				myPlayers[currentPlayer].shotType = FIREBALL;
			} else if (twoPressed) {
				myPlayers[currentPlayer].shotType = BOULDER;
			} else if (threePressed) {
				myPlayers[currentPlayer].shotType = ICE_SHARD;
			} // if
			
			// charge shot + fire when released
			if (spacePressed) {
				
				if (myPlayers[currentPlayer].charge == minForce) {
					myPlayers[currentPlayer].chargeUp = true;
				} else if (myPlayers[currentPlayer].charge == maxForce) {
					myPlayers[currentPlayer].chargeUp = false;
				} // if
				
				myPlayers[currentPlayer].charge += (myPlayers[currentPlayer].chargeUp)? 1: -1;
				
				writeText (myPlayers[currentPlayer].charge + "N / " + maxForce + "N"
						, "Ariel", 20, "center", myPlayers[currentPlayer].centerX, myPlayers[currentPlayer].centerY - 20);
				
				myPlayers[currentPlayer].isCharging = true;
			} else if (myPlayers[currentPlayer].charge != minForce) {
				turn++;
				myShots.push(new Shot (myPlayers[currentPlayer].centerX, myPlayers[currentPlayer].charge
						, myPlayers[currentPlayer].shotAngle, SHOT_MASSES[myPlayers[currentPlayer].shotType], shotImages[myPlayers[currentPlayer].shotType]));
				myPlayers[currentPlayer].charge = minForce;
				myPlayers[currentPlayer].isCharging = false;
				myPlayers[currentPlayer].isAiming = false;
				shotActive = true;
			} // if
		} // if
		
		for (i in myPlayers) {
			myPlayers[i].draw();
		} // for
		
		for (i in myShots) {
			myShots[i].fire();
		} // for
		
		// draw wall
		myWall.draw();
		
		// show stats
		writeText("Player 1 Health: " + myPlayers[0].life + " / 100", "Ariel", 20, "left", 20, 40);
		writeText("Player 2 Health: " + myPlayers[1].life + " / 100", "Ariel", 20, "right", c.width - 20, 40);
		
		// shot box
		ctx.strokeRect(c.width / 2 - 100, 150, 200, 50 + 40 * SHOT_MASSES.length);
		writeText ("Shot Selected:", "Ariel", 20, "center", c.width / 2, 190);
		
		// write shots + their mass
		for (var i = 0; i < SHOT_MASSES.length; i++) {
			writeText (SHOT_NAMES[i] + ": " + SHOT_MASSES[i] + "kg", "Ariel", 20, "center", c.width / 2, 230 + 30 * i);
			
			// highlight selected shot
			if (i == myPlayers[currentPlayer].shotType) {
				ctx.fillStyle = "rgba(200, 50, 50, 0.4)";
				ctx.fillRect(c.width / 2 - 100, 207.5 + 30 * i, 200, 30);
				ctx.fillStyle = "rgba(0, 0, 0, 1)";
			} // if
		} // for
		
		// write current player
		writeText("Current Player: Player " + (currentPlayer + 1), "Ariel", 20, "left", 20, 80);
	} // GAME
} // drawScene

function writeText (words, font, fontSize, allignment, x, y) {
	ctx.font = fontSize + "px " + font;
	ctx.textAlign = allignment;
	ctx.fillText("" + words, x, y);
}

function clear () {
    ctx.clearRect(0, 0, c.width, c.height);
} // clear