
// Last cooked helpers
function formatLastCooked(ts) {
  const days = Math.floor((Date.now() - parseInt(ts)) / 86400000);
  if (days === 0) return 'cooked today';
  if (days === 1) return 'cooked yesterday';
  return `cooked ${days}d ago`;
}

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function formatTimerDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// iOS-safe scroll lock
let _scrollY = 0;
function lockScroll() {
  _scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${_scrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  if (document.body.style.position !== 'fixed') return;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.overflow = '';
  window.scrollTo(0, _scrollY);
}

// Emoji lookup by recipe title keywords
const EMOJI_MAP = [
  [/\b(egg|eggs|omelette|omelet|frittata|scrambled|poached)\b/i, '🥚'],
  [/\b(avocado|avo)\b/i, '🥑'],
  [/\b(salmon|tuna|sardine|mackerel|cod|halibut|sea bass|trout)\b/i, '🐟'],
  [/\b(chicken|poultry|hen)\b/i, '🍗'],
  [/\b(steak|beef|brisket|mince|meatball|burger)\b/i, '🥩'],
  [/\b(shrimp|prawn|lobster|crab)\b/i, '🦐'],
  [/\b(turkey)\b/i, '🦃'],
  [/\b(pork|bacon|ham|sausage|chorizo)\b/i, '🥓'],
  [/\b(lamb|mutton)\b/i, '🐑'],
  [/\b(rice|risotto|pilaf|fried rice)\b/i, '🍚'],
  [/\b(pasta|noodle|spaghetti|penne|fettuccine|linguine|tagliatelle|pad thai)\b/i, '🍝'],
  [/\b(soup|stew|broth|chowder|bisque)\b/i, '🍲'],
  [/\b(salad|slaw|greens)\b/i, '🥗'],
  [/\b(wrap|burrito|taco)\b/i, '🌯'],
  [/\b(bowl)\b/i, '🥣'],
  [/\b(smoothie|shake|blend)\b/i, '🥤'],
  [/\b(pancake|waffle|crepe)\b/i, '🥞'],
  [/\b(toast|bread|bruschetta)\b/i, '🍞'],
  [/\b(banana|plantain)\b/i, '🍌'],
  [/\b(berry|berries|blueberry|strawberry|raspberry)\b/i, '🫐'],
  [/\b(mango)\b/i, '🥭'],
  [/\b(apple)\b/i, '🍎'],
  [/\b(lemon|lime|citrus)\b/i, '🍋'],
  [/\b(orange)\b/i, '🍊'],
  [/\b(pineapple)\b/i, '🍍'],
  [/\b(watermelon|melon)\b/i, '🍉'],
  [/\b(tomato)\b/i, '🍅'],
  [/\b(sweet potato|yam)\b/i, '🍠'],
  [/\b(potato)\b/i, '🥔'],
  [/\b(broccoli)\b/i, '🥦'],
  [/\b(mushroom)\b/i, '🍄'],
  [/\b(carrot)\b/i, '🥕'],
  [/\b(corn)\b/i, '🌽'],
  [/\b(pepper|capsicum)\b/i, '🌶'],
  [/\b(edamame|soy|tofu|tempeh)\b/i, '🫘'],
  [/\b(lentil|chickpea|hummus|legume|bean)\b/i, '🫘'],
  [/\b(nut|almond|cashew|walnut|pecan|pistachio)\b/i, '🥜'],
  [/\b(yogurt|yoghurt)\b/i, '🫙'],
  [/\b(cheese)\b/i, '🧀'],
  [/\b(oat|granola|porridge|muesli)\b/i, '🥣'],
  [/\b(chocolate|cocoa|cacao)\b/i, '🍫'],
  [/\b(cake|muffin|cupcake|brownie)\b/i, '🧁'],
  [/\b(cookie|biscuit)\b/i, '🍪'],
  [/\b(curry|masala|tikka|dhal|dal)\b/i, '🍛'],
  [/\b(sushi|maki|roll)\b/i, '🍱'],
  [/\b(falafel)\b/i, '🧆'],
  [/\b(hummus)\b/i, '🫙'],
  [/\b(zucchini|courgette)\b/i, '🥒'],
  [/\b(asparagus)\b/i, '🌿'],
  [/\b(spinach|kale|chard|arugula|rocket)\b/i, '🥬'],
  [/\b(kebab|skewer)\b/i, '🍢'],
  [/\b(pizza)\b/i, '🍕'],
  [/\b(coffee|espresso|latte)\b/i, '☕'],
  [/\b(tea|matcha)\b/i, '🍵'],
];

// Returns up to 3 distinct emojis for a title (for pattern tiling)
function titleEmojis(title) {
  const found = [];
  for (const [pattern, emoji] of EMOJI_MAP) {
    if (pattern.test(title) && !found.includes(emoji)) {
      found.push(emoji);
      if (found.length === 3) break;
    }
  }
  return found.length ? found : ['🍽'];
}

// Build a staggered emoji tile grid as HTML for the card image
function cardEmojiPattern(title) {
  const emojis = titleEmojis(title);
  const cols = 20;
  const rows = 10;
  let html = '<div class="card-emoji-grid" aria-hidden="true">';
  for (let r = 0; r < rows; r++) {
    html += `<div class="card-emoji-row${r % 2 === 1 ? ' offset' : ''}">`;
    for (let c = 0; c < cols; c++) {
      html += `<span>${emojis[(r * cols + c) % emojis.length]}</span>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// FNV-1a hash → deterministic gradient per recipe title
function hashTitle(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function cardGradientVars(title) {
  const h = hashTitle(title);
  return {
    hue:    h % 360,
    angle:  110 + ((h >>> 8)  % 80),  // 110–189 deg
    spread:  20 + ((h >>> 16) % 35),  // 20–54 deg hue offset
  };
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

let recipes = {};
let recipeRatings = {}; // recipeId → { avg, count }

let currentSort = 'default';
let sortDir = 'desc';

const SORT_OPTIONS = {
  default: { label: 'Smart', field: null,           display: null },
  kcal:    { label: 'Calories ↓',  field: 'energy_kcal', display: n => `${Math.round(n.energy_kcal)} kcal` },
  protein: { label: 'Protein ↓',   field: 'protein_g',   display: n => `${Math.round(n.protein_g)}g protein` },
  carbs:   { label: 'Carbs ↓',     field: 'carbs_g',     display: n => `${Math.round(n.carbs_g)}g carbs` },
  fat:     { label: 'Fat ↓',       field: 'fat_g',       display: n => `${Math.round(n.fat_g)}g fat` },
  fibre:   { label: 'Fibre ↓',     field: 'fibre_g',     display: n => `${Math.round(n.fibre_g)}g fibre` },
};

const favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
const shoppingList = new Set();

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify([...favorites]));
}

function toggleFavorite(title, btn) {
  favorites.has(title) ? favorites.delete(title) : favorites.add(title);
  saveFavorites();
  const active = favorites.has(title);
  btn.classList.toggle('active', active);
  btn.textContent = active ? '♥' : '♡';
  // Sync all card fav buttons for this recipe
  document.querySelectorAll('.card-fav').forEach(cardBtn => {
    const card = cardBtn.closest('.recipe-card');
    if (card && card.dataset.title === title) {
      cardBtn.classList.toggle('active', active);
      cardBtn.textContent = active ? '♥' : '♡';
    }
  });
  if (document.getElementById('favFilter').checked) applyFilters();
}

function toggleShopList(title, btn) {
  shoppingList.has(title) ? shoppingList.delete(title) : shoppingList.add(title);
  const added = shoppingList.has(title);
  btn.classList.toggle('active', added);
  btn.innerHTML = `<i class="ph ${added ? 'ph-check' : 'ph-plus'}"></i>${added ? 'Added' : 'Add'}`;
  const fab = document.getElementById('shopFab');
  fab.hidden = shoppingList.size === 0;
  if (!fab.hidden) fab.textContent = `Shopping list (${shoppingList.size})`;
}

function openShoppingListModal() {
  const body = document.getElementById('shopModalBody');
  // Collect all ingredients flat, keyed by item name for dedup
  const seen = new Map();
  for (const title of shoppingList) {
    for (const items of Object.values(recipes)) {
      const r = items.find(r => r.title === title);
      if (r) {
        r.ingredients.forEach(ing => {
          const key = ing.item.toLowerCase();
          const amt = [ing.amount, ing.unit].filter(Boolean).join(' ');
          if (seen.has(key)) seen.get(key).amounts.push(amt);
          else seen.set(key, { item: ing.item, amounts: [amt] });
        });
        break;
      }
    }
  }
  const sorted = [...seen.values()].sort((a, b) => a.item.localeCompare(b.item));
  body.innerHTML = sorted.map((ing, idx) => `
    <div class="shop-ing">
      <input type="checkbox" id="sli${idx}" style="width:16px;height:16px;min-width:16px;accent-color:var(--accent);cursor:pointer">
      <label for="sli${idx}" style="display:flex;gap:0.75rem;flex:1;cursor:pointer">
        <span class="shop-ing-amount">${ing.amounts.join(' + ')}</span>
        <span>${ing.item}</span>
      </label>
    </div>
  `).join('');
  const copyBtn = document.getElementById('shopCopyBtn');
  copyBtn.onclick = () => {
    const text = sorted.map(ing => `${ing.amounts.join(' + ')} ${ing.item}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    });
  };

  const m = document.getElementById('shopModal');
  m.showModal(); m.focus();
  lockScroll();
}

function closeShopModal() {
  document.getElementById('shopModal').close(); // triggers 'close' event
}
document.getElementById('shopModal').addEventListener('close', () => unlockScroll());

document.getElementById('shopFab').addEventListener('click', openShoppingListModal);
document.getElementById('shopModalClose').addEventListener('click', closeShopModal);
document.getElementById('shopModal').addEventListener('click', e => { if (e.target === document.getElementById('shopModal')) closeShopModal(); });
document.getElementById('shopClearBtn').addEventListener('click', () => {
  shoppingList.clear();
  document.querySelectorAll('.modal-shop-btn, .card-shop-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.textContent = btn.classList.contains('modal-shop-btn') ? 'Add to list' : '+ Add';
  });
  const fab = document.getElementById('shopFab');
  fab.hidden = true;
  closeShopModal();
});

