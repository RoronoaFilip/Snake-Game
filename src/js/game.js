import { SoundFX } from './sound.js';

// --- Game Setup & State ---
const audio = new SoundFX();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvasContainer');

const GRID_COUNT = 20; // 20x20 Grid
const CELL_SIZE = canvas.width / GRID_COUNT;

// UI Elements
const scoreVal = document.getElementById('scoreVal');
const highScoreVal = document.getElementById('highScoreVal');
const finalScore = document.getElementById('finalScore');
const finalHighScore = document.getElementById('finalHighScore');
const newRecordBadge = document.getElementById('newRecordBadge');

const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const pauseLabel = document.getElementById('pauseLabel');
const pauseIcon = document.getElementById('pauseIcon');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const wallWrapToggle = document.getElementById('wallWrapToggle');
const speedOptions = document.querySelectorAll('.speed-option');

// State Variables
let snake = [];
let currentDir = { x: 1, y: 0 };
let inputQueue = []; // Input Buffer Queue (Max 2 moves)

let food = { x: 0, y: 0, isGolden: false };
let foodsEaten = 0;
let particles = [];

let score = 0;
let highScore = parseInt(localStorage.getItem('snake_arcade_highscore') || '0', 10);
let baseSpeed = 175; // Default "Средно" speed in ms
let wallWrap = false;

let isRunning = false;
let isPaused = false;
let lastTickTime = 0;

highScoreVal.textContent = highScore;

// Dynamic speed adjustment based on progress
function getEffectiveInterval() {
    const speedBoost = Math.min(foodsEaten * 1, Math.floor(baseSpeed * 0.4));
    return Math.max(baseSpeed - speedBoost, 45);
}

// Reset Game State
function resetGame() {
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    currentDir = { x: 1, y: 0 };
    inputQueue = [];
    score = 0;
    foodsEaten = 0;
    scoreVal.textContent = '0';
    particles = [];
    spawnFood();
}

// Spawn Food
function spawnFood() {
    let valid = false;
    let newX, newY;

    while (!valid) {
        newX = Math.floor(Math.random() * GRID_COUNT);
        newY = Math.floor(Math.random() * GRID_COUNT);
        valid = !snake.some(segment => segment.x === newX && segment.y === newY);
    }

    food = {
        x: newX,
        y: newY,
        isGolden: Math.random() < 0.2 // 20% golden apple chance
    };
}

// Particle Burst Effect
function createParticles(x, y, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particles.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 3 + 2,
            color: color,
            alpha: 1
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.045;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Queue Movement Input safely
function queueDirection(newX, newY) {
    let lastDir = currentDir;
    if (inputQueue.length > 0) {
        lastDir = inputQueue[inputQueue.length - 1];
    }

    // Prevent 180-degree immediate reversal
    if (lastDir.x + newX !== 0 || lastDir.y + newY !== 0) {
        if (inputQueue.length < 2) {
            inputQueue.push({ x: newX, y: newY });
        }
    }
}

// Game Logic Tick
function tick() {
    if (!isRunning || isPaused) return;

    if (inputQueue.length > 0) {
        currentDir = inputQueue.shift();
    }

    const head = { 
        x: snake[0].x + currentDir.x, 
        y: snake[0].y + currentDir.y 
    };

    // Wall Wrap or Wall Collision logic
    if (wallWrap) {
        if (head.x < 0) head.x = GRID_COUNT - 1;
        if (head.x >= GRID_COUNT) head.x = 0;
        if (head.y < 0) head.y = GRID_COUNT - 1;
        if (head.y >= GRID_COUNT) head.y = 0;
    } else {
        if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
            triggerGameOver();
            return;
        }
    }

    // Self-Collision Check
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        triggerGameOver();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Food Eat Check
    if (head.x === food.x && head.y === food.y) {
        foodsEaten++;
        const points = food.isGolden ? 30 : 10;
        score += points;
        scoreVal.textContent = score;

        audio.playEatSound(food.isGolden);
        createParticles(food.x, food.y, food.isGolden ? '#facc15' : '#4ade80');

        if (score > highScore) {
            highScore = score;
            highScoreVal.textContent = highScore;
            localStorage.setItem('snake_arcade_highscore', highScore.toString());
        }

        spawnFood();
    } else {
        snake.pop(); // Remove tail
    }
}

