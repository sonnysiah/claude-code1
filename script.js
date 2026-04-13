/* ============================================
   GAME CONSTANTS
   ============================================ */
const GRID_SIZE = 20;
const BASE_SPEED = 100; // ms per move
const SPEED_INCREASE = 5; // ms decrease per level
const MIN_SPEED = 50; // minimum speed
const POWERUP_SPAWN_CHANCE = 0.015; // 1.5% chance each frame
const POWERUP_DURATION = 300; // frames
const OBSTACLE_SPAWN_SCORE = 50; // spawn obstacles after this score
const OBSTACLE_SPAWN_CHANCE = 0.01; // 1% chance each frame

const COLORS = {
    bg: '#0a0e27',
    grid: '#1a1f3a',
    player1: '#ff3366',
    player2: '#00d4ff',
    food: '#00ff88',
    wall: '#333333',
    powerupSpeed: '#FFD700',
    powerupSlow: '#DA70D6',
    powerupGhost: '#00CED1',
    powerupDouble: '#FF8C00'
};

const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

const POWERUP_TYPES = {
    SPEED: 'speed',
    SLOW: 'slow',
    GHOST: 'ghost',
    DOUBLE: 'double'
};

/* ============================================
   GAME STATE
   ============================================ */
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.winner = null;
        this.speedLevel = 1;
        this.lastSpeedIncrease = 0;
        this.frameCount = 0;
        this.obstacles = [];
        this.powerups = [];
    }
}

/* ============================================
   SNAKE CLASS
   ============================================ */
class Snake {
    constructor(startX, startY, direction, isPlayer1 = true) {
        this.segments = [{ x: startX, y: startY }];
        this.direction = direction;
        this.nextDirection = direction;
        this.isPlayer1 = isPlayer1;
        this.score = 0;
        this.alive = true;
        this.ghostModeActive = false;
        this.ghostModeFrames = 0;
        this.doublePointsActive = false;
        this.doublePointsFrames = 0;
    }

    update() {
        // Prevent instant reverse
        if (!this.isOppositeDirection(this.nextDirection, this.direction)) {
            this.direction = this.nextDirection;
        }

        const head = this.segments[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        this.segments.unshift(newHead);
    }

    grow() {
        // Do nothing - segment already added in update
    }

    shrink() {
        this.segments.pop();
    }

    setDirection(direction) {
        this.nextDirection = direction;
    }

    isOppositeDirection(dir1, dir2) {
        return (dir1.x === -dir2.x && dir1.y === -dir2.y);
    }

    getHead() {
        return this.segments[0];
    }

    containsPoint(x, y) {
        return this.segments.some(seg => seg.x === x && seg.y === y);
    }

    getBodyWithoutHead() {
        return this.segments.slice(1);
    }

    updatePowerups() {
        if (this.ghostModeActive) {
            this.ghostModeFrames--;
            if (this.ghostModeFrames <= 0) {
                this.ghostModeActive = false;
            }
        }

        if (this.doublePointsActive) {
            this.doublePointsFrames--;
            if (this.doublePointsFrames <= 0) {
                this.doublePointsActive = false;
            }
        }
    }

    addScore(points) {
        const actualPoints = this.doublePointsActive ? points * 2 : points;
        this.score += actualPoints;
        return actualPoints;
    }
}

/* ============================================
   FOOD CLASS
   ============================================ */
class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static spawn(obstacles, snake1, snake2) {
        let x, y, valid;
        do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * GRID_SIZE);
            valid = !obstacles.some(obs => obs.x === x && obs.y === y) &&
                    !snake1.containsPoint(x, y) &&
                    !snake2.containsPoint(x, y);
        } while (!valid);

        return new Food(x, y);
    }
}

