const ROWS = 8, COLS = 6;
const foods = [
  { name: 'Kimchi box', color: '#e85f51', shape: [[0,0],[1,0],[0,1],[1,1]] },
  { name: 'Egg roll', color: '#f2c955', shape: [[0,0],[1,0],[2,0]] },
  { name: 'Leftover pizza', color: '#df8d50', shape: [[0,0],[1,0],[1,1],[2,1]] },
  { name: 'Mystery side dish', color: '#a878c5', shape: [[0,0],[0,1],[0,2],[1,2]] },
  { name: 'Tofu block', color: '#eae3c7', shape: [[0,0],[1,0],[2,0],[1,1]] },
  { name: 'Green onion', color: '#66ae79', shape: [[0,0],[0,1],[0,2],[0,3]] },
  { name: 'Sauce containers', color: '#4ca5c5', shape: [[0,0],[1,0],[1,1],[2,1]] }
];

const boardEl = document.querySelector('#board');
const previewEl = document.querySelector('#piece-preview');
const scoreEl = document.querySelector('#score');
const linesEl = document.querySelector('#lines');
const bestEl = document.querySelector('#best');
const foodNameEl = document.querySelector('#food-name');
const messageEl = document.querySelector('#message');
const modalEl = document.querySelector('#game-over');
let grid, current, score, lines, active;
let best = Number(localStorage.getItem('fridgeTetrisBest') || 0);

function tone(frequency, duration, type = 'sine', delay = 0) {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    const context = tone.context || (tone.context = new Audio());
    if (context.state === 'suspended') context.resume();
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.07, start + .01); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
  } catch {}
}
function placeSound() { tone(210, .08, 'triangle'); tone(150, .11, 'sine', .025); }
function clearSound(linesCleared) { [440, 660, 880].slice(0, linesCleared + 1).forEach((note, index) => tone(note, .16, 'sine', index * .07)); }

function copyShape(shape) { return shape.map(([x, y]) => [x, y]); }
function normalize(shape) { const minX = Math.min(...shape.map(([x]) => x)); const minY = Math.min(...shape.map(([, y]) => y)); return shape.map(([x, y]) => [x - minX, y - minY]); }
function rotateShape(shape) { return normalize(shape.map(([x, y]) => [-y, x])); }
function newFood() { const food = foods[Math.floor(Math.random() * foods.length)]; return { name: food.name, color: food.color, shape: copyShape(food.shape) }; }
function index(row, col) { return row * COLS + col; }
function message(text) { messageEl.textContent = text; messageEl.classList.add('show'); clearTimeout(message.timer); message.timer = setTimeout(() => messageEl.classList.remove('show'), 1200); }

function drawBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const cell = document.createElement('button'); cell.type = 'button'; cell.className = `cell${grid[row][col] ? ' filled' : ''}`;
    if (grid[row][col]) cell.style.background = grid[row][col];
    cell.addEventListener('mouseenter', () => preview(row, col));
    cell.addEventListener('mouseleave', clearPreview);
    cell.addEventListener('click', () => put(row, col));
    boardEl.append(cell);
  }
}
function drawPiece() {
  previewEl.innerHTML = '';
  const maxX = Math.max(...current.shape.map(([x]) => x)); const maxY = Math.max(...current.shape.map(([, y]) => y));
  current.shape.forEach(([x, y]) => { const part = document.createElement('i'); part.className = 'preview-cell'; part.style.left = `${(x + (2 - maxX) / 2) * 31}px`; part.style.top = `${(y + (2 - maxY) / 2) * 31}px`; part.style.background = current.color; previewEl.append(part); });
  foodNameEl.textContent = current.name;
}
function fits(row, col) { return current.shape.every(([x, y]) => row + y >= 0 && row + y < ROWS && col + x >= 0 && col + x < COLS && !grid[row + y][col + x]); }
function landingAt(col) { for (let row = ROWS - 1; row >= 0; row--) if (fits(row, col)) return row; return null; }
function nearestLanding(clickedCol) {
  const width = Math.max(...current.shape.map(([x]) => x)) + 1;
  const options = [];
  for (let col = 0; col <= COLS - width; col++) { const row = landingAt(col); if (row !== null) options.push({ row, col, distance: Math.abs(col - clickedCol) }); }
  options.sort((a, b) => a.distance - b.distance || b.row - a.row);
  return options[0] || null;
}
function clearPreview() { boardEl.querySelectorAll('.valid,.invalid').forEach(cell => { cell.classList.remove('valid', 'invalid'); cell.style.removeProperty('--ghost-color'); }); }
function preview(row, col) { if (!active) return; clearPreview(); const landing = nearestLanding(col); const targetRow = landing === null ? row : landing.row; const targetCol = landing === null ? col : landing.col; current.shape.forEach(([x, y]) => { const cell = boardEl.children[index(targetRow + y, targetCol + x)]; if (cell) { cell.style.setProperty('--ghost-color', current.color); cell.classList.add(landing === null ? 'invalid' : 'valid'); } }); }
function updateStats() { scoreEl.textContent = String(score).padStart(4, '0'); linesEl.textContent = String(lines).padStart(2, '0'); bestEl.textContent = String(best).padStart(4, '0'); }
function gameOver() {
  active = false;
  best = Math.max(best, score);
  localStorage.setItem('fridgeTetrisBest', String(best));
  updateStats();
  document.querySelector('#result-title').textContent = 'GAME OVER';
  document.querySelector('#result-copy').textContent = `정리 점수 ${score}점 · 선반 ${lines}줄. 냉장고가 가득 찼습니다. 다시 시도하시겠습니까?`;
  modalEl.hidden = false;
}
function next() { current = newFood(); drawPiece(); if (nearestLanding(0) === null) gameOver(); }
function put(row, col) {
  if (!active) return;
  const landing = nearestLanding(col);
  if (landing === null) return message('This shelf is full. Try another column.');
  current.shape.forEach(([x, y]) => { grid[landing.row + y][landing.col + x] = current.color; });
  placeSound();
  score += current.shape.length * 10; drawBoard();
  const fullRows = grid.map((line, rowIndex) => line.every(Boolean) ? rowIndex : -1).filter(rowIndex => rowIndex >= 0);
  if (!fullRows.length) { updateStats(); next(); return; }
  active = false;
  fullRows.forEach(rowIndex => { for (let colIndex = 0; colIndex < COLS; colIndex++) boardEl.children[index(rowIndex, colIndex)].classList.add('clearing'); });
  setTimeout(() => { grid = grid.filter((_, rowIndex) => !fullRows.includes(rowIndex)); while (grid.length < ROWS) grid.unshift(Array(COLS).fill(null)); lines += fullRows.length; score += fullRows.length * 100; active = true; drawBoard(); updateStats(); clearSound(fullRows.length); message(`${fullRows.length} shelf cleared!`); next(); }, 350);
}
function reset() { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); score = 0; lines = 0; active = true; modalEl.hidden = true; drawBoard(); updateStats(); next(); message('Pick a shelf for the first container.'); }
function rotate() { if (!active) return; current.shape = rotateShape(current.shape); drawPiece(); clearPreview(); }

document.querySelector('#rotate').addEventListener('click', rotate);
document.querySelector('#restart').addEventListener('click', reset);
document.querySelector('#play-again').addEventListener('click', reset);
window.addEventListener('keydown', event => { if (event.key.toLowerCase() === 'r') rotate(); });
reset();
