
// Chess piece image mapping
const pieceImages = {
    'wK': 'Images/wK.png', 'wQ': 'Images/wQ.png', 'wR': 'Images/wR.png', 'wB': 'Images/wB.png', 'wN': 'Images/wN.png', 'wP': 'Images/wP.png',
    'bK': 'Images/bK.png', 'bQ': 'Images/bQ.png', 'bR': 'Images/bR.png', 'bB': 'Images/bB.png', 'bN': 'Images/bN.png', 'bP': 'Images/bP.png'
};

// Initialize chess game
let game = null;
let selectedSquare = null;
let flipped = false;
let draggedPiece = null;
let capturedByWhite = [];
let capturedByBlack = [];

// Chess clock state
let whiteMsRemaining = 5 * 60 * 1000;
let blackMsRemaining = 5 * 60 * 1000;
let activeColor = 'w';
let clockRunning = false;
let lastTickTs = null;
let tickHandle = null;

// Create the chess board
function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const square = document.createElement('div');
            const actualRank = flipped ? rank : 7 - rank;
            const actualFile = flipped ? 7 - file : file;
            const squareId = String.fromCharCode(97 + actualFile) + (actualRank + 1);
            
            square.className = `square ${(rank + file) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.square = squareId;
            square.onclick = () => handleSquareClick(squareId);
            square.ondragover = (e) => e.preventDefault();
            square.ondrop = (e) => handleDrop(e, squareId);

            board.appendChild(square);
        }
    }

    updateBoard();
}

// Update board with current position
function updateBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const squareId = square.dataset.square;
        const piece = game.get(squareId);
        
        square.innerHTML = '';
        square.classList.remove('highlight', 'possible-move', 'possible-capture');

        if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'piece';
            pieceElement.draggable = true;
            pieceElement.ondragstart = (e) => handleDragStart(e, squareId);
            pieceElement.ondragend = () => handleDragEnd();
            
            const img = document.createElement('img');
            img.src = pieceImages[piece.color + piece.type.toUpperCase()];
            img.alt = piece.color + piece.type;
            img.draggable = false;
            
            pieceElement.appendChild(img);
            square.appendChild(pieceElement);
        }
    });
}

// Handle square click
function handleSquareClick(squareId) {
    if (!clockRunning) {
        return;
    }
    if (selectedSquare === squareId) {
        // Deselect if clicking same square
        selectedSquare = null;
        clearHighlights();
        return;
    }

    const piece = game.get(squareId);
    
    if (selectedSquare) {
        // Try to make move
        const move = game.move({
            from: selectedSquare,
            to: squareId,
            promotion: 'q'
        });

        if (move) {
            trackCapture(move);
            onMoveCompleted(move);
            updateDisplay();
            selectedSquare = null;
            clearHighlights();
        } else if (piece && piece.color === game.turn()) {
            // Select new piece
            selectedSquare = squareId;
            highlightSquare(squareId);
            showPossibleMoves(squareId);
        }
    } else if (piece && piece.color === game.turn()) {
        // Select piece
        selectedSquare = squareId;
        highlightSquare(squareId);
        showPossibleMoves(squareId);
    }
}

// Handle drag start
function handleDragStart(e, squareId) {
    const piece = game.get(squareId);
    if (!clockRunning || !piece || piece.color !== game.turn()) {
        e.preventDefault();
        return;
    }
    
    draggedPiece = squareId;
    e.target.classList.add('dragging');
    
    // Show possible moves
    showPossibleMoves(squareId);
}

// Handle drag end
function handleDragEnd() {
    const draggedElement = document.querySelector('.piece.dragging');
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    clearHighlights();
    draggedPiece = null;
}

// Handle drop
function handleDrop(e, targetSquareId) {
    e.preventDefault();
    if (!clockRunning) return;

    if (!draggedPiece) return;

    const move = game.move({
        from: draggedPiece,
        to: targetSquareId,
        promotion: 'q'
    });

    if (move) {
        trackCapture(move);
        onMoveCompleted(move);
        updateDisplay();
    }

    handleDragEnd();
}

// Highlight selected square
function highlightSquare(squareId) {
    clearHighlights();
    const square = document.querySelector(`[data-square="${squareId}"]`);
    if (square) {
        square.classList.add('highlight');
    }
}

// Show possible moves
function showPossibleMoves(squareId) {
    const moves = game.moves({ square: squareId, verbose: true });
    moves.forEach(move => {
        const square = document.querySelector(`[data-square="${move.to}"]`);
        if (square) {
            if (move.flags.includes('c')) {
                square.classList.add('possible-capture');
            } else {
                square.classList.add('possible-move');
            }
        }
    });
}

// Clear highlights
function clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.remove('highlight', 'possible-move', 'possible-capture');
    });
}

// Update all displays
function updateDisplay() {
    updateBoard();
    
    const status = document.getElementById('game-status');
    const currentTurn = document.getElementById('current-turn');
    const moveCount = document.getElementById('move-count');
    const fenDisplay = document.getElementById('fen-display');

    let statusText = '';
    if (game.in_checkmate()) {
        statusText = game.turn() === 'b' ? 'White wins by checkmate!' : 'Black wins by checkmate!';
        showCheckmateModal();
    } else if (game.in_draw()) {
        statusText = 'Game drawn';
    } else if (game.in_check()) {
        statusText = (game.turn() === 'w' ? 'White' : 'Black') + ' in check';
    } else {
        statusText = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';
    }

    if (status) status.textContent = statusText;
    if (currentTurn) currentTurn.textContent = game.turn() === 'w' ? 'White' : 'Black';
    if (moveCount) moveCount.textContent = Math.floor(game.history().length);
    if (fenDisplay) fenDisplay.textContent = game.fen();

    updateMoveHistory();
    updateCapturedUI();
    updateClocksUI();
}

// Update move history
function updateMoveHistory() {
    const historyDiv = document.getElementById('move-history');
    const moves = game.history();
    
    let historyHTML = '<div style="color: #6a9955; font-style: italic;">// Game started - White to move</div>';
    
    for (let i = 0; i < moves.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = moves[i];
        const blackMove = moves[i + 1] || '';
        
        historyHTML += `
            <div class="move-entry">
                <span class="move-number">${moveNumber}.</span>
                <span class="move-white">${whiteMove}</span>
                ${blackMove ? `<span class="move-black">${blackMove}</span>` : ''}
            </div>
        `;
    }
    if (game.game_over()) {
        let result = '';
        if (game.in_checkmate()) {
            result = game.turn() === 'b' ? '1-0' : '0-1';
        } else {
            result = '1/2-1/2';
        }
        historyHTML += `<div style="color: #f44747; font-weight: bold; margin-top: 10px;">// Game Over: ${result}</div>`;
    }

    historyDiv.innerHTML = historyHTML;
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Game controls
function resetGame() {
    game.reset();
    selectedSquare = null;
    clearHighlights();
    capturedByWhite = [];
    capturedByBlack = [];
    updateDisplay();
    // Clear story box on reset
    updateStoryBox('');
    try { localStorage.removeItem('lastStory'); } catch (_) {}
    // Reset clocks
    pauseClock();
    const tInput = document.getElementById('time-mmss-input');
    const { minutes, seconds } = parseMmSs((tInput && tInput.value) || '05:00');
    whiteMsRemaining = (minutes * 60 + seconds) * 1000;
    blackMsRemaining = (minutes * 60 + seconds) * 1000;
    activeColor = 'w';
    updateClocksUI();
    const toggleBtn = document.getElementById('toggle-clock-btn');
    if (toggleBtn) toggleBtn.textContent = 'Start Clock';
}

