/**
 * Main Application Controller & Event Listeners
 */
function next() {
  cur = Q.length ? S.items.find(i => i.id == Q.shift()) : null;
  shown = false;
}

function add() {
  const g = k => $('#f' + k).value.trim();
  const a = g('a');
  const b = g('b');
  if (!a || (view == 'err' && !b)) {
    $('#fa').focus();
    return;
  }
  const e = edit && S.items.find(i => i.id == edit);
  if (e) Object.assign(e, { a, b, c: g('c'), tag: g('g') });
  else S.items.push({ id: Date.now(), type: view, a, b, c: g('c'), tag: g('g'), box: 0, due: 0 });
  edit = null;
  fo = true;
  save();
  render();
  $('#fa').focus();
}

function grade(ok) {
  const i = cur;
  i.box = ok ? Math.min((i.box || 0) + 1, 5) : 0;
  i.due = ok ? Date.now() + [0, 1, 3, 7, 14, 30][i.box] * 864e5 : 0;
  if (!ok) Q.push(i.id);
  save();
  next();
  render();
}

function initApp() {
  loadState();
  mig();
  initSync();
  localStorage.removeItem('mn-ai');
  localStorage.removeItem('mn-key');

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a],[data-v]');
    if (!el) return;
    const a = el.dataset.a;
    const id = +el.dataset.id;

    if (el.dataset.v) {
      view = el.dataset.v;
      edit = null;
      fo = false;
      q = '';
      tf = '';
      if (view != 'rev' || !cur) {}
      render();
      return;
    }

    if (a == 'fo') {
      const o = fo || edit || !S.items.some(i => i.type == view);
      fo = !o;
      edit = null;
      render();
      if (fo && $('#fa')) $('#fa').focus();
    } else if (a == 'add') add();
    else if (a == 'edit') {
      edit = id;
      render();
      if ($('#fa')) $('#fa').focus();
      scrollTo(0, 0);
    } else if (a == 'cancel') {
      edit = null;
      render();
    } else if (a == 'del') {
      if (el.dataset.sure) {
        S.items = S.items.filter(i => i.id != id);
        save();
        render();
      } else {
        el.dataset.sure = 1;
        el.textContent = 'Sure?';
      }
    } else if (a == 'rstart') {
      Q = due().map(i => i.id).sort(() => Math.random() - 0.5);
      next();
      view = 'rev';
      render();
    } else if (a == 'show') {
      shown = true;
      render();
    } else if (a == 'got') grade(1);
    else if (a == 'miss') grade(0);
    else if (a == 'cop') ctog(!CO);
    else if (a == 'cx') ctog(false);
    else if (a == 'cclr') {
      CH = [];
      cdraw();
    } else if (a == 'csend') csend();
    else if (a == 'cq') csend(el.dataset.t);
    else if (a == 'aiex') {
      $('#fc').value = LK.res.examples[+el.dataset.i];
      document.querySelectorAll('.sug').forEach(b => b.classList.toggle('on', b == el));
    } else if (a == 'aitr') {
      const b = $('#fb');
      b.value = (b.value ? b.value + '\n' : '') + LK.res.translation;
    } else if (a == 'aialt') {
      $('#fb').value = LK.res.alternatives[+el.dataset.i];
      document.querySelectorAll('.sug').forEach(b => b.classList.toggle('on', b == el));
    } else if (a == 'aitr2') {
      const b = $('#fc');
      b.value = (b.value ? b.value + '\n' : '') + LK.res.why_tr;
    } else if (a == 'aimore') fill(el, 1);
    else if (a == 'aichk') chk(el);
    else if (a == 'aiask') ask(el);
    else if (a == 'aifill') fill(el);
    else if (a == 'aie' || a == 'aic') aisave(a, +el.dataset.i, el);
    else if (a == 'aign') {
      S.items.push({ id: Date.now(), type: 'gra', a: AI.q.slice(0, 80), b: AI.ask, c: '', tag: '', box: 0, due: 0 });
      save();
      el.textContent = 'Saved';
      el.disabled = true;
    } else if (a == 'bk') {
      $('#bm').textContent = '';
      $('#bt').value = '';
      $('#bk').showModal();
    } else if (a == 'bkx') $('#bk').close();
    else if (a == 'exp') {
      $('#bt').value = JSON.stringify(S.items);
      $('#bm').textContent = S.items.length + ' entries ready to copy.';
    } else if (a == 'imp') {
      try {
        const r = JSON.parse($('#bt').value);
        if (!Array.isArray(r)) throw 0;
        const have = new Set(S.items.map(i => i.id));
        let n = 0;
        r.forEach(i => {
          if (i && i.id && !have.has(i.id)) {
            if (i.type == 'phr') i.type = 'col';
            if (T[i.type]) {
              S.items.push(i);
              n++;
            }
          }
        });
        save();
        render();
        $('#bm').textContent = n + ' entries imported.';
      } catch (x) {
        $('#bm').textContent = 'That does not look like a backup.';
      }
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id == 'sq') {
      q = e.target.value.toLowerCase();
      $('#items').innerHTML = rows();
    } else if (e.target.id == 'so') {
      so = e.target.value;
      $('#items').innerHTML = rows();
    } else if (e.target.id == 'fl') {
      tf = e.target.value;
      $('#items').innerHTML = rows();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key != 'Enter') return;
    if (e.target.id == 'cin' && !e.shiftKey) {
      e.preventDefault();
      csend();
    } else if (e.target.id == 'fa' && ['col', 'voc', 'err'].includes(view)) {
      e.preventDefault();
      fill($('[data-a=aifill]'));
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id == 'lang') {
      S.lang = t.value.trim();
      save();
    } else if (t.id == 'fa' && aiOn && ['col', 'voc'].includes(view)) {
      clearTimeout(lt);
      if (t.value.trim().length > 2) lt = setTimeout(() => fill({}), 1100);
    }
  });

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
