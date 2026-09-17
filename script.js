// 메모리 매치 게임
const EMOJIS = ['🦊','🐼','🐯','🐸','🦁','🐶','🐰','🐧','🦄','🐙','🦋','🐢'];

const $board = document.getElementById('board');
const $time = document.getElementById('time');
const $moves = document.getElementById('moves');
const $found = document.getElementById('found');
const $level = document.getElementById('level');
const $restart = document.getElementById('restart');
const $modal = document.getElementById('winModal');
const $winSummary = document.getElementById('winSummary');
const $again = document.getElementById('again');
const $best = document.getElementById('best');

const LEVELS = {
  easy:   { cols: 4, pairs: 6,  label: '쉬움' },
  normal: { cols: 4, pairs: 8,  label: '보통' },
  hard:   { cols: 4, pairs: 10, label: '어려움' },
};

let cards = [];
let flipped = [];
let matched = 0;
let moves = 0;
let startedAt = 0;
let timerId = null;
let lock = false;
let pairs = 8;

function shuffle(arr) {
  return arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
}

function fmt(ms) {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function render() {
  const cfg = LEVELS[$level.value];
  pairs = cfg.pairs;
  $board.className = `board cols-${cfg.cols}`;
  const set = EMOJIS.slice(0, pairs);
  const deck = shuffle([...set, ...set]);
  $board.innerHTML = deck
    .map((emoji, i) => `
      <div class="card" data-i="${i}" data-emoji="${emoji}">
        <div class="card__side card__back"></div>
        <div class="card__side card__face">${emoji}</div>
      </div>
    `)
    .join('');
  cards = [...$board.querySelectorAll('.card')];
  document.getElementById('found').textContent = '0';
  document.querySelector('.stat:nth-child(3) strong').innerHTML = `<span id="found">0</span> / ${pairs}`;
  matched = 0; moves = 0; flipped = []; lock = false;
  $moves.textContent = '0';
  startTimer();
}

function startTimer() {
  if (timerId) clearInterval(timerId);
  startedAt = Date.now();
  $time.textContent = '00:00';
  timerId = setInterval(() => {
    $time.textContent = fmt(Date.now() - startedAt);
  }, 250);
}

function bestKey() { return `match-best-${$level.value}`; }
function loadBest() {
  const v = localStorage.getItem(bestKey());
  $best.textContent = v ? `${fmt(Number(v))} (${LEVELS[$level.value].label})` : '없음';
}
function saveBest(ms) {
  const cur = Number(localStorage.getItem(bestKey()) || Infinity);
  if (ms < cur) {
    localStorage.setItem(bestKey(), String(ms));
    loadBest();
    return true;
  }
  return false;
}

$board.addEventListener('click', (e) => {
  if (lock) return;
  const card = e.target.closest('.card');
  if (!card || card.classList.contains('is-matched') || card.classList.contains('is-flip')) return;
  card.classList.add('is-flip');
  flipped.push(card);
  if (flipped.length === 2) {
    moves++;
    $moves.textContent = moves;
    const [a, b] = flipped;
    if (a.dataset.emoji === b.dataset.emoji) {
      setTimeout(() => {
        a.classList.add('is-matched');
        b.classList.add('is-matched');
        a.classList.remove('is-flip');
        b.classList.remove('is-flip');
        flipped = [];
        matched++;
        document.getElementById('found').textContent = matched;
        if (matched === pairs) finish();
      }, 350);
    } else {
      lock = true;
      setTimeout(() => {
        a.classList.remove('is-flip');
        b.classList.remove('is-flip');
        flipped = [];
        lock = false;
      }, 700);
    }
  }
});

function finish() {
  clearInterval(timerId);
  const ms = Date.now() - startedAt;
  const isNew = saveBest(ms);
  $winSummary.innerHTML = `
    <strong>${fmt(ms)}</strong> · ${moves}회 이동
    ${isNew ? '<br/>🎉 새로운 최고 기록!' : ''}
  `;
  setTimeout(() => { $modal.hidden = false; }, 400);
}

$restart.addEventListener('click', render);
$again.addEventListener('click', () => { $modal.hidden = true; render(); });
$modal.querySelector('.modal__bg').addEventListener('click', () => { $modal.hidden = true; });
$level.addEventListener('change', () => { loadBest(); render(); });

loadBest();
render();
