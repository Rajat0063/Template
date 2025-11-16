// Create lucide icons
window.addEventListener('load', () => {
    // Check if lucide is loaded before using it
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    updateTime(); // Call once on load
    setInterval(updateTime, 1000); // Update every second
    setupMobileControls(); // ADDED: Set up D-pad

    // --- Initial Setup ---
    resizeCanvas();
    // Don't start game automatically, wait for button press
    // Draw initial "empty" state
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const currentTimeElement = document.getElementById('currentTime'); // Get the new clock element
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const resetButton = document.getElementById('resetButton');
const resetText = document.getElementById('resetText');
const modal = document.getElementById('gameOverModal');
// Get the new modal button and the game container
const modalResetButton = document.getElementById('modalResetButton');
const modalQuitButton = document.getElementById('modalQuitButton');
const gameContainer = document.getElementById('gameContainer');
// Get new pause elements
const pauseButton = document.getElementById('pauseButton');
const pauseText = document.getElementById('pauseText');

// Game constants
const tileSize = 20; // 20px per square
let tileCountX = 20; // 20 tiles wide
let tileCountY = 20; // 20 tiles high

// Dynamic canvas sizing
function resizeCanvas() {
    const containerWidth = canvas.parentElement.clientWidth;
    tileCountX = Math.floor(containerWidth / tileSize);
    tileCountY = tileCountX; // Keep it square

    canvas.width = tileCountX * tileSize;
    canvas.height = tileCountY * tileSize;
}

// Game state
let snake, food, score, direction, nextDirection, gameLoopInterval, gameOver;
let isPaused = false; // New state for pause

function initializeGame() {
    // Set snake in the middle
    snake = [
        { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }
    ];

    // Place initial food (MOVED after snake init)
    generateFood();

    score = 0;
    scoreElement.textContent = '0';

    // Initial direction
    direction = 'right';
    nextDirection = 'right';

    gameOver = false;
    isPaused = false; // Reset pause state

    // Hide modal
    modal.classList.add('opacity-0', 'invisible');
    // Remove shake effect if it's there
    gameContainer.classList.remove('animate-shake');

    // Start game loop
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    gameLoopInterval = setInterval(gameLoop, 100); // Game speed: 100ms

    resetText.textContent = 'Reset';
    // Enable pause button
    pauseButton.disabled = false;
    pauseText.textContent = 'Pause';

    // Check if lucide is loaded
    if (typeof lucide !== 'undefined') {
        // Remove the old icon (which is likely an svg)
        pauseButton.querySelector('svg')?.remove();
        // Add the new icon markup
        const pauseIconEl = document.createElement('i');
        pauseIconEl.setAttribute('data-lucide', 'pause');
        pauseIconEl.setAttribute('class', 'w-4 h-4');
        pauseButton.prepend(pauseIconEl);
        lucide.createIcons();
    }
}

// --- Game Loop ---
function gameLoop() {
    if (gameOver) {
        clearInterval(gameLoopInterval);
        finalScoreElement.textContent = score;
        modal.classList.remove('opacity-0', 'invisible');

        // --- Enhancements ---
        // 1. Add shake animation
        gameContainer.classList.add('animate-shake');

        // DISABLE CONTROLS
        gameContainer.style.pointerEvents = 'none';
        dPadContainer.style.pointerEvents = 'none';
        // ...
        
        // 2. Play sound
        try {
            // Check if Tone is loaded
            if (typeof Tone !== 'undefined') {
                // Start audio context on user gesture (click)
                Tone.start();
                const synth = new Tone.Synth().toDestination();
                synth.triggerAttackRelease("C2", "8n", Tone.now());
            }
        } catch (e) {
            console.error('Audio context error:', e);
        }
        // 3. Reset main button text
        resetText.textContent = 'Start';
        // 4. Disable pause button
        pauseButton.disabled = true;
        isPaused = false;
        pauseText.textContent = 'Pause';

        // Check if lucide is loaded
        if (typeof lucide !== 'undefined') {
            // Remove the old icon (which is likely an svg)
            pauseButton.querySelector('svg')?.remove();
            // Add the new icon markup
            const pauseIconEl = document.createElement('i');
            pauseIconEl.setAttribute('data-lucide', 'pause');
            pauseIconEl.setAttribute('class', 'w-4 h-4');
            pauseButton.prepend(pauseIconEl);
            lucide.createIcons();
        }

        return;
    }

    // --- Check for pause ---
    if (isPaused) {
        return; // Skip update and draw if paused
    }

    update();
    draw();
}

// --- Update Logic ---
function update() {
    // Update direction
    direction = nextDirection;

    // Get current head
    const head = { ...snake[0] }; // Copy the head

    // Move head based on direction
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    // Check for wall collision
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        gameOver = true;
        return;
    }

    // Check for self-collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver = true;
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
        // Ate food
        score++;
        scoreElement.textContent = score;
        generateFood(); // Generate new food
    } else {
        // Didn't eat food, remove tail
        snake.pop();
    }
}

