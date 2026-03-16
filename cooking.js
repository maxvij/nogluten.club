// ─── Cooking mode (lazy-loaded) ───────────────────────────────────────────────
// Depends on window.APP being set up by main.js before this script loads.

let cookSteps = [];
let cookIdx = 0;
let wakeLock = null;
let cookAc = null;
let cookTimers = new Map(); // name → { name, total, remaining, running, intervalId }
let cookStartTime = null;
let cookElapsed = 0;
let doneReached = false;
let currentRecipeId = null;
let doneRotateInterval = null;
let doneMessageIdx = 0;

const DONE_MESSAGES = [
  { heading: 'All done!',    body: 'Sit down and enjoy your meal.' },
  { heading: 'That\'s it!', body: 'Time to eat well.' },
  { heading: 'Good job!',   body: 'Fuel your body right.' },
  { heading: 'Well cooked.', body: 'Clean food, good energy.' },
  { heading: 'Nailed it.',  body: 'Ready to serve.' },
  { heading: 'Done!',       body: 'Go eat while it\'s warm.' },
];

function stepText(step) {
  if (step === null) return '';
  return typeof step === 'object' ? step.text : step;
}

function stepDuration(step) {
  return step && typeof step === 'object' ? (step.duration_seconds || null) : null;
}

function stepTimerName(step) {
  return step && typeof step === 'object' ? (step.timer_name || null) : null;
}

// ─── Multi-timer ──────────────────────────────────────────────────────────────

function buildTimers(steps) {
  cookTimers = new Map();
  steps.forEach((step, i) => {
    if (!step?.duration_seconds) return;
    const name = step.timer_name || `Step ${i + 1}`;
    if (!cookTimers.has(name)) {
      cookTimers.set(name, { name, total: step.duration_seconds, remaining: step.duration_seconds, running: false, intervalId: null });
    }
  });
}

function currentStepTimerName() {
  const step = cookSteps[cookIdx];
  if (!step?.duration_seconds) return null;
  return step.timer_name || `Step ${cookIdx + 1}`;
}