function undoMove() {
    const move = game.undo();
    if (move !== null) {
        // If the undone move was a capture, remove from captured arrays
        if (move.captured) {
            const wasCapturedByWhite = move.color === 'w';
            const capturedPieceCode = (wasCapturedByWhite ? 'b' : 'w') + move.captured.toUpperCase();
            if (wasCapturedByWhite) {
                // White had captured a black piece; remove last matching
                removeLastCaptured(capturedByWhite, capturedPieceCode);
            } else {
                // Black had captured a white piece
                removeLastCaptured(capturedByBlack, capturedPieceCode);
            }
            updateCapturedUI();
        }
        selectedSquare = null;
        clearHighlights();
        updateDisplay();
    }
}

function flipBoard() {
    flipped = !flipped;
    createBoard();
}

// Modal functions
function showCheckmateModal() {
    const modal = document.getElementById('checkmate-modal');
    const winnerText = document.getElementById('winner-text');
    const winner = game.turn() === 'b' ? 'White' : 'Black';
    
    winnerText.textContent = `${winner} wins!`;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('checkmate-modal');
    modal.classList.remove('show');
    
    // If "New Game" was clicked, reset the game
    if (event.target.textContent === 'New Game') {
        resetGame();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    createBoard();
    updateDisplay();
});

