const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const historyElement = document.getElementById('moveHistory');
const whiteCapturesElement = document.getElementById('whiteCaptures');
const blackCapturesElement = document.getElementById('blackCaptures');
const resetBtn = document.getElementById('resetBtn');

const pieces = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔',
};

let board = [];
let selected = null;
let legalMoves = [];
let turn = 'white';
let history = [];
let captures = { white: [], black: [] };

function createEmptyBoard() {
  board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'],
  ];
}

function isWhite(piece) {
  return piece && piece === piece.toUpperCase();
}

function isBlack(piece) {
  return piece && piece === piece.toLowerCase();
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getPieceColor(piece) {
  if (!piece) return null;
  return isWhite(piece) ? 'white' : 'black';
}

function renderBoard() {
  boardElement.innerHTML = '';

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const square = document.createElement('div');
      square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      square.dataset.row = row;
      square.dataset.col = col;
      const piece = board[row][col];
      if (piece) {
        square.textContent = pieces[piece];
      }

      if (selected && selected.row === row && selected.col === col) {
        square.classList.add('selected');
      }

      const target = legalMoves.find(move => move.row === row && move.col === col);
      if (target) {
        square.classList.add('legal-move');
        if (target.capture) {
          square.classList.add('capture');
        }
      }

      square.addEventListener('click', () => handleSquareClick(row, col));
      boardElement.appendChild(square);
    }
  }

  statusElement.textContent = `Giliran: ${turn === 'white' ? 'Putih' : 'Hitam'}`;
  renderHistory();
  renderCaptures();
}