/* ============================================
   POWERUP CLASS
   ============================================ */
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    static spawn(obstacles, snake1, snake2) {
        const types = Object.values(POWERUP_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];

        let x, y, valid;
        do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * GRID_SIZE);
            valid = !obstacles.some(obs => obs.x === x && obs.y === y) &&
                    !snake1.containsPoint(x, y) &&
                    !snake2.containsPoint(x, y);
        } while (!valid);

        return new PowerUp(x, y, type);
    }

    getColor() {
        switch (this.type) {
            case POWERUP_TYPES.SPEED:
                return COLORS.powerupSpeed;
            case POWERUP_TYPES.SLOW:
                return COLORS.powerupSlow;
            case POWERUP_TYPES.GHOST:
                return COLORS.powerupGhost;
            case POWERUP_TYPES.DOUBLE:
                return COLORS.powerupDouble;
            default:
                return '#ffffff';
        }
    }
}

/* ============================================
   OBSTACLE CLASS
   ============================================ */
class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static spawn(obstacles, snake1, snake2) {
        let x, y, valid;
        do {
            x = Math.floor(Math.random() * GRID_SIZE);
            y = Math.floor(Math.random() * GRID_SIZE);
            valid = !obstacles.some(obs => obs.x === x && obs.y === y) &&
                    !snake1.containsPoint(x, y) &&
                    !snake2.containsPoint(x, y);
        } while (!valid);

        return new Obstacle(x, y);
    }
}

/* ============================================
   GAME ENGINE
   ============================================ */
class SnakeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        this.setupCanvas();
        this.initializeSnakes();
        this.setupInputHandlers();
        this.setupMenuHandlers();
        this.initializeAudio();
        this.lastMoveTime = 0;
        this.currentSpeed = BASE_SPEED;
    }

    setupCanvas() {
        const cellSize = this.canvas.offsetWidth / GRID_SIZE;
        this.canvas.width = cellSize * GRID_SIZE;
        this.canvas.height = cellSize * GRID_SIZE;
    }

    initializeSnakes() {
        const startX = Math.floor(GRID_SIZE / 4);
        const startY = Math.floor(GRID_SIZE / 2);
        this.snake1 = new Snake(startX, startY, DIRECTIONS.RIGHT, true);

        const startX2 = Math.floor((GRID_SIZE * 3) / 4);
        const startY2 = Math.floor(GRID_SIZE / 2);
        this.snake2 = new Snake(startX2, startY2, DIRECTIONS.LEFT, false);

        this.food = Food.spawn([], this.snake1, this.snake2);
    }

    setupInputHandlers() {
        document.addEventListener('keydown', (e) => {
            this.handleInput(e.key);
        });
    }

    handleInput(key) {
        const key_lower = key.toLowerCase();

        // Control Player 1 (WASD)
        if (key_lower === 'w') this.snake1.setDirection(DIRECTIONS.UP);
        if (key_lower === 's') this.snake1.setDirection(DIRECTIONS.DOWN);
        if (key_lower === 'a') this.snake1.setDirection(DIRECTIONS.LEFT);
        if (key_lower === 'd') this.snake1.setDirection(DIRECTIONS.RIGHT);

        // Control Player 2 (Arrow Keys)
        if (key === 'ArrowUp') this.snake2.setDirection(DIRECTIONS.UP);
        if (key === 'ArrowDown') this.snake2.setDirection(DIRECTIONS.DOWN);
        if (key === 'ArrowLeft') this.snake2.setDirection(DIRECTIONS.LEFT);
        if (key === 'ArrowRight') this.snake2.setDirection(DIRECTIONS.RIGHT);

        // Pause
        if (key_lower === 'p' && this.state.gameRunning) {
            this.togglePause();
        }
    }

    setupMenuHandlers() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startCountdown();
        });

        document.getElementById('instructionsBtn').addEventListener('click', () => {
            this.showInstructions();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.showMenu();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startCountdown();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            this.showMenu();
        });

        // Start game with Enter key from menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const startMenu = document.getElementById('startMenu');
                if (startMenu.classList.contains('active')) {
                    this.showInstructions();
                }
            }
        });
    }

    showMenu() {
        this.state.reset();
        this.hideAllScreens();
        document.getElementById('startMenu').classList.add('active');
    }

    showInstructions() {
        this.hideAllScreens();
        document.getElementById('instructionsScreen').classList.add('active');

        // Start game on Enter or if game mode
        const handleStart = (e) => {
            if (e.key === 'Enter') {
                document.removeEventListener('keydown', handleStart);
                this.startCountdown();
            }
        };

        setTimeout(() => {
            document.addEventListener('keydown', handleStart);
        }, 100);
    }

    startCountdown() {
        this.hideAllScreens();
        document.getElementById('countdownScreen').classList.add('active');

        let countdown = 3;
        const countdownElement = document.getElementById('countdownNumber');
        countdownElement.textContent = countdown;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownElement.textContent = countdown;
            } else {
                clearInterval(countdownInterval);
                this.startGame();
            }
        }, 1000);
    }

    startGame() {
        this.hideAllScreens();
        document.getElementById('gameContainer').classList.add('active');

        this.state.reset();
        this.state.gameRunning = true;
        this.initializeSnakes();
        this.state.obstacles = [];
        this.state.powerups = [];
        this.currentSpeed = BASE_SPEED;
        this.state.speedLevel = 1;
        this.state.frameCount = 0;

        this.gameLoop();
    }

    hideAllScreens() {
        document.querySelectorAll('.menu-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('pauseOverlay').classList.remove('active');
        document.getElementById('gameContainer').classList.remove('active');
    }

    togglePause() {
        this.state.gamePaused = !this.state.gamePaused;
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (this.state.gamePaused) {
            pauseOverlay.classList.add('active');
        } else {
            pauseOverlay.classList.remove('active');
        }
    }

    gameLoop = () => {
        const now = performance.now();

        if (!this.state.gameRunning) return;

        if (!this.state.gamePaused && now - this.lastMoveTime >= this.currentSpeed) {
            this.update();
            this.lastMoveTime = now;
        }

        this.render();
        requestAnimationFrame(this.gameLoop);
    };

    update() {
        this.state.frameCount++;

        // Update snakes
        this.snake1.update();
        this.snake2.update();

        // Update powerups
        this.snake1.updatePowerups();
        this.snake2.updatePowerups();

        // Collision detection
        if (this.checkCollisions()) {
            return;
        }

        // Check food collision
        this.checkFoodCollision();

        // Check powerup collision
        this.checkPowerupCollision();

        // Spawn powerups
        if (Math.random() < POWERUP_SPAWN_CHANCE && this.state.powerups.length < 3) {
            this.state.powerups.push(PowerUp.spawn(this.state.obstacles, this.snake1, this.snake2));
        }

        // Spawn obstacles
        if ((this.snake1.score + this.snake2.score) >= OBSTACLE_SPAWN_SCORE &&
            Math.random() < OBSTACLE_SPAWN_CHANCE &&
            this.state.obstacles.length < 10) {
            this.state.obstacles.push(Obstacle.spawn(this.state.obstacles, this.snake1, this.snake2));
        }

        // Increase speed
        const totalScore = this.snake1.score + this.snake2.score;
        const newSpeedLevel = Math.floor(totalScore / 30) + 1;
        if (newSpeedLevel !== this.state.speedLevel && newSpeedLevel <= 15) {
            this.state.speedLevel = newSpeedLevel;
            this.currentSpeed = Math.max(MIN_SPEED, BASE_SPEED - (newSpeedLevel - 1) * SPEED_INCREASE);
        }

        // Update UI
        this.updateHUD();
    }

    checkCollisions() {
        const head1 = this.snake1.getHead();
        const head2 = this.snake2.getHead();

        // Wall collision
        if (this.isOutOfBounds(head1.x, head1.y)) {
            if (!this.snake1.ghostModeActive) {
                this.endGame(2);
                return true;
            }
        }

        if (this.isOutOfBounds(head2.x, head2.y)) {
            if (!this.snake2.ghostModeActive) {
                this.endGame(1);
                return true;
            }
        }

        // Self collision
        if (this.snake1.getBodyWithoutHead().some(seg => seg.x === head1.x && seg.y === head1.y)) {
            if (!this.snake1.ghostModeActive) {
                this.endGame(2);
                return true;
            }
        }

        if (this.snake2.getBodyWithoutHead().some(seg => seg.x === head2.x && seg.y === head2.y)) {
            if (!this.snake2.ghostModeActive) {
                this.endGame(1);
                return true;
            }
        }

        // Obstacle collision
        if (this.state.obstacles.some(obs => obs.x === head1.x && obs.y === head1.y)) {
            if (!this.snake1.ghostModeActive) {
                this.endGame(2);
                return true;
            }
        }

        if (this.state.obstacles.some(obs => obs.x === head2.x && obs.y === head2.y)) {
            if (!this.snake2.ghostModeActive) {
                this.endGame(1);
                return true;
            }
        }

        // Other snake collision
        if (this.snake2.containsPoint(head1.x, head1.y)) {
            if (!this.snake1.ghostModeActive) {
                this.endGame(2);
                return true;
            }
        }

        if (this.snake1.containsPoint(head2.x, head2.y)) {
            if (!this.snake2.ghostModeActive) {
                this.endGame(1);
                return true;
            }
        }

        // Head-to-head collision
        if (head1.x === head2.x && head1.y === head2.y) {
            this.endGame(0); // Draw
            return true;
        }

        return false;
    }

    checkFoodCollision() {
        const head1 = this.snake1.getHead();
        const head2 = this.snake2.getHead();

        if (head1.x === this.food.x && head1.y === this.food.y) {
            this.snake1.addScore(10);
            this.playSound('eat');
            this.snake1.grow();
            this.food = Food.spawn(this.state.obstacles, this.snake1, this.snake2);
        }

        if (head2.x === this.food.x && head2.y === this.food.y) {
            this.snake2.addScore(10);
            this.playSound('eat');
            this.snake2.grow();
            this.food = Food.spawn(this.state.obstacles, this.snake1, this.snake2);
        }
    }

    checkPowerupCollision() {
        const head1 = this.snake1.getHead();
        const head2 = this.snake2.getHead();

        this.state.powerups = this.state.powerups.filter(powerup => {
            let consumed = false;

            if (head1.x === powerup.x && head1.y === powerup.y) {
                this.applyPowerup(this.snake1, this.snake2, powerup);
                consumed = true;
            }

            if (head2.x === powerup.x && head2.y === powerup.y) {
                this.applyPowerup(this.snake2, this.snake1, powerup);
                consumed = true;
            }

            return !consumed;
        });
    }

    applyPowerup(player, opponent, powerup) {
        this.playSound('powerup');

        switch (powerup.type) {
            case POWERUP_TYPES.SPEED:
                this.currentSpeed = Math.max(MIN_SPEED, this.currentSpeed - 20);
                break;
            case POWERUP_TYPES.SLOW:
                this.currentSpeed = Math.min(BASE_SPEED * 2, this.currentSpeed + 30);
                break;
            case POWERUP_TYPES.GHOST:
                player.ghostModeActive = true;
                player.ghostModeFrames = POWERUP_DURATION;
                break;
            case POWERUP_TYPES.DOUBLE:
                player.doublePointsActive = true;
                player.doublePointsFrames = POWERUP_DURATION;
                break;
        }
    }

    isOutOfBounds(x, y) {
        return x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE;
    }

    endGame(winner) {
        this.state.gameRunning = false;
        this.state.gameOver = true;
        this.state.winner = winner; // 0 = draw, 1 = player2 wins, 2 = player1 wins

        this.playSound('crash');
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        const score1 = this.snake1.score;
        const score2 = this.snake2.score;

        document.getElementById('finalScore1').textContent = score1;
        document.getElementById('finalScore2').textContent = score2;

        const resultTitle = document.getElementById('resultTitle');
        if (this.state.winner === 0) {
            resultTitle.textContent = "It's a Draw!";
        } else if (this.state.winner === 1) {
            resultTitle.textContent = 'Player 1 Wins!';
        } else {
            resultTitle.textContent = 'Player 2 Wins!';
        }

        this.hideAllScreens();
        document.getElementById('gameOverScreen').classList.add('active');
    }

    updateHUD() {
        document.getElementById('score1').textContent = this.snake1.score;
        document.getElementById('score2').textContent = this.snake2.score;
        document.getElementById('speedLevel').textContent = `Speed: ${this.state.speedLevel}`;
    }

    render() {
        const cellSize = this.canvas.width / GRID_SIZE;

        // Clear canvas
        this.ctx.fillStyle = COLORS.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = COLORS.grid;
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * cellSize, 0);
            this.ctx.lineTo(i * cellSize, this.canvas.height);
            this.ctx.stroke();

            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * cellSize);
            this.ctx.lineTo(this.canvas.width, i * cellSize);
            this.ctx.stroke();
        }

        // Draw obstacles
        this.ctx.fillStyle = COLORS.wall;
        this.state.obstacles.forEach(obstacle => {
            this.ctx.fillRect(
                obstacle.x * cellSize + 2,
                obstacle.y * cellSize + 2,
                cellSize - 4,
                cellSize - 4
            );
        });

        // Draw food
        this.ctx.fillStyle = COLORS.food;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * cellSize + cellSize / 2,
            this.food.y * cellSize + cellSize / 2,
            cellSize / 3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Draw powerups
        this.state.powerups.forEach(powerup => {
            this.ctx.fillStyle = powerup.getColor();
            this.ctx.beginPath();
            this.ctx.arc(
                powerup.x * cellSize + cellSize / 2,
                powerup.y * cellSize + cellSize / 2,
                cellSize / 4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });

        // Draw snakes
        this.drawSnake(this.snake1, COLORS.player1, cellSize);
        this.drawSnake(this.snake2, COLORS.player2, cellSize);
    }

    drawSnake(snake, color, cellSize) {
        snake.segments.forEach((segment, index) => {
            // Apply ghost mode effect
            if (snake.ghostModeActive) {
                this.ctx.globalAlpha = 0.5;
            }

            // Head - brighter
            if (index === 0) {
                this.ctx.fillStyle = color;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = color;
                this.ctx.fillRect(
                    segment.x * cellSize + 1,
                    segment.y * cellSize + 1,
                    cellSize - 2,
                    cellSize - 2
                );
                this.ctx.shadowBlur = 0;
            } else {
                // Body - slightly darker
                this.ctx.fillStyle = this.adjustColor(color, index > 5 ? 30 : 20);
                this.ctx.fillRect(
                    segment.x * cellSize + 2,
                    segment.y * cellSize + 2,
                    cellSize - 4,
                    cellSize - 4
                );
            }

            this.ctx.globalAlpha = 1;
        });
    }

    adjustColor(color, darken) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * darken);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    initializeAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    playSound(type) {
        try {
            switch (type) {
                case 'eat':
                    this.playTone(800, 0.1, 0.1);
                    break;
                case 'powerup':
                    this.playTone(1200, 0.15, 0.15);
                    this.playTone(1600, 0.15, 0.15, 0.1);
                    break;
                case 'crash':
                    this.playTone(200, 0.2, 0.3);
                    break;
            }
        } catch (e) {
            // Audio context may fail in some environments
        }
    }

    playTone(frequency, duration, volume, delay = 0) {
        try {
            const context = this.audioContext;
            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.connect(gain);
            gain.connect(context.destination);

            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(volume, context.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + delay + duration);

            osc.start(context.currentTime + delay);
            osc.stop(context.currentTime + delay + duration);
        } catch (e) {
            // Fail silently
        }
    }
}

/* ============================================
   INITIALIZATION
   ============================================ */
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new SnakeGame('gameBoard');
    game.showMenu();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (game && game.canvas) {
        game.setupCanvas();
    }
});
