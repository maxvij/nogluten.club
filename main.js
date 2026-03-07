
let recipes = {};

let currentSort = 'default';

const favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
const shoppingList = new Set();

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify([...favorites]));
}

function toggleFavorite(title, btn) {
  favorites.has(title) ? favorites.delete(title) : favorites.add(title);
  saveFavorites();
  btn.classList.toggle('active', favorites.has(title));
  btn.textContent = favorites.has(title) ? '♥' : '♡';
  if (document.getElementById('favFilter').checked) applyFilters();
}

function toggleShopList(title, btn) {
  shoppingList.has(title) ? shoppingList.delete(title) : shoppingList.add(title);
  btn.classList.toggle('active', shoppingList.has(title));
  btn.textContent = shoppingList.has(title) ? '✓ Added' : '+ Add';
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
  const m = document.getElementById('shopModal');
  m.showModal(); m.focus();
}

document.getElementById('shopFab').addEventListener('click', openShoppingListModal);
document.getElementById('shopModalClose').addEventListener('click', () => document.getElementById('shopModal').close());
document.getElementById('shopModal').addEventListener('click', e => { if (e.target === document.getElementById('shopModal')) document.getElementById('shopModal').close(); });

function getSortedItems(cat) {
  const indexed = recipes[cat].map((r, i) => ({ r, i }));
  if (currentSort === 'protein') {
    return indexed.sort((a, b) => parseFloat(b.r.protein) - parseFloat(a.r.protein));
  }
  if (currentSort === 'kcal') {
    return indexed.sort((a, b) => parseFloat(a.r.kcal) - parseFloat(b.r.kcal));
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
      card.innerHTML = `
        <div class="card-meta">
          <span class="card-time">${r.time}</span>
        </div>
        <div class="card-title">${r.title}</div>
        <div class="card-desc" data-desc="${r.desc.replace(/"/g, '&quot;')}">${r.desc}</div>
        <div class="card-footer">
          <div class="card-stats">
            <span class="card-match"></span>
            <span class="card-kcal">${r.kcal}</span>
            <span class="card-protein">${r.protein}</span>
          </div>
          <div class="card-actions">
            <button class="card-fav ${isFav ? 'active' : ''}" aria-label="Favourite">${isFav ? '♥' : '♡'}</button>
            <button class="card-shop-btn ${inList ? 'active' : ''}">${inList ? '✓ Added' : '+ Add'}</button>
          </div>
        </div>
      `;
      card.querySelector('.card-fav').addEventListener('click', e => { e.stopPropagation(); toggleFavorite(r.title, e.currentTarget); });
      card.querySelector('.card-shop-btn').addEventListener('click', e => { e.stopPropagation(); toggleShopList(r.title, e.currentTarget); });
      card.dataset.idx = i;
      card.addEventListener('click', () => openModal(cat, i));
      grid.appendChild(card);
    });
  });
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