function renderHistory() {
  historyElement.innerHTML = '';
  history.forEach((move, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${move}`;
    historyElement.appendChild(li);
  });
}

function renderCaptures() {
  whiteCapturesElement.innerHTML = '';
  blackCapturesElement.innerHTML = '';
  captures.white.forEach(piece => {
    const item = document.createElement('div');
    item.className = 'capture-item';
    item.textContent = pieces[piece];
    whiteCapturesElement.appendChild(item);
  });
  captures.black.forEach(piece => {
    const item = document.createElement('div');
    item.className = 'capture-item';
    item.textContent = pieces[piece];
    blackCapturesElement.appendChild(item);
  });
}

function handleSquareClick(row, col) {
  const piece = board[row][col];
  const selectedPiece = selected ? board[selected.row][selected.col] : null;

  if (selected && legalMoves.some(move => move.row === row && move.col === col)) {
    makeMove(selected.row, selected.col, row, col);
    selected = null;
    legalMoves = [];
    renderBoard();
    return;
  }

  if (piece && getPieceColor(piece) === turn) {
    selected = { row, col }; 
    legalMoves = computeLegalMoves(row, col);
  } else {
    selected = null;
    legalMoves = [];
  }

  renderBoard();
}

function makeMove(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const destination = board[toRow][toCol];
  const fromNotation = squareName(fromRow, fromCol);
  const toNotation = squareName(toRow, toCol);

  if (destination) {
    captures[turn].push(destination);
  }

  if ((piece === 'P' && toRow === 0) || (piece === 'p' && toRow === 7)) {
    board[toRow][toCol] = turn === 'white' ? 'Q' : 'q';
  } else {
    board[toRow][toCol] = piece;
  }
  board[fromRow][fromCol] = '';

  const record = `${pieceSymbol(piece)} ${fromNotation}→${toNotation}`;
  history.push(record);
  turn = turn === 'white' ? 'black' : 'white';

  const kingStillSafe = !isKingInCheck(turn);
  if (!kingStillSafe) {
    statusElement.textContent = `Skak! ${turn === 'white' ? 'Putih' : 'Hitam'} sedang terancam.`;
  }

  if (isGameOver()) {
    statusElement.textContent = `Permainan selesai. ${turn === 'white' ? 'Putih' : 'Hitam'} kalah.`;
    boardElement.querySelectorAll('.square').forEach(square => square.removeEventListener('click', () => {}));
  }
}

function isGameOver() {
  const flat = board.flat();
  return !flat.includes('K') || !flat.includes('k');
}

function pieceSymbol(piece) {
  return piece.toUpperCase();
}

function squareName(row, col) {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

function computeLegalMoves(row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const color = getPieceColor(piece);
  const directions = {
    p: [ [1, 0], [2, 0], [1, -1], [1, 1] ],
    P: [ [-1, 0], [-2, 0], [-1, -1], [-1, 1] ],
    n: [ [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2] ],
    b: [ [1, 1], [1, -1], [-1, 1], [-1, -1] ],
    r: [ [1, 0], [-1, 0], [0, 1], [0, -1] ],
    q: [ [1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1] ],
    k: [ [1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1] ],
  };

  const type = piece.toLowerCase();
  if (type === 'p') {
    const forward = directions[piece][0];
    const doubleForward = directions[piece][1];
    const captureOffsets = [directions[piece][2], directions[piece][3]];
    const [dr, dc] = forward;
    const stepRow = row + dr;
    if (inBounds(stepRow, col) && !board[stepRow][col]) {
      moves.push({row: stepRow, col, capture: false});
      const startingRow = piece === 'P' ? 6 : 1;
      const [dr2, dc2] = doubleForward;
      const doubleRow = row + dr2;
      if (row === startingRow && inBounds(doubleRow, col) && !board[doubleRow][col]) {
        moves.push({row: doubleRow, col, capture: false});
      }
    }
    captureOffsets.forEach(([drC, dcC]) => {
      const targetRow = row + drC;
      const targetCol = col + dcC;
      if (inBounds(targetRow, targetCol)) {
        const occupant = board[targetRow][targetCol];
        if (occupant && getPieceColor(occupant) !== color) {
          moves.push({row: targetRow, col: targetCol, capture: true});
        }
      }
    });
  } else if (type === 'n' || type === 'k') {
    directions[type].forEach(([dr, dc]) => {
      const targetRow = row + dr;
      const targetCol = col + dc;
      if (!inBounds(targetRow, targetCol)) return;
      const occupant = board[targetRow][targetCol];
      if (!occupant || getPieceColor(occupant) !== color) {
        moves.push({row: targetRow, col: targetCol, capture: !!occupant});
      }
    });
  } else {
    directions[type].forEach(([dr, dc]) => {
      let targetRow = row + dr;
      let targetCol = col + dc;
      while (inBounds(targetRow, targetCol)) {
        const occupant = board[targetRow][targetCol];
        if (!occupant) {
          moves.push({row: targetRow, col: targetCol, capture: false});
        } else {
          if (getPieceColor(occupant) !== color) {
            moves.push({row: targetRow, col: targetCol, capture: true});
          }
          break;
        }
        if (type === 'q' || type === 'b' || type === 'r') {
          targetRow += dr;
          targetCol += dc;
        } else {
          break;
        }
      }
    });
  }

  return moves.filter(move => !wouldExposeKing(row, col, move.row, move.col));
}

function wouldExposeKing(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const captured = board[toRow][toCol];
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = '';

  const inCheck = isKingInCheck(getPieceColor(piece));

  board[fromRow][fromCol] = piece;
  board[toRow][toCol] = captured;
  return inCheck;
}

function isKingInCheck(color) {
  const king = color === 'white' ? 'K' : 'k';
  let kingPosition = null;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (board[row][col] === king) {
        kingPosition = {row, col};
        break;
      }
    }
    if (kingPosition) break;
  }
  if (!kingPosition) return true;

  const enemyColor = color === 'white' ? 'black' : 'white';

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece && getPieceColor(piece) === enemyColor) {
        const moves = computePseudoMoves(row, col);
        if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function computePseudoMoves(row, col) {
  const piece = board[row][col];
  const type = piece.toLowerCase();
  const color = getPieceColor(piece);
  const directions = {
    p: [ [1, -1], [1, 1] ],
    P: [ [-1, -1], [-1, 1] ],
    n: [ [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2] ],
    b: [ [1, 1], [1, -1], [-1, 1], [-1, -1] ],
    r: [ [1, 0], [-1, 0], [0, 1], [0, -1] ],
    q: [ [1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1] ],
    k: [ [1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1] ],
  };
  const moves = [];

  if (type === 'p') {
    directions[piece].forEach(([dr, dc]) => {
      const targetRow = row + dr;
      const targetCol = col + dc;
      if (!inBounds(targetRow, targetCol)) return;
      const occupant = board[targetRow][targetCol];
      if (occupant && getPieceColor(occupant) !== color) {
        moves.push({row: targetRow, col: targetCol});
      }
    });
    return moves;
  }

  if (type === 'n' || type === 'k') {
    directions[type].forEach(([dr, dc]) => {
      const targetRow = row + dr;
      const targetCol = col + dc;
      if (!inBounds(targetRow, targetCol)) return;
      const occupant = board[targetRow][targetCol];
      if (!occupant || getPieceColor(occupant) !== color) {
        moves.push({row: targetRow, col: targetCol});
      }
    });
    return moves;
  }

  directions[type].forEach(([dr, dc]) => {
    let targetRow = row + dr;
    let targetCol = col + dc;
    while (inBounds(targetRow, targetCol)) {
      const occupant = board[targetRow][targetCol];
      if (!occupant) {
        moves.push({row: targetRow, col: targetCol});
      } else {
        if (getPieceColor(occupant) !== color) {
          moves.push({row: targetRow, col: targetCol});
        }
        break;
      }
      targetRow += dr;
      targetCol += dc;
    }
  });
  return moves;
}

function resetGame() {
  createEmptyBoard();
  selected = null;
  legalMoves = [];
  turn = 'white';
  history = [];
  captures = { white: [], black: [] };
  renderBoard();
}

resetBtn.addEventListener('click', resetGame);
resetGame();
