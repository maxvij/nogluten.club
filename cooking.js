// ─── Cooking mode (lazy-loaded) ───────────────────────────────────────────────
// Depends on window.APP being set up by main.js before this script loads.

let cookSteps = [];
let cookIdx = 0;
let wakeLock = null;
let cookAc = null;
let cookTimerState = null; // { remaining, total, intervalId, running }

const DONE_MESSAGES = [
  'All done. Enjoy your healthy meal.',
  'That\'s it. Time to eat well.',
  'Well cooked. Fuel your body right.',
  'Done. Clean food, good energy.',
  'Ready to serve. Eat well today.',
];

function stepText(step) {
  if (step === null) return DONE_MESSAGES[Math.floor(Math.random() * DONE_MESSAGES.length)];
  return typeof step === 'object' ? step.text : step;
}

function stepDuration(step) {
  return typeof step === 'object' ? (step.duration_seconds || null) : null;
}

function renderCookStep() {
  const isDone = cookSteps[cookIdx] === null;
  const realTotal = cookSteps.length - 1;
  document.getElementById('cookStepLabel').textContent = isDone ? '' : `Step ${cookIdx + 1} of ${realTotal}`;
  document.getElementById('cookStepText').textContent = stepText(cookSteps[cookIdx]);
  document.getElementById('cookHint').hidden = false;
  const dots = document.getElementById('cookDots');
  dots.innerHTML = Array.from({ length: realTotal }, (_, i) =>
    `<div class="cook-dot${i === cookIdx ? ' active' : ''}"></div>`
  ).join('');
  document.getElementById('cookPrev').disabled = cookIdx === 0;
  document.getElementById('cookNext').textContent = isDone ? '✓' : '→';
  const cs = sessionStorage.getItem('cookState');
  if (cs) sessionStorage.setItem('cookState', JSON.stringify({ ...JSON.parse(cs), step: cookIdx }));

  const dur = isDone ? null : stepDuration(cookSteps[cookIdx]);
  renderCookTimer(dur);
}

function renderCookTimer(durationSeconds) {
  const timerEl = document.getElementById('cookTimer');
  const displayEl = document.getElementById('cookTimerDisplay');
  const btnEl = document.getElementById('cookTimerBtn');

  if (!durationSeconds) {
    timerEl.hidden = true;
    return;
  }

  timerEl.hidden = false;

  if (!cookTimerState) {
    cookTimerState = { remaining: durationSeconds, total: durationSeconds, intervalId: null, running: false };
  }

  displayEl.textContent = window.APP.formatTimerDisplay(cookTimerState.remaining);
  btnEl.textContent = cookTimerState.running ? 'Pause' : (cookTimerState.remaining < cookTimerState.total ? 'Resume' : 'Start timer');
}

function startCookTimer(durationSeconds) {
  if (!cookTimerState) cookTimerState = { remaining: durationSeconds, total: durationSeconds, intervalId: null, running: false };
  if (cookTimerState.running) return;
  cookTimerState.running = true;
  cookTimerState.intervalId = setInterval(() => {
    cookTimerState.remaining = Math.max(0, cookTimerState.remaining - 1);
    const displayEl = document.getElementById('cookTimerDisplay');
    const btnEl = document.getElementById('cookTimerBtn');
    if (displayEl) displayEl.textContent = window.APP.formatTimerDisplay(cookTimerState.remaining);
    if (cookTimerState.remaining === 0) {
      clearInterval(cookTimerState.intervalId);
      cookTimerState.running = false;
      cookTimerState.intervalId = null;
      if (btnEl) btnEl.textContent = 'Done';
    } else {
      if (btnEl) btnEl.textContent = 'Pause';
    }
  }, 1000);
}

function pauseCookTimer() {
  if (!cookTimerState || !cookTimerState.running) return;
  clearInterval(cookTimerState.intervalId);
  cookTimerState.intervalId = null;
  cookTimerState.running = false;
  const btnEl = document.getElementById('cookTimerBtn');
  if (btnEl) btnEl.textContent = 'Resume';
}

