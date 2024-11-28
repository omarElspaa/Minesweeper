let rows = 9;
let cols = 9;
let mines = 10;

const boardElement = document.getElementById('board');
const restartButton = document.getElementById('restart');
const gameSizeButton = document.getElementById('gameSize');
const overlay = document.getElementById('overlay');  // The overlay element
let board = [];
let gameOver = false;
let firstClick = true;
let gameSizes = [
  { rows: 9, cols: 9, mines: 10 },
  { rows: 16, cols: 16, mines: 40 },
  { rows: 22, cols: 22, mines: 99 }
];
let currentSizeIndex = 0;

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
}

function placeMines(excludedRow, excludedCol) {
  let placed = 0;
  while (placed < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    const distant = (Math.abs(row - excludedRow) > 1) || (Math.abs(col - excludedCol) > 1);
    if (!board[row][col].mine && distant) {
      board[row][col].mine = true;
      placed++;
    }
  }
  calculateAdjacentMines();
}

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
    return;
  }

  if (board[row][col].adjacentMines === 0) {
    revealAdjacent(row, col);
  }

  checkWin();
  renderBoard();
}

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

function toggleFlag(row, col) {
  if (gameOver || board[row][col].revealed) return;

  board[row][col].flagged = !board[row][col].flagged;
  renderBoard();
}

function revealAll() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      board[row][col].revealed = true;
    }
  }
  renderBoard();
}

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
  }
}

function showOverlay(message) {
  overlay.textContent = message;
  overlay.style.display = 'flex'; // Show the overlay
}

function hideOverlay() {
  overlay.style.display = 'none'; // Hide the overlay
}

gameSizeButton.addEventListener('click', () => {
  currentSizeIndex = (currentSizeIndex + 1) % gameSizes.length;
  firstClick = true;
  gameOver = false;
  createBoard();
  // Update the text on the button to reflect the new game size
  const size = gameSizes[currentSizeIndex];
  gameSizeButton.textContent = `${size.rows}x${size.cols}`;
});

restartButton.addEventListener('click', () => {
  firstClick = true;
  gameOver = false;
  createBoard();
});

createBoard();