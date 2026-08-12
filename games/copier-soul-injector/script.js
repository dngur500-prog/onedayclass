const levels = [
  ['돌 종이', '거친 돌', 14, 5.2, '#8d9298'], ['석회석 종이', '석회 결정', 23, 4.8, '#d8d0bd'],
  ['흑연 종이', '흑연 광택', 36, 4.5, '#4d535d'], ['구리 종이', '산화 구리', 52, 4.2, '#bf7156'],
  ['은 종이', '은빛 광택', 70, 3.9, '#d9e0e5'], ['백금 종이', '백금 결', 92, 3.7, '#c9d0d4'],
  ['금 종이', '24K 금박', 118, 3.55, '#dcae39'], ['사파이어 종이', '푸른 결정', 148, 3.4, '#416fc3'],
  ['루비 종이', '붉은 결정', 182, 3.25, '#bd3e52'], ['다이아몬드 종이', '다이아 결정', 220, 3.1, '#b9f7ff'],
].map(([name, texture, taps, time, color], index) => ({ name, texture, taps, time, color, final: index === 9 }));

const $ = id => document.getElementById(id);
const ui = { level: $('level'), time: $('time'), best: $('best'), paperName: $('paper-name'), paper: $('paper'), paperMark: $('paper-mark'), feeder: $('feeder-paper'), display: $('display-text'), goal: $('goal-label'), count: $('tap-count'), fill: $('meter-fill'), button: $('start-button'), message: $('message'), machine: $('machine'), overlay: $('phase-overlay'), phaseTitle: $('phase-title'), phaseCopy: $('phase-copy'), electricity: $('electricity'), modal: $('nickname-modal'), nicknameForm: $('nickname-form'), nicknameInput: $('nickname-input'), ranking: $('ranking-list') };
let stage = 0, taps = 0, active = false, animation, deadline, runPeak = 1;
let nickname = localStorage.getItem('copierAwakeningNickname') || '';
let best = Number(localStorage.getItem('copierPowerBest') || 1);
ui.best.textContent = String(best).padStart(2, '0');

