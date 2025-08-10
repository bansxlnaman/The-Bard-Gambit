// Chess piece image mapping
const pieceImages = {
    'wK': 'Images/wK.png', 'wQ': 'Images/wQ.png', 'wR': 'Images/wR.png', 'wB': 'Images/wB.png', 'wN': 'Images/wN.png', 'wP': 'Images/wP.png',
    'bK': 'Images/bK.png', 'bQ': 'Images/bQ.png', 'bR': 'Images/bR.png', 'bB': 'Images/bB.png', 'bN': 'Images/bN.png', 'bP': 'Images/bP.png'
};

// Initialize chess game
let game = new Chess();
let selectedSquare = null;
let flipped = false;
let draggedPiece = null;
let capturedByWhite = [];
let capturedByBlack = [];

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
    if (!piece || piece.color !== game.turn()) {
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
    
    if (!draggedPiece) return;

    const move = game.move({
        from: draggedPiece,
        to: targetSquareId,
        promotion: 'q'
    });

    if (move) {
        trackCapture(move);
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

    status.textContent = statusText;
    currentTurn.textContent = game.turn() === 'w' ? 'White' : 'Black';
    moveCount.textContent = Math.floor(game.history().length);
    fenDisplay.textContent = game.fen();

    updateMoveHistory();
    updateCapturedUI();
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