// Main Animation Loop
function gameLoop(timestamp) {
    if (isRunning && !isPaused) {
        const interval = getEffectiveInterval();
        if (timestamp - lastTickTime >= interval) {
            tick();
            lastTickTime = timestamp;
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Draw Canvas
function draw() {
    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Food Pulsing Animation
    const pulseScale = 1 + Math.sin(Date.now() / 180) * 0.08;
    const foodCenterX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodCenterY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const foodRadius = (CELL_SIZE / 2.4) * pulseScale;

    ctx.save();
    ctx.shadowBlur = food.isGolden ? 20 : 12;
    ctx.shadowColor = food.isGolden ? '#facc15' : '#22c55e';
    ctx.fillStyle = food.isGolden ? '#facc15' : '#ef4444';

    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Reflection dot on food
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(foodCenterX - foodRadius * 0.3, foodCenterY - foodRadius * 0.3, foodRadius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw Snake Segments
    snake.forEach((segment, index) => {
        const segX = segment.x * CELL_SIZE;
        const segY = segment.y * CELL_SIZE;

        ctx.save();
        if (index === 0) {
            // Head
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#4ade80';
            ctx.fillStyle = '#4ade80';

            ctx.beginPath();
            ctx.roundRect(segX + 1, segY + 1, CELL_SIZE - 2, CELL_SIZE - 2, 8);
            ctx.fill();

            // Eyes pointing in movement direction
            ctx.fillStyle = '#022c22';
            const eyeRadius = CELL_SIZE / 5.5;
            let eye1X, eye1Y, eye2X, eye2Y;

            if (currentDir.x === 1) { // Right
                eye1X = segX + CELL_SIZE * 0.7; eye1Y = segY + CELL_SIZE * 0.3;
                eye2X = segX + CELL_SIZE * 0.7; eye2Y = segY + CELL_SIZE * 0.7;
            } else if (currentDir.x === -1) { // Left
                eye1X = segX + CELL_SIZE * 0.3; eye1Y = segY + CELL_SIZE * 0.3;
                eye2X = segX + CELL_SIZE * 0.3; eye2Y = segY + CELL_SIZE * 0.7;
            } else if (currentDir.y === -1) { // Up
                eye1X = segX + CELL_SIZE * 0.3; eye1Y = segY + CELL_SIZE * 0.3;
                eye2X = segX + CELL_SIZE * 0.7; eye2Y = segY + CELL_SIZE * 0.3;
            } else { // Down
                eye1X = segX + CELL_SIZE * 0.3; eye1Y = segY + CELL_SIZE * 0.7;
                eye2X = segX + CELL_SIZE * 0.7; eye2Y = segY + CELL_SIZE * 0.7;
            }

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
            ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Body segments
            const alpha = Math.max(0.4, 1 - (index / snake.length) * 0.55);
            ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;

            ctx.beginPath();
            ctx.roundRect(segX + 2, segY + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
            ctx.fill();
        }
        ctx.restore();
    });

    // Particles
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    updateParticles();
}

// --- Keyboard Controls ---
function handleKeyDown(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " ", "KeyW", "KeyA", "KeyS", "KeyD", "KeyP", "Enter"].includes(e.code) || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    audio.init();

    if (!isRunning) {
        if (e.code === 'Enter' || e.code === 'Space') {
            startGame();
        }
        return;
    }

    if (e.code === 'Space' || e.key === ' ' || e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    if (isPaused) return;

    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
            queueDirection(0, -1); break;
        case 'ArrowDown': case 's': case 'S':
            queueDirection(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A':
            queueDirection(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D':
            queueDirection(1, 0); break;
    }
}

// --- Mobile Touch & Continuous Swipe System (Zero-Scroll Lock) ---
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;

// Global prevention of touchmove scrolling & pull-to-refresh
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

function handleTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = true;
        audio.init();
    }
}

function handleTouchMove(e) {
    e.preventDefault(); // Stop any pull-to-refresh or viewport bouncing
    if (!isSwiping || !isRunning || isPaused || !e.touches || e.touches.length === 0) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const dx = currentX - touchStartX;
    const dy = currentY - touchStartY;
    const threshold = 22; // ~22px swipe threshold for swift direction change

    if (Math.abs(dx) >= threshold || Math.abs(dy) >= threshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
            queueDirection(dx > 0 ? 1 : -1, 0);
        } else {
            queueDirection(0, dy > 0 ? 1 : -1);
        }
        // Continuous Swipe Support: Update start coordinates to enable seamless multi-directional turns
        touchStartX = currentX;
        touchStartY = currentY;
    }
}

function handleTouchEnd(e) {
    isSwiping = false;
}

// Attach Swipe handlers to Game Container and Canvas
const touchTargets = [canvasContainer, canvas];
touchTargets.forEach(target => {
    target.addEventListener('touchstart', handleTouchStart, { passive: false });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd, { passive: false });
    target.addEventListener('touchcancel', handleTouchEnd, { passive: false });
});

// Mobile On-Screen D-Pad (Pointer events for instant responsiveness without zoom)
const dPadButtons = [
    { id: 'btnUp', dir: [0, -1] },
    { id: 'btnDown', dir: [0, 1] },
    { id: 'btnLeft', dir: [-1, 0] },
    { id: 'btnRight', dir: [1, 0] }
];

dPadButtons.forEach(btnInfo => {
    const btn = document.getElementById(btnInfo.id);
    if (btn) {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            audio.init();
            if (isRunning && !isPaused) {
                queueDirection(btnInfo.dir[0], btnInfo.dir[1]);
            }
        });
    }
});