function getSortedItems(cat) {
  const indexed = recipes[cat].map((r, i) => ({ r, i }));
  const sortOpt = SORT_OPTIONS[currentSort];
  if (sortOpt?.field) {
    return indexed.sort((a, b) => {
      const diff = b.r.nutrition[sortOpt.field] - a.r.nutrition[sortOpt.field];
      return sortDir === 'desc' ? diff : -diff;
    });
  }
  if (currentSort === 'best-match') {
    return indexed.sort((a, b) => {
      const pantryA = pantryMap[a.r.title] || [];
      const pantryB = pantryMap[b.r.title] || [];
      const matchedA = pantryA.filter(id => selectedIngredients.has(id)).length;
      const matchedB = pantryB.filter(id => selectedIngredients.has(id)).length;
      const missingA = pantryA.length - matchedA;
      const missingB = pantryB.length - matchedB;
      // Primary: fewest missing (closest to cookable)
      if (missingA !== missingB) return missingA - missingB;
      // Tiebreaker: most matched (most overlap)
      return matchedB - matchedA;
    });
  }
  return indexed;
}

// Render cards + update counts in one pass
function renderCards() {
  Object.entries(recipes).forEach(([cat, items]) => {
    const grid = document.getElementById(`${cat}-grid`);
    const section = document.querySelector(`[data-category="${cat}"]`);
    grid.innerHTML = '';
    if (section) {
      const count = section.querySelector('.section-count');
      if (count) count.textContent = `${items.length} recipe${items.length !== 1 ? 's' : ''}`;
    }
    getSortedItems(cat).forEach(({ r, i }) => {
      const card = document.createElement('article');
      card.className = 'recipe-card';
      const isFav = favorites.has(r.title);
      const inList = shoppingList.has(r.title);
      const sortOpt = SORT_OPTIONS[currentSort];
      const nutritionText = sortOpt?.display ? sortOpt.display(r.nutrition) : '';
      const { hue, angle, spread } = cardGradientVars(r.title);
      card.style.setProperty('--card-hue', hue);
      card.style.setProperty('--card-angle', angle + 'deg');
      card.style.setProperty('--card-spread', spread);
      const lastCooked = localStorage.getItem(`cooked:${r.title}`);
      const lastCookedLabel = lastCooked ? formatLastCooked(lastCooked) : 'be the first to try!';
      card.innerHTML = `
        <div class="card-image">
          ${cardEmojiPattern(r.title)}
          <span class="card-time-chip"><i class="ph ph-clock"></i>${formatTime(r.time_seconds)}</span>
        </div>
        <button class="card-fav ${isFav ? 'active' : ''}" aria-label="Favourite">${isFav ? '♥' : '♡'}</button>
        <div class="card-meta">
          ${nutritionText ? `<span class="card-time">${nutritionText}</span>` : ''}
          <span class="card-last-cooked">${lastCookedLabel}</span>
        </div>
        <div class="card-title">${r.title}</div>
        ${cardStarsHTML(recipeRatings[r.id])}
        <div class="card-desc" data-desc="${r.desc.replace(/"/g, '&quot;')}">${r.desc}</div>
        <span class="card-match"></span>
        <div class="card-actions">
          <button class="card-cook-btn">Start cooking</button>
          <button class="card-shop-btn ${inList ? 'active' : ''}"><i class="ph ${inList ? 'ph-check' : 'ph-plus'}"></i>${inList ? 'Added' : 'Add'}</button>
        </div>
      `;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.querySelector('.card-fav').addEventListener('click', e => { e.stopPropagation(); toggleFavorite(r.title, e.currentTarget); });
      card.querySelector('.card-cook-btn').addEventListener('click', e => { e.stopPropagation(); openCookingMode(r.steps, r.ingredients, r.title, 0, r.slug); });
      card.querySelector('.card-shop-btn').addEventListener('click', e => { e.stopPropagation(); toggleShopList(r.title, e.currentTarget); });
      card.dataset.idx = i;
      card.dataset.title = r.title;
      card.addEventListener('click', () => openModal(cat, i));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(cat, i); } });
      grid.appendChild(card);
    });
  });
}

// ─── Star ratings ─────────────────────────────────────────────────────────────

function renderStars(container, { avg, count, userStars }, onRate) {
  const displayAvg = avg !== null ? (Math.round(avg * 10) / 10).toFixed(1) : null;

  let starsHTML = '';
  for (let i = 1; i <= 5; i++) {
    const filled = userStars !== null ? i <= userStars : false;
    starsHTML += `<button class="star-btn${filled ? ' filled' : ''}" data-star="${i}" aria-label="${i} star${i !== 1 ? 's' : ''}" type="button"><i class="ph${filled ? '-fill' : ''} ph-star"></i></button>`;
  }

  const metaText = displayAvg !== null
    ? `${displayAvg} · ${count} rating${count !== 1 ? 's' : ''}`
    : 'No ratings yet';

  container.innerHTML = `
    <div class="star-rating">
      <div class="star-row" role="group" aria-label="Rate this recipe">${starsHTML}</div>
      <span class="star-meta${displayAvg === null ? ' star-meta--empty' : ''}">${metaText}</span>
    </div>
  `;

  const btns = [...container.querySelectorAll('.star-btn')];

  btns.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const n = parseInt(btn.dataset.star);
      btns.forEach((b, i) => b.classList.toggle('preview', i < n));
    });
  });

  container.querySelector('.star-row').addEventListener('mouseleave', () => {
    btns.forEach(b => b.classList.remove('preview'));
  });

  btns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const stars = parseInt(btn.dataset.star);
      btns.forEach(b => { b.disabled = true; });
      try {
        const result = await onRate(stars);
        renderStars(container, result, onRate);
      } catch {
        btns.forEach(b => { b.disabled = false; });
      }
    });
  });
}

