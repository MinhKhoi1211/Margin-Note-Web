/**
 * UI View Rendering Functions
 */
const due = () => S.items.filter(i => RT.includes(i.type) && (i.due || 0) <= Date.now());
const tabs = [['today', 'Today'], ...Object.entries(T).map(([k, t]) => [k, t.n]), ['ai', 'AI tutor'], ['rev', 'Review']];

function render() {
  const d = due().length;
  const navEl = $('#nav');
  if (navEl) {
    navEl.innerHTML = tabs.map(([k, n]) => {
      const c = T[k] ? S.items.filter(i => i.type == k).length : (k == 'rev' && d ? `<b>${d}</b>` : '');
      return `<button data-v="${k}" aria-current="${k == view}">${n}<span class="n">${c}</span></button>`;
    }).join('');
  }
  
  const mainEl = $('#main');
  if (mainEl) {
    mainEl.innerHTML = view == 'today' ? today() : view == 'rev' ? review() : view == 'ai' ? aiView() : list();
  }
  
  if (T[view] && edit) {
    const e = S.items.find(i => i.id == edit);
    if (e) {
      if ($('#fa')) $('#fa').value = e.a;
      if ($('#fb')) $('#fb').value = e.b || '';
      if ($('#fc')) $('#fc').value = e.c || '';
      if ($('#fg')) $('#fg').value = e.tag || '';
    }
  }
}

function today() {
  const n = k => S.items.filter(i => i.type == k).length;
  const d = due().length;
  const E = {};
  S.items.filter(i => i.type == 'err').forEach(i => {
    const g = i.tag || 'untagged';
    E[g] = (E[g] || 0) + 1;
  });
  const mx = Math.max(1, ...Object.values(E));
  const learned = S.items.filter(i => i.box >= 4).length;
  const pool = S.items.filter(i => i.type != 'gra').sort((x, y) => x.id - y.id);
  const p = pool.length ? pool[Math.floor(Date.now() / 864e5) % pool.length] : null;
  const hero = p
    ? `<div class="pick"><p class="hint">Back from your notebook</p>${
        p.type == 'err'
          ? `<p class="bad">${esc(p.a)}</p><p class="good">${esc(p.b)}</p>`
          : `<p class="big"><mark>${esc(p.a)}</mark></p>${p.b ? `<p class="def">${esc(p.b)}</p>` : ''}${p.c ? `<p class="ex">${esc(p.c)}</p>` : ''}`
      }</div>`
    : '<p class="empty">Your notebook is empty. Start with one collocation or one mistake from today.</p>';

  return `<h2>Today</h2>${hero}
<div class="due"><p>${d ? `<b>${d}</b> card${d > 1 ? 's' : ''} due for review` : 'Nothing due right now'}${learned ? `, ${learned} learned so far` : ''}.</p>${d ? '<button class="pri" data-a="rstart">Start review</button>' : ''}</div>
<h3>Jump to</h3><div class="stats">${Object.entries(T).map(([k, t]) => `<button data-v="${k}">${t.n}<b>${n(k)}</b></button>`).join('')}</div>
<h3>Where my mistakes come from</h3>${
    Object.keys(E).length
      ? Object.entries(E).sort((a, b) => b[1] - a[1]).map(([g, c]) => `<div class="bar"><span>${esc(g)}</span><i style="width:${(c / mx) * 100}%"></i><em>${c}</em></div>`).join('')
      : '<p class="empty">Log a few errors and your patterns will show up here.</p>'
  }`;
}