// --- Game Flow Control ---
function startGame() {
    audio.init();
    audio.playClickSound();

    resetGame();
    isRunning = true;
    isPaused = false;
    lastTickTime = performance.now();

    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
}

function triggerGameOver() {
    isRunning = false;
    audio.playGameOverSound();

    finalScore.textContent = score;
    finalHighScore.textContent = highScore;

    if (score > 0 && score >= highScore) {
        newRecordBadge.classList.remove('hidden');
    } else {
        newRecordBadge.classList.add('hidden');
    }

    gameOverOverlay.classList.remove('hidden');
}

function togglePause() {
    if (!isRunning) return;
    audio.playClickSound();

    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.classList.remove('hidden');
        pauseLabel.textContent = 'Продължи';
        pauseIcon.textContent = '▶️';
    } else {
        pauseOverlay.classList.add('hidden');
        pauseLabel.textContent = 'Пауза';
        pauseIcon.textContent = '⏸️';
        lastTickTime = performance.now();
    }
}

// --- Event Listeners ---
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);

soundToggleBtn.addEventListener('click', () => {
    audio.init();
    audio.muted = !audio.muted;
    soundIcon.textContent = audio.muted ? '🔇' : '🔊';
});

wallWrapToggle.addEventListener('change', (e) => {
    wallWrap = e.target.checked;
    audio.playClickSound();
});

speedOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        audio.playClickSound();
        speedOptions.forEach(b => {
            b.classList.remove('bg-green-500', 'text-slate-950', 'font-bold', 'shadow');
            b.classList.add('text-slate-400');
        });
        btn.classList.remove('text-slate-400');
        btn.classList.add('bg-green-500', 'text-slate-950', 'font-bold', 'shadow');

        baseSpeed = parseInt(btn.dataset.speed, 10);
    });
});

window.addEventListener('keydown', handleKeyDown);

// Start animation loop
resetGame();
requestAnimationFrame(gameLoop);