function renderTimersBar() {
  const bar = document.getElementById('cookTimersBar');
  if (!bar) return;
  if (cookTimers.size === 0) { bar.hidden = true; return; }
  bar.hidden = false;
  const activeName = currentStepTimerName();
  bar.innerHTML = [...cookTimers.values()].map(t => {
    const isActive = t.name === activeName;
    const isDone = t.remaining === 0;
    return `
      <div class="cook-timer-card${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}${t.running ? ' is-running' : ''}" data-timer="${encodeURIComponent(t.name)}">
        <span class="cook-timer-name">${t.name}</span>
        <span class="cook-timer-display">${window.APP.formatTimerDisplay(t.remaining)}</span>
        <div class="cook-timer-controls">
          <button class="cook-timer-play-btn" type="button" aria-label="${t.running ? 'Pause' : 'Start'} ${t.name} timer"${isDone ? ' disabled' : ''}>
            <svg width="18" height="18" fill="currentColor" aria-hidden="true"><use href="#icon-${t.running ? 'pause' : 'play'}"/></svg>
          </button>
          <button class="cook-timer-reset-btn" type="button" aria-label="Reset ${t.name} timer">
            <svg width="14" height="14" fill="currentColor" aria-hidden="true"><use href="#icon-reset"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
  bar.querySelectorAll('.cook-timer-card').forEach(card => {
    const name = decodeURIComponent(card.dataset.timer);
    card.querySelector('.cook-timer-play-btn')?.addEventListener('click', () => toggleTimer(name));
    card.querySelector('.cook-timer-reset-btn')?.addEventListener('click', () => resetTimer(name));
  });
}

function toggleTimer(name) {
  const t = cookTimers.get(name);
  if (!t || t.remaining === 0) return;
  if (t.running) {
    clearInterval(t.intervalId);
    t.intervalId = null;
    t.running = false;
  } else {
    t.running = true;
    t.intervalId = setInterval(() => {
      t.remaining = Math.max(0, t.remaining - 1);
      if (t.remaining === 0) {
        clearInterval(t.intervalId);
        t.intervalId = null;
        t.running = false;
      }
      renderTimersBar();
      updateCookHint();
    }, 1000);
  }
  renderTimersBar();
  updateCookHint();
}

function resetTimer(name) {
  const t = cookTimers.get(name);
  if (!t) return;
  clearInterval(t.intervalId);
  t.intervalId = null;
  t.remaining = t.total;
  t.running = false;
  renderTimersBar();
  updateCookHint();
}

function stopAllTimers() {
  cookTimers.forEach(t => { clearInterval(t.intervalId); t.intervalId = null; t.running = false; });
  cookTimers.clear();
  stopDoneRotation();
}

// ─── Done screen ──────────────────────────────────────────────────────────────

function stopDoneRotation() {
  if (doneRotateInterval) { clearInterval(doneRotateInterval); doneRotateInterval = null; }
}

function renderDoneMessage() {
  const { heading, body } = DONE_MESSAGES[doneMessageIdx];
  const headingEl = document.getElementById('cookDoneHeading');
  const bodyEl = document.getElementById('cookDoneBody');
  if (headingEl) headingEl.textContent = heading;
  if (bodyEl) bodyEl.textContent = body;
}

function startDoneRotation(elapsedSeconds) {
  doneMessageIdx = Math.floor(Math.random() * DONE_MESSAGES.length);
  renderDoneMessage();

  const timeEl = document.getElementById('cookDoneTime');
  if (timeEl && elapsedSeconds > 0) {
    const mins = Math.round(elapsedSeconds / 60);
    timeEl.textContent = mins > 0 ? `Time spent: ${mins} min` : 'Less than a minute';
    timeEl.hidden = false;
  }

  const doneBtn = document.getElementById('cookDoneBtn');
  const ratingSection = document.getElementById('cookDoneRatingSection');
  if (doneBtn) doneBtn.hidden = true;

  renderDoneRating(null);
  ratingSection.hidden = false;
  setTimeout(() => ratingSection.classList.add('visible'), 400);

  if (currentRecipeId) {
    window.SB.fetchRating(currentRecipeId).then(({ userStars }) => {
      if (userStars != null) {
        ratingSection.classList.add('already-rated');
        if (doneBtn) doneBtn.hidden = false;
      } else {
        renderDoneRating(userStars);
      }
    }).catch(() => {});
  }
}

function submitRating(stars) {
  const starsEl = document.getElementById('cookDoneStars');
  renderDoneRating(stars);
  starsEl?.classList.add('rating-loading');
  window.SB.rateRecipe(currentRecipeId, stars).then(({ userStars }) => {
    renderDoneRating(userStars);
    starsEl?.classList.remove('rating-loading');
    window.APP.refreshCardRating(currentRecipeId);
  }).catch(() => { starsEl?.classList.remove('rating-loading'); });
}

function renderDoneRating(userStars) {
  const starsEl = document.getElementById('cookDoneStars');
  const feedbackEl = document.getElementById('cookDoneFeedback');
  const feedbackBtn = document.getElementById('cookDoneFeedbackBtn');
  const feedbackInput = document.getElementById('cookDoneFeedbackInput');
  if (!starsEl) return;

  starsEl.innerHTML = Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    const filled = userStars != null && n <= userStars;
    return `<button class="cook-done-star-btn${filled ? ' filled' : ''}" data-stars="${n}" aria-label="${n} star${n !== 1 ? 's' : ''}">${window.APP.icon(filled ? 'star-fill' : 'star', 22)}</button>`;
  }).join('');

  starsEl.querySelectorAll('.cook-done-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!currentRecipeId) return;
      submitRating(parseInt(btn.dataset.stars));
    });
  });

  const label = document.querySelector('.cook-done-rating-label');
  if (label) {
    label.textContent = userStars != null
      ? `You've rated this recipe ${userStars} star${userStars !== 1 ? 's' : ''}. Thank you!`
      : 'Did you like this recipe?';
  }

  const showFeedback = userStars != null && userStars <= 2;
  if (feedbackEl) feedbackEl.hidden = !showFeedback;
  document.getElementById('cookDoneRatingSection')?.classList.remove('rating-submitted');
  if (showFeedback && feedbackBtn && feedbackInput) {
    feedbackBtn.onclick = () => {
      const text = feedbackInput.value.trim();
      if (!text || !currentRecipeId) return;
      window.SB.rateRecipe(currentRecipeId, userStars, text).then(() => {
        document.getElementById('cookDoneRatingSection').classList.add('rating-submitted');
      }).catch(() => {});
    };
    feedbackInput.onkeydown = e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); feedbackBtn.click(); }
    };
  }
}