function renderModalBody(r, servings) {
  const scale = servings / r.servings;
  const ingHTML = r.ingredients.map(ing => {
    const amt = [ing.amount, ing.unit].filter(Boolean).join(' ');
    return `<li><span class="ing-amount">${amt}</span><span>${ing.item}</span></li>`;
  }).join('');
  const stepsHTML = r.steps.map(s => `<li>${s}</li>`).join('');
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-section-title">Ingredients</div>
    <ul class="ingredient-list">${ingHTML}</ul>
    <div class="modal-section-title">Method</div>
    <ol class="steps-list">${stepsHTML}</ol>
    ${r.tips ? `<div class="modal-section-title">Benefits</div><div class="modal-tips">${r.tips}</div>` : ''}
    <div class="modal-section-title" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
      <span>Nutrition</span>
      <div class="serving-selector" id="servingSelector">
        <span class="serving-label">Servings</span>
        <button class="serving-btn" id="servingDown" aria-label="Decrease servings">−</button>
        <span class="serving-count" id="servingCount">${servings}</span>
        <button class="serving-btn" id="servingUp" aria-label="Increase servings">+</button>
      </div>
    </div>
    ${renderNutritionPanel(r.nutrition, scale)}
  `;
}

function openModal(cat, idx) {
  const r = recipes[cat][idx];
  const catLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  document.getElementById('modalCat').textContent = catLabels[cat];
  document.getElementById('modalTitle').textContent = r.title;
  document.getElementById('modalStats').innerHTML = `<span class="stat">Time <span>${r.time}</span></span>`;

  let servings = r.servings;
  renderModalBody(r, servings);

  document.getElementById('modalBody').addEventListener('click', function handler(e) {
    if (e.target.id === 'servingDown' && servings > 1) { servings--; renderModalBody(r, servings); }
    if (e.target.id === 'servingUp') { servings++; renderModalBody(r, servings); }
  }, { signal: (modal._ac = new AbortController()).signal });


  previousFocus = document.activeElement;
  modal.showModal();
  modal.focus();
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', '#' + r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
}

function closeModal() {
  modal._ac?.abort();
  modal.close();
  document.body.style.overflow = '';
  previousFocus?.focus();
  history.replaceState(null, '', window.location.pathname);
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// Keyboard shortcut: / to focus search
document.addEventListener('keydown', e => {
  if (e.key === '/' && !modal.open && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  if (e.key === 'Escape' && modal.open) closeModal();
});



// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'light' ? '☽' : '☀';
}

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const savedTheme = localStorage.getItem('theme');
applyTheme(savedTheme || systemTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'light' ? 'dark' : 'light');
});

// Pantry data
const pantryGroups = {
  protein: [
    { id: 'eggs',           label: 'Eggs',           keywords: 'egg boiled fried scramble omelette' },
    { id: 'chicken-breast', label: 'Chicken breast', keywords: 'chicken poultry meat white lean' },
    { id: 'chicken-thighs', label: 'Chicken thighs', keywords: 'chicken poultry meat thigh juicy' },
    { id: 'ground-turkey',  label: 'Ground turkey',  keywords: 'turkey mince minced ground poultry lean' },
    { id: 'canned-tuna',    label: 'Canned tuna',    keywords: 'tuna fish seafood tinned can tin' },
    { id: 'prawns',         label: 'Prawns',         keywords: 'prawn shrimp seafood shellfish' },
    { id: 'salmon',         label: 'Salmon',         keywords: 'salmon fish seafood smoked fillet' },
    { id: 'beef',           label: 'Beef',           keywords: 'beef steak mince red meat sirloin rump' },
    { id: 'ground-lamb',    label: 'Ground lamb',    keywords: 'lamb mince ground red meat kofta' },
    { id: 'pea-protein',    label: 'Pea protein',    keywords: 'protein powder supplement shake pea vegan' },
  ],
  produce: [
    { id: 'spinach',        label: 'Spinach',        keywords: 'spinach greens leafy salad vegetable' },
    { id: 'broccoli',       label: 'Broccoli',       keywords: 'broccoli greens vegetable cruciferous' },
    { id: 'avocado',        label: 'Avocado',        keywords: 'avocado avo fat creamy guacamole' },
    { id: 'zucchini',       label: 'Zucchini',       keywords: 'zucchini courgette vegetable marrow' },
    { id: 'sweet-potato',   label: 'Sweet potato',   keywords: 'sweet potato kumara potato carb orange' },
    { id: 'green-beans',    label: 'Green beans',    keywords: 'green beans beans vegetable snap' },
    { id: 'bok-choy',       label: 'Bok choy',       keywords: 'bok choy pak choi asian greens chinese cabbage' },
    { id: 'cucumber',       label: 'Cucumber',       keywords: 'cucumber salad fresh cool' },
    { id: 'mixed-berries',  label: 'Mixed berries',  keywords: 'berries strawberry blueberry raspberry frozen fruit' },
    { id: 'frozen-mango',   label: 'Frozen mango',   keywords: 'mango tropical frozen fruit smoothie' },
    { id: 'frozen-banana',  label: 'Frozen banana',  keywords: 'banana frozen fruit smoothie' },
    { id: 'edamame',        label: 'Edamame',        keywords: 'edamame soy soybean beans japanese' },
  ],
  pantry: [
    { id: 'rice',            label: 'Rice',            keywords: 'rice carbs grain jasmine basmati sushi white brown' },
    { id: 'firm-tofu',       label: 'Firm tofu',       keywords: 'tofu soy vegan vegetarian bean curd protein' },
    { id: 'coconut-milk',    label: 'Coconut milk',    keywords: 'coconut milk dairy free cream thai curry' },
    { id: 'oat-milk',        label: 'Oat milk',        keywords: 'oat milk dairy free milk alternative drink' },
    { id: 'yogurt',          label: 'LF yogurt',       keywords: 'yogurt yoghurt dairy lactose free probiotic' },
    { id: 'red-lentils',     label: 'Red lentils',     keywords: 'lentils legume pulse dal dhal soup' },
    { id: 'canned-tomatoes', label: 'Canned tomatoes', keywords: 'tomatoes tomato tinned can passata crushed' },
    { id: 'miso-paste',      label: 'Miso paste',      keywords: 'miso fermented japanese paste umami soy' },
    { id: 'curry-paste',     label: 'Curry paste',     keywords: 'curry paste thai green red indian spice' },
    { id: 'tahini',          label: 'Tahini',          keywords: 'tahini sesame paste middle eastern dip' },
    { id: 'nut-butter',      label: 'Nut butter',      keywords: 'nut butter peanut butter almond peanut spread' },
    { id: 'oats',            label: 'Rolled oats',     keywords: 'oats rolled oats porridge breakfast gluten free' },
    { id: 'granola',         label: 'GF granola',      keywords: 'granola breakfast oats cereal gluten free' },
    { id: 'rice-cakes',      label: 'Rice cakes',      keywords: 'rice cakes crackers snack gluten free light' },
  ],
};

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
  const span = document.createElement('span');
  span.textContent = label;
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
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.sort-btn[data-sort="${currentSort}"]`)?.classList.add('active');
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
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.sort-btn[data-sort="${currentSort}"]`)?.classList.add('active');
  }
  renderCards();
  applyFilters();
}

document.getElementById('sidebarReset').addEventListener('click', clearAllFilters);

// Flat id → label lookup for pantry
const pantryLabelMap = {};
Object.values(pantryGroups).flat().forEach(({ id, label }) => { pantryLabelMap[id] = label; });

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
      const mins = parseInt(r.time);
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
      if (anyPantry && pantry.length > 0) {
        const pct = matched / pantry.length;
        const tier = pct >= 0.8 ? 'match-high' : pct >= 0.5 ? 'match-mid' : 'match-low';
        matchEl.textContent = `${matched} / ${pantry.length}`;
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

  updateResultCount(totalVisible, totalRecipes);
  updateFilterSummary(checkedCats, q);
  saveFilterState();
}

function updateResultCount(visible, total) {
  const el = document.getElementById('resultCount');
  if (visible === total) {
    el.textContent = `Showing all ${total} recipes`;
  } else {
    el.textContent = `Showing ${visible} of ${total} recipes`;
  }
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
    el.innerHTML = greetingHTML;
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
document.getElementById('searchInput').addEventListener('input', applyFilters);

// Pantry clear
document.getElementById('pantryClear').addEventListener('click', () => {
  selectedIngredients.clear();
  document.getElementById('pantryClear').hidden = true;
  renderPantryItems();
  deactivateBestMatch();
});

// Sort
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentSort = btn.dataset.sort;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCards();
    applyFilters();
  });
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

// Swipe down to close
let touchStartY = 0;
sheetSidebar.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
sheetSidebar.addEventListener('touchend', e => {
  if (e.changedTouches[0].clientY - touchStartY > 60) closeSheet();
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

// Save current filter state to localStorage
function saveFilterState() {
  const state = {
    categories: [...document.querySelectorAll('input[name="category"]:checked')].map(el => el.value),
    time: activeTime,
    search: document.getElementById('searchInput').value,
    ingredients: [...selectedIngredients]
  };
  localStorage.setItem('filter-state', JSON.stringify(state));
}

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
  (state.ingredients || []).forEach(id => selectedIngredients.add(id));
  if (selectedIngredients.size > 0) {
    document.getElementById('pantryClear').hidden = false;
    prePantrySort = currentSort;
    currentSort = 'best-match';
  }
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
let greetingHTML = '';
function initGreeting() {
  const hour = new Date().getHours();
  let text, cat;
  if      (hour >= 5  && hour < 11) { text = 'Good morning.';  cat = 'breakfast'; }
  else if (hour >= 11 && hour < 15) { text = 'Good afternoon.'; cat = 'lunch'; }
  else if (hour >= 15 && hour < 18) { text = 'Good afternoon.'; cat = 'snack'; }
  else if (hour >= 18 && hour < 22) { text = 'Good evening.';   cat = 'dinner'; }
  else                               { text = 'Late night.';     cat = 'snack'; }
  const pool = recipes[cat];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const recipeIdx = pool.indexOf(pick);
  greetingHTML = `<span class="greeting-inline">${text} Try <a onclick="openModal('${cat}',${recipeIdx})">${pick.title}</a>.</span>`;
}

function buildPantryMap() {
  const map = {};
  const allItems = Object.values(pantryGroups).flat();
  for (const [, items] of Object.entries(recipes)) {
    for (const r of items) {
      const ingText = r.ingredients.map(i => i.item.toLowerCase()).join(' ');
      const matched = [];
      for (const p of allItems) {
        const kwds = p.keywords.toLowerCase().split(' ').filter(k => k.length > 2);
        if (kwds.some(kw => ingText.includes(kw))) matched.push(p.id);
      }
      if (matched.length > 0) map[r.title] = [...new Set(matched)];
    }
  }
  return map;
}

function boot() {
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

fetch('recipes.json')
  .then(r => r.json())
  .then(data => {
    recipes = { breakfast: [], lunch: [], dinner: [], snack: [] };
    data.recipes.forEach(r => {
      const cat = r.category;
      if (!recipes[cat]) return;
      const n = r.nutrition_per_serving;
      recipes[cat].push({
        title:      r.title,
        desc:       r.desc,
        time:       r.time,
        protein:    n.protein_g + 'g protein',
        kcal:       n.energy_kcal + ' kcal',
        servings:   r.servings,
        ingredients: r.ingredients,
        steps:      r.steps,
        tips:       r.benefits,
        nutrition:  n,
      });
    });
    boot();
    // URL deep-link
    const hash = window.location.hash.slice(1);
    if (hash) {
      for (const [cat, items] of Object.entries(recipes)) {
        const idx = items.findIndex(r =>
          r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === hash
        );
        if (idx !== -1) { openModal(cat, idx); break; }
      }
    }
  })
  .catch(err => console.error('Failed to load recipes:', err));

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
