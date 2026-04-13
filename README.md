# 2 Player Snake Battle

An advanced, competitive 2-player Snake game built with pure HTML, CSS, and JavaScript. No external libraries required!

## Features

### Core Gameplay
- **Grid-based Snake Game**: 20x20 game board
- **Dual Control Schemes**: 
  - Player 1: WASD keys
  - Player 2: Arrow keys
- **Dynamic Difficulty**: Game speed increases as players accumulate points
- **Smooth Movement**: 60 FPS game loop using requestAnimationFrame

### Collision System
- **Wall Collision**: Hit the edge = lose
- **Self Collision**: Hit your own body = lose
- **Snake-to-Snake Collision**: Hit opponent's body = lose
- **Head-to-Head Collision**: Direct collision = Draw
- **Smart Direction Control**: Prevents instant reversal

### Power-Ups (Random Spawn)
1. **Speed Boost** (Yellow): Increases game speed temporarily
2. **Slow Opponent** (Purple): Decreases game speed for everyone
3. **Ghost Mode** (Cyan): Pass through walls and obstacles for 3 seconds
4. **Double Points** (Orange): Next 3 food eaten = 20 points instead of 10

### Advanced Features
- **Dynamic Obstacles**: Blocks spawn after players reach certain scores
- **Web Audio Synthesis**: Built-in sound effects (no external files needed)
- **Pause System**: Press 'P' to pause/unpause mid-game
- **Countdown**: 3-second countdown before game starts
- **Score Tracking**: Real-time HUD with both players' scores
- **Speed Level Indicator**: Shows current game speed level
- **Responsive Design**: Works on desktop and mobile devices

### UI/UX
- **Dark Modern Theme**: Sleek sci-fi aesthetic with cyan/pink accents
- **Animated Menus**: Smooth transitions and fade-in effects
- **Instructions Screen**: Full controls and rules explained
- **Game Over Screen**: Shows winner and final scores
- **Centered Game Board**: Always centered and optimally sized

## How to Play

### Installation
1. Clone or download this repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
3. No server needed - works locally!

### Controls

**Player 1 (Red Snake)**
- `W` - Move Up
- `A` - Move Left
- `S` - Move Down
- `D` - Move Right

**Player 2 (Blue Snake)**
- `↑` - Move Up
- `←` - Move Left
- `↓` - Move Down
- `→` - Move Right

**Game Controls**
- `P` - Pause/Unpause game
- `Enter` - From menu: Start game or Instructions

### Gameplay Tips
1. Eat food (green dots) to grow and earn points
2. Avoid walls, obstacles, and opponent's snake
3. Collect power-ups strategically
4. Game speed increases as you score more points
5. Use Ghost Mode to escape tight situations
6. Double Points power-up is great for quick scoring

## Customization Guide

### Speed Settings
Edit these constants in `script.js`:

```javascript
const BASE_SPEED = 100;        // Initial speed in milliseconds (100 = 10 moves/sec)
const SPEED_INCREASE = 5;      // How much faster per level (ms to subtract)
const MIN_SPEED = 50;          // Maximum speed (lowest milliseconds)
```

**Formula**: `actual_speed = MAX(MIN_SPEED, BASE_SPEED - (level-1) * SPEED_INCREASE)`

### Power-Up Duration
```javascript
const POWERUP_DURATION = 300;  // frames (at 60 FPS = 5 seconds)
```

### Power-Up Spawn Rate
```javascript
const POWERUP_SPAWN_CHANCE = 0.015;  // 1.5% chance per frame
```

Increase for more power-ups, decrease for fewer.

### Obstacles
```javascript
const OBSTACLE_SPAWN_SCORE = 50;     // Score threshold to start spawning
const OBSTACLE_SPAWN_CHANCE = 0.01;  // 1% chance per frame
```

