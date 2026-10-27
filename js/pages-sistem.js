/**
 * Halaman tugas & sistem: Tugas Saya, Manajemen Akun, Role & Tugas, Pengaturan, Audit Log, Profil.
 */

// =====================================================================
// TUGAS SAYA / LAPORAN SUPIR
// =====================================================================
Pages.tugas = async (el) => {
  const d = await API.call('tugas.list', { cabang: App.cabang });
  const own = App.scope('tugas') === 'SENDIRI';
  const canLapor = App.can('tugas', 'c');
  const bulan = UI.thisMonth();
  el.innerHTML = UI.pageHead({
    title: own ? 'Tugas saya' : 'Tugas & laporan supir',
    desc: own ? 'Jadwal mengemudi Anda dan laporan kilometer serta kondisi kendaraan.' : 'Penugasan supir di transaksi sewa aktif dan laporan KM yang masuk.'
  }) + `
  <div class="grid g3">
    ${UI.kpi({ label: 'Tugas aktif', value: d.aktif.length, unit: 'Tugas', icon: 'clipboard-list' })}
    ${UI.kpi({ label: 'Kendaraan ' + (own ? 'ditugaskan' : 'dalam cakupan'), value: d.kendaraan.length, unit: 'Unit', icon: 'car-front', tone: 'navy' })}
    ${UI.kpi({ label: 'Laporan bulan ini', value: d.laporan.filter(r => String(r.tanggal).slice(0, 7) === bulan).length, unit: 'Laporan', icon: 'gauge', tone: 'green' })}
  </div>
  <div class="grid ${canLapor ? 'g-side' : ''} mt-20">
    <div class="stack">
      <section class="card"><div class="card-head"><h3>${UI.ic('calendar', 't-blue')} Jadwal tugas aktif</h3></div><div class="card-body" id="tg-list"></div></section>
      <section class="card"><div class="card-head"><h3>${UI.ic('history', 't-blue')} Riwayat laporan KM & kondisi</h3></div><div id="tg-lap"></div></section>
    </div>
    ${canLapor ? `<aside class="sticky-side"><section class="card"><div class="card-head" style="background:var(--navy);border-radius:10px 10px 0 0"><div><h3 style="color:#fff">${UI.ic('gauge')} Lapor KM & kondisi</h3><p style="color:#AFC0EB">KM akhir memperbarui odometer kendaraan</p></div></div>
      <form class="card-body" id="f-lapor">
        ${d.kendaraan.length ? `
        <div class="field"><label>Kendaraan <span class="req">*</span></label><select class="input" name="id_kendaraan" required>${UI.opts(d.kendaraan, 'id_kendaraan', k => k.plat + ' — ' + k.nama, '', 'Pilih kendaraan')}</select></div>
        <div class="field mt-12"><label>Tanggal</label><input class="input" type="date" name="tanggal" value="${UI.today()}"></div>
        <div class="fgrid mt-12"><div class="field"><label>KM awal <span class="req">*</span></label><input class="input mono" name="km_awal" inputmode="numeric" required></div><div class="field"><label>KM akhir <span class="req">*</span></label><input class="input mono" name="km_akhir" inputmode="numeric" required></div></div>
        <div class="field mt-12"><label>Kondisi kendaraan</label><select class="input" name="kondisi">${UI.opts(['Baik', 'Perlu perhatian', 'Rusak'])}</select></div>
        <div class="field mt-12"><label>Catatan</label><textarea class="input" name="catatan" rows="2" placeholder="BBM, suara mesin, ban, dll."></textarea></div>
        <div class="mt-12">${UI.fileField('foto', 'Foto odometer / kondisi')}</div>
        <button class="btn btn-primary btn-lg mt-16" style="width:100%" type="submit">${UI.ic('send')} Kirim laporan</button>`
        : UI.empty('Belum ada kendaraan ditugaskan', 'Form laporan aktif saat Anda ditugaskan pada transaksi sewa.', 'car-front')}
      </form></section></aside>` : ''}
  </div>`;
  UI.icons(el);
  UI.bindDrops(el);

  const list = el.querySelector('#tg-list');
  list.innerHTML = d.aktif.length ? d.aktif.map(x => `<div class="li ${x.terlambat ? 'red' : ''}">
    <div class="li-top"><div><span class="mono t-blue small strong">#${esc(x.id_sewa)}</span> ${x.terlambat ? UI.badge('Terlambat ' + x.terlambat_jam + ' jam', 'red') : ''}<h4 class="mt-8">${esc(x.nama_pelanggan)}</h4><p class="mono">${esc(x.no_hp)}</p></div>${UI.plat(x.plat)}</div>
    <div class="row wrap small mt-8" style="gap:16px"><span>${UI.ic('car-front', 'ic-sm')} ${esc(x.nama_kendaraan)}</span><span>${UI.ic('calendar', 'ic-sm')} ${UI.dt(x.tgl_pinjam)} → ${UI.dt(x.tgl_kembali_rencana)}</span>${!own ? `<span>${UI.ic('user', 'ic-sm')} ${esc(x.nama_supir)}</span>` : ''}</div>
    ${x.catatan ? `<p class="mt-8">${esc(x.catatan)}</p>` : ''}
    <div class="row mt-12" style="justify-content:flex-end">${App.can('denda', 'c') ? `<button class="btn btn-danger-soft btn-sm" data-rusak="${esc(x.id_sewa)}">${UI.ic('triangle-alert', 'ic-sm')} Lapor kerusakan</button>` : ''}${canLapor ? `<button class="btn btn-soft btn-sm" data-lapor="${esc(x.id_kendaraan)}">${UI.ic('gauge', 'ic-sm')} Lapor KM</button>` : ''}${App.can('sewa', 'r') && !own ? `<a class="btn btn-outline btn-sm" href="#/sewa/${encodeURIComponent(x.id_sewa)}">Detail sewa</a>` : ''}</div></div>`).join('')
    : UI.empty('Tidak ada tugas aktif', own ? 'Tugas baru muncul saat Anda ditugaskan pada transaksi sewa.' : 'Belum ada transaksi aktif dengan supir.', 'calendar-check');
  UI.icons(list);

  UI.table(el.querySelector('#tg-lap'), {
    unit: 'laporan', pageSize: 8, empty: 'Belum ada laporan.', rows: d.laporan,
    columns: [
      { key: 'tanggal', label: 'Tanggal', render: r => `<span class="mono">${UI.date(r.tanggal)}</span>` },
      { key: 'plat', label: 'Kendaraan', render: r => UI.plat(r.plat, true) + `<div class="t-sub">${esc(r.nama_kendaraan || '')}</div>` },
      ...(own ? [] : [{ key: 'nama_supir', label: 'Supir' }]),
      { key: 'km_akhir', label: 'KM awal → akhir', num: true, render: r => `${UI.num(r.km_awal)} → ${UI.num(r.km_akhir)}<div class="t-sub">${UI.num(UI.n(r.km_akhir) - UI.n(r.km_awal))} km</div>` },
      { key: 'kondisi', label: 'Kondisi', align: 'center', render: r => UI.badge(r.kondisi, r.kondisi === 'Baik' ? 'green' : r.kondisi === 'Rusak' ? 'red' : 'amber') },
      { key: 'catatan', label: 'Catatan' },
      { label: '', align: 'right', render: r => r.id_foto_drive ? `<button class="btn-icon" data-file="${esc(r.id_foto_drive)}" aria-label="Foto laporan">${UI.ic('image')}</button>` : '' }
    ],
    bind: Pages._bindFiles
  });

  const f = el.querySelector('#f-lapor');
  if (f && f.id_kendaraan) {
    f.id_kendaraan.onchange = () => { const k = d.kendaraan.find(z => z.id_kendaraan === f.id_kendaraan.value); if (k) f.km_awal.value = k.km_saat_ini || ''; };
    f.onsubmit = async e => {
      e.preventDefault();
      const b = f.querySelector('button[type=submit]'); UI.busy(b, true, 'Mengirim...');
      try {
        const data = Object.assign(UI.formData(f), await UI.collectFiles(f));
        data.km_awal = UI.n(String(data.km_awal).replace(/\D/g, ''));
        data.km_akhir = UI.n(String(data.km_akhir).replace(/\D/g, ''));
        await API.call('tugas.lapor', data);
        UI.toast('Laporan terkirim. Odometer kendaraan diperbarui.', 'success'); App.route();
      } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
    };
  }
  el.querySelectorAll('[data-lapor]').forEach(b => b.onclick = () => { if (!f) return; f.id_kendaraan.value = b.dataset.lapor; f.id_kendaraan.onchange(); f.km_akhir.focus(); f.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  el.querySelectorAll('[data-rusak]').forEach(b => b.onclick = () => { const x = d.aktif.find(z => z.id_sewa === b.dataset.rusak); Pages.dendaForm(x, () => UI.toast('Laporan kerusakan diteruskan ke Staf/Admin.', 'success')); });
};

// =====================================================================
// MANAJEMEN AKUN
// =====================================================================
Pages.akun = async (el) => {
  const d = await API.call('akun.list');
  el.innerHTML = UI.pageHead({
    crumbs: '<span>Sistem & pengaturan</span>', title: 'Manajemen akun', badge: UI.badge(d.users.filter(u => u.status_aktif).length + ' aktif', 'navy'),
    desc: 'Tidak ada pendaftaran mandiri. Admin membuat akun, menetapkan role dan cabang, serta mereset password.',
    actions: App.can('akun', 'c') ? `<button class="btn btn-primary" data-add>${UI.ic('user-plus')} Buat akun</button>` : ''
  }) + `<section class="card"><div class="filters"><label class="search">${UI.ic('search')}<input class="input" data-q placeholder="Cari nama, username, atau role..." aria-label="Cari akun"></label>
    <select class="input" data-role aria-label="Role"><option value="">Semua role</option>${UI.opts(d.roles, 'id_role', 'nama_role')}</select></div><div id="tbl-akun"></div></section>`;
  const tbl = UI.table(el.querySelector('#tbl-akun'), {
    unit: 'akun', rowClass: u => u.status_aktif ? '' : 'faint',
    columns: [
      { key: 'nama', label: 'Pengguna', render: u => `<div class="row"><span class="avatar ${u.id_role === 'ROLE-ADMIN' ? '' : 'lt'}" style="width:34px;height:34px;font-size:12px">${esc(UI.initials(u.nama))}</span><div><div class="t-main">${esc(u.nama)}${u.id_user === App.user.id_user ? ' <span class="badge sans blue">Anda</span>' : ''}</div><div class="t-sub mono">@${esc(u.username)}</div></div></div>` },
      { key: 'nama_role', label: 'Role', render: u => UI.badge(u.nama_role, u.id_role === 'ROLE-ADMIN' ? 'navy' : 'blue') },
      { key: 'nama_cabang', label: 'Cabang', render: u => u.id_cabang ? UI.cab(u.nama_cabang) : '<span class="muted small">Semua cabang</span>' },
      { key: 'email', label: 'Email' },
      { key: 'login_terakhir', label: 'Login terakhir', render: u => u.login_terakhir ? `<span class="mono small">${UI.dt(u.login_terakhir)}</span>` : '<span class="muted small">Belum pernah</span>' },
      { key: 'status_aktif', label: 'Status', align: 'center', render: u => UI.status('akun', u.status_aktif ? 'Aktif' : 'Nonaktif') },
      { label: 'Aksi', align: 'right', render: u => `<div class="acts">${App.can('akun', 'u') ? `<button class="btn-icon blue" data-edit="${esc(u.id_user)}" aria-label="Ubah">${UI.ic('pencil')}</button><button class="btn-icon" data-reset="${esc(u.id_user)}" aria-label="Reset password">${UI.ic('key-round')}</button>${u.id_user !== App.user.id_user ? `<button class="btn-icon ${u.status_aktif ? 'red' : 'green'}" data-toggle="${esc(u.id_user)}" aria-label="${u.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}">${UI.ic(u.status_aktif ? 'user-x' : 'user-check')}</button>` : ''}` : ''}</div>` }
    ],
    bind: box => {
      box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => Pages.akunForm(d, d.users.find(u => u.id_user === b.dataset.edit)));
      box.querySelectorAll('[data-reset]').forEach(b => b.onclick = async () => {
        const u = d.users.find(x => x.id_user === b.dataset.reset);
        const pw = await UI.confirm({ title: 'Reset password @' + esc(u.username), message: 'Minimal 8 karakter berisi huruf dan angka. Sampaikan password baru secara langsung kepada pengguna.', input: true, inputType: 'text', inputLabel: 'Password baru', required: true, ok: 'Reset password' });
        if (!pw) return;
        try { await API.call('akun.resetPassword', { id_user: u.id_user, password: pw }); UI.toast('Password @' + u.username + ' berhasil direset.', 'success'); } catch (e) { UI.toast(e.message, 'error'); }
      });
      box.querySelectorAll('[data-toggle]').forEach(b => b.onclick = async () => {
        const u = d.users.find(x => x.id_user === b.dataset.toggle);
        const ok = await UI.confirm({ title: (u.status_aktif ? 'Nonaktifkan' : 'Aktifkan') + ' akun?', message: u.status_aktif ? `@${esc(u.username)} tidak bisa login dan sesinya yang sedang berjalan langsung berakhir.` : `@${esc(u.username)} dapat login kembali.`, danger: u.status_aktif, ok: u.status_aktif ? 'Nonaktifkan' : 'Aktifkan' });
        if (!ok) return;
        try { await API.call('akun.toggle', { id_user: u.id_user, aktif: !u.status_aktif }); UI.toast('Status akun diperbarui.', 'success'); App.route(); } catch (e) { UI.toast(e.message, 'error'); }
      });
    }
  });
  const st = { q: '', role: '' };
  const filt = () => tbl.setRows(d.users.filter(u => (!st.role || u.id_role === st.role) && UI.match(u, st.q, ['nama', 'username', 'nama_role', 'email'])));
  filt();
  el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => { st.q = e.target.value; filt(); }, 150));
  el.querySelector('[data-role]').onchange = e => { st.role = e.target.value; filt(); };
  const add = el.querySelector('[data-add]');
  if (add) add.onclick = () => Pages.akunForm(d, null);
  UI.icons(el);
};

