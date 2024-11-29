let rows = 9;
let cols = 9;
let mines = 10;

const boardElement = document.getElementById('board');
const restartButton = document.getElementById('restart');
const gameSizeButton = document.getElementById('gameSize');
const overlay = document.getElementById('overlay'); // The overlay element
let board = [];
let gameOver = false;
let firstClick = true;
let gameSizes = [
  { rows: 9, cols: 9, mines: 10 },
  { rows: 16, cols: 16, mines: 40 },
  { rows: 22, cols: 22, mines: 99 },
];
let currentSizeIndex = 0;

// Save game state
function saveGameState() {
  const gameState = {
    board,
    rows,
    cols,
    mines,
    firstClick,
    gameOver,
    currentSizeIndex,
  };
  chrome.storage.local.set({ gameState }, () => {
    console.log('Game state saved.');
  });
}

// Load game state
function loadGameState() {
  chrome.storage.local.get('gameState', (data) => {
    if (data.gameState) {
      const savedState = data.gameState;
      board = savedState.board;
      rows = savedState.rows;
      cols = savedState.cols;
      mines = savedState.mines;
      firstClick = savedState.firstClick;
      gameOver = savedState.gameOver;
      currentSizeIndex = savedState.currentSizeIndex;
      renderBoard();
      console.log('Game state loaded.');
    } else {
      createBoard();
    }
  });
}

// Create a new board
function createBoard() {
  const size = gameSizes[currentSizeIndex];
  rows = size.rows;
  cols = size.cols;
  mines = size.mines;

  board = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols).fill(null).map(() => ({
        mine: false,
        revealed: false,
        adjacentMines: 0,
        flagged: false,
      }))
    );

  renderBoard();
  hideOverlay(); // Hide the overlay when creating a new board
  saveGameState(); // Save the initial board state
}

// Place mines, avoiding the first click
function placeMines(excludedRow, excludedCol) {
  let placed = 0;
  while (placed < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    const distant = Math.abs(row - excludedRow) > 1 || Math.abs(col - excludedCol) > 1;
    if (!board[row][col].mine && distant) {
      board[row][col].mine = true;
      placed++;
    }
  }
  calculateAdjacentMines();
}

// Calculate adjacent mines for each cell
function calculateAdjacentMines() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].mine) {
            count++;
          }
        }
      }
      board[row][col].adjacentMines = count;
    }
  }
}

// Render the board
function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = board[row][col];
      const cellElement = document.createElement('div');
      cellElement.className = 'cell';
      switch (cols) {
        case 9:
          cellElement.classList.add('cell-small');
          break;
        case 16:
          cellElement.classList.add('cell-medium');
          break;
        case 22:
          cellElement.classList.add('cell-big');
          break;
      }

      if (cell.revealed) {
        cellElement.classList.add('revealed');
        if (cell.mine) {
          cellElement.classList.add('mine');
          cellElement.textContent = '💣';
        } else if (cell.adjacentMines > 0) {
          cellElement.textContent = cell.adjacentMines;
        }
      } else if (cell.flagged) {
        cellElement.classList.add('flag');
        cellElement.textContent = '🚩';
      }

      cellElement.addEventListener('click', () => handleCellClick(row, col));
      cellElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(row, col);
      });

      boardElement.appendChild(cellElement);
    }
  }
}

// Handle cell click
function handleCellClick(row, col) {
  if (gameOver || board[row][col].flagged || board[row][col].revealed) return;

  if (firstClick) {
    placeMines(row, col);
    firstClick = false;
  }

  board[row][col].revealed = true;
  if (board[row][col].mine) {
    gameOver = true;
    revealAll();
    showOverlay('Game Over!');
    saveGameState(); // Save the state after a loss
    return;
  }

  if (board[row][col].adjacentMines === 0) {
    revealAdjacent(row, col);
  }

  checkWin();
  renderBoard();
  saveGameState(); // Save the state after a click
}

// Reveal adjacent cells
function revealAdjacent(row, col) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (
        r >= 0 &&
        r < rows &&
        c >= 0 &&
        c < cols &&
        !board[r][c].revealed &&
        !board[r][c].mine
      ) {
        handleCellClick(r, c);
      }
    }
  }
}

// Toggle flag on a cell
function toggleFlag(row, col) {
  if (gameOver || board[row][col].revealed) return;

  board[row][col].flagged = !board[row][col].flagged;
  renderBoard();
  saveGameState(); // Save the state after toggling a flag
}

// Reveal all cells
function revealAll() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      board[row][col].revealed = true;
    }
  }
  renderBoard();
}

// Check for a win
function checkWin() {
  const nonMineCells = rows * cols - mines;
  let revealedCount = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].revealed && !board[row][col].mine) {
        revealedCount++;
      }
    }
  }

  if (revealedCount === nonMineCells) {
    gameOver = true;
    showOverlay('You Win!');
    saveGameState(); // Save the state after a win
  }
}

// Show overlay with a message
function showOverlay(message) {
  overlay.textContent = message;
  overlay.style.display = 'flex'; // Show the overlay
}

// Hide overlay
function hideOverlay() {
  overlay.style.display = 'none'; // Hide the overlay
}

// Event listeners
gameSizeButton.addEventListener('click', () => {
  currentSizeIndex = (currentSizeIndex + 1) % gameSizes.length;
  firstClick = true;
  gameOver = false;
  chrome.storage.local.remove('gameState', () => {
    console.log('Game state cleared.');
    createBoard();
    const size = gameSizes[currentSizeIndex];
    gameSizeButton.textContent = `${size.rows}x${size.cols}`;
  });
});

restartButton.addEventListener('click', () => {
  firstClick = true;
  gameOver = false;
  chrome.storage.local.remove('gameState', () => {
    console.log('Game state cleared.');
    createBoard();
  });
});

// Initialize the game
loadGameState();