// Capture tracking helpers
function trackCapture(move) {
    if (move.captured) {
        // The mover is move.color; the captured piece belongs to the opposite color
        const capturedPieceCode = (move.color === 'w' ? 'b' : 'w') + move.captured.toUpperCase();
        if (move.color === 'w') {
            capturedByWhite.push(capturedPieceCode);
        } else {
            capturedByBlack.push(capturedPieceCode);
        }
        updateCapturedUI();
    }
}

function removeLastCaptured(arr, pieceCode) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] === pieceCode) {
            arr.splice(i, 1);
            return;
        }
    }
}

function updateCapturedUI() {
    const whiteDiv = document.getElementById('captured-white');
    const blackDiv = document.getElementById('captured-black');
    if (!whiteDiv || !blackDiv) return;

    whiteDiv.innerHTML = '';
    blackDiv.innerHTML = '';

    capturedByWhite.forEach(code => {
        const el = document.createElement('div');
        el.className = 'captured-piece';
        const img = document.createElement('img');
        img.src = pieceImages[code];
        img.alt = code;
        el.appendChild(img);
        whiteDiv.appendChild(el);
    });

    capturedByBlack.forEach(code => {
        const el = document.createElement('div');
        el.className = 'captured-piece';
        const img = document.createElement('img');
        img.src = pieceImages[code];
        img.alt = code;
        el.appendChild(img);
        blackDiv.appendChild(el);
    });
}

async function generateStoryFromCurrentPosition() {
    console.log('[Story] Generate clicked');
    // Assemble a simple PGN from the current move history
    // Use chess.js' built-in exporter for correctness
    const pgn = game.pgn({ max_width: 80, newline_char: ' ' });
    if (!pgn || pgn.trim().length === 0) {
        updateStoryBox('// No moves yet. Play a few moves before generating a story.');
        return;
    }

    const themeSelect = document.getElementById('theme-select');
    let selectedTheme = 'medieval_kingdom';
    if (themeSelect && themeSelect.value) {
        selectedTheme = themeSelect.value;
    } else {
        // If not selected, default to medieval_kingdom but inform user
        console.warn('[Story] No theme selected, defaulting to medieval_kingdom');
    }

    // POST to backend using the expected route /narrate/current_game/<theme>
    const apiUrl = `the-bard-gambit-production.up.railway.app/narrate/current_game/${encodeURIComponent(selectedTheme)}`;
    const payload = {
        eventName: 'User Game',
        whitePlayer: 'White',
        blackPlayer: 'Black',
        pgn: pgn.trim()
    };

    updateStoryBox('// Generating story...');
    // Disable button and prevent page refresh while generating
    const genBtn = document.getElementById('generate-story-btn');
    if (genBtn) genBtn.disabled = true;
    const beforeUnloadGuard = (e) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
    };
    window.addEventListener('beforeunload', beforeUnloadGuard);

    // Setup a fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        console.log('[Story] POST', apiUrl, payload);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            cache: 'no-store',
            signal: controller.signal,
            mode: 'cors',
        });

        const contentType = response.headers.get('content-type') || '';
        let data;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Unexpected response: ${text.slice(0, 200)}`);
        }
        console.log('[Story] Response', response.status, data);
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate story');
        }

        if (data && data.story) {
            updateStoryBox(data.story);
        } else {
            updateStoryBox('// No story returned.');
        }
        // Focus the story box so accidental keypress doesn't reset UI
        const sb = document.getElementById('story-box');
        if (sb) sb.focus && sb.focus();
    } catch (err) {
        console.error(err);
        updateStoryBox(`// Error: ${err.message}`);
    } finally {
        clearTimeout(timeoutId);
        window.removeEventListener('beforeunload', beforeUnloadGuard);
        if (genBtn) genBtn.disabled = false;
    }
}