// ─── Step rendering ───────────────────────────────────────────────────────────

function updateCookHint() {
  const hint = document.getElementById('cookHint');
  if (!hint) return;
  const name = currentStepTimerName();
  if (name) {
    const t = cookTimers.get(name);
    if (t) {
      if (t.remaining === 0) hint.textContent = 'Press Enter to continue';
      else if (t.running)    hint.textContent = 'Press Enter to pause';
      else                   hint.textContent = 'Press Enter to start timer';
      return;
    }
  }
  hint.textContent = 'Press Enter to continue';
}

function renderCookStep() {
  const isDone = cookSteps[cookIdx] === null;
  const realTotal = cookSteps.length - 1;
  document.getElementById('cookStepLabel').textContent = isDone ? '' : `Step ${cookIdx + 1} of ${realTotal}`;
  document.getElementById('cookStepStrip').hidden = isDone;

  const stepTextEl = document.getElementById('cookStepText');
  const doneContentEl = document.getElementById('cookDoneContent');

  if (isDone) {
    stopDoneRotation();
    stepTextEl.hidden = true;
    doneContentEl.hidden = false;
    document.getElementById('cookDoneTime').hidden = true;
    cookElapsed = cookStartTime ? Math.round((Date.now() - cookStartTime) / 1000) : 0;
    doneReached = true;
    startDoneRotation(cookElapsed);
  } else {
    stopDoneRotation();
    stepTextEl.hidden = false;
    stepTextEl.textContent = stepText(cookSteps[cookIdx]);
    doneContentEl.hidden = true;
  }

  renderTimersBar();
  updateCookHint();
  document.getElementById('cookHint').hidden = false;

  const dots = document.getElementById('cookDots');
  dots.innerHTML = Array.from({ length: realTotal }, (_, i) =>
    `<div class="cook-dot${i === cookIdx ? ' active' : ''}"></div>`
  ).join('');
  document.getElementById('cookNav').hidden = isDone;
  document.getElementById('cookPrev').disabled = cookIdx === 0;
  document.getElementById('cookNext').textContent = isDone ? '✓' : '→';

  const cs = sessionStorage.getItem('cookState');
  if (cs) sessionStorage.setItem('cookState', JSON.stringify({ ...JSON.parse(cs), step: cookIdx }));
}

function advanceCookStep() {
  if (cookSteps[cookIdx] === null) { closeCookingMode(); return; }
  cookIdx++;
  renderCookStep();
}

// ─── Open / close ─────────────────────────────────────────────────────────────

function closeCookingMode() {
  if (doneReached && currentRecipeId && cookElapsed > 0) {
    window.SB.recordCook(currentRecipeId, cookElapsed).catch(() => {});
  }
  cookAc?.abort();
  cookAc = null;
  doneReached = false;
  cookElapsed = 0;
  stopAllTimers();
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

  cookStartTime = Date.now();
  currentRecipeId = null;

  buildTimers(steps);
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
    if (recipeObj) {
      currentRecipeId = recipeObj.id;
      window.SB.recordCook(recipeObj.id).catch(() => {});
    }
  }

  cookAc = new AbortController();

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const name = currentStepTimerName();
      if (name) {
        const t = cookTimers.get(name);
        if (t && t.remaining > 0) { toggleTimer(name); return; }
      }
      advanceCookStep();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      advanceCookStep();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (cookIdx > 0) { cookIdx--; renderCookStep(); }
    } else if (doneReached && /^[1-5]$/.test(e.key) && currentRecipeId && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      submitRating(parseInt(e.key));
    }
  }, { signal: cookAc.signal });

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    panel.hidden = expanded;
    toggle.setAttribute('aria-expanded', String(!expanded));
  }, { signal: cookAc.signal });

  document.getElementById('cookDoneBtn').addEventListener('click', closeCookingMode, { signal: cookAc.signal });
}

// ─── Event listeners (set up once on load) ────────────────────────────────────
document.getElementById('cookClose').addEventListener('click', closeCookingMode);
document.getElementById('cookPrev').addEventListener('click', () => {
  if (cookIdx > 0) { cookIdx--; renderCookStep(); }
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
    else if (dx < 0 && cookIdx > 0) { cookIdx--; renderCookStep(); }
  }, { passive: true });
})();

// ─── Export ───────────────────────────────────────────────────────────────────
window.APP.openCookingMode = openCookingMode;