function message(text, kind = '') { ui.message.textContent = text; ui.message.className = kind; }
function configureStage() {
  const level = levels[stage]; taps = 0;
  ui.level.textContent = String(stage + 1).padStart(2, '0'); ui.paperName.textContent = level.name;
  ui.paperMark.textContent = level.texture; ui.machine.style.setProperty('--mineral', level.color); ui.machine.dataset.stage = stage + 1;
  ui.goal.textContent = `${level.taps}회 전기 타건`; ui.count.textContent = `0 / ${level.taps}`; ui.fill.style.width = '0%'; ui.time.textContent = '--.-';
}
function tone(freq = 180, length = .03) {
  try { const context = new (window.AudioContext || window.webkitAudioContext)(), oscillator = context.createOscillator(), gain = context.createGain(); oscillator.frequency.value = freq; gain.gain.setValueAtTime(.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + length); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + length); } catch {}
}
function showPhase(title, copy) { ui.phaseTitle.textContent = title; ui.phaseCopy.textContent = copy; ui.overlay.classList.add('visible'); }
function hidePhase() { ui.overlay.classList.remove('visible'); }
function getRanking() { try { return JSON.parse(localStorage.getItem('copierAwakeningRanks') || '[]'); } catch { return []; } }
function renderRanking() {
  const scores = getRanking();
  ui.ranking.innerHTML = scores.length ? scores.map((score, index) => `<li><span class="rank-number">${index + 1}</span><strong>${escapeHtml(score.name)}</strong><span>${score.stage}단계</span></li>`).join('') : '<li class="empty-rank">아직 신의 경지에 오른 사람이 없습니다.</li>';
}
function escapeHtml(value) { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; }
function saveRecord(finalStage) {
  if (!nickname) return;
  const records = getRanking(); const old = records.find(record => record.name === nickname);
  if (old) old.stage = Math.max(old.stage, finalStage); else records.push({ name: nickname, stage: finalStage });
  records.sort((a, b) => b.stage - a.stage || a.name.localeCompare(b.name));
  localStorage.setItem('copierAwakeningRanks', JSON.stringify(records.slice(0, 10))); renderRanking();
}
function countdown() {
  configureStage(); ui.button.disabled = true; ui.button.textContent = '전압 충전 중...';
  showPhase(`STAGE ${String(stage + 1).padStart(2, '0')} · READY`, `${levels[stage].name} 장착 완료`);
  setTimeout(() => { showPhase('3', '손가락에 전기를 모으세요'); tone(330); }, 700);
  setTimeout(() => { showPhase('2', '복사기가 떨고 있습니다'); tone(390); }, 1400);
  setTimeout(() => { showPhase('1', '과전압 주의'); tone(470); }, 2100);
  setTimeout(() => { hidePhase(); active = true; ui.machine.classList.add('running', 'shaking'); ui.display.textContent = 'POWER 000%'; deadline = performance.now() + levels[stage].time * 1000; animation = requestAnimationFrame(tick); message(`${levels[stage].name}에 전기를 공급하세요.`); tone(600, .08); }, 2800);
}
function start() { if (!active && !ui.button.disabled && nickname) { runPeak = 1; countdown(); } }
function tick(now) { const left = Math.max(0, deadline - now); ui.time.textContent = (left / 1000).toFixed(1); if (!left) return fail('복사기가 전력 부족으로 다시 잠들었습니다.'); animation = requestAnimationFrame(tick); }
function tap() {
  if (!active) return; const level = levels[stage]; taps++;
  const percent = Math.min(100, taps / level.taps * 100); ui.fill.style.width = `${percent}%`; ui.count.textContent = `${taps} / ${level.taps}`; ui.display.textContent = `POWER ${String(Math.floor(percent)).padStart(3, '0')}%`;
  ui.electricity.classList.remove('spark'); void ui.electricity.offsetWidth; ui.electricity.classList.add('spark'); tone(170 + percent * 2);
  if (taps >= level.taps) clear();
}
function clear() {
  cancelAnimationFrame(animation); active = false; ui.machine.classList.remove('shaking'); ui.machine.classList.add('printing'); ui.display.textContent = 'PRINTING...';
  const current = levels[stage]; message(`${String(stage + 1).padStart(2, '0')}단계 출력 성공! ${current.name}을(를) 획득했습니다.`, 'success'); showPhase('출력 성공!', `${current.name}이(가) 하단 슬롯에서 출력됩니다`); tone(850, .16);
  if (current.final) return setTimeout(() => Math.random() < .02 ? win() : fail('다이아몬드 결정화에 실패했습니다. 현실이 너무 단단합니다.'), 1500);
  stage++; runPeak = Math.max(runPeak, stage + 1); best = Math.max(best, runPeak); localStorage.setItem('copierPowerBest', best); ui.best.textContent = String(best).padStart(2, '0');
  setTimeout(() => { ui.machine.classList.remove('printing'); countdown(); }, 2600);
}
function stop() { active = false; cancelAnimationFrame(animation); ui.machine.classList.remove('running', 'shaking', 'printing'); ui.button.disabled = false; ui.button.textContent = '1단계부터 다시 도전'; }
function fail(reason) { stop(); saveRecord(runPeak); stage = 0; configureStage(); ui.display.textContent = 'POWER ERROR'; message(`${reason} 최고 ${runPeak}단계 기록 후 1단계로 초기화됩니다.`, 'danger'); showPhase('BLACKOUT', '복사기가 삐— 하고 꺼졌습니다'); tone(65, .2); }
function win() { stop(); saveRecord(10); ui.display.textContent = 'DIVINE COPY'; ui.time.textContent = '∞'; ui.fill.style.width = '100%'; message('기적입니다. 다이아몬드 종이 출력 성공! 당신은 복사의 신으로 기록되었습니다.', 'success'); showPhase('LEGENDARY!', '다이아몬드 종이 출력 완료'); tone(980, .3); }
ui.nicknameForm.addEventListener('submit', event => { event.preventDefault(); const proposed = ui.nicknameInput.value.trim().slice(0, 15); if (!proposed) return; nickname = proposed; localStorage.setItem('copierAwakeningNickname', nickname); ui.modal.classList.add('hidden'); message(`${nickname} 님, 복사의 신화를 시작하세요.`); });
ui.button.addEventListener('click', start);
window.addEventListener('keydown', event => { if (event.code !== 'Space') return; event.preventDefault(); if (!event.repeat) active ? tap() : start(); });
if (nickname) ui.modal.classList.add('hidden'); else setTimeout(() => ui.nicknameInput.focus(), 100);
configureStage(); renderRanking();