function list() {
  const t = T[view];
  const used = [...new Set(S.items.filter(i => i.type == view && i.tag).map(i => i.tag))];
  const open = fo || edit || !S.items.some(i => i.type == view);
  return `<div class="top"><h2>${t.n}</h2><button class="pri" data-a="fo">${open ? 'Hide form' : 'New entry'}</button></div>${
    open
      ? `<div class="add">
<label>${t.l[0]}<input id="fa" placeholder="${esc(t.ph)}" autocomplete="off"></label>
<div id="lk" class="lk">${lkHTML()}</div>
<label>${t.l[1]}<textarea id="fb" rows="2"></textarea></label>
<label>${t.l[2]}<textarea id="fc" rows="2"></textarea></label>
<label>Tag<input id="fg" list="tl" autocomplete="off"><datalist id="tl">${[...new Set([...t.tags, ...used])].map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
<div class="act">${view != 'gra' ? `<button class="sec" data-a="aifill">${view == 'err' ? 'Suggest correction' : 'Look up'}</button>` : ''}<button class="pri" data-a="add">${edit ? 'Save changes' : 'Add to notebook'}</button>${edit ? '<button class="sec" data-a="cancel">Cancel</button>' : ''}</div></div>`
      : ''
  }
<div class="filt"><input id="sq" type="search" placeholder="Search" value="${esc(q)}" aria-label="Search"><select id="fl" aria-label="Filter by tag"><option value="">All tags</option>${used.map(x => `<option${x == tf ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select><select id="so" aria-label="Sort"><option value="">Newest</option><option value="az"${so == 'az' ? ' selected' : ''}>A to Z</option><option value="tag"${so == 'tag' ? ' selected' : ''}>By tag</option></select></div>
<div id="items">${rows()}</div>`;
}

function rows() {
  const r = S.items
    .filter(i => i.type == view && (!tf || i.tag == tf) && (!q || (i.a + i.b + i.c + (i.tag || '')).toLowerCase().includes(q)))
    .sort(
      so == 'az'
        ? (x, y) => x.a.localeCompare(y.a)
        : so == 'tag'
        ? (x, y) => (x.tag || '~').localeCompare(y.tag || '~') || y.id - x.id
        : (x, y) => y.id - x.id
    );
  return r.length ? r.map(row).join('') : `<p class="empty">${S.items.some(i => i.type == view) ? 'Nothing matches.' : EMPTY[view]}</p>`;
}

function row(i) {
  const pos = i.tag ? `<i class="pos">${esc(i.tag)}</i>` : '';
  const body =
    i.type == 'err'
      ? `<div class="diff"><p class="bad">${esc(i.a)}</p><p class="good">${esc(i.b)}</p></div>${i.c || i.tag ? `<p class="why">${pos}${esc(i.c)}</p>` : ''}`
      : `<p class="head"><mark>${esc(i.a)}</mark>${pos}</p>${i.b ? `<p class="def">${esc(i.b)}</p>` : ''}${i.c ? `<p class="ex">${esc(i.c)}</p>` : ''}`;
  return `<div class="row">${body}<div class="meta"><span>${new Date(i.id).toLocaleDateString()}</span>${i.box >= 4 ? '<span class="ok">learned</span>' : ''}<button class="lnk" data-a="edit" data-id="${i.id}">Edit</button><button class="lnk" data-a="del" data-id="${i.id}">Delete</button></div></div>`;
}

function review() {
  const d = due().length;
  if (!cur)
    return `<h2>Review</h2><p class="lead">${d ? `${d} card${d > 1 ? 's' : ''} due.` : 'All caught up. Come back tomorrow, or add more entries.'}</p>${d ? '<button class="pri" data-a="rstart">Start</button>' : ''}`;
  const i = cur;
  const f =
    i.type == 'err'
      ? `<p class="hint">Fix this sentence</p><p class="big bad">${esc(i.a)}</p>`
      : i.type == 'col' && !/idiom|phrasal/.test(i.tag || '')
      ? `<p class="hint">Complete the collocation${i.b ? ': ' + esc(i.b) : ''}</p><p class="big">${esc(i.a.split(' ')[0])} &hellip;</p>`
      : `<p class="hint">What does it mean?</p><p class="big">${esc(i.a)}</p>`;
  const b =
    i.type == 'err'
      ? `<p class="good">${esc(i.b)}</p>${i.c ? `<p class="why">${esc(i.c)}</p>` : ''}`
      : `<p class="head"><mark>${esc(i.a)}</mark></p>${i.b ? `<p>${esc(i.b)}</p>` : ''}${i.c ? `<p class="ex">${esc(i.c)}</p>` : ''}`;
  return `<h2>Review</h2><p class="hint">${Q.length} more after this one</p><div class="card">${f}${shown ? `<hr>${b}` : ''}</div>
<div class="act">${shown ? '<button class="sec" data-a="miss">Missed it</button><button class="pri" data-a="got">Got it</button>' : '<button class="pri" data-a="show">Show answer</button>'}</div>`;
}

function lkHTML() {
  const E = view == 'err';
  const r = LK && $('#fa') && LK.a == $('#fa').value.trim() ? LK.res : null;
  const L = `<label class="lg">${E ? 'Also explain in' : 'Translate into'} <input id="lang" list="lgs" placeholder="e.g. Vietnamese" value="${esc(S.lang || '')}" autocomplete="off"></label>`;
  if (!r) return `<p class="hint">${E ? 'Type the sentence you got wrong, then press Suggest correction (or Enter) to get a fixed version and a simple explanation.' : 'Type a word or phrase, then press Look up (or Enter) for the meaning, a translation and example ideas.'}</p>${L}`;
  const AT = LK && LK.auto && r.tag ? `<p class="hint">Tag added automatically: <b>${esc(r.tag)}</b>. You can change it below.</p>` : '';
  if (E) return `<div class="lkb">${AT}<p class="good">${esc(r.corrected)}</p><p>${esc(r.why)}</p>${r.why_tr ? `<p>${esc(r.why_tr)} <button class="lnk" data-a="aitr2">Add to explanation</button></p>` : ''}${(r.alternatives || []).length ? '<p class="hint">Other natural ways to say it. Tap one to use it.</p>' + r.alternatives.map((e, i) => `<button class="sug" data-a="aialt" data-i="${i}">${esc(e)}</button>`).join('') + '<div><button class="lnk" data-a="aimore">More alternatives</button></div>' : ''}</div>${L}`;
  return `<div class="lkb">${AT}<p class="head">${esc(LK.a)}<i class="pos">${esc(r.pos)}${r.ipa ? ' ' + esc(r.ipa) : ''}</i></p><p class="def">${esc(r.meaning)}</p>${r.translation ? `<p>${esc(r.translation)} <button class="lnk" data-a="aitr">Add to meaning</button></p>` : S.lang ? '' : '<p class="hint">Set your language below to see a translation.</p>'}
<p class="hint">Example suggestions. Tap one to use it.</p>${(r.examples || []).map((e, i) => `<button class="sug" data-a="aiex" data-i="${i}">${esc(e)}</button>`).join('')}<div><button class="lnk" data-a="aimore">More examples</button></div></div>${L}`;
}

function aiView() {
  const r = AI;
  let out = '';
  if (r && r.err) out = `<p class="empty">${esc(r.err)}</p>`;
  else if (r && r.ask != null) out = `<div class="out">${esc(r.ask)}</div>${r.done ? '<div class="act" style="margin-top:8px"><button class="sec" data-a="aign">Save to Grammar notes</button></div>' : ''}`;
  else if (r && r.res) {
    const x = r.res;
    out =
      `<h3>Corrected</h3><p class="good">${esc(x.corrected)}</p>` +
      (x.errors && x.errors.length
        ? '<h3>What to fix</h3>' +
          x.errors.map((e, i) => `<div class="row"><div class="diff"><p class="bad">${esc(e.wrong)}</p><p class="good">${esc(e.right)}</p></div><p class="why"><i class="pos">${esc(e.tag)}</i>${esc(e.why)}</p><div class="meta"><button class="lnk" data-a="aie" data-i="${i}">Add to error log</button></div></div>`).join('')
        : '<p class="empty">No mistakes found. Nice.</p>') +
      (x.collocations && x.collocations.length
        ? '<h3>Worth saving</h3>' +
          x.collocations.map((c, i) => `<div class="row"><p class="head"><mark>${esc(c.phrase)}</mark></p><p class="def">${esc(c.meaning)}</p><p class="ex">${esc(c.example)}</p><div class="meta"><button class="lnk" data-a="aic" data-i="${i}">Save to collocations</button></div></div>`).join('')
        : '');
  }
  return `<h2>AI tutor</h2><div class="add ai"><label>Write a sentence, a paragraph, or a question<textarea id="ait" rows="5" placeholder="e.g. Yesterday I have went to the market for buy some vegetable.">${esc(AIt)}</textarea></label><div class="act"><button class="sec" data-a="aiask">Ask the tutor</button><button class="pri" data-a="aichk">Check my English</button></div></div><div id="aiout">${out}</div>`;
}