function cardStarsHTML(rating) {
  const hasRatings = rating && rating.count > 0;
  const rounded = hasRatings ? Math.round(rating.avg) : 0;
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="ph${i <= rounded ? '-fill' : ''} ph-star card-star"></i>`;
  }
  const meta = hasRatings
    ? `<span class="card-star-count">${(Math.round(rating.avg * 10) / 10).toFixed(1)} <span class="card-star-total">(${rating.count})</span></span>`
    : '';
  const label = hasRatings ? `${(Math.round(rating.avg * 10) / 10).toFixed(1)} out of 5, ${rating.count} ratings` : 'Not yet rated';
  return `<div class="card-stars" aria-label="${label}">${stars}${meta}</div>`;
}

// Modal
const modal = document.getElementById('recipeModal');
let previousFocus = null;

function fmt(val, decimals = 1) {
  const n = Math.round(val * 10 ** decimals) / 10 ** decimals;
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(decimals);
}

function renderNutritionPanel(n, scale) {
  const s = v => fmt(v * scale);
  return `
    <div class="nutrition-panel">
      <div class="nutrition-row energy">
        <span class="nutrition-label">Energy</span>
        <span class="nutrition-value">${s(n.energy_kcal)} kcal<span class="nutrition-kj">${s(n.energy_kj)} kJ</span></span>
      </div>
      <div class="nutrition-row">
        <span class="nutrition-label">Protein</span>
        <span class="nutrition-value">${s(n.protein_g)}g</span>
      </div>
      <div class="nutrition-row">
        <span class="nutrition-label">Carbohydrates</span>
        <span class="nutrition-value">${s(n.carbs_g)}g</span>
      </div>
      <div class="nutrition-row sub">
        <span class="nutrition-label">of which sugars</span>
        <span class="nutrition-value">${s(n.of_which_sugars_g)}g</span>
      </div>
      <div class="nutrition-row">
        <span class="nutrition-label">Fat</span>
        <span class="nutrition-value">${s(n.fat_g)}g</span>
      </div>
      <div class="nutrition-row sub">
        <span class="nutrition-label">of which saturates</span>
        <span class="nutrition-value">${s(n.of_which_saturated_g)}g</span>
      </div>
      <div class="nutrition-row">
        <span class="nutrition-label">Fibre</span>
        <span class="nutrition-value">${s(n.fibre_g)}g</span>
      </div>
      <div class="nutrition-row">
        <span class="nutrition-label">Salt</span>
        <span class="nutrition-value">${s(n.salt_g)}g</span>
      </div>
    </div>
  `;
}

function saveCheckState(title) {
  const ings = [...document.querySelectorAll('#modalContent .ingredient-list input[type="checkbox"]')].map(cb => cb.checked);
  const steps = [...document.querySelectorAll('#modalContent .steps-list input[type="checkbox"]')].map(cb => cb.checked);
  sessionStorage.setItem(`checkState:${title}`, JSON.stringify({ ings, steps }));
}

function restoreCheckState(title) {
  const saved = JSON.parse(sessionStorage.getItem(`checkState:${title}`) || 'null');
  if (!saved) return;
  document.querySelectorAll('#modalContent .ingredient-list input[type="checkbox"]').forEach((cb, i) => { cb.checked = saved.ings[i] ?? false; });
  document.querySelectorAll('#modalContent .steps-list input[type="checkbox"]').forEach((cb, i) => { cb.checked = saved.steps[i] ?? false; });
}

function renderModalBody(r, servings) {
  const scale = servings / r.servings;
  const ingHTML = r.ingredients.map((ing, i) => {
    const amt = [ing.amount, ing.unit].filter(Boolean).join(' ');
    const id = `ing-${i}`;
    return `<li><label class="ing-row"><input type="checkbox" id="${id}"><span class="ing-amount">${amt}</span><span class="ing-item">${ing.item}</span></label></li>`;
  }).join('');
  const stepsHTML = r.steps.map((s, i) => {
    const id = `step-${i}`;
    const text = typeof s === 'object' ? s.text : s;
    const dur = typeof s === 'object' && s.duration_seconds ? `<span class="step-duration">${formatTime(s.duration_seconds)}</span>` : '';
    return `<li><label class="ing-row"><input type="checkbox" id="${id}"><span class="step-num">${i + 1}</span><span>${text}${dur}</span></label></li>`;
  }).join('');
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `
    <div class="modal-section-title">Method</div>
    <ol class="steps-list">${stepsHTML}</ol>
    ${r.tips ? `<div class="modal-section-title">Benefits</div><div class="modal-tips">${r.tips}</div>` : ''}
    <div class="modal-section-title">Ingredients</div>
    <ul class="ingredient-list">${ingHTML}</ul>
    <div class="nutrition-block">
      <div class="modal-section-title nutrition-header">
        <span>Nutrition</span>
        <div class="serving-selector" id="servingSelector">
          <span class="serving-label">Servings</span>
          <button class="serving-btn" id="servingDown" aria-label="Decrease servings">−</button>
          <span class="serving-count" id="servingCount">${servings}</span>
          <button class="serving-btn" id="servingUp" aria-label="Increase servings">+</button>
        </div>
      </div>
      ${renderNutritionPanel(r.nutrition, scale)}
    </div>
  `;
  restoreCheckState(r.title);
}

function openModal(cat, idx) {
  const r = recipes[cat][idx];
  modal._ac?.abort();
  modal._ac = new AbortController();
  const catLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  document.getElementById('modalTitle').textContent = r.title;
  document.getElementById('modalStats').innerHTML = `${catLabels[cat]} recipe · ${formatTime(r.time_seconds)}`;
  document.getElementById('modalTitleCompact').textContent = r.title;
  const modalBar = document.getElementById('modalBar');
  modalBar.classList.remove('modal-bar--scrolled');

  const { hue, angle, spread } = cardGradientVars(r.title);
  const modalArtwork = document.getElementById('modalImageBg');
  modalArtwork.style.setProperty('--card-hue', hue);
  modalArtwork.style.setProperty('--card-angle', angle + 'deg');
  modalArtwork.style.setProperty('--card-spread', spread);
  modalArtwork.innerHTML = cardEmojiPattern(r.title);

  const modalFav = document.getElementById('modalFav');
  const modalShopBtn = document.getElementById('modalShopBtn');

  const updateModalFav = () => {
    const active = favorites.has(r.title);
    modalFav.textContent = active ? '♥' : '♡';
    modalFav.classList.toggle('active', active);
  };
  const updateModalShop = () => {
    const inList = shoppingList.has(r.title);
    modalShopBtn.innerHTML = inList ? '<i class="ph ph-check"></i>Added to list' : 'Add to list';
    modalShopBtn.classList.toggle('active', inList);
  };

  updateModalFav();
  updateModalShop();

  modalFav.onclick = () => { toggleFavorite(r.title, modalFav); updateModalFav(); };
  modalShopBtn.onclick = () => { toggleShopList(r.title, modalShopBtn); updateModalShop(); };
  document.getElementById('modalCookBtn').onclick = () => { closeModal(); openCookingMode(r.steps, r.ingredients, r.title, 0, r.slug); };
  document.getElementById('modalShare').onclick = () => shareRecipe(r);
  const adminEditBtn = document.getElementById('modalAdminEdit');
  adminEditBtn.hidden = !_isAdmin;
  adminEditBtn.onclick = () => { closeModal(); openAdminModal(r); };

  let servings = 1;
  renderModalBody(r, servings);

  // Compact title: fade in once title block scrolls fully out of view
  const titleObserver = new IntersectionObserver(
    ([entry]) => modalBar.classList.toggle('modal-bar--scrolled', !entry.isIntersecting),
    { root: document.getElementById('modalBody'), threshold: 0 }
  );
  titleObserver.observe(document.getElementById('modalTitle'));
  modal._ac.signal.addEventListener('abort', () => titleObserver.disconnect());

  document.getElementById('modalBody').addEventListener('click', function handler(e) {
    if (e.target.id === 'servingDown' && servings > 1) { servings--; renderModalBody(r, servings); }
    if (e.target.id === 'servingUp') { servings++; renderModalBody(r, servings); }
  }, { signal: modal._ac.signal });

  document.getElementById('modalContent').addEventListener('change', e => {
    if (e.target.type === 'checkbox') saveCheckState(r.title);
  }, { signal: modal._ac.signal });


  // Rating stars — use cached aggregate, only fetch user's own stars
  const ratingContainer = document.getElementById('modalRating');
  const onRate = async stars => {
    const result = await window.SB.rateRecipe(r.id, stars);
    recipeRatings[r.id] = { avg: result.avg, count: result.count };
    document.querySelectorAll(`.recipe-card[data-title="${CSS.escape(r.title)}"] .card-stars`).forEach(el => {
      el.outerHTML = cardStarsHTML(recipeRatings[r.id]);
    });
    return result;
  };
  const cached = recipeRatings[r.id];
  if (cached) {
    // Render immediately with cached aggregate, then patch in userStars async
    renderStars(ratingContainer, { ...cached, userStars: null }, onRate);
    window.SB.fetchRating(r.id).then(fresh => {
      if (fresh.userStars !== null) renderStars(ratingContainer, fresh, onRate);
    }).catch(() => {});
  } else {
    ratingContainer.innerHTML = `<div class="star-rating"><div class="star-row star-row--loading">${Array.from({length: 5}, () => '<button class="star-btn" disabled aria-hidden="true"><i class="ph ph-star"></i></button>').join('')}</div><span class="star-meta">&nbsp;</span></div>`;
    window.SB.fetchRating(r.id).then(fresh => {
      renderStars(ratingContainer, fresh, onRate);
    }).catch(() => { ratingContainer.innerHTML = ''; });
  }

  document.getElementById('modalBody').scrollTop = 0;
  previousFocus = document.activeElement;
  modal.showModal();
  modal.focus();
  lockScroll();
  history.replaceState(null, '', '#' + (r.slug || r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')));
}

function closeModal() {
  modal._ac?.abort();
  document.getElementById('modalBar')?.classList.remove('modal-bar--scrolled');
  history.replaceState(null, '', window.location.pathname);
  modal.close(); // triggers 'close' event which handles scroll + focus
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
modal.addEventListener('close', () => { unlockScroll(); previousFocus?.focus(); });

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === '/' && !modal.open && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  if (e.key === 'Escape' && modal.open) closeModal();

  // Arrow key navigation between cards
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') && !modal.open) {
    const cards = [...document.querySelectorAll('.recipe-card:not([hidden])')];
    if (!cards.length) return;
    const current = document.activeElement;
    const idx = cards.indexOf(current);
    if (idx === -1) {
      // No card focused yet — focus first on any arrow press
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); cards[0].focus(); }
      return;
    }
    e.preventDefault();
    const next = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? cards[idx + 1] : cards[idx - 1];
    if (next) next.focus();
  }
});



// ─── Theme system ─────────────────────────────────────────────────────────────
function syncThemeOptButtons() {
  const saved = localStorage.getItem('theme');
  const active = saved || 'system';
  document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === active);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  syncThemeOptButtons();
}

function setTheme(pref) {
  if (pref === 'system') {
    localStorage.removeItem('theme');
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } else {
    localStorage.setItem('theme', pref);
    applyTheme(pref);
  }
  syncThemeOptButtons();
}

applyTheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

document.querySelectorAll('.theme-opt').forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});

// Pantry data
// Pantry staples assumed to always be on hand — excluded from the fridge filter
const PANTRY_STAPLES = new Set([
  'salt', 'black pepper', 'sea salt', 'coarse sea salt', 'salt & pepper',
  'olive oil', 'sesame oil', 'water', 'vanilla extract', 'ice',
  'garlic cloves', 'garlic powder', 'lemon juice', 'lime juice',
  'rice vinegar', 'balsamic vinegar', 'dijon mustard',
  'chili flakes', 'chili powder', 'smoked paprika', 'turmeric',
  'garam masala', 'dried oregano', 'italian herbs', 'ground coriander',
  'ground cumin', 'sriracha', 'fish sauce', 'cornstarch',
  'fresh thyme', 'fresh basil', 'fresh parsley', 'fresh coriander',
  'fresh dill', 'fresh mint leaves', 'fresh chives', 'fresh ginger',
  'spring onions', 'lemon', 'lime', 'honey', 'maple syrup',
  'capers', 'sesame seeds', 'coconut flakes', 'water or oat milk',
]);

const CATEGORY_KEYWORDS = {
  protein: ['chicken', 'turkey', 'beef', 'lamb', 'pork', 'salmon', 'tuna', 'prawn', 'cod', 'mackerel', 'sardine', 'trout', 'egg', 'tofu', 'protein', 'sirloin', 'steak', 'loin', 'thigh', 'breast', 'leg', 'chop', 'mince'],
  produce: ['spinach', 'broccoli', 'avocado', 'zucchini', 'sweet potato', 'green bean', 'bok choy', 'cucumber', 'berr', 'mango', 'banana', 'edamame', 'kale', 'asparagus', 'pepper', 'mushroom', 'onion', 'carrot', 'cauliflower', 'pumpkin', 'rocket', 'arugula', 'lettuce', 'apple', 'watermelon', 'tomato', 'celery', 'cabbage', 'beetroot', 'pineapple', 'greens'],
};

// Collapse ingredient variants into a single canonical term
const INGREDIENT_ALIASES = {
  'chicken breast': 'chicken',
  'chicken breasts': 'chicken',
  'chicken thighs': 'chicken',
  'chicken thigh': 'chicken',
  'chicken legs': 'chicken',
  'chicken leg': 'chicken',
  'bone-in chicken thighs': 'chicken',
  'beef chuck': 'beef',
  'beef sirloin': 'beef',
  'lean ground beef': 'beef',
  'sirloin steak': 'beef',
  'sliced roast beef': 'beef',
  'lean ground turkey': 'turkey',
  'ground lamb': 'lamb',
  'pork loin': 'pork',
  'pork tenderloin': 'pork',
  'raw prawns': 'prawns',
  'firm tofu': 'tofu',
  'silken tofu': 'tofu',
  'pea protein isolate': 'pea protein',
  'tuna in spring water': 'tuna',
  'fresh tuna': 'tuna',
  'baby spinach': 'spinach',
  'broccoli florets': 'broccoli',
  'mixed mushrooms': 'mushrooms',
  'red bell pepper': 'bell pepper',
  'bell peppers': 'bell pepper',
  'cherry tomatoes': 'tomatoes',
  'diced tomatoes': 'tomatoes',
  'jasmine rice': 'rice',
  'brown rice': 'rice',
  'cooked rice': 'rice',
  'rice noodles': 'rice noodles',
  'rice vermicelli noodles': 'rice noodles',
  'lactose-free yoghurt': 'lactose-free yoghurt',
  'oat milk': 'oat milk',
  'mixed berries': 'berries',
  'frozen blueberries': 'berries',
  'edamame pods': 'edamame',
  'shelled edamame': 'edamame',
  'mixed nuts': 'nuts',
  'nut butter': 'plant-based butter',
  'peanut butter': 'plant-based butter',
  'almond butter': 'plant-based butter',
  'plant-based butter': 'plant-based butter',
  'white miso paste': 'miso paste',
  'green curry paste': 'curry paste',
  'sweet potato': 'sweet potato',
  'sweet potatoes': 'sweet potato',
  'carrots': 'carrot',
  'gf rolled oats': 'rolled oats',
  'gf granola': 'granola',
  'rice cakes': 'rice cakes',
  'dark chocolate chips': 'dark chocolate',
  'beef bone broth': 'beef broth',
  'chicken bone broth': 'chicken broth',
  'vegetable broth': 'vegetable broth',
};

function normalizeIngItem(raw) {
  const base = raw
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,.*$/, '')
    .replace(/^(gf|gluten[- ]free)\s+/i, '')
    .replace(/^(cooked|frozen|raw|smoked|canned|grilled)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return INGREDIENT_ALIASES[base] ?? base;
}

function categorizePantryItem(id) {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => id.includes(kw))) return cat;
  }
  return 'pantry';
}

function buildPantryGroupsFromRecipes(recipes) {
  const seen = new Map();
  for (const items of Object.values(recipes)) {
    for (const r of items) {
      for (const ing of r.ingredients) {
        const norm = normalizeIngItem(ing.item);
        if (!PANTRY_STAPLES.has(norm) && norm.length > 1 && !seen.has(norm)) {
          seen.set(norm, norm.charAt(0).toUpperCase() + norm.slice(1));
        }
      }
    }
  }
  // Prefer singular: if both "egg" and "eggs" exist, drop the plural
  const toDelete = new Set();
  for (const key of seen.keys()) {
    if (key.endsWith('s') && seen.has(key.slice(0, -1))) toDelete.add(key);
  }
  toDelete.forEach(k => seen.delete(k));

  const groups = { protein: [], produce: [], pantry: [] };
  [...seen.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([id, label]) => groups[categorizePantryItem(id)].push({ id, label }));
  return groups;
}

const INGREDIENT_EMOJIS = {
  // Protein
  'chicken': '🍗', 'turkey': '🦃', 'beef': '🥩', 'lamb': '🫀', 'pork': '🥓',
  'salmon': '🐟', 'tuna': '🐟', 'prawns': '🦐', 'cod': '🐠', 'mackerel': '🐟',
  'sardines': '🐟', 'trout': '🐟', 'egg': '🥚', 'tofu': '🫙', 'pea protein': '💪',
  // Produce
  'spinach': '🥬', 'broccoli': '🥦', 'avocado': '🥑', 'zucchini': '🥒',
  'sweet potato': '🍠', 'green beans': '🫘', 'bok choy': '🥬', 'cucumber': '🥒',
  'berries': '🫐', 'mango': '🥭', 'banana': '🍌', 'edamame': '🫘',
  'kale': '🥬', 'asparagus': '🌿', 'bell pepper': '🫑', 'mushrooms': '🍄',
  'onion': '🧅', 'carrot': '🥕', 'cauliflower': '🥦', 'pumpkin': '🎃',
  'rocket': '🌿', 'lettuce': '🥬', 'apple': '🍎', 'watermelon': '🍉',
  'tomatoes': '🍅', 'celery': '🌿', 'red cabbage': '🥬', 'pineapple': '🍍',
  'mixed salad greens': '🥗', 'beetroot': '🫀',
  // Pantry
  'rice': '🍚', 'quinoa': '🌾', 'rice noodles': '🍜', 'coconut milk': '🥥',
  'oat milk': '🥛', 'lactose-free yoghurt': '🫙', 'red lentils': '🫘',
  'chickpeas': '🫘', 'black beans': '🫘', 'kidney beans': '🫘',
  'soy sauce': '🍶', 'plant-based butter': '🥜', 'rolled oats': '🌾',
  'granola': '🌾', 'rice cakes': '🍘', 'dark chocolate': '🍫',
  'chia seeds': '🌱', 'miso paste': '🫙', 'curry paste': '🫙',
  'nuts': '🥜', 'almonds': '🥜', 'walnuts': '🥜', 'mixed nuts': '🥜',
  'medjool dates': '🍬', 'coconut flakes': '🥥', 'harissa paste': '🌶️',
  'black beans': '🫘', 'beef broth': '🍲', 'chicken broth': '🍲',
  'vegetable broth': '🍲',
};

let pantryGroups = {};

let pantryMap = {};

const selectedIngredients = new Set();
let pantryView = 'cat';

function makePantryItem(id, label) {
  const el = document.createElement('label');
  el.className = 'pantry-option';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.value = id;
  cb.checked = selectedIngredients.has(id);
  cb.addEventListener('change', e => {
    if (e.target.checked) selectedIngredients.add(id);
    else selectedIngredients.delete(id);
    document.getElementById('pantryClear').hidden = selectedIngredients.size === 0;
    if (selectedIngredients.size > 0) activateBestMatch();
    else deactivateBestMatch();
  });
  const emoji = INGREDIENT_EMOJIS[id] || '';
  const span = document.createElement('span');
  span.textContent = (emoji ? emoji + ' ' : '') + label;
  el.appendChild(cb);
  el.appendChild(span);
  return el;
}

function renderPantryItems() {
  const q = (document.getElementById('pantrySearch')?.value || '').toLowerCase().trim();
  const container = document.getElementById('pantry-items');
  container.innerHTML = '';

  function matches(item) {
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || (item.keywords || '').toLowerCase().includes(q);
  }

  if (pantryView === 'az') {
    const all = Object.values(pantryGroups).flat()
      .filter(matches)
      .sort((a, b) => a.label.localeCompare(b.label));
    all.forEach(({ id, label }) => container.appendChild(makePantryItem(id, label)));
  } else {
    Object.entries(pantryGroups).forEach(([group, items]) => {
      const filtered = items.filter(matches);
      if (filtered.length === 0) return;
      const groupEl = document.createElement('div');
      groupEl.className = 'pantry-group';
      const labelEl = document.createElement('div');
      labelEl.className = 'pantry-group-label';
      labelEl.textContent = group.charAt(0).toUpperCase() + group.slice(1);
      groupEl.appendChild(labelEl);
      filtered.forEach(({ id, label }) => groupEl.appendChild(makePantryItem(id, label)));
      container.appendChild(groupEl);
    });
  }
}

document.getElementById('pantrySearch').addEventListener('input', renderPantryItems);

// Collapsible pantry section
document.getElementById('pantryToggle').addEventListener('click', () => {
  const body = document.getElementById('pantryBody');
  const btn = document.getElementById('pantryToggle');
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  body.hidden = expanded;
  btn.setAttribute('aria-expanded', String(!expanded));
});

document.querySelectorAll('.pvt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    pantryView = btn.dataset.view;
    document.querySelectorAll('.pvt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPantryItems();
  });
});

function updateCardMatches() {
  applyFilters();
}

let prePantrySort = 'default';

function activateBestMatch() {
  if (currentSort !== 'best-match') prePantrySort = currentSort;
  currentSort = 'best-match';
  renderCards();
  applyFilters();
}

function deactivateBestMatch() {
  currentSort = prePantrySort;
  const sel = document.getElementById('sortSelect');
  if (sel) sel.value = currentSort;
  updateSortDirBtn();
  renderCards();
  applyFilters();
}

function clearAllFilters() {
  document.getElementById('favFilter').checked = false;
  document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
  activeTime = null;
  document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('searchInput').value = '';
  selectedIngredients.clear();
  document.getElementById('pantryClear').hidden = true;
  renderPantryItems();
  if (currentSort === 'best-match') {
    currentSort = prePantrySort;
    const sel = document.getElementById('sortSelect');
    if (sel) sel.value = currentSort;
    updateSortDirBtn();
  }
  renderCards();
  applyFilters();
}

document.getElementById('sidebarReset').addEventListener('click', clearAllFilters);

// Flat id → label lookup for pantry (populated in boot after recipes load)
let pantryLabelMap = {};

// Unified filter state
let activeTime = null;

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const checkedCats = [...document.querySelectorAll('input[name="category"]:checked')].map(el => el.value);
  const anyPantry = selectedIngredients.size > 0;
  const favOnly = document.getElementById('favFilter').checked;
  let totalVisible = 0;
  let totalRecipes = 0;

  document.querySelectorAll('.category-section').forEach(section => {
    const cat = section.dataset.category;
    const catMatch = checkedCats.length === 0 || checkedCats.includes(cat);
    let visible = 0;
    section.querySelectorAll('.recipe-card').forEach((card) => {
      totalRecipes++;
      const r = recipes[cat][parseInt(card.dataset.idx)];
      const mins = (r.time_seconds || 0) / 60;
      const timeMatch = !activeTime
        || (activeTime === '15'  && mins <= 15)
        || (activeTime === '30'  && mins > 15 && mins <= 30)
        || (activeTime === '30+' && mins > 30);
      const searchMatch = !q || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q);
      const pantry = pantryMap[r.title] || [];
      const matched = pantry.filter(id => selectedIngredients.has(id)).length;
      const pantryMatch = !anyPantry || matched > 0;
      const matchEl = card.querySelector('.card-match');
      const descEl = card.querySelector('.card-desc');
      // Search highlight
      const titleEl = card.querySelector('.card-title');
      if (q && searchMatch && titleEl) {
        const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        titleEl.innerHTML = r.title.replace(re, '<mark>$1</mark>');
        if (!anyPantry) descEl.innerHTML = descEl.dataset.desc.replace(re, '<mark>$1</mark>');
      } else if (titleEl) {
        titleEl.textContent = r.title;
      }
      if (anyPantry && pantry.length > 0) {
        const pct = matched / pantry.length;
        const tier = pct >= 0.8 ? 'match-high' : pct >= 0.5 ? 'match-mid' : 'match-low';
        matchEl.textContent = `${matched}/${pantry.length} main ingredients`;
        matchEl.className = `card-match visible ${tier}`;
        const missing = pantry.filter(id => !selectedIngredients.has(id));
        if (missing.length === 0) {
          descEl.textContent = 'All ingredients in house.';
        } else {
          descEl.textContent = 'Need to buy: ' + missing.map(id => pantryLabelMap[id] || id).join(', ') + '.';
        }
        descEl.style.color = '';
      } else {
        matchEl.textContent = '';
        matchEl.className = 'card-match';
        descEl.textContent = descEl.dataset.desc;
        descEl.style.color = '';
      }
      const show = catMatch && timeMatch && searchMatch && pantryMatch && (!favOnly || favorites.has(r.title));
      card.hidden = !show;
      if (show) { visible++; totalVisible++; }
    });
    section.classList.toggle('hidden', !catMatch || visible === 0);
  });

  const emptyEl = document.getElementById('emptyState');
  if (emptyEl) {
    const isEmpty = totalVisible === 0;
    emptyEl.style.display = isEmpty ? 'block' : 'none';
    if (isEmpty) emptyEl.textContent = EMPTY_STATES[Math.floor(Math.random() * EMPTY_STATES.length)];
  }
  updateResultCount(totalVisible, totalRecipes);
  updateFilterSummary(checkedCats, q);
  saveFilterState();
}

const EMPTY_STATES = [
  'Nothing. You\'ve out-filtered yourself.',
  'Zero results. Even we\'re impressed by that.',
  'No recipes found. Maybe ease up on the filters.',
  'That combination doesn\'t exist. Try being less specific.',
  'Nothing here. The kitchen is judging you.',
  'Completely empty. A bold choice.',
  'No matches. The filters have spoken.',
  'You\'ve filtered your way into a corner.',
  'Not a single recipe. Remarkable, honestly.',
  'Nothing. Go touch grass and come back.',
];

function updateResultCount(visible, total) {
  const el = document.getElementById('resultCount');
  if (!el) return;
  el.textContent = `${visible} of ${total} results`;
}

function updateFilterSummary(checkedCats, q) {
  const el = document.getElementById('filterSummary');
  const resetBtn = document.getElementById('sidebarReset');
  el.innerHTML = '';
  const pills = [];

  checkedCats.forEach(cat => {
    const labels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
    pills.push({ label: labels[cat], remove: () => {
      document.querySelector(`input[name="category"][value="${cat}"]`).checked = false;
      applyFilters();
    }});
  });

  if (activeTime) {
    const timeLabels = { '15': '≤ 15 min', '30': '15–30 min', '30+': '30+ min' };
    pills.push({ label: timeLabels[activeTime], remove: () => {
      activeTime = null;
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      applyFilters();
    }});
  }

  if (q) {
    pills.push({ label: `"${q}"`, remove: () => {
      document.getElementById('searchInput').value = '';
      applyFilters();
    }});
  }

  if (selectedIngredients.size > 0) {
    pills.push({ label: `${selectedIngredients.size} ingredient${selectedIngredients.size > 1 ? 's' : ''}`, remove: () => {
      selectedIngredients.clear();
      document.getElementById('pantryClear').hidden = true;
      renderPantryItems();
      applyFilters();
    }});
  }

  if (document.getElementById('favFilter').checked) {
    pills.push({ label: '♥ Favourites', remove: () => {
      document.getElementById('favFilter').checked = false;
      applyFilters();
    }});
  }

  resetBtn.disabled = pills.length === 0;
  resetBtn.style.opacity = pills.length === 0 ? '0.35' : '';

  if (pills.length === 0) {
    const msg = document.createElement('span');
    msg.className = 'filter-all-label';
    msg.textContent = 'Showing all gluten-free and lactose-free recipes';
    el.appendChild(msg);
    return;
  }

  const label = document.createElement('span');
  label.className = 'filter-on-label';
  label.textContent = 'Filtered on';
  el.appendChild(label);

  pills.forEach(({ label, remove }) => {
    const pill = document.createElement('span');
    pill.className = 'filter-pill';
    pill.innerHTML = `${label}<button class="filter-pill-remove" aria-label="Remove filter">×</button>`;
    pill.querySelector('button').addEventListener('click', remove);
    el.appendChild(pill);
  });
}

// Fav filter
document.getElementById('greetingSuggestion').addEventListener('click', e => {
  const link = e.target.closest('.greeting-link');
  if (link) openModal(link.dataset.cat, parseInt(link.dataset.idx));
});

document.getElementById('favFilter').addEventListener('change', applyFilters);

// Category checkboxes
document.querySelectorAll('input[name="category"]').forEach(cb => {
  cb.addEventListener('change', applyFilters);
});

// Time filter
document.querySelectorAll('.time-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.time;
    if (activeTime === val) {
      activeTime = null;
      btn.classList.remove('active');
    } else {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      activeTime = val;
      btn.classList.add('active');
    }
    applyFilters();
  });
});

// Search
document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 150));

// Pantry clear
document.getElementById('pantryClear').addEventListener('click', () => {
  selectedIngredients.clear();
  document.getElementById('pantryClear').hidden = true;
  renderPantryItems();
  deactivateBestMatch();
});

// Sort
function updateSortDirBtn() {
  const btn = document.getElementById('sortDirBtn');
  const hasField = !!SORT_OPTIONS[currentSort]?.field;
  btn.hidden = !hasField;
  btn.textContent = sortDir === 'desc' ? '↓' : '↑';
  btn.setAttribute('aria-label', sortDir === 'desc' ? 'Sort ascending' : 'Sort descending');
}

document.getElementById('sortSelect').addEventListener('change', e => {
  currentSort = e.target.value;
  sortDir = 'desc';
  updateSortDirBtn();
  renderCards();
  applyFilters();
});

document.getElementById('sortDirBtn').addEventListener('click', () => {
  sortDir = sortDir === 'desc' ? 'asc' : 'desc';
  updateSortDirBtn();
  renderCards();
  applyFilters();
});

// Mobile sheet
const sheetSidebar = document.getElementById('sidebar');
const sheetBackdrop = document.getElementById('sheetBackdrop');
const sheetToggleBtn = document.getElementById('mobileFilterToggle');

function openSheet() {
  sheetSidebar.classList.add('open');
  sheetBackdrop.classList.add('open');
  sheetToggleBtn.classList.add('open');
  sheetToggleBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  sheetSidebar.classList.remove('open');
  sheetBackdrop.classList.remove('open');
  sheetToggleBtn.classList.remove('open');
  sheetToggleBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

sheetToggleBtn.addEventListener('click', () => {
  sheetSidebar.classList.contains('open') ? closeSheet() : openSheet();
});

sheetBackdrop.addEventListener('click', closeSheet);
document.getElementById('sheetApply').addEventListener('click', closeSheet);
document.getElementById('sheetClose').addEventListener('click', closeSheet);

// Swipe down on handle only to close
const sheetHandle = sheetSidebar.querySelector('.sheet-handle');
let touchStartY = 0;
sheetHandle.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
sheetHandle.addEventListener('touchend', e => {
  if (e.changedTouches[0].clientY - touchStartY > 40) closeSheet();
}, { passive: true });

// Cookie helpers
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}
function getCookie(name) {
  const match = document.cookie.split('; ').find(r => r.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

// Save current filter state to localStorage (debounced to avoid writes on every keystroke)
function saveFilterState() {
  const state = {
    categories: [...document.querySelectorAll('input[name="category"]:checked')].map(el => el.value),
    time: activeTime,
    search: document.getElementById('searchInput').value,
    ingredients: [...selectedIngredients],
    sort: currentSort !== 'best-match' ? currentSort : prePantrySort,
    sortDir,
  };
  debouncedWriteFilterState(state);
}

const debouncedWriteFilterState = debounce(state => {
  localStorage.setItem('filter-state', JSON.stringify(state));
}, 400);

// Apply a saved state object onto the UI (without re-rendering)
function restoreFilterState(state) {
  (state.categories || []).forEach(cat => {
    const cb = document.querySelector(`input[name="category"][value="${cat}"]`);
    if (cb) cb.checked = true;
  });
  if (state.time) {
    activeTime = state.time;
    document.querySelector(`.time-btn[data-time="${state.time}"]`)?.classList.add('active');
  }
  if (state.search) document.getElementById('searchInput').value = state.search;
  if (state.sort) {
    currentSort = state.sort;
    const sel = document.getElementById('sortSelect');
    if (sel) sel.value = currentSort;
  }
  if (state.sortDir) sortDir = state.sortDir;
  (state.ingredients || []).forEach(id => selectedIngredients.add(id));
  if (selectedIngredients.size > 0) {
    document.getElementById('pantryClear').hidden = false;
    prePantrySort = currentSort;
    currentSort = 'best-match';
  }
  updateSortDirBtn();
}

// Show resume card when returning after 2+ hours
function showFilterResumeCard(state) {
  const parts = [];
  const catLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
  const timeLabels = { '15': '≤ 15 min', '30': '15–30 min', '30+': '30+ min' };
  if ((state.categories || []).length) parts.push(state.categories.map(c => catLabels[c]).join(', '));
  if (state.time) parts.push(timeLabels[state.time]);
  if (state.search) parts.push(`"${state.search}"`);
  if ((state.ingredients || []).length) parts.push(`${state.ingredients.length} ingredient${state.ingredients.length > 1 ? 's' : ''}`);

  const card = document.createElement('div');
  card.className = 'filter-resume-card';
  card.innerHTML = `
    <div class="filter-resume-text">Resume last filters: <em>${parts.join(' · ')}</em></div>
    <div class="filter-resume-actions">
      <button class="filter-resume-apply">Apply filters</button>
      <button class="filter-resume-dismiss">No, thanks</button>
    </div>
  `;

  const sidebarBody = document.querySelector('.sidebar-body');
  sidebarBody.insertBefore(card, sidebarBody.firstChild);

  card.querySelector('.filter-resume-apply').addEventListener('click', () => {
    restoreFilterState(state);
    renderPantryItems();
    renderCards();
    applyFilters();
    card.remove();
  });
  card.querySelector('.filter-resume-dismiss').addEventListener('click', () => card.remove());
}

// Inline sort-bar greeting (shown when no filters active)
const isNZ = Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Auckland');

const GREETINGS = {
  morning: [
    'Good morning.',
    'Rise and shine.',
    'Morning, champion.',
    'Wakey wakey.',
    'Up already? Impressive.',
    'Morning has broken. You haven\'t.',
    'The early bird gets the protein.',
    'Coffee first, questions later.',
    'Pre-workout fuel incoming.',
    'Morning. Let\'s make it count.',
    'Your future self thanks you for eating well.',
    'Breakfast is non-negotiable.',
    'Good morning, overachiever.',
    'The fridge is calling.',
    'Another lap around the sun begins.',
    ...(isNZ ? [
      'Kia ora.',
      'Morning, mate!',
      'Long white sorted. Now eat.',
      'Sweet as. Morning.',
      'It\'s probably raining. Eat well anyway.',
    ] : []),
  ],
  lunch: [
    'Good afternoon.',
    'Lunch o\'clock.',
    'Hunger: incoming.',
    'Midday fuel stop.',
    'The morning survived. Now eat.',
    'Lunchtime, finally.',
    'Peak hunger detected.',
    'Your stomach has opinions.',
    'Afternoon, legend.',
    'Halfway through. Refuel.',
    'The afternoon won\'t feed itself.',
    'It\'s giving lunch vibes.',
    'Lunch break. Make it count.',
    'Stomach says yes. Brain agrees.',
    ...(isNZ ? [
      'Good arvo.',
      'Arvo fuel. Non-negotiable.',
      'Kia ora. Hungry?',
    ] : []),
  ],
  snack: [
    'Good afternoon.',
    'The 3pm slump is real.',
    'Snack o\'clock.',
    'Afternoon. You\'re doing great.',
    'Almost home time.',
    'The afternoon demands fuel.',
    'Your body is asking. Politely.',
    'Energy dip? We\'ve got you.',
    'Carry on. Eat something.',
    'The finish line is in sight.',
    'Small snack. Big comeback.',
    'Late afternoon. Early dinner. You decide.',
    ...(isNZ ? [
      'Nearly home time. Sweet as.',
      'Auckland traffic can wait. Eat first.',
    ] : []),
  ],
  evening: [
    'Good evening.',
    'Evening, champion.',
    'The day is done. Eat well.',
    'Stove on. Stress off.',
    'Dinner doesn\'t cook itself. Unfortunately.',
    'You\'ve earned a proper meal.',
    'Golden hour, golden plate.',
    'Evening. The kitchen awaits.',
    'The hardest decision of the day: what to eat.',
    'Protein doesn\'t sleep. Neither should your ambition.',
    'Evening mode activated.',
    'Night is young. Dinner first.',
    'Well done today. Eat accordingly.',
    'Dinner time.',
    'End-of-day fuel.',
    ...(isNZ ? [
      'Good evening, Auckland.',
      'Kia ora.',
      'The All Blacks would eat well tonight.',
    ] : []),
  ],
  late: [
    'Still up?',
    'Night owl energy.',
    'Midnight snack? We don\'t judge.',
    'The night shift deserves good food.',
    'Technically tomorrow already.',
    'Sleep soon. Eat first.',
    'Nobody needs to know.',
    'The dark hours demand snacks.',
    'Late night, high standards.',
    'You and every chef in Auckland right now.',
    'Burning the midnight oil. Might as well eat.',
  ],
};

function pickGreeting(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

let greetingHTML = '';
function initGreeting() {
  const hour = new Date().getHours();
  let text, cat, pool;
  if      (hour >= 5  && hour < 11) { pool = GREETINGS.morning; cat = 'breakfast'; }
  else if (hour >= 11 && hour < 15) { pool = GREETINGS.lunch;   cat = 'lunch'; }
  else if (hour >= 15 && hour < 18) { pool = GREETINGS.snack;   cat = 'snack'; }
  else if (hour >= 18 && hour < 22) { pool = GREETINGS.evening; cat = 'dinner'; }
  else                               { pool = GREETINGS.late;    cat = 'snack'; }
  text = pickGreeting(pool);
  const recipes_pool = recipes[cat];
  const pick = recipes_pool[Math.floor(Math.random() * recipes_pool.length)];
  const recipeIdx = recipes_pool.indexOf(pick);
  const headingEl = document.getElementById('greetingHeading');
  if (headingEl) headingEl.textContent = text;
  const RECIPE_INTROS = [
    t => `Try ${t}.`,
    t => `Time to make ${t}.`,
    t => `I heard ${t} is nice.`,
    t => `${t} is pretty good.`,
    t => `${t} might be the one.`,
    t => `Have you tried ${t}?`,
    t => `${t} hits different.`,
    t => `Not to be pushy, but ${t}.`,
    t => `${t} has been getting good reviews.`,
    t => `Today feels like a ${t} day.`,
    t => `You look like someone who could eat ${t}.`,
    t => `${t}. Just saying.`,
    t => `Can confirm ${t} slaps.`,
    t => `Rumour has it ${t} is excellent.`,
    t => `${t} — a classic for a reason.`,
    t => `In the mood for ${t}?`,
    t => `${t} is calling your name.`,
    t => `Strongly suggest ${t}.`,
    t => `Word on the street: ${t}.`,
    t => `${t} won't make itself, but it should.`,
  ];
  const intro = RECIPE_INTROS[Math.floor(Math.random() * RECIPE_INTROS.length)];
  const linkHTML = `<a class="greeting-link" data-cat="${cat}" data-idx="${recipeIdx}">${pick.title}</a>`;
  greetingHTML = '';
  const suggEl = document.getElementById('greetingSuggestion');
  if (suggEl) suggEl.innerHTML = `<span class="greeting-inline">${intro(linkHTML)}</span>`;
}