function resetCookTimer() {
  if (cookTimerState) {
    clearInterval(cookTimerState.intervalId);
    cookTimerState = null;
  }
}

function advanceCookStep() {
  if (cookSteps[cookIdx] === null) { closeCookingMode(); return; }
  cookIdx++;
  resetCookTimer();
  renderCookStep();
}

function closeCookingMode() {
  cookAc?.abort();
  cookAc = null;
  resetCookTimer();
  sessionStorage.removeItem('cookState');
  document.getElementById('cookModal').close();
}

function openCookingMode(steps, ingredients, recipeTitle, startAtStep = 0, recipeSlug = null) {
  cookSteps = [...steps, null];
  cookIdx = Math.min(startAtStep, cookSteps.length - 1);

  const list = document.getElementById('cookIngredientsList');
  list.innerHTML = (ingredients || []).map(ing => {
    const amt = [ing.amount, ing.unit].filter(Boolean).join(' ');
    return `<li class="cook-ing-row"><span class="cook-ing-amount">${amt}</span><span>${ing.item}</span></li>`;
  }).join('');

  document.getElementById('cookRecipeTitle').textContent = recipeTitle || '';

  const panel = document.getElementById('cookIngredientsPanel');
  const toggle = document.getElementById('cookIngredientsToggle');
  panel.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');

  resetCookTimer();
  renderCookStep();
  document.getElementById('cookModal').showModal();
  window.APP.lockScroll();

  if (navigator.wakeLock) {
    navigator.wakeLock.request('screen').then(wl => { wakeLock = wl; }).catch(() => {});
  }
  if (recipeTitle) {
    localStorage.setItem(`cooked:${recipeTitle}`, Date.now());
    const slug = recipeSlug || recipeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    history.replaceState(null, '', '#' + slug);
    sessionStorage.setItem('cookState', JSON.stringify({ slug, step: cookIdx }));
    const recipeObj = Object.values(window.APP.recipes).flat().find(r => r.title === recipeTitle);
    if (recipeObj) window.SB.recordCook(recipeObj.id).catch(() => {});
  }

  cookAc = new AbortController();
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); advanceCookStep(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (cookIdx > 0) { cookIdx--; resetCookTimer(); renderCookStep(); } }
  }, { signal: cookAc.signal });

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    panel.hidden = expanded;
    toggle.setAttribute('aria-expanded', String(!expanded));
  }, { signal: cookAc.signal });

  document.getElementById('cookTimerBtn').addEventListener('click', () => {
    if (!cookTimerState) return;
    const dur = stepDuration(cookSteps[cookIdx]);
    if (!dur) return;
    if (cookTimerState.running) { pauseCookTimer(); } else { startCookTimer(dur); }
  }, { signal: cookAc.signal });
}

// ─── Event listeners (set up once on load) ────────────────────────────────────
document.getElementById('cookClose').addEventListener('click', closeCookingMode);
document.getElementById('cookPrev').addEventListener('click', () => {
  if (cookIdx > 0) { cookIdx--; resetCookTimer(); renderCookStep(); }
});
document.getElementById('cookNext').addEventListener('click', advanceCookStep);

document.getElementById('cookModal').addEventListener('close', () => {
  window.APP.unlockScroll();
  if (wakeLock) { wakeLock.release(); wakeLock = null; }
});

// Swipe left/right to navigate steps
(function() {
  const modal = document.getElementById('cookModal');
  let swipeStartX = 0;
  modal.addEventListener('touchstart', e => { swipeStartX = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener('touchend', e => {
    const dx = swipeStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) < 50) return;
    if (dx > 0) { advanceCookStep(); }
    else if (dx < 0 && cookIdx > 0) { cookIdx--; resetCookTimer(); renderCookStep(); }
  }, { passive: true });
})();

// ─── Export ───────────────────────────────────────────────────────────────────
window.APP.openCookingMode = openCookingMode;