function updateStoryBox(text) {
    const box = document.getElementById('story-box');
    if (box) {
        box.textContent = text;
        box.scrollTop = box.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Init] DOMContentLoaded');
    if (typeof Chess === 'undefined') {
        console.error('Chess.js not loaded');
        updateStoryBox('// Error: chess.js failed to load.');
        return;
    }
    game = new Chess();

    createBoard();
    updateDisplay();

    // Prevent any accidental form submissions from reloading the page
    document.addEventListener('submit', (e) => {
        console.log('[Guard] Prevented form submit');
        e.preventDefault();
    });

    const genBtn = document.getElementById('generate-story-btn');
    if (genBtn) {
        genBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Story] Button clicked');
            generateStoryFromCurrentPosition();
        });
    } else {
        console.warn('[Init] Generate button not found');
    }

    // Time control select and clock toggle
    const timeInput = document.getElementById('time-mmss-input');
    if (timeInput) {
        const applyTime = () => {
            const val = (timeInput.value || '').trim();
            const { minutes, seconds } = parseMmSs(val || '05:00');
            whiteMsRemaining = (minutes * 60 + seconds) * 1000;
            blackMsRemaining = (minutes * 60 + seconds) * 1000;
            activeColor = 'w';
            pauseClock();
            updateClocksUI();
            const toggleBtn = document.getElementById('toggle-clock-btn');
            if (toggleBtn) toggleBtn.textContent = 'Start Clock';
        };
        timeInput.addEventListener('change', applyTime);
        timeInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') applyTime();
        });
        timeInput.addEventListener('blur', () => {
            // Normalize formatting to MM:SS
            const { minutes, seconds } = parseMmSs(timeInput.value || '05:00');
            timeInput.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        });
    }

    const toggleBtn = document.getElementById('toggle-clock-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (!clockRunning) {
                startClock();
                toggleBtn.textContent = 'Pause Clock';
            } else {
                pauseClock();
                toggleBtn.textContent = 'Start Clock';
            }
        });
    }

    // Initialize clocks UI on load
    updateClocksUI();
});

window.addEventListener('beforeunload', () => {
    console.log('[Lifecycle] beforeunload');
});

document.addEventListener('visibilitychange', () => {
    console.log('[Lifecycle] visibilitychange', document.visibilityState);
});

// Ensure global access for inline onclick
window.generateStoryFromCurrentPosition = generateStoryFromCurrentPosition;

// --- Chess clock helpers ---
function startClock() {
    if (clockRunning) return;
    clockRunning = true;
    lastTickTs = performance.now();
    tickHandle = setInterval(clockTick, 100);
}

function pauseClock() {
    if (!clockRunning) return;
    clockRunning = false;
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = null;
}

function clockTick() {
    if (!clockRunning) return;
    const now = performance.now();
    const delta = now - (lastTickTs || now);
    lastTickTs = now;
    if (activeColor === 'w') {
        whiteMsRemaining = Math.max(0, whiteMsRemaining - delta);
    } else {
        blackMsRemaining = Math.max(0, blackMsRemaining - delta);
    }
    updateClocksUI();
    if (whiteMsRemaining === 0 || blackMsRemaining === 0) {
        pauseClock();
    }
}

function onMoveCompleted(move) {
    // Switch side to move
    activeColor = (activeColor === 'w') ? 'b' : 'w';
    updateClocksUI();
}

function updateClocksUI() {
    const whiteEl = document.getElementById('white-clock');
    const blackEl = document.getElementById('black-clock');
    if (whiteEl) whiteEl.textContent = formatMs(whiteMsRemaining);
    if (blackEl) blackEl.textContent = formatMs(blackMsRemaining);
}

function formatMs(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseMmSs(value) {
    // Accept formats: MM:SS, M:SS, MM, M, or seconds only
    const v = (value || '').replace(/\s+/g, '');
    if (v.includes(':')) {
        const [m, s] = v.split(':');
        const minutes = Math.max(0, parseInt(m || '0', 10) || 0);
        const seconds = Math.max(0, Math.min(59, parseInt(s || '0', 10) || 0));
        return { minutes, seconds };
    }
    const n = Math.max(0, parseInt(v || '0', 10) || 0);
    if (n >= 60) {
        return { minutes: Math.floor(n / 60), seconds: n % 60 };
    }
    return { minutes: n, seconds: 0 };
}