function buildPantryMap() {
  const validIds = new Set(Object.values(pantryGroups).flat().map(p => p.id));
  const map = {};
  for (const items of Object.values(recipes)) {
    for (const r of items) {
      const matched = [...new Set(
        r.ingredients.map(ing => {
          const norm = normalizeIngItem(ing.item);
          if (validIds.has(norm)) return norm;
          // fall back to singular (e.g. recipe has "eggs", pantry has "egg")
          const singular = norm.endsWith('s') ? norm.slice(0, -1) : null;
          return singular && validIds.has(singular) ? singular : null;
        }).filter(Boolean)
      )];
      if (matched.length > 0) map[r.title] = matched;
    }
  }
  return map;
}

function boot() {
  pantryGroups = buildPantryGroupsFromRecipes(recipes);
  pantryLabelMap = {};
  Object.values(pantryGroups).flat().forEach(({ id, label }) => { pantryLabelMap[id] = label; });
  pantryMap = buildPantryMap();
  initGreeting();

  const _lastVisit = getCookie('last-filter-visit');
  setCookie('last-filter-visit', Date.now(), 30);
  const _savedRaw = localStorage.getItem('filter-state');
  const _twoHours = 2 * 60 * 60 * 1000;
  const _elapsed = _lastVisit ? Date.now() - parseInt(_lastVisit) : 0;

  if (_savedRaw) {
    const _saved = JSON.parse(_savedRaw);
    const _hasFilters = (_saved.categories || []).length || _saved.time || _saved.search || (_saved.ingredients || []).length;
    if (_hasFilters && _elapsed >= _twoHours) {
      renderCards(); renderPantryItems(); applyFilters();
      showFilterResumeCard(_saved);
    } else {
      restoreFilterState(_saved);
      renderCards(); renderPantryItems(); applyFilters();
    }
  } else {
    renderCards(); renderPantryItems(); applyFilters();
  }
}

