/**
 * LocalStorage & Account Synchronization
 */
function loadState() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) S = JSON.parse(r);
  } catch (e) {}
}

function mig() {
  S.items = S.items || [];
  S.items.forEach(i => {
    if (i.type == 'phr') i.type = 'col';
  });
}

function save() {
  S.t = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
  clearTimeout(timer);
  timer = setTimeout(() => {
    dbDoc && dbDoc.set({ data: JSON.stringify(S) }).catch(() => {});
  }, 800);
}

async function initSync() {
  try {
    const [db, user] = await Promise.all([
      window.claude.use('db'),
      window.claude.use('user')
    ]);
    if (!db || !user) return;
    const id = await user.id();
    const d = db.doc('data/users/' + id + '/notebook');
    const s = await d.get();
    dbDoc = d;
    if (s.exists) {
      const r = JSON.parse(s.data().data);
      if (r.t > S.t) {
        S = r;
        mig();
        try {
          localStorage.setItem(KEY, JSON.stringify(S));
        } catch (e) {}
        render();
      } else {
        save();
      }
    } else if (S.items.length) {
      save();
    }
    const syncEl = $('#sync');
    if (syncEl) syncEl.textContent = 'Synced to your account';
  } catch (e) {}
}
