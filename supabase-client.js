// ─── Supabase integration ────────────────────────────────────────────────────
// Anonymous likes (device UUID) + Google OAuth + favourites cloud sync
// All public state exposed on window.SB for main.js consumption.

const SUPABASE_URL = 'https://afnbnxfqwzwvofgxztzq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SswLHSc2_002aFVTGUwgZQ_uEuQNRqQ';

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Device ID ───────────────────────────────────────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
  }
  return id;
}

// ─── Likes state ─────────────────────────────────────────────────────────────
const _likeCounts = {};     // recipeId (int) → count (int)
const _likedByDevice = new Set(); // set of recipeIds this device has liked

async function loadLikes(recipeIds) {
  if (!recipeIds || !recipeIds.length) return;
  const deviceId = getDeviceId();

  const [allRes, myRes] = await Promise.all([
    _sb.from('recipe_likes').select('recipe_id').in('recipe_id', recipeIds),
    _sb.from('recipe_likes').select('recipe_id').in('recipe_id', recipeIds).eq('device_id', deviceId),
  ]);

  if (allRes.data) {
    // Reset then recount
    recipeIds.forEach(id => { _likeCounts[id] = 0; });
    allRes.data.forEach(row => { _likeCounts[row.recipe_id] = (_likeCounts[row.recipe_id] || 0) + 1; });
  }

  _likedByDevice.clear();
  if (myRes.data) {
    myRes.data.forEach(row => _likedByDevice.add(row.recipe_id));
  }
}

async function toggleLike(recipeId) {
  const deviceId = getDeviceId();
  const liked = _likedByDevice.has(recipeId);

  // Optimistic update
  if (liked) {
    _likedByDevice.delete(recipeId);
    _likeCounts[recipeId] = Math.max(0, (_likeCounts[recipeId] || 1) - 1);
  } else {
    _likedByDevice.add(recipeId);
    _likeCounts[recipeId] = (_likeCounts[recipeId] || 0) + 1;
  }

  // Persist
  if (liked) {
    await _sb.from('recipe_likes').delete()
      .eq('recipe_id', recipeId).eq('device_id', deviceId);
  } else {
    await _sb.from('recipe_likes').upsert({ recipe_id: recipeId, device_id: deviceId });
  }

  return getLikeState(recipeId);
}

function getLikeState(recipeId) {
  return {
    count: _likeCounts[recipeId] || 0,
    liked: _likedByDevice.has(recipeId),
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
let _currentUser = null;

function getCurrentUser() { return _currentUser; }

async function signInWithGoogle() {
  await _sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

async function signOut() {
  await _sb.auth.signOut();
}

// ─── Favourites cloud sync ────────────────────────────────────────────────────
// Provided by main.js after recipes load: recipeTitle → recipeId
let _recipeIdMap = {};

function setRecipeIdMap(map) { _recipeIdMap = map; }

async function pushFavourites(titlesSet) {
  if (!_currentUser) return;
  const ids = [...titlesSet].map(t => _recipeIdMap[t]).filter(Boolean);
  if (!ids.length) return;
  await _sb.from('user_favourites').upsert(
    ids.map(recipe_id => ({ user_id: _currentUser.id, recipe_id }))
  );
}

async function pullFavouriteIds() {
  if (!_currentUser) return [];
  const { data } = await _sb.from('user_favourites')
    .select('recipe_id').eq('user_id', _currentUser.id);
  return (data || []).map(row => row.recipe_id);
}

// ─── Auth UI ──────────────────────────────────────────────────────────────────
function _renderAuthBtn() {
  const btn = document.getElementById('authBtn');
  if (!btn) return;
  if (_currentUser) {
    const meta = _currentUser.user_metadata || {};
    const name = (meta.full_name || meta.name || _currentUser.email || '').split(' ')[0];
    const avatar = meta.avatar_url;
    btn.innerHTML = avatar
      ? `<img class="auth-avatar" src="${avatar}" alt="${name}" referrerpolicy="no-referrer"><span class="auth-name">${name}</span>`
      : `<span class="auth-name">${name}</span>`;
    btn.title = 'Sign out';
    btn.setAttribute('aria-label', `Signed in as ${name} — click to sign out`);
    btn.onclick = signOut;
    btn.classList.add('signed-in');
  } else {
    btn.innerHTML = 'Sign in';
    btn.title = 'Sign in with Google to sync favourites';
    btn.setAttribute('aria-label', 'Sign in with Google');
    btn.onclick = signInWithGoogle;
    btn.classList.remove('signed-in');
  }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// Called by main.js once the DOM is ready.
async function initSupabase(onUserChange) {
  const { data: { session } } = await _sb.auth.getSession();
  _currentUser = session?.user || null;
  _renderAuthBtn();

  _sb.auth.onAuthStateChange(async (event, session) => {
    const prev = _currentUser;
    _currentUser = session?.user || null;
    _renderAuthBtn();
    if (onUserChange) onUserChange(event, _currentUser, prev);
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────
window.SB = {
  loadLikes,
  toggleLike,
  getLikeState,
  getCurrentUser,
  signInWithGoogle,
  signOut,
  setRecipeIdMap,
  pushFavourites,
  pullFavouriteIds,
  initSupabase,
};