// Slogan crossfade
(function() {
  const slogan = document.querySelector('.header-slogan');
  if (!slogan) return;
  setInterval(() => slogan.classList.toggle('show-b'), 10000);
})();

window.SB.fetchAllRatings().then(ratings => {
  recipeRatings = ratings;
  renderCards();
}).catch(() => {});

window.SB.fetchRecipes()
  .then(data => {
    recipes = { breakfast: [], lunch: [], dinner: [], snack: [] };
    data.forEach(r => {
      const cat = r.category;
      if (!recipes[cat]) return;
      recipes[cat].push({
        id:          r.id,
        slug:        r.slug,
        title:       r.title,
        desc:        r.description,
        time_seconds: r.time_seconds,
        servings:    r.servings,
        ingredients: r.ingredients,
        steps:       r.steps,
        tips:        r.notes,
        nutrition:   r.nutrition,
      });
    });
    // Keep recipe ID map up to date for cloud favourites sync
    const titleToId = {};
    Object.values(recipes).flat().forEach(r => { titleToId[r.title] = r.id; });
    window.SB.setRecipeIdMap(titleToId);

    boot();
    // Restore cook mode if session was active
    const savedCook = JSON.parse(sessionStorage.getItem('cookState') || 'null');
    if (savedCook) {
      for (const [, items] of Object.entries(recipes)) {
        const r = items.find(r => r.slug === savedCook.slug);
        if (r) { openCookingMode(r.steps, r.ingredients, r.title, savedCook.step); break; }
      }
    } else {
      // URL deep-link
      const hash = window.location.hash.slice(1);
      if (hash) {
        for (const [cat, items] of Object.entries(recipes)) {
          const idx = items.findIndex(r => r.slug === hash);
          if (idx !== -1) { openModal(cat, idx); break; }
        }
      }
    }
  })
  .catch(() => {
    document.querySelectorAll('.recipe-grid').forEach(g => { g.innerHTML = ''; });
    const el = document.getElementById('emptyState');
    el.textContent = 'Could not load recipes. Try refreshing the page.';
    el.style.display = 'block';
  });

