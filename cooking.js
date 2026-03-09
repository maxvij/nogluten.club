// ─── Cooking mode (lazy-loaded) ───────────────────────────────────────────────
// Depends on window.APP being set up by main.js before this script loads.

let cookSteps = [];
let cookIdx = 0;
let wakeLock = null;
let cookAc = null;
let cookTimerState = null; // { remaining, total, intervalId, running }
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

  const dur = isDone ? null : stepDuration(cookSteps[cookIdx]);
  renderCookTimer(dur);
}

function updateTimerBtn() {
  const btnEl = document.getElementById('cookTimerBtn');
  if (!btnEl || !cookTimerState) return;
  const running = cookTimerState.running;
  const done = cookTimerState.remaining === 0;
  btnEl.innerHTML = `<svg width="20" height="20" fill="currentColor" aria-hidden="true"><use href="#icon-${running ? 'pause' : 'play'}"/></svg>`;
  btnEl.setAttribute('aria-label', running ? 'Pause timer' : (done ? 'Timer done' : (cookTimerState.remaining < cookTimerState.total ? 'Resume timer' : 'Start timer')));
  btnEl.disabled = done;
}

function updateCookHint() {
  const hint = document.getElementById('cookHint');
  if (!hint) return;
  const dur = cookSteps[cookIdx] ? stepDuration(cookSteps[cookIdx]) : null;
  if (dur && cookTimerState) {
    if (cookTimerState.remaining === 0) hint.textContent = 'Press Enter to continue';
    else if (cookTimerState.running)    hint.textContent = 'Press Enter to pause';
    else                                hint.textContent = 'Press Enter to start timer';
  } else if (dur && !cookTimerState) {
    hint.textContent = 'Press Enter to start timer';
  } else {
    hint.textContent = 'Press Enter to continue';
  }
}

function renderCookTimer(durationSeconds) {
  const timerEl = document.getElementById('cookTimer');
  const displayEl = document.getElementById('cookTimerDisplay');

  if (!durationSeconds) {
    timerEl.hidden = true;
    return;
  }

  timerEl.hidden = false;

  if (!cookTimerState) {
    cookTimerState = { remaining: durationSeconds, total: durationSeconds, intervalId: null, running: false };
  }

  displayEl.textContent = window.APP.formatTimerDisplay(cookTimerState.remaining);
  updateTimerBtn();
}

function startCookTimer(durationSeconds) {
  if (!cookTimerState) cookTimerState = { remaining: durationSeconds, total: durationSeconds, intervalId: null, running: false };
  if (cookTimerState.running) return;
  cookTimerState.running = true;
  updateTimerBtn();
  updateCookHint();
  cookTimerState.intervalId = setInterval(() => {
    cookTimerState.remaining = Math.max(0, cookTimerState.remaining - 1);
    const displayEl = document.getElementById('cookTimerDisplay');
    if (displayEl) displayEl.textContent = window.APP.formatTimerDisplay(cookTimerState.remaining);
    if (cookTimerState.remaining === 0) {
      clearInterval(cookTimerState.intervalId);
      cookTimerState.running = false;
      cookTimerState.intervalId = null;
      updateTimerBtn();
      updateCookHint();
    }
  }, 1000);
}

function pauseCookTimer() {
  if (!cookTimerState || !cookTimerState.running) return;
  clearInterval(cookTimerState.intervalId);
  cookTimerState.intervalId = null;
  cookTimerState.running = false;
  updateTimerBtn();
  updateCookHint();
}

function resetTimerToStart() {
  if (!cookTimerState) return;
  clearInterval(cookTimerState.intervalId);
  const total = cookTimerState.total;
  cookTimerState = { remaining: total, total, intervalId: null, running: false };
  const displayEl = document.getElementById('cookTimerDisplay');
  if (displayEl) displayEl.textContent = window.APP.formatTimerDisplay(total);
  updateTimerBtn();
  updateCookHint();
}

function resetCookTimer() {
  if (cookTimerState) {
    clearInterval(cookTimerState.intervalId);
    cookTimerState = null;
  }
  stopDoneRotation();
}

function advanceCookStep() {
  if (cookSteps[cookIdx] === null) { closeCookingMode(); return; }
  cookIdx++;
  resetCookTimer();
  renderCookStep();
}

function closeCookingMode() {
  if (doneReached && currentRecipeId && cookElapsed > 0) {
    window.SB.recordCook(currentRecipeId, cookElapsed).catch(() => {});
  }
  cookAc?.abort();
  cookAc = null;
  doneReached = false;
  cookElapsed = 0;
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

  cookStartTime = Date.now();
  currentRecipeId = null;
  if (recipeTitle) {
    const recipeObj = Object.values(window.APP.recipes).flat().find(r => r.title === recipeTitle);
    if (recipeObj) currentRecipeId = recipeObj.id;
  }
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
    if (recipeObj) {
      currentRecipeId = recipeObj.id;
      window.SB.recordCook(recipeObj.id).catch(() => {});
    }
  }

  cookAc = new AbortController();
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const dur = stepDuration(cookSteps[cookIdx]);
      if (dur && cookTimerState && cookTimerState.remaining > 0) {
        if (cookTimerState.running) pauseCookTimer(); else startCookTimer(dur);
      } else if (dur && !cookTimerState) {
        startCookTimer(dur);
      } else {
        advanceCookStep();
      }
    } else if (e.key === 'ArrowRight') { e.preventDefault(); advanceCookStep(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (cookIdx > 0) { cookIdx--; resetCookTimer(); renderCookStep(); } }
    else if (doneReached && /^[1-5]$/.test(e.key) && currentRecipeId && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      submitRating(parseInt(e.key));
    }
  }, { signal: cookAc.signal });

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    panel.hidden = expanded;
    toggle.setAttribute('aria-expanded', String(!expanded));
  }, { signal: cookAc.signal });

  document.getElementById('cookTimerBtn').addEventListener('click', () => {
    const dur = stepDuration(cookSteps[cookIdx]);
    if (!dur) return;
    if (cookTimerState && cookTimerState.remaining > 0) {
      if (cookTimerState.running) pauseCookTimer(); else startCookTimer(dur);
    } else if (!cookTimerState) {
      startCookTimer(dur);
    }
  }, { signal: cookAc.signal });

  document.getElementById('cookTimerResetBtn').addEventListener('click', () => {
    resetTimerToStart();
  }, { signal: cookAc.signal });

  document.getElementById('cookDoneBtn').addEventListener('click', closeCookingMode, { signal: cookAc.signal });

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
