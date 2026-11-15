/* Режим мастера «Малинка»: тексты, фото на странице, каталог (цены, описания, фото, добавить, скрыть, удалить).
   Демо (MASTER_URL пуст): изменения хранятся только в этом браузере. */
(function () {
  const V = window.ML, D = V.D, esc = V.esc;
  const deep = x => JSON.parse(JSON.stringify(x));
  let dirty = false, on = false;
  const F = "'Golos Text',system-ui,sans-serif";

  const css = `
.ms-bar{position:fixed;left:0;right:0;top:0;z-index:300;background:#3A0C1F;color:#fff;font:500 14px/1.3 ${F};padding:8px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.25)}
.ms-bar[hidden],.ms-toast[hidden]{display:none!important}
.ms-bar b{font-weight:600;margin-right:auto}.ms-bar small{opacity:.75;display:block;font-weight:400}
.ms-bar button,.ms-ui button,.ms-dlg button{font:600 14px/1 ${F};border:0;border-radius:999px;padding:10px 14px;cursor:pointer;background:#fff;color:#3A0C1F}
.ms-bar .ms-save{background:#F6C3D3}.ms-bar .ms-save.dirty{background:#fff;box-shadow:0 0 0 3px #C8235A}
body.ms{padding-top:58px}body.ms .hd{top:58px}body.ms .mock{display:none}
body.ms [data-k]{outline:1.5px dashed rgba(200,35,90,.55);outline-offset:3px;border-radius:3px;cursor:text}
body.ms [data-k]:focus{outline:2px solid #C8235A;background:rgba(255,255,255,.7)}
body.ms [data-ik]{outline:4px dashed #F2CB66;outline-offset:-4px;cursor:pointer}
body.ms .card{outline:2px dashed rgba(200,35,90,.35);outline-offset:-2px}
body.ms .card.off::after{content:"скрыт";position:absolute;right:10px;top:10px;background:#3A0C1F;color:#fff;font-size:12px;padding:3px 9px;border-radius:999px}
.ms-ui{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.ms-ui button{background:#C8235A;color:#fff;box-shadow:0 4px 12px rgba(200,35,90,.3)}
.ms-ui p{flex-basis:100%;font:14px/1.4 ${F};color:#6D5660;margin:0}
.ms-dlg{margin:auto;border:0;border-radius:20px;padding:0;width:min(680px,calc(100vw - 20px));max-height:calc(100vh - 20px);color:#2C1820;font:15px/1.4 ${F}}
.ms-dlg::backdrop{background:rgba(30,8,18,.55)}
.ms-dlg .in{padding:18px 16px 0}.ms-dlg h3{font:600 20px/1.2 ${F};margin:0 0 6px}.ms-dlg .hint{font-size:13px;opacity:.7;margin:0 0 12px}
.ms-dlg .ft{position:sticky;bottom:0;background:#fff;display:flex;gap:8px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #eee;margin-top:14px}
.ms-dlg .ft .ok{background:#C8235A;color:#fff}.ms-dlg .ft button{background:#F6E6EB}.ms-dlg .ft .del{margin-right:auto;background:#fff;color:#b3261e;box-shadow:inset 0 0 0 1.5px #e7b4b0}
.ms-dlg input,.ms-dlg textarea,.ms-dlg select{font:inherit;width:100%;border:1px solid #E6C9D2;border-radius:10px;padding:9px 10px;background:#fff;color:inherit;box-sizing:border-box}
.ms-dlg textarea{min-height:90px;resize:vertical}
.ms-f{display:block;margin-bottom:12px}.ms-f>span{display:block;font-size:13px;opacity:.75;margin-bottom:4px}
.ms-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ms-tags{display:flex;flex-wrap:wrap;gap:6px}.ms-tags label{display:inline-flex;gap:6px;align-items:center;background:#FDEEF1;border-radius:999px;padding:6px 11px;font-size:14px;cursor:pointer}.ms-tags input{width:auto}
.ms-chk{display:flex;gap:8px;align-items:center;margin:4px 0 8px;font-size:15px}.ms-chk input{width:20px;height:20px}
.ms-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
.ms-th{position:relative;border-radius:12px;overflow:hidden;background:#FDEEF1}
.ms-th img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}
.ms-th div{display:flex;justify-content:space-between;padding:5px}
.ms-th div button{padding:7px 10px;background:#fff;font-size:13px}
.ms-th span{position:absolute;left:6px;top:6px;background:rgba(0,0,0,.55);color:#fff;font-size:12px;border-radius:8px;padding:2px 7px}
.ms-add{background:#F6E6EB!important;margin-top:10px}
.ms-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:310;background:#3A0C1F;color:#fff;padding:12px 16px;border-radius:14px;font:14px/1.4 ${F};max-width:calc(100vw - 32px);box-shadow:0 10px 30px rgba(0,0,0,.3)}
@media(max-width:600px){.ms-2{grid-template-columns:1fr}.ms-bar{flex-wrap:nowrap;gap:6px;padding:8px}.ms-bar small{display:none}.ms-bar b{font-size:13px}.ms-bar button{padding:9px 10px;font-size:13px}.ms-bar .lg{display:none}body.ms{padding-top:52px}body.ms .hd{top:52px}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const bar = document.createElement('div'); bar.className = 'ms-bar'; bar.hidden = true;
  bar.innerHTML = '<b>Мастер<span class="lg">: режим правки</span><small>Нажмите на текст, чтобы изменить. Фото с жёлтой рамкой можно заменить. Букеты в каталоге открываются для правки</small></b><button class="ms-save" type="button">Сохранить</button><button class="ms-reset" type="button">Отменить<span class="lg"> правки</span></button><button class="ms-exit" type="button">Выйти</button>';
  document.body.appendChild(bar);
  const toast = document.createElement('div'); toast.className = 'ms-toast'; toast.hidden = true; document.body.appendChild(toast);
  let tt; const say = (t, ms) => { toast.textContent = t; toast.hidden = false; clearTimeout(tt); tt = setTimeout(() => toast.hidden = true, ms || 4000); };

  // ---- фото: уменьшаем перед сохранением ----
  function pickFiles(multi) {
    return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = !!multi; i.onchange = () => res([...i.files]); i.click(); });
  }
  function shrink(file, W) {
    return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image();
      im.onload = () => { const k = Math.min(1, W / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .82)); };
      im.onerror = () => rej(new Error('Не удалось открыть фото')); im.src = u; });
  }
  const btn = (t, f, cls) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = f; if (cls) b.className = cls; return b; };
  const move = (a, i, d) => { const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; };
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---- каталог ----
  const work = () => { if (!D.cat) D.cat = deep(V.cat()); return D.cat; };
  const SEC = V.SEC, TAGS = V.TAGS;
  function editItem(orig, isNew) {
    const list = work(), idx = list.findIndex(c => String(c.id) === String(orig.id));
    const it = deep(idx >= 0 ? list[idx] : orig); it.g = it.g || []; it.ph = it.ph || [];
    const d = document.createElement('dialog'); d.className = 'ms-dlg';
    d.innerHTML = `<div class="in"><h3>${isNew ? 'Новая работа' : 'Работа в каталоге'}</h3><p class="hint">Цену можно писать как 3000, от 3 000 ₽ или 1 500 ₽/кг</p>
<label class="ms-f"><span>Название</span><input data-f="t" maxlength="120"></label>
<div class="ms-2"><label class="ms-f"><span>Цена</span><input data-f="p" maxlength="40"></label><label class="ms-f"><span>Размер или состав, коротко</span><input data-f="m" maxlength="80" placeholder="например, 25 см, 19 цветов"></label></div>
<label class="ms-f"><span>Раздел каталога</span><select data-f="s">${SEC.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join('')}</select></label>
<label class="ms-f"><span>Описание</span><textarea data-f="d" maxlength="1500"></textarea></label>
<div class="ms-f"><span>Кому подходит</span><div class="ms-tags">${TAGS.map(([k, n]) => `<label><input type="checkbox" value="${esc(k)}">${esc(n)}</label>`).join('')}</div></div>
<label class="ms-chk"><input type="checkbox" data-hide>Скрыть с сайта (работа останется здесь, её можно вернуть)</label>
<div class="ms-f"><span>Фото, первое будет на карточке</span><div class="ph"></div></div></div>
<div class="ft"><button type="button" class="del">Удалить</button><button type="button" class="no">Отмена</button><button type="button" class="ok">Готово</button></div>`;
    document.body.appendChild(d);
    d.querySelectorAll('[data-f]').forEach(el => { el.value = it[el.dataset.f] || ''; el.oninput = () => it[el.dataset.f] = el.value; });
    if (!it.s) { it.s = SEC[0][0]; d.querySelector('[data-f=s]').value = it.s; }
    d.querySelectorAll('.ms-tags input').forEach(c => { c.checked = it.g.includes(c.value); c.onchange = () => { it.g = [...d.querySelectorAll('.ms-tags input:checked')].map(x => x.value); }; });
    const hide = d.querySelector('[data-hide]'); hide.checked = !!it.h; hide.onchange = () => { if (hide.checked) it.h = 1; else delete it.h; };
    const phBox = d.querySelector('.ph');
    function drawPh() {
      phBox.innerHTML = '<div class="ms-thumbs"></div>'; const g = phBox.firstChild;
      it.ph.forEach((v, i) => { const t = document.createElement('div'); t.className = 'ms-th';
        t.innerHTML = `<img src="${esc(V.SRC(it, v))}" alt=""><span>${i + 1}</span><div></div>`;
        t.lastChild.append(btn('←', () => { move(it.ph, i, -1); drawPh(); }), btn('×', () => { it.ph.splice(i, 1); drawPh(); }), btn('→', () => { move(it.ph, i, 1); drawPh(); }));
        g.appendChild(t); });
      phBox.appendChild(btn('+ Добавить фото', async () => { const fs = await pickFiles(true); for (const f of fs) { try { it.ph.push(await shrink(f, 1400)); } catch (e) { say(e.message); } } drawPh(); }, 'ms-add'));
    }
    drawPh();
    const close = () => { d.close(); d.remove(); };
    d.querySelector('.no').onclick = close; d.addEventListener('cancel', () => d.remove());
    const del = d.querySelector('.del');
    if (isNew) del.hidden = true;
    del.onclick = () => { if (!window.confirm('Удалить эту работу с сайта насовсем? Если хотите убрать на время, лучше отметьте «Скрыть с сайта»')) return; list.splice(idx, 1); V.setCat(list); markDraft(); close(); say('Работа удалена. Не забудьте нажать «Сохранить»'); };
    d.querySelector('.ok').onclick = () => {
      it.t = it.t.trim(); it.p = (it.p || '').trim();
      if (/^\d[\d\s]*$/.test(it.p)) it.p = (+it.p.replace(/\s/g, '')).toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';
      if (!it.t) { say('Напишите название'); return; }
      if (!it.ph.length) { say('Добавьте хотя бы одно фото'); return; }
      if (idx >= 0) list[idx] = it; else list.unshift(it);
      V.setCat(list); markDraft(); close();
    };
    d.showModal();
  }
  function addUi() {
    if (document.querySelector('.ms-ui')) return;
    const u = document.createElement('div'); u.className = 'ms-ui';
    u.append(btn('+ Добавить работу', () => { const t = document.querySelector('#tabs .tab.on'); const s = t && t.dataset.s !== 'all' ? t.dataset.s : SEC[0][0];
      editItem({id: 'u' + rid(), s, t: '', p: '', m: '', d: '', g: [], ph: []}, true); }));
    const p = document.createElement('p'); p.textContent = 'Нажмите на любую работу, чтобы поменять цену, название, описание или фото, скрыть или удалить её. Скрытые работы видны только вам';
    u.appendChild(p);
    const tabs = document.getElementById('tabs'); tabs.parentNode.insertBefore(u, tabs);
  }
  window.MLEDIT = c => editItem(c, false);

  // ---- тексты и фото на странице ----
  function onInput(e) { const el = e.target.closest('[data-k]'); if (!el || !on) return; D.t[el.dataset.k] = V.clean(el.innerHTML); markDraft(); }
  function onKey(e) { if (on && e.key === 'Enter' && e.target.closest('[data-k]')) { e.preventDefault(); e.target.blur(); } }
  function onPaste(e) { if (!on || !e.target.closest('[data-k]')) return; e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ')); }
  async function onClick(e) {
    if (!on) return;
    if (e.target.closest('.ms-bar,.ms-dlg,.ms-ui')) return;
    const k = e.target.closest('[data-k]'), im = e.target.closest('[data-ik]');
    if (k) { e.preventDefault(); e.stopPropagation(); return; }
    if (im) { e.preventDefault(); e.stopPropagation(); const [f] = await pickFiles(); if (!f) return;
      try { const u = await shrink(f, 1400); D.img[im.dataset.ik] = u; im.src = u; im.removeAttribute('width'); im.removeAttribute('height'); markDraft(); } catch (er) { say(er.message); } }
  }
  document.addEventListener('input', onInput, true); document.addEventListener('keydown', onKey, true);
  document.addEventListener('paste', onPaste, true); document.addEventListener('click', onClick, true);

  // ---- вход, черновик, сохранение ----
  const LIVE = !!V.MASTER_URL, TKEY = 'ml-tok-v1', DKEY = 'ml-draft-v1';
  const LS = {get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }, del: k => { try { localStorage.removeItem(k); } catch (e) {} }};
  const tok = () => { const t = LS.get(TKEY); return t && t.exp > Date.now() ? t : null; };
  let baseRev = D.rev || 0, warned = false;
  function markDraft() {
    dirty = true; bar.querySelector('.ms-save').classList.add('dirty');
    if (!LIVE) return;
    if (!LS.set(DKEY, {base: baseRev, d: D}) && !warned) { warned = true; say('Черновик не помещается в память браузера. Нажмите «Сохранить», чтобы правки не пропали', 7000); }
  }
  async function api(body) {
    const r = await fetch(V.MASTER_URL, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(body), signal: AbortSignal.timeout(120000)});
    return r.json();
  }
  function loginDlg() {
    const d = document.createElement('dialog'); d.className = 'ms-dlg';
    d.innerHTML = '<form class="in" method="dialog"><h3>Вход для мастера</h3><p class="hint">Здесь можно менять тексты, цены, фото и работы на сайте</p><input type="password" autocomplete="current-password" placeholder="Пароль" required><p class="hint err" style="color:#b3261e;min-height:1.4em;margin-top:8px"></p><div class="ft" style="margin:0 -16px"><button type="button" class="no">Закрыть</button><button type="submit" class="ok">Войти</button></div></form>';
    document.body.appendChild(d); d.showModal();
    const f = d.querySelector('form'), pw = f.querySelector('input'), er = f.querySelector('.err'), b = f.querySelector('.ok');
    d.querySelector('.no').onclick = () => { d.close(); d.remove(); };
    d.addEventListener('cancel', () => d.remove());
    f.onsubmit = async e => {
      e.preventDefault(); b.disabled = true; b.textContent = 'Проверяю...'; er.textContent = '';
      try {
        const r = await api({a: 'login', pw: pw.value});
        if (r.ok) { LS.set(TKEY, {token: r.token, exp: r.exp}); d.close(); d.remove(); enter(); return; }
        er.textContent = r.err === 'locked' ? 'Слишком много попыток, подождите 15 минут' : 'Неверный пароль';
      } catch (x) { er.textContent = 'Нет связи, попробуйте ещё раз'; }
      b.disabled = false; b.textContent = 'Войти';
    };
  }
  function enter() {
    if (on) return;
    if (LIVE && !tok()) { loginDlg(); return; }
    on = true; window.MLON = true; bar.hidden = false; document.body.classList.add('ms');
    if (LIVE) { const dr = LS.get(DKEY); if (dr && dr.d && dr.base === baseRev) { Object.assign(D, dr.d); V.applyText(); dirty = true; bar.querySelector('.ms-save').classList.add('dirty'); } else if (dr) LS.del(DKEY); }
    V.setCat(D.cat || V.cat()); V.showAll();
    document.querySelectorAll('[data-k]').forEach(el => { el.contentEditable = 'plaintext-only'; if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true'; el.spellcheck = true; });
    document.querySelectorAll('main a,footer a').forEach(a => a.draggable = false);
    document.querySelectorAll('main details').forEach(d => d.open = true);
    document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
    addUi();
    try { sessionStorage.setItem('ml-ms', '1'); } catch (e) {}
    say(LIVE ? (dirty ? 'Есть несохранённые правки с прошлого раза. Нажмите «Сохранить», чтобы их увидели все' : 'Вы в режиме мастера. Меняйте, потом нажмите «Сохранить»') : 'Демо режима мастера: изменения сохранятся только в этом браузере', 6500);
  }
  async function save(force) {
    const sb = bar.querySelector('.ms-save');
    if (!LIVE) {
      D.rev = (D.rev || 0) + 1;
      try { localStorage.setItem(V.DEMO_KEY, JSON.stringify(D)); }
      catch (e) { D.rev--; say('Не хватило места в браузере для новых фото. На готовом сайте фото сохраняются без ограничений', 7000); return; }
      dirty = false; sb.classList.remove('dirty'); say('Сохранено. В демо изменения видны только в этом браузере'); return;
    }
    const t = tok(); if (!t) { say('Вход устарел, войдите ещё раз'); on = false; loginDlg(); return; }
    sb.disabled = true; sb.textContent = 'Сохраняю...';
    // новые фото (data:) уходят файлами в img/u, в данных остаётся путь
    const files = [], map = {};
    const fix = v => { if (typeof v === 'string' && v.startsWith('data:image/')) { if (!map[v]) { map[v] = 'img/u/' + rid() + '.jpg'; files.push({path: map[v], b64: v.split(',')[1]}); } return map[v]; } if (Array.isArray(v)) return v.map(fix); if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = fix(v[k]); return o; } return v; };
    const data = fix(deep(D)); data.v = 1;
    try {
      const r = await api({a: 'save', token: t.token, base: baseRev, force: !!force, data, files});
      if (r.ok) {
        Object.assign(D, fix(D)); D.rev = data.rev = baseRev = r.rev;
        if (D.cat) V.setCat(D.cat);
        try { sessionStorage.setItem('ml-pub', JSON.stringify(data)); } catch (e) {}
        LS.del(DKEY); dirty = false; sb.classList.remove('dirty');
        say('Сохранено! Все посетители увидят изменения через 1-2 минуты', 6000);
      } else if (r.err === 'conflict') {
        if (window.confirm('Сайт уже изменили с другого устройства. Записать вашу версию поверх?')) { sb.disabled = false; sb.textContent = 'Сохранить'; return save(true); }
      } else if (r.err === 'auth') { LS.del(TKEY); on = false; say('Вход устарел, войдите ещё раз'); loginDlg(); }
      else say('Не получилось сохранить (' + r.err + '). Правки остались в черновике, попробуйте ещё раз', 7000);
    } catch (x) { say('Нет связи, правки остались в черновике. Попробуйте ещё раз', 7000); }
    sb.disabled = false; sb.textContent = 'Сохранить';
  }
  bar.querySelector('.ms-save').onclick = () => save(false);
  bar.querySelector('.ms-reset').onclick = () => {
    if (LIVE) { if (!window.confirm('Отменить несохранённые правки? Сайт вернётся к последней сохранённой версии')) return; LS.del(DKEY); dirty = false; location.reload(); return; }
    if (!window.confirm('Убрать все ваши изменения и вернуть сайт как было?')) return; try { localStorage.removeItem(V.DEMO_KEY); sessionStorage.removeItem('ml-ms'); } catch (e) {} dirty = false; location.href = location.pathname; };
  bar.querySelector('.ms-exit').onclick = () => { if (dirty && !window.confirm('Есть несохранённые изменения. Выйти без сохранения?')) return; dirty = false; LS.del(TKEY); try { sessionStorage.removeItem('ml-ms'); } catch (e) {} location.href = location.pathname; };
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  window.MLM = enter; enter();
})();