// ─── Auth + favourites sync ───────────────────────────────────────────────────

async function onUserChange(event, user, prev) {
  if (user && !prev) {
    // Just signed in — pull cloud favs, merge with local, push merged set
    await syncFavouritesOnSignIn();
    await checkAdminAndRender();
  }
  if (!user && prev) {
    // Signed out — reset admin state
    _isAdmin = false;
    document.getElementById('adminNewBtn').hidden = true;
    renderCards();
  }
}

async function syncFavouritesOnSignIn() {
  try {
    const cloudIds = await window.SB.pullFavouriteIds();
    // Build reverse map: recipeId → title
    const idToTitle = {};
    Object.values(recipes).flat().forEach(r => { idToTitle[r.id] = r.title; });
    // Merge cloud IDs into local favourites set
    cloudIds.forEach(id => {
      const title = idToTitle[id];
      if (title) favorites.add(title);
    });
    saveFavorites();
    renderCards();
    // Push the merged local set back to cloud
    const titleToId = {};
    Object.values(recipes).flat().forEach(r => { titleToId[r.title] = r.id; });
    window.SB.setRecipeIdMap(titleToId);
    await window.SB.pushFavourites(favorites);
  } catch (e) {
    console.error('Favourites sync failed', e);
  }
}

window.SB.initSupabase(onUserChange).then(() => {
  // If already signed in from a previous session, check admin status
  if (window.SB.getCurrentUser()) checkAdminAndRender();
}).catch(() => {});

