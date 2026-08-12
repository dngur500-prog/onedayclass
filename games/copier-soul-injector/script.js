const levels = [
  { name: 'A4 복사용지', mark: 'A4', taps: 12, time: 4.8, color: '#e8d9ae', message: '영혼은 얇고 평평한 것부터 시작합니다.' },
  { name: '80g 백상지', mark: '80g', taps: 16, time: 4.6, color: '#fff9e7', message: '종이에 미묘한 자의식이 생겼습니다.' },
  { name: '재생지', mark: 'RECYCLE', taps: 21, time: 4.5, color: '#b8c69b', message: '전생의 회의록이 속삭입니다.' },
  { name: '크림색 고급지', mark: 'CREAM', taps: 27, time: 4.4, color: '#f4deb3', message: '복사기가 문학을 읽기 시작했습니다.' },
  { name: '진주 펄지', mark: 'PEARL', taps: 34, time: 4.2, color: '#eadfff', message: '빛을 보면 종이가 윙크합니다.' },
  { name: '홀로그램지', mark: 'HOLO', taps: 42, time: 4.0, color: '#a5ffe7', message: '이제 문서에 무지개 세금이 붙습니다.' },
  { name: '황금 전단지', mark: 'GOLD', taps: 51, time: 3.9, color: '#ffd34e', message: '모든 복사본이 쿠폰처럼 보입니다.' },
  { name: '운석 섬유지', mark: 'METEOR', taps: 61, time: 3.8, color: '#c8b8ff', message: '사무실 중력이 0.3% 증가했습니다.' },
  { name: '용 비늘지', mark: 'DRAGON', taps: 73, time: 3.7, color: '#ff826e', message: '토너가 불꽃을 뿜을 준비를 합니다.' },
  { name: '다이아몬드 종이', mark: 'DIAMOND', taps: 84, time: 3.6, color: '#b9f7ff', message: '결정화 확률은 단 2%입니다. 행운도 연타하세요.', final: true },
];

let stage = 0, taps = 0, active = false, timer, deadline;
const $ = id => document.getElementById(id);
const ui = { level: $('level'), time: $('time'), best: $('best'), paperName: $('paper-name'), paper: $('paper'), paperMark: $('paper-mark'), display: $('display-text'), goal: $('goal-label'), count: $('tap-count'), fill: $('meter-fill'), button: $('start-button'), message: $('message'), card: $('status-card'), machine: $('machine') };
let best = Number(localStorage.getItem('copierSoulBest') || 1);
ui.best.textContent = String(best).padStart(2, '0');

function setMessage(text, kind = '') { ui.message.textContent = text; ui.message.className = kind; }
function setStage() {
  const level = levels[stage];
  taps = 0;
  ui.level.textContent = String(stage + 1).padStart(2, '0'); ui.paperName.textContent = level.name;
  ui.paperMark.textContent = level.mark; ui.paper.style.setProperty('--paper', level.color); ui.paper.style.background = level.color;
  ui.goal.textContent = `${level.taps}회 영혼 타건`; ui.count.textContent = `0 / ${level.taps}`; ui.fill.style.width = '0%';
  ui.display.textContent = 'READY / SOUL';
}
function beep(freq = 170, length = .035) {
  try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.frequency.value = freq; gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + length); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + length); } catch {} 
}
function start() {
  if (active) return;
  setStage(); active = true; ui.button.textContent = '영혼 주입 중...'; ui.button.disabled = true; ui.machine.classList.add('running', 'shaking');
  setMessage(levels[stage].message); deadline = performance.now() + levels[stage].time * 1000;
  timer = requestAnimationFrame(tick);
}
function tick(now) {
  const left = Math.max(0, deadline - now); ui.time.textContent = (left / 1000).toFixed(1);
  if (!left) return fail('복사기가 영혼을 기다리다 퇴근했습니다.');
  timer = requestAnimationFrame(tick);
}
function tap() {
  if (!active) return;
  const level = levels[stage]; taps++; const pct = Math.min(100, taps / level.taps * 100);
  ui.fill.style.width = `${pct}%`; ui.count.textContent = `${taps} / ${level.taps}`; ui.display.textContent = `SOUL ${String(Math.floor(pct)).padStart(3, '0')}%`; beep(160 + pct * 2);
  if (taps >= level.taps) clearStage();
}
function clearStage() {
  cancelAnimationFrame(timer); const level = levels[stage];
  if (level.final && Math.random() >= .02) return fail('다이아몬드 결정화 실패! 종이가 너무 완벽해서 현실을 거부합니다.');
  if (level.final) return win();
  stage++; best = Math.max(best, stage + 1); localStorage.setItem('copierSoulBest', best); ui.best.textContent = String(best).padStart(2, '0');
  ui.machine.classList.remove('shaking'); ui.display.textContent = 'PAPER UPGRADE!'; beep(720, .12);
  setMessage(`${level.name} 완성. 다음 종이를 장착합니다…`, 'success');
  setTimeout(() => { setStage(); deadline = performance.now() + levels[stage].time * 1000; ui.machine.classList.add('shaking'); timer = requestAnimationFrame(tick); }, 650);
}
function finishCommon() { active = false; cancelAnimationFrame(timer); ui.machine.classList.remove('running', 'shaking'); ui.button.disabled = false; ui.button.textContent = '1단계부터 다시 주입'; }
function fail(reason) { finishCommon(); ui.display.textContent = 'SOUL ERROR'; ui.time.textContent = '--.-'; ui.fill.style.width = '0%'; setMessage(`${reason} 1단계로 초기화됩니다.`, 'danger'); beep(70, .22); stage = 0; setStage(); }
function win() { finishCommon(); ui.display.textContent = 'DIVINE COPY'; ui.time.textContent = '∞'; ui.fill.style.width = '100%'; setMessage('기적입니다. 복사기가 당신을 사내 신으로 등록했습니다. 다이아몬드 종이 출력 성공!', 'success'); beep(980, .35); }
ui.button.addEventListener('click', start);
window.addEventListener('keydown', event => { if (event.code !== 'Space') return; event.preventDefault(); if (event.repeat) return; if (!active) start(); else tap(); });
setStage();
