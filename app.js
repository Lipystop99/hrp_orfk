(function () {
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('open');
      document.body.classList.toggle('menu-open', nav.classList.contains('open'));
    });
  }

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  const officersWrap = document.querySelector('[data-officers]');
  if (officersWrap && window.officers !== undefined) renderOfficers(officersWrap);

  if (document.querySelector('[data-penalty-app]')) initPenaltyApp();

  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      showToast('A mintaoldalon a belépés nincs háttérrendszerhez kötve.');
    });
  }
})();

function renderOfficers(wrap) {
  wrap.innerHTML = officers.map(o => `
    <article class="officer-card">
      <div class="avatar">${o.callSign}</div>
      <div><h3>${o.name}</h3><p>${o.rank} · [${o.callSign}]</p></div>
      <span class="online" title="Online"></span>
    </article>
  `).join('');
}

function initPenaltyApp() {
  let activeCat = 'ALL';
  let docket = [];
  const search = document.querySelector('#penaltySearch');
  const list = document.querySelector('#penaltyList');
  const docketList = document.querySelector('#docketList');
  const fineEl = document.querySelector('#totalFine');
  const jailEl = document.querySelector('#totalJail');

  const money = n => new Intl.NumberFormat('hu-HU').format(n) + ' Ft';

  function renderPenalties() {
    const q = (search.value || '').trim().toLowerCase();
    const filtered = btkData.filter(item => {
      const catOK = activeCat === 'ALL' || item.cat === activeCat;
      const qOK = !q || item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.cat.toLowerCase().includes(q);
      return catOK && qOK;
    });
    list.innerHTML = filtered.length ? filtered.map((item, i) => `
      <div class="penalty-item" data-index="${btkData.indexOf(item)}" role="button" tabindex="0">
        <div class="penalty-code">${item.code}</div>
        <div><div class="penalty-title">${item.title}</div><div class="penalty-cat">${item.cat}</div></div>
        <div class="penalty-values"><strong>${money(item.fine)}</strong><span>${item.jail} perc fogda</span></div>
      </div>
    `).join('') : '<div class="docket-empty">Nincs a keresésnek megfelelő vádpont.</div>';

    list.querySelectorAll('.penalty-item').forEach(el => {
      const add = () => { docket.push({...btkData[Number(el.dataset.index)], id: cryptoId()}); renderDocket(); };
      el.addEventListener('click', add);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(); } });
    });
  }

  function renderDocket() {
    if (!docket.length) {
      docketList.innerHTML = '<div class="docket-empty">Még nincs kiválasztott vádpont.<br>Kattints egy tételre a hozzáadáshoz.</div>';
    } else {
      docketList.innerHTML = docket.map(item => `
        <div class="docket-row">
          <div><strong>${item.code} · ${item.title}</strong><small>${money(item.fine)} · ${item.jail} perc</small></div>
          <button class="remove" data-remove="${item.id}" aria-label="Törlés">×</button>
        </div>`).join('');
      docketList.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
        docket = docket.filter(i => i.id !== btn.dataset.remove);
        renderDocket();
      }));
    }
    fineEl.textContent = money(docket.reduce((s,i) => s + i.fine, 0));
    jailEl.textContent = docket.reduce((s,i) => s + i.jail, 0) + ' perc';
  }

  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    activeCat = btn.dataset.cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPenalties();
  }));
  search.addEventListener('input', renderPenalties);
  document.querySelector('#clearDocket').addEventListener('click', () => { docket = []; renderDocket(); });
  document.querySelector('#copyDocket').addEventListener('click', async () => {
    if (!docket.length) return showToast('Nincs mit másolni.');
    const rows = docket.map(i => `${i.code} ${i.title} — ${money(i.fine)} / ${i.jail} perc`).join('\n');
    const totalFine = money(docket.reduce((s,i) => s + i.fine, 0));
    const totalJail = docket.reduce((s,i) => s + i.jail, 0);
    const text = `HOMERP ORFK / INTÉZKEDÉSI JEGYZÉK\n${rows}\n--------------------\nÖSSZESEN: ${totalFine} / ${totalJail} perc`;
    try { await navigator.clipboard.writeText(text); showToast('Intézkedési jegyzék a vágólapra másolva.'); }
    catch { showToast('A böngésző nem engedte a vágólap használatát.'); }
  });

  renderPenalties();
  renderDocket();
}

function cryptoId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}