// ─── Login modal ──────────────────────────────────────────────────────────────
const loginModal = document.getElementById('loginModal');
document.getElementById('loginModalClose').addEventListener('click', () => loginModal.close());
loginModal.addEventListener('click', e => { if (e.target === loginModal) loginModal.close(); });
document.getElementById('googleSignInBtn').addEventListener('click', () => {
  loginModal.close();
  window.SB.signInWithGoogle();
});

// ─── Profile dropdown ─────────────────────────────────────────────────────────
const profileDropdown = document.getElementById('profileDropdown');
const profileWrap = document.getElementById('profileWrap');

window._toggleProfileDropdown = function() {
  profileDropdown.hidden = !profileDropdown.hidden;
};

document.addEventListener('click', e => {
  if (!profileWrap.contains(e.target)) profileDropdown.hidden = true;
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') profileDropdown.hidden = true;
});

document.getElementById('profileSettingsBtn').addEventListener('click', () => {
  profileDropdown.hidden = true;
  syncThemeOptButtons();
  document.getElementById('settingsModal').showModal();
});

document.getElementById('profileLogoutBtn').addEventListener('click', () => {
  profileDropdown.hidden = true;
  window.SB.signOut();
});

// ─── Settings modal ───────────────────────────────────────────────────────────
const settingsModal = document.getElementById('settingsModal');
document.getElementById('settingsModalClose').addEventListener('click', () => settingsModal.close());
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.close(); });

// Reorder category sections by time of day
(function() {
  const hour = new Date().getHours();
  let order;
  if      (hour >= 5  && hour < 11) order = ['breakfast', 'lunch', 'snack', 'dinner'];
  else if (hour >= 11 && hour < 15) order = ['lunch', 'breakfast', 'snack', 'dinner'];
  else if (hour >= 15 && hour < 18) order = ['snack', 'lunch', 'dinner', 'breakfast'];
  else if (hour >= 18 && hour < 22) order = ['dinner', 'snack', 'lunch', 'breakfast'];
  else                               order = ['snack', 'dinner', 'breakfast', 'lunch'];

  const parent = document.querySelector('.main-body');
  order.forEach(cat => {
    const el = parent.querySelector(`[data-category="${cat}"]`);
    if (el) parent.appendChild(el);
  });
})();

// ─── Share recipe ────────────────────────────────────────────────────────────

function shareRecipe(r) {
  const shareBtn = document.getElementById('modalShare');
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: r.title, text: r.desc, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const orig = shareBtn.textContent;
      shareBtn.textContent = 'Copied!';
      setTimeout(() => { shareBtn.textContent = orig; }, 2000);
    });
  }
}

// ─── Cooking mode ─────────────────────────────────────────────────────────────

let cookSteps = [];
let cookIdx = 0;
let wakeLock = null;
let cookAc = null;
let cookTimerState = null; // { remaining, total, intervalId, running }

function openCookingMode(steps, ingredients, recipeTitle, startAtStep = 0, recipeSlug = null) {
  cookSteps = [...steps, null]; // null = done screen
  cookIdx = Math.min(startAtStep, cookSteps.length - 1);

  // Render ingredients list
  const list = document.getElementById('cookIngredientsList');
  list.innerHTML = (ingredients || []).map(ing => {
    const amt = [ing.amount, ing.unit].filter(Boolean).join(' ');
    return `<li class="cook-ing-row"><span class="cook-ing-amount">${amt}</span><span>${ing.item}</span></li>`;
  }).join('');

  document.getElementById('cookRecipeTitle').textContent = recipeTitle || '';

  // Reset ingredients panel
  const panel = document.getElementById('cookIngredientsPanel');
  const toggle = document.getElementById('cookIngredientsToggle');
  panel.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');

  // Reset timer when opening
  resetCookTimer();

  renderCookStep();
  document.getElementById('cookModal').showModal();
  lockScroll();

  if (navigator.wakeLock) {
    navigator.wakeLock.request('screen').then(wl => { wakeLock = wl; }).catch(() => {});
  }
  if (recipeTitle) {
    localStorage.setItem(`cooked:${recipeTitle}`, Date.now());
    const slug = recipeSlug || recipeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    history.replaceState(null, '', '#' + slug);
    sessionStorage.setItem('cookState', JSON.stringify({ slug, step: cookIdx }));
    // Cloud cook record — find recipe ID from title
    const recipeObj = Object.values(recipes).flat().find(r => r.title === recipeTitle);
    if (recipeObj) window.SB.recordCook(recipeObj.id).catch(() => {});
  }

  // Any key advances steps
  cookAc = new AbortController();
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); advanceCookStep(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (cookIdx > 0) { cookIdx--; resetCookTimer(); renderCookStep(); } }
  }, { signal: cookAc.signal });

  // Ingredients toggle
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    panel.hidden = expanded;
    toggle.setAttribute('aria-expanded', String(!expanded));
  }, { signal: cookAc.signal });

  // Timer button
  document.getElementById('cookTimerBtn').addEventListener('click', () => {
    if (!cookTimerState) return;
    const dur = stepDuration(cookSteps[cookIdx]);
    if (!dur) return;
    if (cookTimerState.running) {
      pauseCookTimer();
    } else {
      startCookTimer(dur);
    }
  }, { signal: cookAc.signal });
}

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

  // Timer
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

  // If no timer running (or it's a fresh step), initialise with the step duration
  if (!cookTimerState) {
    cookTimerState = { remaining: durationSeconds, total: durationSeconds, intervalId: null, running: false };
  }

  displayEl.textContent = formatTimerDisplay(cookTimerState.remaining);
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
    if (displayEl) displayEl.textContent = formatTimerDisplay(cookTimerState.remaining);
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

document.getElementById('cookClose').addEventListener('click', closeCookingMode);
document.getElementById('cookPrev').addEventListener('click', () => {
  if (cookIdx > 0) { cookIdx--; resetCookTimer(); renderCookStep(); }
});
document.getElementById('cookNext').addEventListener('click', advanceCookStep);

// Escape key cleanup for cook and submit modals
document.getElementById('cookModal').addEventListener('close', () => {
  unlockScroll();
  if (wakeLock) { wakeLock.release(); wakeLock = null; }
});
document.getElementById('adminModal').addEventListener('close', () => unlockScroll());

// Swipe left/right in cook body to navigate steps
(function() {
  const body = document.getElementById('cookModal');
  let swipeStartX = 0;
  body.addEventListener('touchstart', e => { swipeStartX = e.touches[0].clientX; }, { passive: true });
  body.addEventListener('touchend', e => {
    const dx = swipeStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) < 50) return;
    if (dx > 0) { advanceCookStep(); }
    else if (dx < 0 && cookIdx > 0) { cookIdx--; resetCookTimer(); renderCookStep(); }
  }, { passive: true });
})();



// ─── Admin panel ──────────────────────────────────────────────────────────────

let _isAdmin = false;
let _adminEditingId = null; // recipe ID being edited, null = new recipe

async function checkAdminAndRender() {
  _isAdmin = await window.SB.isAdmin().catch(() => false);
  document.getElementById('adminNewBtn').hidden = !_isAdmin;
  if (_isAdmin) renderCards(); // re-render to show edit buttons
}

document.getElementById('adminNewBtn').addEventListener('click', () => openAdminModal(null));

function adminIngRow(ing = {}) {
  const row = document.createElement('div');
  row.className = 'submit-ing-row';
  row.innerHTML = `
    <input class="submit-input sf-ing-amount" type="text" placeholder="200" value="${ing.amount || ''}">
    <input class="submit-input sf-ing-unit" type="text" placeholder="g" value="${ing.unit || ''}">
    <input class="submit-input sf-ing-item" type="text" placeholder="chicken breast" value="${ing.item || ''}">
    <button type="button" class="submit-rm-btn" aria-label="Remove">−</button>
  `;
  return row;
}

function adminStepRow(step = {}, num = 1) {
  const text = typeof step === 'object' ? (step.text || '') : (step || '');
  const dur = typeof step === 'object' ? (step.duration_seconds || '') : '';
  const row = document.createElement('div');
  row.className = 'submit-step-row';
  row.innerHTML = `
    <span class="submit-step-num">${num}</span>
    <textarea class="submit-input sf-step-text" rows="2" placeholder="Step ${num}...">${text}</textarea>
    <input class="submit-input sf-step-dur" type="number" placeholder="sec (optional)" value="${dur}" style="width:7rem;font-size:0.8rem">
    <button type="button" class="submit-rm-btn" aria-label="Remove">−</button>
  `;
  return row;
}

