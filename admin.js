// ─── Admin panel (lazy-loaded) ────────────────────────────────────────────────
// Depends on window.APP being set up by main.js before this script loads.

let _adminEditingId = null;

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

  body.querySelector('#af-add-ing').addEventListener('click', () => { ingsEl.appendChild(adminIngRow()); });
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

  return {
    title:        document.getElementById('af-title').value.trim(),
    category:     document.getElementById('af-cat').value,
    time_seconds: parseInt(document.getElementById('af-time').value) || null,
    servings:     parseInt(document.getElementById('af-servings').value) || 1,
    description:  document.getElementById('af-desc').value.trim(),
    notes:        document.getElementById('af-notes').value.trim(),
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
  window.APP.lockScroll();
}

function closeAdminModal() {
  document.getElementById('adminModal').close();
}

// ─── Event listeners ──────────────────────────────────────────────────────────
document.getElementById('adminModalClose').addEventListener('click', closeAdminModal);
document.getElementById('adminModal').addEventListener('click', e => {
  if (e.target === document.getElementById('adminModal')) closeAdminModal();
});
document.getElementById('adminModal').addEventListener('close', () => window.APP.unlockScroll());

document.getElementById('adminSaveBtn').addEventListener('click', async () => {
  const fields = readAdminForm();
  if (!fields.title) { showAdminError('Title is required.'); return; }
  if (!fields.category) { showAdminError('Category is required.'); return; }

  const btn = document.getElementById('adminSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const recipes = window.APP.recipes;
    if (_adminEditingId) {
      await window.SB.updateRecipe(_adminEditingId, fields);
      for (const [cat, items] of Object.entries(recipes)) {
        const idx = items.findIndex(r => r.id === _adminEditingId);
        if (idx !== -1) {
          const updated = { ...items[idx], ...fields, desc: fields.description, tips: fields.notes };
          recipes[cat][idx] = updated;
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
    window.APP.renderCards();
    window.APP.applyFilters();
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
  const recipes = window.APP.recipes;
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
    window.APP.renderCards();
    window.APP.applyFilters();
    closeAdminModal();
  } catch (err) {
    showAdminError(err.message || 'Delete failed.');
    btn.disabled = false;
    btn.textContent = 'Delete recipe';
  }
});

// ─── Export ───────────────────────────────────────────────────────────────────
window.APP.openAdminModal = openAdminModal;