// --- Draw Logic ---
function draw() {
    // Clear canvas (dark background)
    ctx.fillStyle = '#111827'; // gray-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake (emerald-400)
    ctx.fillStyle = '#34d399';
    for (const segment of snake) {
        ctx.fillRect(segment.x * tileSize, segment.y * tileSize, tileSize - 2, tileSize - 2);
    }

    // Draw food (red-500)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize - 2, tileSize - 2);

    // Draw grid lines (optional, but looks cool)
    ctx.strokeStyle = '#1f2937'; // gray-800
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCountX; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvas.height);
        ctx.stroke();
    }
    for (let j = 0; j <= tileCountY; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * tileSize);
        ctx.lineTo(canvas.width, j * tileSize);
        ctx.stroke();
    }

    // --- Draw PAUSED overlay ---
    if (isPaused) {
        ctx.fillStyle = 'rgba(17, 24, 39, 0.75)'; // gray-900 with 75% opacity
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px "Source Code Pro"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// --- Helper Functions ---
function generateFood() {
    let newFoodPosition;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
        // Keep generating until food is not on the snake
    } while (snake && snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y)); // Added snake check

    food = newFoodPosition;
}

// --- Clock Function ---
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (currentTimeElement) {
        currentTimeElement.textContent = `[TIME: ${hours}:${minutes}:${seconds}]`;
    }
}

// --- New Pause Function ---
function togglePause() {
    // Can't pause if game is over or hasn't started
    if (gameOver || resetText.textContent === 'Start') {
        return;
    }

    isPaused = !isPaused;

    if (isPaused) {
        // Pause the game (MODIFIED: remove interval clearing)
        // clearInterval(gameLoopInterval);
        // gameLoopInterval = null; // Clear interval ID

        // Update button
        pauseText.textContent = 'Resume';

        if (typeof lucide !== 'undefined') {
            // Remove the old icon (which is likely an svg)
            pauseButton.querySelector('svg')?.remove();
            // Add the new icon markup
            const playIconEl = document.createElement('i');
            playIconEl.setAttribute('data-lucide', 'play');
            playIconEl.setAttribute('class', 'w-4 h-4');
            pauseButton.prepend(playIconEl);
        }

        // Redraw canvas to show "PAUSED" text
        draw();
    } else {
        // Resume the game (MODIFIED: remove interval setting)
        // gameLoopInterval = setInterval(gameLoop, 100);

        // Update button
        pauseText.textContent = 'Pause';

        if (typeof lucide !== 'undefined') {
            // Remove the old icon (which is likely an svg)
            pauseButton.querySelector('svg')?.remove();
            // Add the new icon markup
            const pauseIconEl = document.createElement('i');
            pauseIconEl.setAttribute('data-lucide', 'pause');
            pauseIconEl.setAttribute('class', 'w-4 h-4');
            pauseButton.prepend(pauseIconEl);
        }
    }
    // Update the icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- NEW: D-Pad setup ---
function setupMobileControls() {
    const upBtn = document.getElementById('up-btn');
    const downBtn = document.getElementById('down-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    // Use 'touchstart' for immediate response on mobile
    // We use { passive: false } to allow e.preventDefault()
    upBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction !== 'down') nextDirection = 'up';
    }, { passive: false });

    downBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction !== 'up') nextDirection = 'down';
    }, { passive: false });

    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction !== 'right') nextDirection = 'left';
    }, { passive: false });

    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (direction !== 'left') nextDirection = 'right';
    }, { passive: false });
}

// --- Event Listeners ---

// Keyboard controls (UPDATED)
document.addEventListener('keydown', e => {
    // Add spacebar to toggle pause
    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        togglePause();
        return;
    }

    // Add WASD controls
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
    // Prevent page scrolling with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', e => {
    if (e.touches.length === 0) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    const minSwipeDist = 20; // Minimum distance to register as swipe

    // Check which direction has more movement
    if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
        if (Math.abs(dx) > minSwipeDist) {
            if (dx > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
            // Reset start points after a successful swipe
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        }
    } else { // Vertical swipe
        if (Math.abs(dy) > minSwipeDist) {
            if (dy > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
            // Reset start points after a successful swipe
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        }
    }

}, { passive: true });

// Reset button
resetButton.addEventListener('click', initializeGame);
// New modal reset button
modalResetButton.addEventListener('click', initializeGame);
// New modal quit button
modalQuitButton.addEventListener('click', () => {
    modal.classList.add('opacity-0', 'invisible');
});
// New pause button
pauseButton.addEventListener('click', togglePause);

// Resize canvas on window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    // Re-draw immediately after resize
    // Add check for snake being initialized
    if (!gameOver && snake) {
        draw();
    } else if (!snake) { // If game hasn't started, just draw the empty state
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
});

// Add listener to remove shake class after animation
gameContainer.addEventListener('animationend', () => {
    gameContainer.classList.remove('animate-shake');
});