function buildAdminForm(r = null) {
  const n = r?.nutrition || {};
  const body = document.getElementById('adminModalBody');
  body.innerHTML = `
    <form id="adminForm" autocomplete="off">
      <div class="submit-section">
        <div class="submit-field"><label class="submit-label">Title</label><input class="submit-input" id="af-title" type="text" value="${r?.title || ''}" required></div>
        <div class="submit-field"><label class="submit-label">Category</label>
          <select class="submit-input" id="af-cat">
            <option value="breakfast" ${r?.category === 'breakfast' ? 'selected' : ''}>Breakfast</option>
            <option value="lunch"     ${r?.category === 'lunch'     ? 'selected' : ''}>Lunch</option>
            <option value="dinner"    ${!r || r.category === 'dinner' ? 'selected' : ''}>Dinner</option>
            <option value="snack"     ${r?.category === 'snack'     ? 'selected' : ''}>Snack</option>
          </select>
        </div>
        <div class="submit-field"><label class="submit-label">Cook time (seconds)</label><input class="submit-input" id="af-time" type="number" value="${r?.time_seconds || ''}" placeholder="e.g. 1800"></div>
        <div class="submit-field"><label class="submit-label">Servings</label><input class="submit-input" id="af-servings" type="number" min="1" value="${r?.servings || 1}"></div>
        <div class="submit-field"><label class="submit-label">Description</label><textarea class="submit-input" id="af-desc" rows="2">${r?.desc || ''}</textarea></div>
        <div class="submit-field"><label class="submit-label">Notes / benefits</label><textarea class="submit-input" id="af-notes" rows="2">${r?.tips || ''}</textarea></div>
      </div>
      <div class="submit-section">
        <div class="submit-section-label">Ingredients <button type="button" class="submit-add-btn" id="af-add-ing">+ Add</button></div>
        <div id="af-ings"></div>
      </div>
      <div class="submit-section">
        <div class="submit-section-label">Method <button type="button" class="submit-add-btn" id="af-add-step">+ Add step</button></div>
        <div id="af-steps"></div>
      </div>
      <div class="submit-section">
        <div class="submit-section-label">Nutrition <span class="admin-sub-label">(per serving)</span></div>
        <div class="submit-nutrition-grid">
          <div class="submit-field"><label class="submit-label">Energy (kcal)</label><input class="submit-input" id="af-kcal"    type="number" value="${n.energy_kcal || ''}"></div>
          <div class="submit-field"><label class="submit-label">Energy (kJ)</label>  <input class="submit-input" id="af-kj"      type="number" value="${n.energy_kj || ''}"></div>
          <div class="submit-field"><label class="submit-label">Protein (g)</label>  <input class="submit-input" id="af-protein" type="number" value="${n.protein_g || ''}"></div>
          <div class="submit-field"><label class="submit-label">Carbs (g)</label>    <input class="submit-input" id="af-carbs"   type="number" value="${n.carbs_g || ''}"></div>
          <div class="submit-field"><label class="submit-label">Sugars (g)</label>   <input class="submit-input" id="af-sugars"  type="number" value="${n.of_which_sugars_g || ''}"></div>
          <div class="submit-field"><label class="submit-label">Fat (g)</label>       <input class="submit-input" id="af-fat"     type="number" value="${n.fat_g || ''}"></div>
          <div class="submit-field"><label class="submit-label">Saturates (g)</label><input class="submit-input" id="af-sat"     type="number" value="${n.of_which_saturated_g || ''}"></div>
          <div class="submit-field"><label class="submit-label">Fibre (g)</label>    <input class="submit-input" id="af-fibre"   type="number" value="${n.fibre_g || ''}"></div>
          <div class="submit-field"><label class="submit-label">Salt (g)</label>     <input class="submit-input" id="af-salt"    type="number" value="${n.salt_g || ''}"></div>
        </div>
      </div>
      <div class="admin-form-error" id="adminFormError" hidden></div>
    </form>
  `;

  const ingsEl = body.querySelector('#af-ings');
  const stepsEl = body.querySelector('#af-steps');

  (r?.ingredients || [{}]).forEach(ing => ingsEl.appendChild(adminIngRow(ing)));
  (r?.steps || [{}]).forEach((s, i) => stepsEl.appendChild(adminStepRow(s, i + 1)));

  body.querySelector('#af-add-ing').addEventListener('click', () => {
    ingsEl.appendChild(adminIngRow());
  });
  body.querySelector('#af-add-step').addEventListener('click', () => {
    const num = stepsEl.children.length + 1;
    stepsEl.appendChild(adminStepRow({}, num));
  });
  body.addEventListener('click', e => {
    if (e.target.classList.contains('submit-rm-btn')) {
      e.target.closest('.submit-ing-row, .submit-step-row')?.remove();
    }
  });
}

function readAdminForm() {
  const ingredients = [...document.querySelectorAll('#af-ings .submit-ing-row')].map(row => ({
    amount: row.querySelector('.sf-ing-amount').value.trim(),
    unit:   row.querySelector('.sf-ing-unit').value.trim(),
    item:   row.querySelector('.sf-ing-item').value.trim(),
  })).filter(i => i.item);

  const steps = [...document.querySelectorAll('#af-steps .submit-step-row')].map(row => {
    const text = row.querySelector('.sf-step-text').value.trim();
    const dur  = parseInt(row.querySelector('.sf-step-dur').value) || null;
    if (!text) return null;
    return dur ? { text, duration_seconds: dur } : { text, duration_seconds: null };
  }).filter(Boolean);

  const sodium_mg = parseFloat(document.getElementById('af-salt').value) * 400 || 0;

  return {
    title:       document.getElementById('af-title').value.trim(),
    category:    document.getElementById('af-cat').value,
    time_seconds: parseInt(document.getElementById('af-time').value) || null,
    servings:    parseInt(document.getElementById('af-servings').value) || 1,
    description: document.getElementById('af-desc').value.trim(),
    notes:       document.getElementById('af-notes').value.trim(),
    ingredients,
    steps,
    nutrition: {
      energy_kcal:          parseFloat(document.getElementById('af-kcal').value)    || 0,
      energy_kj:            parseFloat(document.getElementById('af-kj').value)      || 0,
      protein_g:            parseFloat(document.getElementById('af-protein').value)  || 0,
      carbs_g:              parseFloat(document.getElementById('af-carbs').value)    || 0,
      of_which_sugars_g:    parseFloat(document.getElementById('af-sugars').value)   || 0,
      fat_g:                parseFloat(document.getElementById('af-fat').value)      || 0,
      of_which_saturated_g: parseFloat(document.getElementById('af-sat').value)      || 0,
      fibre_g:              parseFloat(document.getElementById('af-fibre').value)    || 0,
      salt_g:               parseFloat(document.getElementById('af-salt').value)     || 0,
    },
  };
}

function showAdminError(msg) {
  const el = document.getElementById('adminFormError');
  el.textContent = msg;
  el.hidden = false;
}

function openAdminModal(r = null) {
  _adminEditingId = r?.id || null;
  document.getElementById('adminModalTitle').textContent = r ? 'Edit recipe' : 'New recipe';
  document.getElementById('adminDeleteBtn').hidden = !r;
  buildAdminForm(r);
  document.getElementById('adminModal').showModal();
  lockScroll();
}

function closeAdminModal() {
  document.getElementById('adminModal').close();
}

document.getElementById('adminModalClose').addEventListener('click', closeAdminModal);
document.getElementById('adminModal').addEventListener('click', e => {
  if (e.target === document.getElementById('adminModal')) closeAdminModal();
});

document.getElementById('adminSaveBtn').addEventListener('click', async () => {
  const fields = readAdminForm();
  if (!fields.title) { showAdminError('Title is required.'); return; }
  if (!fields.category) { showAdminError('Category is required.'); return; }

  const btn = document.getElementById('adminSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    if (_adminEditingId) {
      await window.SB.updateRecipe(_adminEditingId, fields);
      // Update local recipe object
      for (const [cat, items] of Object.entries(recipes)) {
        const idx = items.findIndex(r => r.id === _adminEditingId);
        if (idx !== -1) {
          const updated = { ...items[idx], ...fields, desc: fields.description, tips: fields.notes };
          recipes[cat][idx] = updated;
          // If category changed, move it
          if (cat !== fields.category) {
            recipes[cat].splice(idx, 1);
            recipes[fields.category] = recipes[fields.category] || [];
            recipes[fields.category].push(updated);
          }
          break;
        }
      }
    } else {
      fields.slug = fields.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const created = await window.SB.createRecipe(fields);
      recipes[fields.category] = recipes[fields.category] || [];
      recipes[fields.category].push({
        id: created.id, slug: created.slug, title: created.title,
        desc: created.description, time_seconds: created.time_seconds,
        servings: created.servings, ingredients: created.ingredients,
        steps: created.steps, tips: created.notes, nutrition: created.nutrition,
        category: created.category,
      });
    }
    renderCards();
    applyFilters();
    closeAdminModal();
  } catch (err) {
    showAdminError(err.message || 'Save failed. Check the console.');
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save changes';
  }
});

document.getElementById('adminDeleteBtn').addEventListener('click', async () => {
  if (!_adminEditingId) return;
  const r = Object.values(recipes).flat().find(r => r.id === _adminEditingId);
  if (!confirm(`Delete "${r?.title}"? This cannot be undone.`)) return;

  const btn = document.getElementById('adminDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  try {
    await window.SB.deleteRecipe(_adminEditingId);
    for (const [cat, items] of Object.entries(recipes)) {
      const idx = items.findIndex(r => r.id === _adminEditingId);
      if (idx !== -1) { recipes[cat].splice(idx, 1); break; }
    }
    renderCards();
    applyFilters();
    closeAdminModal();
  } catch (err) {
    showAdminError(err.message || 'Delete failed.');
    btn.disabled = false;
    btn.textContent = 'Delete recipe';
  }
});
