/**
 * Kerangka aplikasi: login, sidebar, header, router hash (#/halaman), sesi.
 * Halaman-halaman didefinisikan di pages-*.js sebagai fungsi Pages.namaHalaman(el, params).
 */
const MENU = [
  {
    group: 'Operasional', items: [
      { path: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', m: 'dashboard' },
      { path: 'kendaraan', label: 'Kendaraan', icon: 'car-front', m: 'kendaraan' },
      { path: 'sewa', label: 'Sewa', icon: 'key-round', m: 'sewa' },
      { path: 'pelanggan', label: 'Pelanggan', icon: 'users', m: 'pelanggan' },
      { path: 'keuangan', label: 'Keuangan', icon: 'wallet', m: 'keuangan' },
      { path: 'karyawan', label: 'Karyawan & Gaji', icon: 'id-card', m: 'karyawan' },
      { path: 'approval', label: 'Approval', icon: 'clipboard-check', m: 'approval', badge: 'approval' },
      { path: 'laporan', label: 'Laporan', icon: 'file-text', m: 'laporan' },
      { path: 'tugas', label: 'Tugas Saya', icon: 'clipboard-list', m: 'tugas' }
    ]
  },
  {
    group: 'Sistem & Pengaturan', items: [
      { path: 'akun', label: 'Manajemen Akun', icon: 'user-cog', m: 'akun' },
      { path: 'role', label: 'Role & Tugas', icon: 'shield-check', m: 'akun' },
      { path: 'pengaturan', label: 'Pengaturan', icon: 'sliders-horizontal', m: 'pengaturan' },
      { path: 'audit', label: 'Audit Log', icon: 'history', m: 'audit' }
    ]
  }
];

const Pages = {};

const App = {
  user: null,
  meta: null,
  cabang: '',
  badges: { approval: 0, pengingat: 0 },
  _clock: null,

  // ---------- Izin ----------
  can(m, a) { const p = App.user && App.user.perms[m]; return !!(p && p[a]); },
  scope(m) { return ((App.user && App.user.perms[m]) || {}).scope || 'SENDIRI'; },
  canSee(m) { return App.can(m, 'r') || (m === 'tugas' && App.can(m, 'c')) || (m === 'approval' && App.can(m, 'a')); },
  // Filter cabang di header hanya untuk role yang boleh melihat data operasional lintas cabang
  // (Pelanggan tidak dihitung karena datanya tidak terikat cabang).
  allBranches() { return App.user.isAdmin || ['dashboard', 'kendaraan', 'sewa', 'keuangan', 'laporan', 'karyawan'].some(k => { const p = App.user.perms[k]; return p && p.r && p.scope === 'SEMUA'; }); },
  cabName(id) { const c = (App.meta.cabang || []).find(x => x.id_cabang === id); return c ? c.nama_cabang : (id || 'Semua Cabang'); },
  label(item) { return item.m === 'karyawan' && App.scope('karyawan') === 'SENDIRI' ? 'Slip Gaji Saya' : item.label; },

  // ---------- Start ----------
  async init() {
    try { App.cabang = localStorage.getItem('mtb_cabang') || ''; } catch (e) { App.cabang = ''; }
    window.addEventListener('hashchange', () => App.route());
    if (!API.token) { App.renderLogin(); return; }
    App.renderSplash();
    try {
      const me = await API.call('auth.me');
      await App.start(me.user);
    } catch (e) {
      API.token = '';
      App.renderLogin(e.code === 'SESSION_EXPIRED' ? 'Sesi Anda berakhir. Silakan login kembali.' : e.message);
    }
  },

  renderSplash() {
    document.getElementById('root').innerHTML = `<div style="min-height:100vh;display:grid;place-items:center"><div class="row muted"><span class="spin"></span> Memuat MTB Manajemen...</div></div>`;
  },

  renderLogin(msg) {
    clearInterval(App._clock);
    document.getElementById('root').innerHTML = `
    <div class="login">
      <section class="login-side">
        <div class="login-brand"><div class="logo-mark">MTB</div><div class="logo-text"><b>${UI.esc(CONFIG.APP_NAME)}</b><span>${UI.esc(CONFIG.APP_SUB)}</span></div></div>
        <div class="login-hero">
          <h1>Armada, sewa, dan kas dua cabang dalam satu layar.</h1>
          <p>Pantau status kendaraan, jatuh tempo pajak, transaksi sewa, dan penggajian cabang Samarinda dan Balikpapan secara langsung.</p>
          <div class="plate-row" aria-hidden="true">
            <div class="plate-big">KT 1829 BC<small>SAMARINDA</small></div>
            <div class="plate-big">KT 2104 WA<small>BALIKPAPAN</small></div>
            <div class="plate-big">KT 7721 LA<small>BALIKPAPAN</small></div>
          </div>
        </div>
        <div class="login-foot">Akun dibuat oleh Admin. Hubungi Admin jika lupa password.</div>
      </section>
      <main class="login-main">
        <form class="login-card" id="login-form" autocomplete="on">
          <h2>Masuk ke MTB Manajemen</h2>
          <p class="lead">Gunakan username dan password yang diberikan Admin.</p>
          ${msg ? `<div class="callout amber" style="margin-bottom:16px">${UI.ic('info')}<div>${UI.esc(msg)}</div></div>` : ''}
          <div class="field"><label for="lg-u">Username</label><input id="lg-u" class="input" name="username" autocomplete="username" required autofocus></div>
          <div class="field"><label for="lg-p">Password</label><input id="lg-p" class="input" type="password" name="password" autocomplete="current-password" required></div>
          <label class="check small"><input type="checkbox" id="lg-show"> Tampilkan password</label>
          <button class="btn btn-primary btn-lg" type="submit">${UI.ic('log-in')} Masuk</button>
          <div class="login-note">${UI.ic('lock', 'ic-sm')} Sesi otomatis berakhir setelah 6 jam tidak aktif.</div>
        </form>
      </main>
    </div>`;
    UI.icons();
    const f = document.getElementById('login-form');
    document.getElementById('lg-show').onchange = e => { document.getElementById('lg-p').type = e.target.checked ? 'text' : 'password'; };
    f.onsubmit = async e => {
      e.preventDefault();
      const btn = f.querySelector('button[type=submit]');
      UI.busy(btn, true, 'Memeriksa...');
      try {
        const d = UI.formData(f);
        const res = await API.call('auth.login', { username: d.username, password: f.password.value });
        API.token = res.token;
        await App.start(res.user);
      } catch (err) {
        UI.busy(btn, false);
        UI.toast(err.message, 'error');
        f.password.value = '';
        f.password.focus();
      }
    };
  },

  async start(user) {
    App.user = user;
    App.meta = await API.call('meta.bootstrap');
    if (!App.allBranches()) App.cabang = '';
    App.renderShell();
    App.route();
    App.refreshBadges();
  },

  // ---------- Kerangka ----------
  renderShell() {
    const u = App.user;
    const nav = MENU.map(g => {
      const items = g.items.filter(i => App.canSee(i.m));
      if (!items.length) return '';
      return `<div class="nav-group">${g.group.toUpperCase()}</div>` + items.map(i =>
        `<a class="nav-item" href="#/${i.path}" data-path="${i.path}" title="${UI.esc(App.label(i))}">${UI.ic(i.icon)}<span>${UI.esc(App.label(i))}</span>${i.badge ? `<b class="nav-badge" data-badge="${i.badge}" hidden>0</b>` : ''}</a>`).join('');
    }).join('');
    const cabSel = App.allBranches()
      ? `<label class="cabang-select">${UI.ic('map-pin')}<span class="sr-only">Filter cabang</span><select class="input" id="cabang-filter"><option value="">Semua Cabang</option>${UI.opts(App.meta.cabang, 'id_cabang', 'nama_cabang', App.cabang)}</select></label>`
      : `<span class="cabang-chip">${UI.ic('map-pin', 'ic-sm t-blue')} ${UI.esc(u.nama_cabang)}</span>`;

    document.getElementById('root').innerHTML = `
    <aside class="sidebar" id="sidebar" aria-label="Navigasi utama">
      <div class="side-brand"><div class="logo-mark">MTB</div><div class="logo-text"><b>${UI.esc(CONFIG.APP_NAME)}</b><span>${UI.esc(CONFIG.APP_SUB)}</span></div></div>
      <nav class="side-nav">${nav}</nav>
      <div class="side-foot"><a class="nav-item" href="#" id="nav-logout" title="Keluar">${UI.ic('log-out')}<span>Keluar</span></a></div>
    </aside>
    <div class="overlay" id="overlay" hidden></div>
    <div class="main">
      <header class="topbar">
        <button class="btn-icon hamburger" id="btn-menu" aria-label="Buka menu">${UI.ic('menu', 'ic-lg')}</button>
        <div class="crumb"><span>MTB Manajemen</span>${UI.ic('chevron-right')}<b id="crumb-title">Dashboard</b></div>
        ${cabSel}
        <div class="top-spacer"></div>
        <span class="clock" id="clock">${UI.ic('clock', 'ic-sm')}<span></span></span>
        <button class="btn-icon bell" id="btn-bell" aria-label="Notifikasi">${UI.ic('bell', 'ic-lg')}<span class="dot" id="bell-dot" hidden>0</span></button>
        <button class="profile-btn" id="btn-profile" aria-haspopup="menu"><span class="who"><b>${UI.esc(u.nama)}</b><span>${UI.esc(u.nama_role)}${u.id_cabang ? ' • ' + UI.esc(u.nama_cabang) : ''}</span></span><span class="avatar">${UI.esc(UI.initials(u.nama))}</span></button>
      </header>
      <main class="page" id="page" tabindex="-1"></main>
    </div>`;
    UI.icons();

    const sb = document.getElementById('sidebar'), ov = document.getElementById('overlay');
    const closeNav = () => { sb.classList.remove('open'); ov.hidden = true; };
    document.getElementById('btn-menu').onclick = () => { sb.classList.add('open'); ov.hidden = false; };
    ov.onclick = closeNav;
    sb.addEventListener('click', e => { if (e.target.closest('.nav-item')) closeNav(); });
    document.getElementById('nav-logout').onclick = e => { e.preventDefault(); App.logout(); };
    const cf = document.getElementById('cabang-filter');
    if (cf) cf.onchange = () => {
      App.cabang = cf.value;
      try { localStorage.setItem('mtb_cabang', App.cabang); } catch (e) { /* abaikan */ }
      App.route();
      App.refreshBadges();
    };
    document.getElementById('btn-profile').onclick = e => { e.stopPropagation(); App.popMenu(); };
    document.getElementById('btn-bell').onclick = e => { e.stopPropagation(); App.popBell(); };
    App.tick();
    clearInterval(App._clock);
    App._clock = setInterval(App.tick, 30000);
  },

  tick() {
    const el = document.querySelector('#clock span');
    if (!el) return;
    try {
      const f = new Intl.DateTimeFormat('id-ID', { timeZone: CONFIG.TIMEZONE, weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const g = t => (f.find(p => p.type === t) || {}).value || '';
      el.textContent = `${g('weekday')}, ${g('day')} ${g('month')} ${g('year')} • ${g('hour')}:${g('minute')} WITA`;
    } catch (e) { el.textContent = UI.dt(UI.nowWita()) + ' WITA'; }
  },

  closePops() { document.querySelectorAll('.menu-pop').forEach(p => p.remove()); },
  pop(html) {
    App.closePops();
    const p = document.createElement('div');
    p.className = 'menu-pop';
    p.innerHTML = html;
    document.body.appendChild(p);
    UI.icons(p);
    setTimeout(() => document.addEventListener('click', App.closePops, { once: true }), 0);
    return p;
  },
  popMenu() {
    const u = App.user;
    const p = App.pop(`<div style="padding:8px 10px"><b>${UI.esc(u.nama)}</b><div class="muted small">@${UI.esc(u.username)} • ${UI.esc(u.nama_role)}</div></div><hr>
      <a href="#/profil">${UI.ic('user')} Profil & ganti password</a>
      <button data-refresh>${UI.ic('refresh-cw')} Segarkan izin akses</button><hr>
      <button data-out class="t-red">${UI.ic('log-out')} Keluar</button>`);
    p.querySelector('[data-out]').onclick = () => App.logout();
    p.querySelector('[data-refresh]').onclick = async () => {
      try { const me = await API.call('auth.me'); await App.start(me.user); UI.toast('Izin akses diperbarui.', 'success'); } catch (e) { UI.toast(e.message, 'error'); }
    };
  },
  popBell() {
    const b = App.badges;
    App.pop(`<div style="padding:8px 10px"><b>Notifikasi</b></div><hr>
      ${App.canSee('approval') ? `<a href="#/approval">${UI.ic('clipboard-check')} <span style="flex:1">Approval menunggu</span> <b class="mono">${b.approval || 0}</b></a>` : ''}
      ${App.can('kendaraan', 'r') && App.scope('kendaraan') !== 'SENDIRI' ? `<a href="#/kendaraan">${UI.ic('calendar-clock')} <span style="flex:1">Jatuh tempo ≤ 7 hari</span> <b class="mono">${b.pengingat || 0}</b></a>` : ''}
      ${App.can('tugas', 'c') ? `<a href="#/tugas">${UI.ic('clipboard-list')} <span style="flex:1">Tugas saya</span></a>` : ''}`);
  },

  async refreshBadges() {
    try {
      App.badges = await API.call('meta.badges', { cabang: App.cabang });
      document.querySelectorAll('[data-badge]').forEach(el => {
        const n = App.badges[el.dataset.badge] || 0;
        el.textContent = n; el.hidden = !n;
        el.closest('.nav-item').classList.toggle('has-badge', n > 0);
      });
      const tot = (App.badges.approval || 0) + (App.badges.pengingat || 0);
      const dot = document.getElementById('bell-dot');
      if (dot) { dot.textContent = tot; dot.hidden = !tot; }
    } catch (e) { /* lencana bersifat opsional */ }
  },

  setCrumb(t) { const el = document.getElementById('crumb-title'); if (el) el.textContent = t; document.title = t + ' — MTB Manajemen'; },

  // ---------- Router ----------
  go(path) { if (location.hash === '#/' + path) App.route(); else location.hash = '#/' + path; },

  async route() {
    if (!App.user) return;
    App.closePops();
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent).filter(Boolean);
    const first = MENU.flatMap(g => g.items).find(i => App.canSee(i.m));
    const key = parts[0] || (first ? first.path : 'profil');
    const item = MENU.flatMap(g => g.items).find(i => i.path === key);
    document.querySelectorAll('.nav-item[data-path]').forEach(a => a.classList.toggle('active', a.dataset.path === key));
    const el = document.getElementById('page');
    if (!el) return;
    if (item && !App.canSee(item.m)) {
      el.innerHTML = `<div class="card err-box">${UI.ic('lock', 'ic-lg muted')}<p class="strong mt-8">Halaman ini tidak tersedia untuk role Anda</p><p class="muted small mt-8">Hubungi Admin jika Anda membutuhkan akses.</p></div>`;
      UI.icons(el); return;
    }
    const map = {
      dashboard: () => Pages.dashboard(el),
      kendaraan: () => parts[1] ? Pages.kendaraanDetail(el, parts[1]) : Pages.kendaraan(el),
      sewa: () => parts[1] === 'baru' ? Pages.sewaBaru(el) : parts[1] ? Pages.sewaDetail(el, parts[1]) : Pages.sewa(el),
      pelanggan: () => Pages.pelanggan(el),
      keuangan: () => Pages.keuangan(el),
      karyawan: () => Pages.karyawan(el),
      approval: () => Pages.approval(el, parts[1]),
      laporan: () => Pages.laporan(el),
      tugas: () => Pages.tugas(el),
      akun: () => Pages.akun(el),
      role: () => Pages.role(el),
      pengaturan: () => Pages.pengaturan(el),
      audit: () => Pages.audit(el),
      profil: () => Pages.profil(el)
    };
    const fn = map[key];
    App.setCrumb(item ? App.label(item) : key === 'profil' ? 'Profil' : 'Halaman');
    window.scrollTo(0, 0);
    if (!fn) { el.innerHTML = UI.empty('Halaman tidak ditemukan', 'Periksa alamat atau pilih menu di samping.', 'map'); UI.icons(el); return; }
    el.innerHTML = UI.skeleton(6);
    try { await fn(); } catch (e) { if (e.code !== 'SESSION_EXPIRED') UI.errorBox(el, e, () => App.route()); }
  },

  // ---------- Sesi ----------
  sessionExpired(msg) {
    if (!App.user) return;
    App.user = null;
    document.getElementById('modal-root').innerHTML = '';
    App.renderLogin(msg || 'Sesi Anda berakhir. Silakan login kembali.');
  },
  async logout() {
    const ok = await UI.confirm({ title: 'Keluar dari aplikasi?', message: 'Anda perlu login kembali untuk mengakses MTB Manajemen.', ok: 'Keluar' });
    if (!ok) return;
    try { await API.call('auth.logout'); } catch (e) { /* tetap keluar */ }
    API.token = '';
    App.user = null;
    location.hash = '';
    App.renderLogin();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