### Grid Size & Colors
```javascript
// In script.js
const GRID_SIZE = 20;  // 20x20 board (change to 15, 25, etc.)

// In :root CSS variables (style.css)
--player1: #ff3366;        // Player 1 snake color
--player2: #00d4ff;        // Player 2 snake color
--food: #00ff88;           // Food color
--powerup-speed: #FFD700;  // Speed boost color
--powerup-slow: #DA70D6;   // Slow opponent color
--powerup-ghost: #00CED1;  // Ghost mode color
--powerup-double: #FF8C00; // Double points color
```

### Cell Size (Canvas Rendering)
```css
/* In style.css :root */
--cell-size: 30px;  /* Size of each grid square */
```

Change this to scale the game board:
- Smaller (15px) = larger board, smaller cells
- Larger (40px) = smaller board, larger cells

### Speed Level Progression
Edit the formula in the `update()` method:
```javascript
const newSpeedLevel = Math.floor(totalScore / 30) + 1;
// Change 30 to higher for slower progression (50)
// Change 30 to lower for faster progression (20)
```

### Sound Effects
The game uses Web Audio API for synthesized sound. To adjust:

```javascript
playTone(frequency, duration, volume, delay);
// frequency: 200-2000 Hz range
// duration: 0.1-0.3 seconds
// volume: 0.1-0.3 range
```

Edit the `playSound()` method to customize tones.

## File Structure

```
claude-code1/
├── index.html          # HTML structure and layout
├── style.css           # Styling and animations
├── script.js           # Game logic and engine
├── assets/             # Folder for future sound files
└── README.md          # This file
```

## Code Architecture

### Key Classes
- **GameState**: Tracks game status, speed level, powerups, obstacles
- **Snake**: Represents a snake with segments, direction, score, and powerup states
- **Food**: Represents food spawning logic
- **PowerUp**: Represents power-up with type and spawning
- **Obstacle**: Represents static obstacles
- **SnakeGame**: Main game engine managing logic, collision, rendering, and UI

### Key Methods
- `gameLoop()`: Main 60 FPS loop using requestAnimationFrame
- `update()`: Handles movement, collisions, spawning
- `render()`: Canvas-based rendering of game board
- `checkCollisions()`: Comprehensive collision detection
- `handleInput()`: Keyboard input processing
- `playSound()`: Web Audio synthesis for effects

## Performance

- **Rendering**: Canvas-based for optimal performance
- **Optimization**: Only updates when movement occurs
- **Memory**: Minimal allocations in game loop
- **FPS**: Maintains 60 FPS on modern devices
- **No Dependencies**: Zero external libraries

## Browser Compatibility

- Chrome/Chromium ✓
- Firefox ✓
- Safari ✓
- Edge ✓
- Mobile browsers ✓ (touch-friendly menus)

## Game Balance Notes

The default settings provide:
- **Smooth Learning Curve**: Speed increases every 30 points
- **Power-Ups**: Spawn frequently enough to be useful (1.5% per frame)
- **Obstacles**: Start appearing after moderate play, add challenge
- **Speed Range**: From comfortable (100ms) to intense (50ms)

For a more **casual experience**: Increase BASE_SPEED to 150, decrease SPEED_INCREASE to 2
For a more **competitive experience**: Decrease BASE_SPEED to 80, increase SPEED_INCREASE to 8

## Development Tips

1. **Add Sound Files**: Replace Web Audio with actual .wav files in assets/ folder
2. **Add Themes**: Create CSS variations for different color schemes
3. **Leaderboard**: Store scores in localStorage
4. **Difficulty Modes**: Create game presets (Easy, Normal, Hard)
5. **Mobile Input**: Add touch controls for mobile gameplay
6. **Network Play**: Use WebSockets for online multiplayer

## Credits

Built as a pure JavaScript/HTML5 Canvas game with no external dependencies.
Perfect for learning game development fundamentals!

## License

Free to use and modify for personal and educational purposes.

---

Enjoy the game! 🐍🎮