Pages.akunForm = (d, u) => {
  const x = u || {};
  const m = UI.modal({
    title: u ? 'Ubah akun @' + esc(u.username) : 'Buat akun baru', sub: u ? 'Perubahan role/cabang berlaku pada login berikutnya.' : 'Pengguna dapat mengganti passwordnya sendiri setelah login.', size: 'lg',
    body: `<form id="f-akun" class="fgrid">
      <div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="${esc(x.nama || '')}" required></div>
      <div class="field"><label>Username <span class="req">*</span></label><input class="input mono" name="username" value="${esc(x.username || '')}" placeholder="mis. staf.smd" pattern="[a-z0-9._]{3,30}" required><span class="hint">3–30 karakter: huruf kecil, angka, titik, garis bawah.</span></div>
      <div class="field"><label>Role <span class="req">*</span></label><select class="input" name="id_role" required ${u && u.id_user === App.user.id_user ? 'disabled' : ''}>${UI.opts(d.roles.filter(r => r.status === 'Aktif' || r.id_role === x.id_role), 'id_role', 'nama_role', x.id_role, 'Pilih role')}</select></div>
      <div class="field"><label>Cabang</label><select class="input" name="id_cabang">${UI.opts(d.cabang, 'id_cabang', 'nama_cabang', x.id_cabang, 'Semua cabang (khusus Admin)')}</select></div>
      <div class="field"><label>Email</label><input class="input" type="email" name="email" value="${esc(x.email || '')}"><span class="hint">Untuk notifikasi approval & pengingat.</span></div>
      ${u ? '' : `<div class="field"><label>Password awal <span class="req">*</span></label><input class="input mono" name="password" type="text" minlength="8" required autocomplete="new-password"><span class="hint">Minimal 8 karakter, mengandung huruf dan angka.</span></div>`}
    </form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" type="submit" form="f-akun">${UI.ic('check')} ${u ? 'Simpan perubahan' : 'Buat akun'}</button>`
  });
  m.q('form').onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]'); UI.busy(b, true);
    try {
      const data = UI.formData(e.target);
      if (u) { data.id_user = u.id_user; if (!data.id_role) data.id_role = u.id_role; }
      data.username = data.username.toLowerCase();
      await API.call('akun.save', data);
      UI.toast(u ? 'Akun diperbarui.' : 'Akun @' + data.username + ' dibuat.', 'success'); m.close(); App.route();
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

// =====================================================================
// ROLE & TUGAS (matriks izin)
// =====================================================================
Pages.role = async (el, selId) => {
  const d = await API.call('role.list');
  const st = { sel: selId || (d.roles.find(r => r.id_role !== 'ROLE-ADMIN') || d.roles[0] || {}).id_role, baru: false };
  const ACT = [['c', 'Tambah'], ['r', 'Lihat'], ['u', 'Ubah'], ['d', 'Hapus'], ['a', 'Approve']];
  const SC = [['SEMUA', 'Semua cabang'], ['CABANG', 'Cabang sendiri'], ['SENDIRI', 'Data sendiri']];
  const render = () => {
    const role = st.baru ? { id_role: '', nama_role: '', deskripsi: '', status: 'Aktif', perms: {} } : d.roles.find(r => r.id_role === st.sel);
    const isAdmin = role && role.id_role === 'ROLE-ADMIN';
    el.innerHTML = UI.pageHead({
      crumbs: '<span>Sistem & pengaturan</span>', title: 'Role & tugas',
      desc: 'Atur izin tiap role per modul (tambah, lihat, ubah, hapus, approve) dan cakupan datanya. Izin dicek di server, bukan hanya menyembunyikan menu.',
      actions: App.can('akun', 'c') ? `<button class="btn btn-primary" data-new>${UI.ic('plus')} Role baru</button>` : ''
    }) + `
    <div class="grid" style="grid-template-columns:minmax(0,300px) minmax(0,1fr)" id="role-grid">
      <section class="card"><div class="card-head"><h3>Daftar role</h3></div><div class="list-pane">
        ${d.roles.map(r => `<button class="ap-item ${!st.baru && r.id_role === st.sel ? 'on' : ''}" data-sel="${esc(r.id_role)}"><div class="row between"><b>${esc(r.nama_role)}</b>${r.status === 'Aktif' ? UI.badge('Aktif', 'green') : UI.badge('Nonaktif', '')}</div><p class="muted small mt-8">${esc(r.deskripsi || '-')}</p><p class="xs faint mt-8">${r.jumlah_pengguna} pengguna</p></button>`).join('')}
        ${st.baru ? `<div class="ap-item on"><b>Role baru</b><p class="muted small">Belum disimpan</p></div>` : ''}
      </div></section>
      <section class="card">${role ? `<form id="f-role">
        <div class="card-body fgrid">
          <div class="field"><label>Nama role <span class="req">*</span></label><input class="input" name="nama_role" value="${esc(role.nama_role)}" ${isAdmin ? 'disabled' : ''} required></div>
          <div class="field"><label>Tugas / deskripsi</label><input class="input" name="deskripsi" value="${esc(role.deskripsi || '')}" ${isAdmin ? 'disabled' : ''} placeholder="Tanggung jawab utama role ini"></div>
        </div>
        ${isAdmin ? `<div class="card-body" style="padding-top:0"><div class="callout blue">${UI.ic('shield-check')}<div>Role Admin selalu memiliki akses penuh ke seluruh modul dan kedua cabang. Izinnya tidak dapat diubah atau dinonaktifkan.</div></div></div>` : `
        <div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th>Modul</th>${ACT.map(a => `<th>${a[1]}</th>`).join('')}<th style="text-align:left">Cakupan data</th></tr></thead><tbody>
          ${d.modules.map(mo => { const p = role.perms[mo.key] || {}; return `<tr data-m="${mo.key}"><td><b style="font-weight:500">${esc(mo.label)}</b></td>${ACT.map(a => `<td><input type="checkbox" data-a="${a[0]}" ${p[a[0]] ? 'checked' : ''} aria-label="${a[1]} ${esc(mo.label)}"></td>`).join('')}<td style="text-align:left"><select class="input" data-scope style="height:32px;min-width:150px">${UI.opts(SC, 0, 1, p.scope || 'CABANG')}</select></td></tr>`; }).join('')}
        </tbody></table></div>
        <div class="card-body"><div class="callout amber">${UI.ic('info')}<div><b>Cakupan data:</b> "Cabang sendiri" membatasi ke cabang akun pengguna; "Data sendiri" hanya data miliknya (mis. tugas & slip gaji supir). Role yang punya izin <b>Tugas Saya: Tambah</b> muncul sebagai pilihan supir di form sewa. Perubahan berlaku saat pengguna login ulang atau menekan "Segarkan izin akses".</div></div></div>
        <div class="card-foot">${!st.baru && App.can('akun', 'u') ? `<button type="button" class="btn ${role.status === 'Aktif' ? 'btn-danger-soft' : 'btn-outline'}" data-toggle>${UI.ic(role.status === 'Aktif' ? 'ban' : 'circle-check')} ${role.status === 'Aktif' ? 'Nonaktifkan role' : 'Aktifkan role'}</button>` : '<span></span>'}
          <button class="btn btn-primary" type="submit">${UI.ic('check')} ${st.baru ? 'Simpan role baru' : 'Simpan izin'}</button></div>`}
      </form>` : UI.empty('Pilih role', '', 'shield')}</section>
    </div>`;
    if (window.matchMedia('(max-width: 1023px)').matches) el.querySelector('#role-grid').style.gridTemplateColumns = 'minmax(0,1fr)';
    UI.icons(el);
    el.querySelectorAll('[data-sel]').forEach(b => b.onclick = () => { st.sel = b.dataset.sel; st.baru = false; render(); });
    const nb = el.querySelector('[data-new]');
    if (nb) nb.onclick = () => { st.baru = true; render(); };
    const f = el.querySelector('#f-role');
    if (!f || isAdmin) return;
    const tg = el.querySelector('[data-toggle]');
    if (tg) tg.onclick = async () => {
      const aktif = role.status !== 'Aktif';
      const ok = await UI.confirm({ title: (aktif ? 'Aktifkan' : 'Nonaktifkan') + ' role ' + esc(role.nama_role) + '?', message: aktif ? 'Pengguna dengan role ini dapat login kembali.' : `${role.jumlah_pengguna} pengguna dengan role ini tidak bisa login sampai role diaktifkan lagi. Role yang dipakai tidak dihapus.`, danger: !aktif, ok: aktif ? 'Aktifkan' : 'Nonaktifkan' });
      if (!ok) return;
      try { await API.call('role.toggle', { id_role: role.id_role, aktif }); UI.toast('Status role diperbarui.', 'success'); App.route(); } catch (e) { UI.toast(e.message, 'error'); }
    };
    f.onsubmit = async e => {
      e.preventDefault();
      const perms = {};
      f.querySelectorAll('tr[data-m]').forEach(tr => {
        const p = { scope: tr.querySelector('[data-scope]').value };
        tr.querySelectorAll('[data-a]').forEach(c => p[c.dataset.a] = c.checked);
        perms[tr.dataset.m] = p;
      });
      const b = f.querySelector('button[type=submit]'); UI.busy(b, true);
      try {
        const r = await API.call('role.save', { role: { id_role: role.id_role, nama_role: f.nama_role.value, deskripsi: f.deskripsi.value }, permissions: perms });
        UI.toast('Izin role disimpan.', 'success');
        const fresh = await API.call('role.list');
        d.roles = fresh.roles; st.sel = r.id_role; st.baru = false; render();
      } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
    };
  };
  render();
};

// =====================================================================
// PENGATURAN
// =====================================================================
Pages.pengaturan = async (el) => {
  const d = await API.call('pengaturan.get');
  const canU = App.can('pengaturan', 'u');
  const groups = [
    ['Identitas usaha', ['nama_perusahaan', 'alamat_perusahaan', 'kontak_perusahaan']],
    ['Keuangan & approval', ['ambang_approval', 'metode_bayar', 'kategori_pemasukan', 'kategori_pengeluaran', 'format_kwitansi']],
    ['Sewa & denda', ['denda_per_jam', 'batas_jam_hari_penuh', 'jenis_kendaraan']],
    ['Pengingat otomatis', ['pengingat_hari', 'pengingat_km', 'email_notifikasi']]
  ];
  const item = k => d.items.find(i => i.kunci === k);
  const used = new Set(groups.flatMap(g => g[1]));
  const lain = d.items.filter(i => !used.has(i.kunci));
  if (lain.length) groups.push(['Lainnya', lain.map(i => i.kunci)]);
  const label = k => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
  el.innerHTML = UI.pageHead({ crumbs: '<span>Sistem & pengaturan</span>', title: 'Pengaturan', desc: 'Nilai ini dipakai di seluruh aplikasi: kwitansi, ambang approval, kategori transaksi, denda, dan pengingat email.' }) + `
  <form id="f-set" class="stack">
    ${groups.map(g => `<section class="card"><div class="card-head"><h3>${esc(g[0])}</h3></div><div class="card-body fgrid">
      ${g[1].map(k => { const it = item(k); if (!it) return ''; const long = /kategori|email|alamat|metode|jenis/.test(k); return `<div class="field ${long ? 'span-2' : ''}"><label>${esc(label(k))}</label><input class="input ${/ambang|denda|batas|pengingat_km|format/.test(k) ? 'mono' : ''}" data-k="${esc(k)}" value="${esc(it.nilai)}" ${canU ? '' : 'disabled'}><span class="hint">${esc(it.keterangan || '')}</span></div>`; }).join('')}
    </div></section>`).join('')}
    <section class="card"><div class="card-head"><h3>Data cabang</h3></div><div class="card-body">
      ${d.cabang.map(c => `<div class="fgrid c3" data-cab="${esc(c.id_cabang)}" style="margin-bottom:14px"><div class="field"><label>Nama cabang <span class="mono xs muted">${esc(c.id_cabang)}</span></label><input class="input" data-f="nama_cabang" value="${esc(c.nama_cabang)}" ${canU ? '' : 'disabled'}></div><div class="field"><label>Alamat</label><input class="input" data-f="alamat" value="${esc(c.alamat || '')}" ${canU ? '' : 'disabled'}></div><div class="field"><label>Kontak</label><input class="input" data-f="kontak" value="${esc(c.kontak || '')}" ${canU ? '' : 'disabled'}></div></div>`).join('')}
    </div></section>
    ${canU ? `<div class="row" style="justify-content:flex-end"><button class="btn btn-primary btn-lg" type="submit">${UI.ic('save')} Simpan pengaturan</button></div>` : ''}
  </form>`;
  UI.icons(el);
  const f = el.querySelector('#f-set');
  f.onsubmit = async e => {
    e.preventDefault();
    const items = [...f.querySelectorAll('[data-k]')].map(i => ({ kunci: i.dataset.k, nilai: i.value.trim() }));
    const cabang = [...f.querySelectorAll('[data-cab]')].map(r => ({ id_cabang: r.dataset.cab, nama_cabang: r.querySelector('[data-f=nama_cabang]').value, alamat: r.querySelector('[data-f=alamat]').value, kontak: r.querySelector('[data-f=kontak]').value }));
    const b = f.querySelector('button[type=submit]'); UI.busy(b, true);
    try {
      await API.call('pengaturan.save', { items, cabang });
      App.meta = await API.call('meta.bootstrap');
      UI.toast('Pengaturan disimpan.', 'success'); UI.busy(b, false);
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

// =====================================================================
// AUDIT LOG
// =====================================================================
Pages.audit = async (el) => {
  const st = { q: '', modul: '', tanggal: '' };
  el.innerHTML = UI.pageHead({ crumbs: '<span>Sistem & pengaturan</span>', title: 'Audit log', desc: 'Jejak aktivitas penting: login, perubahan data, pembayaran, approval, dan perubahan izin. Menampilkan 500 entri terbaru sesuai filter.' }) + `
  <section class="card"><div class="filters">
    <label class="search">${UI.ic('search')}<input class="input" data-q placeholder="Cari pengguna, aksi, ID, atau keterangan..." aria-label="Cari log"></label>
    <select class="input" data-modul aria-label="Modul"><option value="">Semua modul</option>${UI.opts(['auth', 'kendaraan', 'servis', 'sewa', 'pelanggan', 'denda', 'keuangan', 'approval', 'karyawan', 'tugas', 'akun', 'pengaturan'])}</select>
    <input class="input" type="date" data-tgl aria-label="Tanggal">
    <button class="btn btn-outline" data-go>${UI.ic('filter')} Terapkan</button>
  </div><div id="tbl-audit"></div></section>`;
  UI.icons(el);
  const tone = a => /GAGAL|TOLAK|BATAL|NONAKTIF/.test(a) ? 'red' : /APPROVE|LOGIN$|BAYAR|PEMBAYARAN|AKTIFKAN/.test(a) ? 'green' : /UBAH|RESET|IZIN/.test(a) ? 'amber' : 'blue';
  const load = async () => {
    const box = el.querySelector('#tbl-audit');
    box.innerHTML = '<div class="empty"><span class="spin"></span></div>';
    const rows = await API.call('audit.list', st);
    UI.table(box, {
      unit: 'entri', pageSize: 20, rows,
      columns: [
        { key: 'timestamp', label: 'Waktu', render: r => `<span class="mono small nowrap">${UI.date(r.timestamp)} ${UI.time(r.timestamp)}</span>` },
        { key: 'nama_user', label: 'Pengguna' },
        { key: 'aksi', label: 'Aksi', render: r => UI.badge(r.aksi.replace(/_/g, ' '), tone(r.aksi)) },
        { key: 'modul', label: 'Modul', render: r => `<span class="badge sans">${esc(r.modul)}</span>` },
        { key: 'id_referensi', label: 'Referensi', render: r => r.id_referensi ? `<span class="mono small">${esc(r.id_referensi)}</span>` : '-' },
        { key: 'keterangan', label: 'Keterangan', render: r => `<div style="max-width:420px">${esc(r.keterangan || '-')}</div>` }
      ]
    });
  };
  el.querySelector('[data-go]').onclick = () => { st.q = el.querySelector('[data-q]').value.trim(); st.modul = el.querySelector('[data-modul]').value; st.tanggal = el.querySelector('[data-tgl]').value; load().catch(e => UI.toast(e.message, 'error')); };
  el.querySelector('[data-q]').addEventListener('keydown', e => { if (e.key === 'Enter') el.querySelector('[data-go]').click(); });
  await load();
};

// =====================================================================
// PROFIL & GANTI PASSWORD
// =====================================================================
Pages.profil = async (el) => {
  const u = App.user;
  const mods = App.meta.modules.filter(m => u.perms[m.key] && (u.perms[m.key].r || u.perms[m.key].c));
  const SCL = { SEMUA: 'semua cabang', CABANG: 'cabang sendiri', SENDIRI: 'data sendiri' };
  el.innerHTML = UI.pageHead({ title: 'Profil saya', desc: 'Informasi akun dan pengaturan keamanan.' }) + `
  <div class="grid g2">
    <section class="card card-pad"><div class="row"><span class="avatar" style="width:56px;height:56px;font-size:18px">${esc(UI.initials(u.nama))}</span><div><h2 style="font-size:20px;font-weight:600">${esc(u.nama)}</h2><p class="muted mono">@${esc(u.username)}</p></div></div>
      <dl class="kv mt-20"><div><dt>Role</dt><dd>${esc(u.nama_role)}</dd></div><div><dt>Cabang</dt><dd>${esc(u.nama_cabang)}</dd></div><div><dt>Email</dt><dd>${esc(u.email || '-')}</dd></div><div><dt>ID karyawan</dt><dd class="mono">${esc(u.id_karyawan || '-')}</dd></div></dl>
      <div class="section-title mt-20">Akses modul</div>
      <div class="chips">${mods.map(m => `<span class="badge sans blue" title="Cakupan: ${SCL[u.perms[m.key].scope]}">${esc(m.label)} • ${SCL[u.perms[m.key].scope]}</span>`).join('')}</div></section>
    <section class="card"><div class="card-head"><h3>${UI.ic('lock', 't-blue')} Ganti password</h3></div>
      <form class="card-body" id="f-pw">
        <div class="field"><label>Password lama</label><input class="input" type="password" name="password_lama" autocomplete="current-password" required></div>
        <div class="field mt-12"><label>Password baru</label><input class="input" type="password" name="password_baru" autocomplete="new-password" minlength="8" required><span class="hint">Minimal 8 karakter, mengandung huruf dan angka.</span></div>
        <div class="field mt-12"><label>Ulangi password baru</label><input class="input" type="password" name="ulang" autocomplete="new-password" required></div>
        <button class="btn btn-primary mt-16" type="submit">${UI.ic('check')} Simpan password baru</button>
      </form></section>
  </div>`;
  UI.icons(el);
  const f = el.querySelector('#f-pw');
  f.onsubmit = async e => {
    e.preventDefault();
    if (f.password_baru.value !== f.ulang.value) { UI.toast('Konfirmasi password baru tidak sama.', 'error'); return; }
    const b = f.querySelector('button[type=submit]'); UI.busy(b, true);
    try { await API.call('auth.changePassword', { password_lama: f.password_lama.value, password_baru: f.password_baru.value }); UI.toast('Password berhasil diganti.', 'success'); f.reset(); }
    catch (err) { UI.toast(err.message, 'error'); }
    UI.busy(b, false);
  };
};
