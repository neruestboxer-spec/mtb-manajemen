/**
 * Halaman operasional: Dashboard, Kendaraan, Sewa, Pelanggan.
 */
const esc = UI.esc;

// =====================================================================
// DASHBOARD
// =====================================================================
Pages.dashboard = async (el) => {
  const d = await API.call('dashboard.get', { cabang: App.cabang });
  if (d.own) return Pages.dashboardSupir(el, d);
  const k = d.kendaraan;
  const area = App.cabang ? 'Cabang ' + App.cabName(App.cabang) : (App.allBranches() ? 'Samarinda & Balikpapan' : 'Cabang ' + App.user.nama_cabang);
  const actions = [
    App.can('kendaraan', 'c') ? `<button class="btn btn-outline" data-act="kend">${UI.ic('car-front')} Tambah Kendaraan</button>` : '',
    App.can('keuangan', 'c') ? `<button class="btn btn-outline t-red" data-act="keluar">${UI.ic('circle-minus')} Catat Pengeluaran</button>` : '',
    App.can('sewa', 'c') ? `<a class="btn btn-primary" href="#/sewa/baru">${UI.ic('plus')} Sewa Baru</a>` : ''
  ].join('');

  const keu = d.keuangan;
  const kpi4 = keu ? UI.kpi({
    label: 'Pemasukan bulan ini', extra: UI.delta(keu.pemasukan, keu.pemasukan_lalu), value: UI.rp(keu.pemasukan), money: true,
    sub: `vs ${UI.rp(keu.pemasukan_lalu)} bulan lalu`
  }) : UI.kpi({ label: 'Sewa aktif', value: d.sewa_aktif, unit: 'Kontrak', icon: 'key-round', sub: 'Sedang berjalan' });

  el.innerHTML = UI.pageHead({
    crumbs: `<span>Operasional terpadu</span><span>•</span><b>${esc(area)}</b>`,
    title: 'Dashboard Utama',
    desc: 'Ringkasan armada, sewa, dan kas hari ini. Data mengikuti filter cabang di atas.',
    actions
  }) + `
  <div class="grid g4 kpis">
    ${UI.kpi({ label: 'Kendaraan tersedia', value: k.tersedia, unit: 'Unit', icon: 'circle-check', tone: 'green', sub: 'Siap disewakan dari ' + k.total + ' unit aktif', bar: UI.pct(k.tersedia, k.total), barTone: 'green' })}
    ${UI.kpi({ label: 'Sedang disewa', value: k.disewa, unit: 'Unit', icon: 'key-round', sub: 'Utilisasi ' + String(k.utilisasi).replace('.', ',') + '% armada aktif', bar: k.utilisasi })}
    ${UI.kpi({ label: 'Dalam servis', value: k.servis, unit: 'Unit', icon: 'wrench', tone: 'amber', sub: 'Tidak bisa disewakan sementara', bar: UI.pct(k.servis, k.total), barTone: 'amber' })}
    ${kpi4}
  </div>
  ${d.tren || d.cabang ? `<div class="grid ${d.tren && d.cabang ? 'g-main' : ''} mt-20">
    ${d.tren ? `<section class="card"><div class="card-head"><div><h3>Pemasukan vs pengeluaran ${UI.badge('6 bulan', '')}</h3><p>Arus kas yang sudah disetujui</p></div>
      <div class="legend"><span><i style="background:#16A34A"></i>Pemasukan</span><span><i style="background:#DC2626"></i>Pengeluaran</span></div></div>
      <div class="card-body"><div class="chart-box"><canvas id="ch-tren" aria-label="Grafik pemasukan dan pengeluaran 6 bulan"></canvas></div></div></section>` : ''}
    ${d.cabang ? `<section class="card"><div class="card-head"><div><h3>Perbandingan antarcabang</h3><p>Omzet bulan ini dan utilisasi armada</p></div></div>
      <div class="card-body">${Pages._cabangBars(d.cabang)}</div>
      <div class="card-foot"><span class="small muted">Total armada gabungan: <b class="mono" style="color:var(--text)">${d.cabang.reduce((a, c) => a + c.armada, 0)} unit</b></span>${App.can('laporan', 'r') ? '<a href="#/laporan" class="small">Lihat laporan lengkap</a>' : ''}</div></section>` : ''}
  </div>` : ''}
  <div class="grid g3 mt-20">
    ${d.pengingat ? `<section class="card"><div class="card-head"><h3>${UI.ic('calendar-clock', 't-red')} Pengingat jatuh tempo</h3>${UI.badge(d.pengingat.length + ' perlu aksi', d.pengingat.length ? 'amber' : '')}</div>
      <div class="card-body">${d.pengingat.length ? d.pengingat.map(Pages._pengingatItem).join('') : UI.empty('Tidak ada jatuh tempo dekat', 'Pajak, STNK, dan servis aman 30 hari ke depan.', 'shield-check')}</div>
      ${App.can('kendaraan', 'r') ? '<div class="card-foot"><a href="#/kendaraan" class="small">Buka daftar kendaraan</a></div>' : ''}</section>` : ''}
    <section class="card"><div class="card-head"><h3>${UI.ic('clock', 't-blue')} Jadwal kembali hari ini</h3>${UI.badge(d.kembali.length + ' unit', 'blue')}</div>
      <div class="card-body">${d.kembali.length ? d.kembali.map(Pages._kembaliItem).join('') : UI.empty('Tidak ada pengembalian hari ini', 'Unit yang jatuh tempo kembali akan muncul di sini.', 'calendar-check')}</div>
      ${App.can('sewa', 'r') ? '<div class="card-foot"><a href="#/sewa" class="small">Semua transaksi sewa</a></div>' : ''}</section>
    ${d.approval ? `<section class="card"><div class="card-head"><h3>${UI.ic('clipboard-check', 't-blue')} Approval menunggu</h3>${UI.badge(d.approval.length + ' tiket', d.approval.length ? 'amber' : '')}</div>
      <div class="card-body">${d.approval.length ? d.approval.map(a => `<div class="li"><div class="li-top"><div style="min-width:0"><h4>${esc(a.judul)}</h4><p>${esc(a.modul)} • ${esc(a.nama_pengaju)}</p></div><b class="mono nowrap">${UI.rp(a.nominal)}</b></div>
        <div class="row mt-8" style="justify-content:flex-end"><a class="btn btn-outline btn-sm" href="#/approval/${encodeURIComponent(a.id_approval)}">Lihat</a>${a.modul !== 'Penggajian' ? `<button class="btn btn-primary btn-sm" data-approve="${esc(a.id_approval)}">Setujui</button>` : ''}</div></div>`).join('')
        : UI.empty('Semua pengajuan sudah diputuskan', '', 'circle-check')}</div>
      <div class="card-foot"><a href="#/approval" class="small">Buka antrean approval</a></div></section>` : ''}
  </div>`;
  UI.icons(el);

  if (d.tren) {
    UI.chart(el.querySelector('#ch-tren'), {
      type: 'line',
      data: {
        labels: d.tren.map(t => UI.BULAN[+t.bulan.slice(5) - 1]),
        datasets: [
          { label: 'Pemasukan', data: d.tren.map(t => t.pemasukan), borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,.08)', fill: true, tension: .3, pointRadius: 4, pointBackgroundColor: '#fff', borderWidth: 2.5 },
          { label: 'Pengeluaran', data: d.tren.map(t => t.pengeluaran), borderColor: '#DC2626', borderDash: [6, 4], tension: .3, pointRadius: 4, pointBackgroundColor: '#fff', borderWidth: 2 }
        ]
      },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + UI.rp(c.parsed.y) } } }, scales: { y: UI.axisRp(), x: { grid: { display: false } } } }
    });
  }
  el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
    if (b.dataset.act === 'kend') Pages.kendaraanForm(null, () => App.route());
    if (b.dataset.act === 'keluar') Pages.keuanganForm('Pengeluaran', () => App.route());
  });
  el.querySelectorAll('[data-approve]').forEach(b => b.onclick = async () => {
    const ok = await UI.confirm({ title: 'Setujui pengajuan?', message: 'Keputusan akan dicatat atas nama Anda dan pengaju menerima notifikasi.', ok: 'Setujui' });
    if (!ok) return;
    UI.busy(b, true, '');
    try { await API.call('approval.decide', { id_approval: b.dataset.approve, keputusan: 'Disetujui' }); UI.toast('Pengajuan disetujui.', 'success'); App.route(); App.refreshBadges(); }
    catch (e) { UI.busy(b, false); UI.toast(e.message, 'error'); }
  });
};

Pages._cabangBars = (list) => {
  const max = Math.max(1, ...list.map(c => c.omzet));
  const total = list.reduce((a, c) => a + c.armada, 0);
  return list.map((c, i) => `<div class="li" ${i ? '' : ''}>
    <div class="li-top"><h4>${esc(c.nama_cabang)}</h4><b class="mono">${UI.rp(c.omzet)}</b></div>
    <div class="bar mt-8"><i class="${i ? '' : 'navy'}" style="width:${UI.pct(c.omzet, max)}%"></i></div>
    <div class="row between mt-8 small"><span class="muted">${c.armada} unit armada (${UI.pct(c.armada, total)}%)</span><span class="t-green">Utilisasi ${String(c.utilisasi).replace('.', ',')}%</span></div></div>`).join('');
};

Pages._pengingatItem = (p) => {
  const tone = p.sisa <= 7 ? 'red' : 'amber';
  const label = p.satuan === 'km' ? (p.sisa_km <= 0 ? 'Lewat ' + UI.num(-p.sisa_km) + ' km' : 'Sisa ' + UI.num(p.sisa_km) + ' km')
    : (p.sisa < 0 ? 'Terlambat ' + Math.abs(p.sisa) + ' hari' : p.sisa === 0 ? 'Hari ini' : p.sisa + ' hari lagi');
  return `<div class="li ${tone === 'red' ? 'red' : ''}"><div class="li-top">${UI.plat(p.plat)}${UI.badge(label, tone)}</div>
    <h4 class="mt-8">${esc(p.nama)}</h4><p>${esc(p.jenis)}${p.tanggal ? ' • ' + UI.dateLong(p.tanggal) : ''} • ${esc(p.nama_cabang)}</p></div>`;
};

Pages._kembaliItem = (x) => `<a class="li ${x.terlambat ? 'red' : ''}" style="display:block;text-decoration:none;color:inherit" href="#/sewa/${encodeURIComponent(x.id_sewa)}">
  <div class="li-top"><span class="mono t-blue small strong">#${esc(x.id_sewa)}</span>${x.terlambat ? UI.badge('Terlambat ' + x.terlambat_jam + ' jam', 'red') : UI.badge('Aktif', 'blue')}</div>
  <h4 class="mt-8">${esc(x.nama_pelanggan)}</h4>
  <div class="row between small"><span class="muted">${esc(x.nama_kendaraan)} • <span class="mono">${esc(x.plat)}</span></span><span class="${x.terlambat ? 't-red strong' : ''} nowrap">${UI.time(x.tgl_kembali_rencana)} WITA</span></div></a>`;

Pages.dashboardSupir = (el, d) => {
  el.innerHTML = UI.pageHead({ title: 'Halo, ' + esc(App.user.nama.split(' ')[0]), desc: 'Tugas mengemudi dan kendaraan yang sedang ditugaskan kepada Anda.', actions: App.can('tugas', 'c') ? `<a class="btn btn-primary" href="#/tugas">${UI.ic('gauge')} Lapor KM & kondisi</a>` : '' }) +
    `<div class="grid g2">${UI.kpi({ label: 'Tugas aktif', value: d.tugas.length, unit: 'Tugas', icon: 'clipboard-list' })}${UI.kpi({ label: 'Kendaraan ditugaskan', value: d.kendaraan.total, unit: 'Unit', icon: 'car-front', tone: 'navy' })}</div>
    <section class="card mt-20"><div class="card-head"><h3>Jadwal tugas saya</h3></div><div class="card-body">${d.tugas.length ? d.tugas.map(Pages._kembaliItem).join('') : UI.empty('Belum ada tugas aktif', 'Tugas baru muncul saat Admin atau Staf menugaskan Anda pada transaksi sewa.', 'calendar')}</div></section>`;
  UI.icons(el);
};

// =====================================================================
// KENDARAAN
// =====================================================================
Pages.kendaraan = async (el) => {
  const rows = await API.call('kendaraan.list', { cabang: App.cabang });
  const P = App.meta.pengaturan;
  const st = { q: '', jenis: '', status: '' };
  const aktif = rows.filter(k => k.status !== 'Nonaktif');
  const n = s => aktif.filter(k => k.status === s).length;
  const pajak30 = aktif.filter(k => k.sisa_hari_pajak !== null && k.sisa_hari_pajak <= 30).sort((a, b) => a.sisa_hari_pajak - b.sisa_hari_pajak);
  const util = UI.pct(n('Disewa'), aktif.length);
  const cabs = App.meta.cabang.map(c => ({ c, list: aktif.filter(k => k.id_cabang === c.id_cabang) })).filter(x => x.list.length || !App.cabang);

  el.innerHTML = UI.pageHead({
    title: 'Armada Kendaraan', badge: UI.badge(aktif.length + ' unit aktif', 'navy'),
    desc: 'Status ketersediaan, kilometer, tarif, dan jadwal pajak setiap unit.',
    actions: `<button class="btn btn-outline" data-csv>${UI.ic('download')} Ekspor CSV</button>${App.can('kendaraan', 'c') ? `<button class="btn btn-primary" data-add>${UI.ic('plus')} Tambah Kendaraan</button>` : ''}`
  }) + `
  <div class="grid g4 kpis">
    ${UI.kpi({ label: 'Total unit armada', value: aktif.length, unit: 'Unit', icon: 'car-front', tone: 'navy', sub: App.cabang ? 'Cabang ' + esc(App.cabName(App.cabang)) : 'Semua cabang dalam cakupan Anda' })}
    ${UI.kpi({ label: 'Tersedia', extra: UI.badge(UI.pct(n('Tersedia'), aktif.length) + '%', 'green'), value: n('Tersedia'), unit: 'Unit', icon: 'circle-check', tone: 'green', sub: 'Siap disewa langsung' })}
    ${UI.kpi({ label: 'Sedang disewa', extra: UI.badge(util + '%', 'blue'), value: n('Disewa'), unit: 'Unit', icon: 'key-round', sub: 'Kontrak aktif' })}
    ${UI.kpi({ label: 'Dalam servis', extra: UI.badge(UI.pct(n('Servis'), aktif.length) + '%', 'red'), value: n('Servis'), unit: 'Unit', icon: 'wrench', tone: 'amber', sub: 'Di bengkel' })}
  </div>
  <section class="card mt-20">
    <div class="filters">
      <label class="search">${UI.ic('search')}<input class="input" data-f="q" placeholder="Cari nama mobil atau plat nomor..." aria-label="Cari kendaraan"></label>
      <select class="input" data-f="jenis" aria-label="Jenis"><option value="">Semua jenis</option>${UI.opts(P.jenis_kendaraan)}</select>
      <select class="input" data-f="status" aria-label="Status"><option value="">Semua status</option>${UI.opts(['Tersedia', 'Disewa', 'Servis', 'Nonaktif'])}</select>
      <button class="btn btn-ghost" data-reset>${UI.ic('rotate-ccw')} Reset</button>
    </div>
    <div id="tbl-kend"></div>
  </section>
  <div class="grid g3 mt-20">
    <section class="card card-pad"><div class="row between"><h3 class="strong" style="font-size:15px">Tingkat utilisasi armada</h3><b class="mono t-blue">${String(util).replace('.', ',')}%</b></div>
      <p class="muted small mt-8">${n('Disewa')} dari ${aktif.length} unit aktif sedang menghasilkan pendapatan. Target operasional 75%.</p>
      <div class="bar mt-16" style="height:10px"><i style="width:${Math.min(util, 100)}%"></i></div><div class="row between xs muted mt-8"><span>0%</span><span>Target 75%</span></div></section>
    <section class="card card-pad"><div class="row between"><h3 class="strong" style="font-size:15px">Pajak jatuh tempo &lt; 30 hari</h3>${UI.badge(pajak30.length + ' unit', pajak30.length ? 'red' : '')}</div>
      <p class="muted small mt-8">Perpanjang STNK/PKB di Samsat sebelum jatuh tempo agar tidak kena denda.</p>
      <div class="mt-12">${pajak30.slice(0, 4).map(k => `<div class="row between small" style="padding:6px 0"><span class="mono strong">${esc(k.plat)}</span><span class="${k.sisa_hari_pajak <= 7 ? 't-red' : 't-amber'} mono">${UI.dateLong(k.tgl_pajak_tahunan)} (${k.sisa_hari_pajak} hari)</span></div>`).join('') || '<p class="small t-green mt-8">Tidak ada pajak yang jatuh tempo dalam 30 hari.</p>'}</div></section>
    <section class="card card-pad"><h3 class="strong" style="font-size:15px">Distribusi per cabang</h3><p class="muted small mt-8">Sebaran unit aktif dan statusnya.</p>
      <div class="grid g2 mt-12" style="gap:10px">${cabs.map(x => `<div class="li" style="margin:0"><p class="muted small" style="margin:0">${esc(x.c.nama_cabang)}</p><b class="mono" style="font-size:18px">${x.list.length} unit</b><p class="t-blue xs">${x.list.filter(k => k.status === 'Tersedia').length} siap • ${x.list.filter(k => k.status === 'Disewa').length} disewa</p></div>`).join('')}</div></section>
  </div>`;

  const tbl = UI.table(el.querySelector('#tbl-kend'), {
    unit: 'kendaraan', pageSize: 10,
    rowClass: k => k.status === 'Nonaktif' ? 'faint' : '',
    onRow: k => App.go('kendaraan/' + encodeURIComponent(k.id_kendaraan)),
    columns: [
      { key: 'nama', label: 'Kendaraan', render: k => `<div class="row"><div class="thumb">${UI.ic('car-front')}</div><div><div class="t-main">${esc(k.nama)}</div><div class="t-sub">${esc([k.jenis, k.tahun ? 'Tahun ' + k.tahun : '', k.warna].filter(Boolean).join(' • '))}</div></div></div>` },
      { key: 'plat', label: 'Plat nomor', render: k => UI.plat(k.plat) },
      { key: 'nama_cabang', label: 'Cabang', render: k => UI.cab(k.nama_cabang) },
      { key: 'km_saat_ini', label: 'KM saat ini', num: true, render: k => UI.num(k.km_saat_ini) + ' km' },
      { key: 'tgl_pajak_tahunan', label: 'Jatuh tempo pajak', render: k => `<div>${UI.dateLong(k.tgl_pajak_tahunan)}</div>${UI.sisaHari(k.sisa_hari_pajak)}` },
      { key: 'harga_sewa_per_hari', label: 'Tarif sewa', num: true, render: k => `${UI.rp(k.harga_sewa_per_hari)} <span class="muted xs">/hari</span>` },
      { key: 'status', label: 'Status', align: 'center', render: k => UI.status('kendaraan', k.status) + (k.sewa_aktif ? `<div class="t-sub">s.d. ${UI.dateLong(k.sewa_aktif.tgl_kembali_rencana)}</div>` : '') },
      { label: 'Aksi', align: 'right', render: k => `<div class="acts"><button class="btn-icon" data-view="${esc(k.id_kendaraan)}" aria-label="Detail">${UI.ic('eye')}</button>${App.can('kendaraan', 'u') ? `<button class="btn-icon blue" data-edit="${esc(k.id_kendaraan)}" aria-label="Ubah">${UI.ic('pencil')}</button>` : ''}</div>` }
    ],
    bind: (box) => {
      box.querySelectorAll('[data-view]').forEach(b => b.onclick = () => App.go('kendaraan/' + encodeURIComponent(b.dataset.view)));
      box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => Pages.kendaraanForm(rows.find(k => k.id_kendaraan === b.dataset.edit), () => App.route()));
    }
  });
  const apply = () => tbl.setRows(rows.filter(k => UI.match(k, st.q, ['nama', 'plat', 'jenis']) && (!st.jenis || k.jenis === st.jenis) && (!st.status || k.status === st.status)));
  apply();
  el.querySelectorAll('[data-f]').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'change', UI.debounce(() => { st[i.dataset.f] = i.value; apply(); }, 150)));
  el.querySelector('[data-reset]').onclick = () => { el.querySelectorAll('[data-f]').forEach(i => i.value = ''); st.q = st.jenis = st.status = ''; apply(); };
  const add = el.querySelector('[data-add]');
  if (add) add.onclick = () => Pages.kendaraanForm(null, () => App.route());
  el.querySelector('[data-csv]').onclick = () => UI.downloadText(UI.csv(tbl.rows, [
    { label: 'ID', key: 'id_kendaraan' }, { label: 'Nama', key: 'nama' }, { label: 'Plat', key: 'plat' }, { label: 'Jenis', key: 'jenis' }, { label: 'Tahun', key: 'tahun' },
    { label: 'Cabang', key: 'nama_cabang' }, { label: 'KM', key: 'km_saat_ini' }, { label: 'Pajak Tahunan', val: k => UI.date(k.tgl_pajak_tahunan) },
    { label: 'STNK 5 Tahunan', val: k => UI.date(k.tgl_stnk_5tahunan) }, { label: 'Tarif/Hari', key: 'harga_sewa_per_hari' }, { label: 'Status', key: 'status' }
  ]), 'kendaraan_' + UI.today() + '.csv');
  UI.icons(el);
};

Pages.kendaraanForm = (k, onDone) => {
  const full = App.can('kendaraan', 'c');
  if (k && !full) {
    // Role tanpa izin tambah (Staf): hanya ubah status
    const m = UI.modal({
      title: 'Ubah status kendaraan', sub: esc(k.nama) + ' • ' + esc(k.plat), size: 'sm',
      body: `<form id="f-status"><div class="field"><label>Status</label><select class="input" name="status">${UI.opts(['Tersedia', 'Servis', 'Nonaktif'], null, null, k.status)}</select>
        <span class="hint">Status "Disewa" diatur otomatis lewat transaksi sewa.</span></div></form>`,
      footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" form="f-status" type="submit">Simpan status</button>`
    });
    m.q('form').onsubmit = async e => {
      e.preventDefault();
      const b = m.q('button[type=submit]'); UI.busy(b, true);
      try { await API.call('kendaraan.save', { id_kendaraan: k.id_kendaraan, status: e.target.status.value }); UI.toast('Status kendaraan diperbarui.', 'success'); m.close(); onDone && onDone(); }
      catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
    };
    return;
  }
  const P = App.meta.pengaturan;
  const x = k || { id_cabang: App.cabang || (App.allBranches() ? '' : App.user.id_cabang) };
  const cabOpts = App.scope('kendaraan') === 'SEMUA' ? App.meta.cabang : App.meta.cabang.filter(c => c.id_cabang === App.user.id_cabang);
  const m = UI.modal({
    title: k ? 'Ubah data kendaraan' : 'Tambah kendaraan', sub: k ? esc(k.plat) : 'Plat nomor harus unik. Tanggal pajak tahunan wajib diisi.', size: 'lg',
    body: `<form id="f-kend" class="fgrid">
      <div class="field span-2"><label>Nama / merek kendaraan <span class="req">*</span></label><input class="input" name="nama" value="${esc(x.nama || '')}" placeholder="Toyota Avanza 1.5 G CVT" required></div>
      <div class="field"><label>Plat nomor <span class="req">*</span></label><input class="input mono" name="plat" value="${esc(x.plat || '')}" placeholder="KT 1234 AB" required style="text-transform:uppercase"></div>
      <div class="field"><label>Cabang <span class="req">*</span></label><select class="input" name="id_cabang" required>${UI.opts(cabOpts, 'id_cabang', 'nama_cabang', x.id_cabang, 'Pilih cabang')}</select></div>
      <div class="field"><label>Jenis</label><select class="input" name="jenis">${UI.opts(P.jenis_kendaraan, null, null, x.jenis, 'Pilih jenis')}</select></div>
      <div class="field"><label>Tahun</label><input class="input mono" name="tahun" inputmode="numeric" maxlength="4" value="${esc(x.tahun || '')}"></div>
      <div class="field"><label>Warna</label><input class="input" name="warna" value="${esc(x.warna || '')}"></div>
      <div class="field"><label>KM saat ini</label><div class="input-group"><input class="input" name="km_saat_ini" inputmode="numeric" value="${esc(x.km_saat_ini || '')}"><span class="addon" style="border-right:0;border-left:1px solid var(--line)">KM</span></div></div>
      <div class="field"><label>Tarif sewa per hari <span class="req">*</span></label><div class="input-group"><span class="addon">IDR</span><input class="input" name="harga_sewa_per_hari" inputmode="numeric" value="${esc(x.harga_sewa_per_hari || '')}" required></div></div>
      <div class="field"><label>Pajak tahunan (PKB) <span class="req">*</span></label><input class="input" type="date" name="tgl_pajak_tahunan" value="${esc(x.tgl_pajak_tahunan || '')}" required></div>
      <div class="field"><label>STNK 5 tahunan</label><input class="input" type="date" name="tgl_stnk_5tahunan" value="${esc(x.tgl_stnk_5tahunan || '')}"></div>
      ${k ? `<div class="field"><label>Status</label><select class="input" name="status" ${k.status === 'Disewa' ? 'disabled' : ''}>${UI.opts(k.status === 'Disewa' ? ['Disewa'] : ['Tersedia', 'Servis', 'Nonaktif'], null, null, k.status)}</select></div>` : ''}
      <div class="span-all grid g2" style="gap:14px">${UI.fileField('foto', k && k.id_foto_drive ? 'Foto kendaraan (ganti)' : 'Foto kendaraan')}${UI.fileField('stnk', k && k.id_stnk_drive ? 'Scan STNK (ganti)' : 'Scan STNK')}</div>
    </form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" type="submit" form="f-kend">${UI.ic('check')} ${k ? 'Simpan perubahan' : 'Tambah kendaraan'}</button>`
  });
  m.q('form').onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]');
    UI.busy(b, true, 'Menyimpan...');
    try {
      const data = Object.assign(UI.formData(e.target), await UI.collectFiles(e.target));
      if (k) { data.id_kendaraan = k.id_kendaraan; if (k.status === 'Disewa') delete data.status; }
      await API.call('kendaraan.save', data);
      UI.toast(k ? 'Data kendaraan diperbarui.' : 'Kendaraan ditambahkan.', 'success');
      m.close(); onDone && onDone();
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

Pages.kendaraanDetail = async (el, id) => {
  const d = await API.call('kendaraan.detail', { id_kendaraan: id });
  const k = d.kendaraan;
  App.setCrumb(k.plat);
  const canServ = App.can('servis', 'c');
  el.innerHTML = UI.pageHead({
    crumbs: `<a href="#/kendaraan">Armada Kendaraan</a><span>›</span><b>${esc(k.plat)}</b>`,
    title: esc(k.nama), badge: UI.status('kendaraan', k.status),
    desc: `${UI.cab(k.nama_cabang)} <span class="muted small">• ID <span class="mono">${esc(k.id_kendaraan)}</span></span>`,
    actions: [
      k.id_stnk_drive ? `<button class="btn btn-outline" data-stnk>${UI.ic('file-text')} Lihat STNK</button>` : '',
      canServ ? `<button class="btn btn-outline" data-servis>${UI.ic('wrench')} Catat servis</button>` : '',
      App.can('kendaraan', 'u') ? `<button class="btn btn-primary" data-edit>${UI.ic('pencil')} ${App.can('kendaraan', 'c') ? 'Ubah data' : 'Ubah status'}</button>` : ''
    ].join('')
  }) + `
  <div class="grid g-side">
    <div class="stack">
      <section class="card"><div class="tabs" role="tablist">
        <button class="tab on" data-tab="servis">Riwayat servis <span class="n">${d.servis.length}</span></button>
        <button class="tab" data-tab="laporan">Laporan supir <span class="n">${d.laporan.length}</span></button>
        ${d.sewa.length || App.can('sewa', 'r') ? `<button class="tab" data-tab="sewa">Riwayat sewa <span class="n">${d.sewa.length}</span></button>` : ''}
      </div><div id="tab-body"></div></section>
    </div>
    <aside class="stack">
      <section class="card card-pad"><div class="photo-box" id="photo">${UI.ic('car-front', 'ic-lg')}</div>
        <div class="row between mt-16">${UI.plat(k.plat)}<b class="mono">${UI.rp(k.harga_sewa_per_hari)}<span class="muted xs"> /hari</span></b></div>
        <dl class="kv mt-16">
          <div><dt>Jenis</dt><dd>${esc(k.jenis || '-')}</dd></div><div><dt>Tahun • warna</dt><dd>${esc(k.tahun || '-')} • ${esc(k.warna || '-')}</dd></div>
          <div><dt>Odometer</dt><dd class="mono">${UI.num(k.km_saat_ini)} km</dd></div><div><dt>Sewa aktif</dt><dd>${k.sewa_aktif ? `<a class="mono" href="#/sewa/${encodeURIComponent(k.sewa_aktif.id_sewa)}">#${esc(k.sewa_aktif.id_sewa)}</a>` : '-'}</dd></div>
          <div><dt>Pajak tahunan</dt><dd>${UI.dateLong(k.tgl_pajak_tahunan)}<div>${UI.sisaHari(k.sisa_hari_pajak)}</div></dd></div>
          <div><dt>STNK 5 tahunan</dt><dd>${UI.dateLong(k.tgl_stnk_5tahunan)}<div>${UI.sisaHari(k.sisa_hari_stnk)}</div></dd></div>
        </dl></section>
    </aside>
  </div>`;
  UI.icons(el);
  if (k.id_foto_drive) {
    API.call('file.get', { id: k.id_foto_drive }).then(f => {
      const box = el.querySelector('#photo');
      if (box) { box.innerHTML = `<img alt="Foto ${esc(k.nama)}" src="${URL.createObjectURL(UI.b64Blob(f.base64, f.mimeType))}">`; box.style.cursor = 'zoom-in'; box.onclick = () => UI.openFile(k.id_foto_drive, 'Foto ' + k.plat); }
    }).catch(() => {});
  }
  const body = el.querySelector('#tab-body');
  const tabs = {
    servis: () => UI.table(body, {
      unit: 'catatan servis', empty: 'Belum ada catatan servis.', columns: [
        { key: 'tanggal', label: 'Tanggal', render: s => UI.date(s.tanggal) },
        { key: 'jenis_servis', label: 'Jenis servis', render: s => `<div class="t-main">${esc(s.jenis_servis)}</div><div class="t-sub">${esc(s.bengkel || '-')}</div>` },
        { key: 'km_saat_servis', label: 'KM', num: true, render: s => UI.num(s.km_saat_servis) },
        { key: 'biaya', label: 'Biaya', num: true, render: s => `<span class="t-red">${UI.rp(s.biaya)}</span>` },
        { key: 'km_servis_berikutnya', label: 'Servis berikutnya', render: s => [s.km_servis_berikutnya ? UI.num(s.km_servis_berikutnya) + ' km' : '', s.tgl_servis_berikutnya ? UI.date(s.tgl_servis_berikutnya) : ''].filter(Boolean).join(' / ') || '-' },
        { label: '', align: 'right', render: s => s.id_bukti_drive ? `<button class="btn-icon" data-file="${esc(s.id_bukti_drive)}" aria-label="Bukti">${UI.ic('paperclip')}</button>` : '' }
      ], bind: Pages._bindFiles
    }),
    laporan: () => UI.table(body, {
      unit: 'laporan', empty: 'Belum ada laporan supir untuk kendaraan ini.', columns: [
        { key: 'tanggal', label: 'Tanggal', render: r => UI.date(r.tanggal) },
        { key: 'nama_supir', label: 'Supir' },
        { key: 'km_awal', label: 'KM awal → akhir', num: true, render: r => UI.num(r.km_awal) + ' → ' + UI.num(r.km_akhir) },
        { key: 'kondisi', label: 'Kondisi', render: r => UI.badge(r.kondisi, r.kondisi === 'Baik' ? 'green' : r.kondisi === 'Rusak' ? 'red' : 'amber') },
        { key: 'catatan', label: 'Catatan' },
        { label: '', align: 'right', render: r => r.id_foto_drive ? `<button class="btn-icon" data-file="${esc(r.id_foto_drive)}" aria-label="Foto">${UI.ic('image')}</button>` : '' }
      ], bind: Pages._bindFiles
    }),
    sewa: () => UI.table(body, {
      unit: 'transaksi', empty: 'Belum ada riwayat sewa.', onRow: x => App.go('sewa/' + encodeURIComponent(x.id_sewa)), columns: [
        { key: 'id_sewa', label: 'No. sewa', render: x => `<span class="mono t-blue strong">#${esc(x.id_sewa)}</span>` },
        { key: 'nama_pelanggan', label: 'Pelanggan' },
        { key: 'tgl_pinjam', label: 'Periode', render: x => UI.date(x.tgl_pinjam) + ' – ' + UI.date(x.tgl_kembali_aktual || x.tgl_kembali_rencana) },
        { key: 'harga_total', label: 'Total', num: true, render: x => UI.rp(x.harga_total) },
        { key: 'status_sewa', label: 'Status', align: 'center', render: x => UI.status('sewa', x.status_sewa) }
      ]
    })
  };
  const show = t => { el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); tabs[t](); };
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => show(b.dataset.tab));
  show('servis');
  const on = (s, f) => { const b = el.querySelector(s); if (b) b.onclick = f; };
  on('[data-edit]', () => Pages.kendaraanForm(k, () => App.route()));
  on('[data-servis]', () => Pages.servisForm(k, () => App.route()));
  on('[data-stnk]', () => UI.openFile(k.id_stnk_drive, 'STNK ' + k.plat));
};

Pages._bindFiles = (box) => box.querySelectorAll('[data-file]').forEach(b => b.onclick = () => UI.openFile(b.dataset.file, b.getAttribute('aria-label') || 'Berkas'));

Pages.servisForm = (k, onDone) => {
  const P = App.meta.pengaturan;
  const m = UI.modal({
    title: 'Catat servis kendaraan', sub: esc(k.nama) + ' • ' + esc(k.plat), size: 'lg',
    body: `<form id="f-servis" class="fgrid">
      <div class="field"><label>Tanggal <span class="req">*</span></label><input class="input" type="date" name="tanggal" value="${UI.today()}" required></div>
      <div class="field"><label>Jenis servis <span class="req">*</span></label><input class="input" name="jenis_servis" placeholder="Ganti oli & filter" required></div>
      <div class="field"><label>KM saat servis</label><input class="input mono" name="km_saat_servis" inputmode="numeric" value="${esc(k.km_saat_ini || '')}"></div>
      <div class="field"><label>Biaya</label><div class="input-group"><span class="addon">IDR</span><input class="input" name="biaya" inputmode="numeric" placeholder="0"></div></div>
      <div class="field"><label>Bengkel</label><input class="input" name="bengkel" placeholder="Bengkel resmi"></div>
      <div class="field"><label>Metode bayar</label><select class="input" name="metode">${UI.opts(P.metode_bayar)}</select></div>
      <div class="field"><label>Servis berikutnya (KM)</label><input class="input mono" name="km_servis_berikutnya" inputmode="numeric" placeholder="mis. ${UI.n(k.km_saat_ini) + 5000}"></div>
      <div class="field"><label>Servis berikutnya (tanggal)</label><input class="input" type="date" name="tgl_servis_berikutnya"></div>
      <div class="span-all">${UI.fileField('bukti', 'Bukti servis / nota')}</div>
      ${k.status === 'Servis' ? '<label class="check span-all"><input type="checkbox" name="selesai" checked> Servis selesai — ubah status kendaraan menjadi Tersedia</label>' : ''}
      <div class="callout amber span-all">${UI.ic('info')}<div>Biaya otomatis tercatat sebagai pengeluaran "Servis Armada". Nominal di atas <b>${UI.rp(P.ambang_approval)}</b> membutuhkan persetujuan Admin.</div></div>
    </form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" type="submit" form="f-servis">${UI.ic('check')} Simpan servis</button>`
  });
  m.q('form').onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]'); UI.busy(b, true, 'Menyimpan...');
    try {
      const data = Object.assign(UI.formData(e.target), await UI.collectFiles(e.target), { id_kendaraan: k.id_kendaraan });
      const r = await API.call('servis.save', data);
      UI.toast(r.keuangan && r.keuangan.status_approval === 'Menunggu' ? 'Servis dicatat. Biaya menunggu approval Admin.' : 'Servis dicatat.', 'success');
      m.close(); onDone && onDone(); App.refreshBadges();
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

// =====================================================================
// SEWA — DAFTAR
// =====================================================================
Pages.sewa = async (el) => {
  const st = { tab: 'Aktif', q: '', dari: '', sampai: '' };
  const load = async () => {
    const d = await API.call('sewa.list', { cabang: App.cabang, status: st.tab, dari: st.dari, sampai: st.sampai });
    render(d);
  };
  const render = (d) => {
    const s = d.summary, c = d.counts;
    el.innerHTML = UI.pageHead({
      title: 'Transaksi Sewa', desc: 'Kontrak sewa, status pengembalian, dan pelunasan pembayaran pelanggan.',
      actions: `<button class="btn btn-outline" data-csv>${UI.ic('download')} Ekspor rekap</button>${App.can('sewa', 'c') ? `<a class="btn btn-primary" href="#/sewa/baru">${UI.ic('plus')} Sewa Baru</a>` : ''}`
    }) + `
    <div class="grid g4 kpis">
      ${UI.kpi({ label: 'Omzet sewa bulan ini', value: UI.rp(s.omzet_bulan), money: true, icon: 'banknote', sub: 'Nilai kontrak yang dimulai bulan ini' })}
      ${UI.kpi({ label: 'Unit sedang di jalan', value: s.unit_jalan, unit: 'Unit', icon: 'car-front', sub: 'Kontrak berstatus aktif' })}
      ${UI.kpi({ label: 'Sisa tagihan', value: UI.rp(s.outstanding), money: true, icon: 'receipt', tone: 'amber', extra: UI.badge(s.outstanding_count + ' kontrak', 'amber'), sub: 'Belum lunas / sisa DP' })}
      ${UI.kpi({ label: 'Jadwal kembali hari ini', value: s.kembali_hari_ini, unit: 'Kendaraan', icon: 'calendar-clock', tone: s.terlambat ? 'red' : '', sub: s.terlambat ? `<span class="t-red strong">${s.terlambat} terlambat</span>` : 'Tidak ada keterlambatan' })}
    </div>
    <section class="card mt-20">
      <div class="tabs" role="tablist">
        ${[['', 'Semua transaksi', c.semua], ['Aktif', 'Aktif / sedang jalan', c.aktif], ['Selesai', 'Selesai', c.selesai], ['BelumLunas', 'Belum lunas', c.belum_lunas], ['Dibatalkan', 'Dibatalkan', c.dibatalkan]]
        .map(t => `<button class="tab ${st.tab === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]} <span class="n ${t[0] === 'BelumLunas' && t[2] ? 'warn' : ''}">${t[2]}</span></button>`).join('')}
      </div>
      <div class="filters">
        <label class="search">${UI.ic('search')}<input class="input" data-q value="${esc(st.q)}" placeholder="Cari no. sewa, nama penyewa, plat..." aria-label="Cari transaksi"></label>
        <label class="row small muted">Dari <input class="input" type="date" data-dari value="${esc(st.dari)}"></label>
        <label class="row small muted">Sampai <input class="input" type="date" data-sampai value="${esc(st.sampai)}"></label>
        <button class="btn-icon" data-reload aria-label="Muat ulang">${UI.ic('refresh-cw')}</button>
      </div>
      <div id="tbl-sewa"></div>
    </section>`;
    const tbl = UI.table(el.querySelector('#tbl-sewa'), {
      unit: 'transaksi', empty: 'Tidak ada transaksi pada filter ini.',
      rowClass: x => x.terlambat ? 'warn-row' : '',
      onRow: x => App.go('sewa/' + encodeURIComponent(x.id_sewa)),
      footNote: rows => `<span>Total sisa tagihan ditampilkan: <b class="t-amber mono">${UI.rp(rows.reduce((a, x) => a + (x.status_sewa === 'Dibatalkan' ? 0 : UI.n(x.sisa_bayar)), 0))}</b></span>`,
      columns: [
        { key: 'id_sewa', label: 'No. sewa', render: x => `<div class="mono strong ${x.terlambat ? 't-red' : 't-blue'}">${x.terlambat ? UI.ic('triangle-alert', 'ic-sm') + ' ' : ''}#${esc(x.id_sewa)}</div><div class="t-sub">${esc(x.nama_cabang)}</div>` },
        { key: 'nama_pelanggan', label: 'Pelanggan', render: x => `<div class="row"><span class="avatar lt" style="width:32px;height:32px;font-size:11px">${esc(UI.initials(x.nama_pelanggan))}</span><div><div class="t-main">${esc(x.nama_pelanggan)}</div><div class="t-sub mono">${esc(x.no_hp)}</div></div></div>` },
        { key: 'nama_kendaraan', label: 'Kendaraan', render: x => `<div class="t-main" style="font-weight:500">${esc(x.nama_kendaraan)}</div><div class="mt-8">${UI.plat(x.plat, true)}</div>` },
        { key: 'tgl_pinjam', label: 'Periode sewa', render: x => `<div>${UI.dateLong(x.tgl_pinjam)} – ${UI.dateLong(x.tgl_kembali_aktual || x.tgl_kembali_rencana)}</div><div class="t-sub ${x.terlambat ? 't-red' : ''}">${x.terlambat ? 'Lewat ' + x.terlambat_jam + ' jam dari jadwal' : x.durasi_hari + ' hari' + (x.status_sewa === 'Aktif' ? ' • kembali ' + UI.time(x.tgl_kembali_rencana) + ' WITA' : '')}</div>` },
        { key: 'nama_supir', label: 'Supir', render: x => x.nama_supir ? `<span class="badge sans blue">${UI.ic('user', 'ic-sm')} ${esc(x.nama_supir)}</span>` : '<span class="badge sans">Lepas kunci</span>' },
        { key: 'harga_total', label: 'Total', num: true, render: x => UI.rp(x.harga_total), sortVal: x => UI.n(x.harga_total) },
        { key: 'sisa_bayar', label: 'Sisa', num: true, render: x => `<span class="${UI.n(x.sisa_bayar) > 0 && x.status_sewa !== 'Dibatalkan' ? 't-amber' : 'muted'}">${UI.rp(x.sisa_bayar)}</span>`, sortVal: x => UI.n(x.sisa_bayar) },
        { key: 'status_bayar', label: 'Bayar', align: 'center', render: x => UI.status('bayar', x.status_bayar) },
        { key: 'status_sewa', label: 'Status', align: 'center', render: x => UI.status('sewa', x.status_sewa) }
      ]
    });
    const filt = () => tbl.setRows(d.rows.filter(x => UI.match(x, st.q, ['id_sewa', 'nama_pelanggan', 'plat', 'nama_kendaraan', 'no_hp'])));
    filt();
    el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => { st.q = e.target.value; filt(); }, 150));
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; load().catch(e => UI.toast(e.message, 'error')); });
    el.querySelector('[data-dari]').onchange = e => { st.dari = e.target.value; load().catch(er => UI.toast(er.message, 'error')); };
    el.querySelector('[data-sampai]').onchange = e => { st.sampai = e.target.value; load().catch(er => UI.toast(er.message, 'error')); };
    el.querySelector('[data-reload]').onclick = () => load().catch(e => UI.toast(e.message, 'error'));
    el.querySelector('[data-csv]').onclick = () => UI.downloadText(UI.csv(tbl.rows, [
      { label: 'No Sewa', key: 'id_sewa' }, { label: 'Cabang', key: 'nama_cabang' }, { label: 'Pelanggan', key: 'nama_pelanggan' }, { label: 'No HP', key: 'no_hp' },
      { label: 'Kendaraan', key: 'nama_kendaraan' }, { label: 'Plat', key: 'plat' }, { label: 'Pinjam', val: x => UI.date(x.tgl_pinjam) + ' ' + UI.time(x.tgl_pinjam) },
      { label: 'Kembali', val: x => UI.date(x.tgl_kembali_aktual || x.tgl_kembali_rencana) }, { label: 'Durasi (hari)', key: 'durasi_hari' }, { label: 'Supir', key: 'nama_supir' },
      { label: 'Total', key: 'harga_total' }, { label: 'Dibayar', key: 'total_dibayar' }, { label: 'Sisa', key: 'sisa_bayar' }, { label: 'Status Bayar', key: 'status_bayar' }, { label: 'Status Sewa', key: 'status_sewa' }
    ]), 'rekap_sewa_' + UI.today() + '.csv');
    UI.icons(el);
  };
  await load();
};

// =====================================================================
// SEWA — FORM BARU
// =====================================================================
Pages.sewaBaru = async (el) => {
  App.setCrumb('Sewa Baru');
  const fd = await API.call('sewa.formData', { cabang: App.cabang });
  const P = App.meta.pengaturan;
  const canPrice = App.user.isAdmin || App.can('sewa', 'a');
  const multiCab = App.scope('sewa') === 'SEMUA' && !App.cabang;
  const now = UI.nowWita();
  const st = { mode: fd.pelanggan.length ? 'lama' : 'baru', pel: null, kend: null, cab: '', hargaManual: false };
  const plusDay = (v, n) => { const d = new Date(Date.parse(v + ':00Z') + n * 86400000); return d.toISOString().slice(0, 16); };
  const start = now.slice(0, 11) + String(Math.min(23, +now.slice(11, 13) + 1)).padStart(2, '0') + ':00';

  el.innerHTML = UI.pageHead({
    crumbs: `<a href="#/sewa">Transaksi Sewa</a><span>›</span><b>Kontrak baru</b>`,
    title: 'Buat kontrak sewa baru', desc: 'Pilih penyewa dan kendaraan yang tersedia, atur jadwal, lalu catat uang muka bila ada.',
    actions: `<a class="btn btn-outline" href="#/sewa">${UI.ic('arrow-left')} Batal</a>`
  }) + `
  <form id="f-sewa" class="grid g-side" novalidate>
    <div class="stack">
      <section class="form-section"><header><h3>${UI.ic('user')} 1. Penyewa</h3><span>Wajib disertai KTP & SIM A</span></header><div class="body">
        <div class="seg" id="seg-pel">${fd.pelanggan.length ? `<button type="button" data-mode="lama">Pelanggan terdaftar</button>` : ''}${App.can('pelanggan', 'c') ? `<button type="button" data-mode="baru">${UI.ic('user-plus', 'ic-sm')} Pelanggan baru</button>` : ''}</div>
        <div id="pel-lama" class="mt-16">
          <label class="search">${UI.ic('search')}<input class="input" id="pel-q" placeholder="Cari nama, no. HP, atau no. KTP..." aria-label="Cari pelanggan"></label>
          <div id="pel-list" class="mt-12"></div>
        </div>
        <div id="pel-baru" class="fgrid mt-16" hidden>
          <div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="pb_nama"></div>
          <div class="field"><label>No. HP / WhatsApp <span class="req">*</span></label><input class="input mono" name="pb_no_hp" inputmode="tel"></div>
          <div class="field"><label>No. KTP (NIK)</label><input class="input mono" name="pb_no_ktp" inputmode="numeric" maxlength="16"></div>
          <div class="field"><label>Email (untuk kwitansi)</label><input class="input" type="email" name="pb_email"></div>
          <div class="field span-2"><label>Alamat</label><input class="input" name="pb_alamat"></div>
          <div class="span-all">${UI.fileField('pb_ktp', 'Foto KTP')}</div>
        </div>
      </div></section>

      <section class="form-section"><header><h3>${UI.ic('car-front')} 2. Kendaraan & supir</h3><span>${fd.kendaraan.length} unit tersedia</span></header><div class="body">
        ${multiCab ? `<div class="seg" id="seg-cab"><button type="button" data-cab="" class="on">Semua cabang</button>${App.meta.cabang.map(c => `<button type="button" data-cab="${esc(c.id_cabang)}">${esc(c.nama_cabang)}</button>`).join('')}</div>` : ''}
        <div class="veh-pick mt-12" id="veh"></div>
        <div class="fgrid mt-16">
          <div class="field"><label>Tipe layanan / supir</label><select class="input" name="id_supir" id="supir"><option value="">Lepas kunci (tanpa supir)</option></select><span class="hint">Supir yang dipilih melihat tugas ini di menu Tugas Saya.</span></div>
          <div class="field"><label>Biaya layanan tambahan</label><div class="input-group"><span class="addon">IDR</span><input class="input" name="biaya_tambahan" inputmode="numeric" placeholder="0"></div><span class="hint">Mis. jasa supir, antar-jemput bandara.</span></div>
        </div>
      </div></section>

      <section class="form-section"><header><h3>${UI.ic('calendar')} 3. Jadwal sewa</h3><span>Zona WITA (UTC+8)</span></header><div class="body">
        <div class="fgrid">
          <div class="field"><label>Serah terima (mulai sewa) <span class="req">*</span></label><input class="input" type="datetime-local" name="tgl_pinjam" value="${start}" required></div>
          <div class="field"><label>Rencana pengembalian <span class="req">*</span></label><input class="input" type="datetime-local" name="tgl_kembali_rencana" value="${plusDay(start, 1)}" required></div>
          <div class="span-all callout blue" id="durasi-box">${UI.ic('clock')}<div id="durasi-txt">Durasi: 1 hari</div></div>
          <div class="field span-all"><label>Tujuan / catatan</label><textarea class="input" name="catatan" rows="2" placeholder="Mis. perjalanan dinas Samarinda – Tenggarong"></textarea></div>
        </div>
      </div></section>

      <section class="form-section"><header><h3>${UI.ic('banknote')} 4. Uang muka (DP)</h3><span>Opsional</span></header><div class="body">
        <div class="fgrid">
          <div class="field"><label>Nominal uang muka</label><div class="input-group"><span class="addon">IDR</span><input class="input" name="uang_muka" inputmode="numeric" placeholder="0"></div>
            <div class="chips mt-8"><button type="button" class="chip-btn" data-dp="30">DP 30%</button><button type="button" class="chip-btn" data-dp="50">DP 50%</button><button type="button" class="chip-btn" data-dp="100">Lunas</button><button type="button" class="chip-btn" data-dp="0">Tanpa DP</button></div></div>
          <div class="field"><label>Metode pembayaran</label><select class="input" name="metode">${UI.opts(P.metode_bayar)}</select></div>
          <div class="span-all">${UI.fileField('bukti_bayar', 'Bukti pembayaran / struk transfer')}</div>
        </div>
      </div></section>
    </div>

    <aside class="sticky-side stack">
      <section class="card"><div class="card-head" style="background:var(--navy);border-radius:10px 10px 0 0"><h3 style="color:#fff">${UI.ic('receipt')} Ringkasan biaya</h3>${UI.badge('Otomatis', 'blue')}</div>
        <div class="card-body" id="sum"></div>
        <div class="card-body" style="padding-top:0">
          <div class="field"><label>Harga total kontrak</label><div class="input-group"><span class="addon">IDR</span><input class="input" name="harga_total" id="harga-total" inputmode="numeric"></div>
            <span class="hint" id="harga-hint">${canPrice ? 'Bisa disesuaikan (diskon/negosiasi).' : 'Perubahan harga memerlukan persetujuan Admin.'}</span></div>
          <div class="field mt-12" id="alasan-box" hidden><label>Alasan penyesuaian harga <span class="req">*</span></label><textarea class="input" name="alasan_harga" rows="2"></textarea></div>
          <div class="summary-dark mt-16"><div class="xs">SISA PELUNASAN</div><div class="money-big" id="sisa">Rp 0</div><div class="xs mt-8">Dilunasi saat serah terima atau pengembalian unit.</div></div>
          <button class="btn btn-primary btn-lg mt-16" style="width:100%" type="submit">${UI.ic('file-check')} Simpan & buat kontrak</button>
        </div>
      </section>
      <div class="callout amber">${UI.ic('info')}<div>Keterlambatan dikenakan ${UI.rp(P.denda_per_jam)}/jam. Terlambat lebih dari ${P.batas_jam_hari_penuh} jam dihitung 1 hari penuh.</div></div>
    </aside>
  </form>`;
  UI.icons(el);
  UI.bindDrops(el);
  const f = el.querySelector('#f-sewa');

  // --- Pelanggan
  const setMode = (mode) => {
    st.mode = mode;
    el.querySelectorAll('#seg-pel [data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    el.querySelector('#pel-lama').hidden = mode !== 'lama';
    el.querySelector('#pel-baru').hidden = mode !== 'baru';
  };
  const renderPel = () => {
    const q = el.querySelector('#pel-q').value;
    const box = el.querySelector('#pel-list');
    if (st.pel) {
      const p = st.pel;
      box.innerHTML = `<div class="li row between"><div class="row"><span class="avatar">${esc(UI.initials(p.nama))}</span><div><b>${esc(p.nama)}</b> ${p.id_foto_ktp_drive ? UI.badge('KTP tersimpan', 'green') : ''}<div class="muted small mono">${esc(p.no_hp)}${p.no_ktp ? ' • NIK ' + esc(p.no_ktp) : ''}</div></div></div><button type="button" class="btn btn-soft btn-sm" data-ganti>${UI.ic('pencil', 'ic-sm')} Ganti</button></div>`;
      box.querySelector('[data-ganti]').onclick = () => { st.pel = null; renderPel(); };
    } else {
      const list = fd.pelanggan.filter(p => UI.match(p, q, ['nama', 'no_hp', 'no_ktp'])).slice(0, 6);
      box.innerHTML = list.length ? list.map(p => `<button type="button" class="ap-item" data-pel="${esc(p.id_pelanggan)}"><b>${esc(p.nama)}</b><div class="muted small mono">${esc(p.no_hp)}${p.no_ktp ? ' • ' + esc(p.no_ktp) : ''}</div></button>`).join('') : '<p class="muted small">Pelanggan tidak ditemukan. Gunakan "Pelanggan baru".</p>';
      box.querySelectorAll('[data-pel]').forEach(b => b.onclick = () => { st.pel = fd.pelanggan.find(p => p.id_pelanggan === b.dataset.pel); renderPel(); });
    }
    UI.icons(box);
  };
  el.querySelectorAll('#seg-pel [data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  el.querySelector('#pel-q').addEventListener('input', UI.debounce(renderPel, 120));
  setMode(st.mode);
  renderPel();

  // --- Kendaraan
  const renderVeh = () => {
    const list = fd.kendaraan.filter(k => !st.cab || k.id_cabang === st.cab);
    const box = el.querySelector('#veh');
    box.innerHTML = list.length ? list.map(k => `<label class="radio-card ${st.kend && st.kend.id_kendaraan === k.id_kendaraan ? 'on' : ''}"><div class="row between" style="width:100%"><input type="radio" name="id_kendaraan" value="${esc(k.id_kendaraan)}" ${st.kend && st.kend.id_kendaraan === k.id_kendaraan ? 'checked' : ''}>${UI.plat(k.plat, true)}</div>
      <b>${esc(k.nama)}</b><span class="muted xs">${esc(k.jenis || '')} • ${esc(k.nama_cabang)} • ${UI.num(k.km_saat_ini)} km</span><b class="mono t-blue">${UI.rp(k.harga_sewa_per_hari)}<span class="muted xs"> /hari</span></b></label>`).join('')
      : UI.empty('Tidak ada kendaraan tersedia', 'Semua unit sedang disewa, diservis, atau nonaktif.', 'car-front');
    box.querySelectorAll('input[name=id_kendaraan]').forEach(r => r.onchange = () => { st.kend = fd.kendaraan.find(k => k.id_kendaraan === r.value); st.hargaManual = false; renderVeh(); renderSupir(); recalc(); });
    UI.icons(box);
  };
  const renderSupir = () => {
    const s = el.querySelector('#supir');
    const cur = s.value;
    const list = fd.supir.filter(u => !st.kend || !u.id_cabang || u.id_cabang === st.kend.id_cabang);
    s.innerHTML = '<option value="">Lepas kunci (tanpa supir)</option>' + UI.opts(list, 'id_user', u => 'Dengan supir: ' + u.nama, cur);
  };
  el.querySelectorAll('#seg-cab [data-cab]').forEach(b => b.onclick = () => { st.cab = b.dataset.cab; el.querySelectorAll('#seg-cab [data-cab]').forEach(x => x.classList.toggle('on', x === b)); renderVeh(); });
  renderVeh(); renderSupir();

  // --- Hitung biaya
  const calc = () => {
    const t1 = Date.parse(f.tgl_pinjam.value + ':00Z'), t2 = Date.parse(f.tgl_kembali_rencana.value + ':00Z');
    const valid = isFinite(t1) && isFinite(t2) && t2 > t1;
    const durasi = valid ? Math.max(1, Math.ceil((t2 - t1) / 86400000)) : 0;
    const tarif = st.kend ? UI.n(st.kend.harga_sewa_per_hari) : 0;
    const tambahan = UI.n(String(f.biaya_tambahan.value).replace(/\D/g, ''));
    return { valid, durasi, tarif, tambahan, normal: durasi * tarif + tambahan, jam: valid ? Math.round((t2 - t1) / 3600000) : 0 };
  };
  const digits = v => UI.n(String(v).replace(/\D/g, ''));
  const recalc = () => {
    const c = calc();
    const hp = el.querySelector('#harga-total');
    if (!st.hargaManual) hp.value = c.normal || '';
    const total = digits(hp.value) || c.normal;
    const dp = digits(f.uang_muka.value);
    const changed = c.normal && total !== c.normal;
    el.querySelector('#alasan-box').hidden = !(changed && !canPrice);
    el.querySelector('#durasi-txt').innerHTML = c.valid ? `Durasi terhitung: <b>${c.durasi} hari</b> (${c.jam} jam) — dibulatkan ke atas per 24 jam` : '<span class="t-red">Tanggal kembali harus setelah tanggal mulai.</span>';
    el.querySelector('#sum').innerHTML = `
      <div class="sum-row"><span>${st.kend ? esc(st.kend.nama) : 'Belum pilih kendaraan'}<br><span class="xs faint">${c.durasi} hari × ${UI.rp(c.tarif)}</span></span><b>${UI.rp(c.durasi * c.tarif)}</b></div>
      <div class="sum-row"><span>Layanan tambahan</span><b>${UI.rp(c.tambahan)}</b></div>
      ${changed ? `<div class="sum-row"><span>Penyesuaian harga</span><b class="${total < c.normal ? 't-green' : ''}">${UI.rp(total - c.normal, true)}</b></div>` : ''}
      <div class="sum-row sum-total"><span class="strong" style="color:var(--text)">Total kontrak</span><b>${UI.rp(total)}</b></div>
      <div class="sum-row"><span class="t-green">DP diterima</span><b class="t-green">- ${UI.rp(dp)}</b></div>`;
    el.querySelector('#sisa').textContent = UI.rp(Math.max(0, total - dp));
  };
  el.querySelector('#harga-total').addEventListener('input', () => { st.hargaManual = true; recalc(); });
  ['tgl_pinjam', 'tgl_kembali_rencana', 'biaya_tambahan', 'uang_muka'].forEach(n => f[n].addEventListener('input', recalc));
  el.querySelectorAll('[data-dp]').forEach(b => b.onclick = () => {
    const total = digits(el.querySelector('#harga-total').value) || calc().normal;
    f.uang_muka.value = Math.round(total * (+b.dataset.dp) / 100 / 1000) * 1000 || '';
    if (b.dataset.dp === '100') f.uang_muka.value = total;
    recalc();
  });
  recalc();

  f.onsubmit = async e => {
    e.preventDefault();
    const c = calc();
    const btn = f.querySelector('button[type=submit]');
    try {
      if (st.mode === 'lama' && !st.pel) throw new Error('Pilih pelanggan terlebih dahulu.');
      if (st.mode === 'baru' && (!f.pb_nama.value.trim() || !f.pb_no_hp.value.trim())) throw new Error('Nama dan No. HP pelanggan baru wajib diisi.');
      if (!st.kend) throw new Error('Pilih kendaraan yang akan disewa.');
      if (!c.valid) throw new Error('Periksa kembali jadwal sewa.');
      const total = digits(el.querySelector('#harga-total').value) || c.normal;
      if (total !== c.normal && !canPrice && !f.alasan_harga.value.trim()) throw new Error('Isi alasan penyesuaian harga.');
      UI.busy(btn, true, 'Menyimpan kontrak...');
      const files = await UI.collectFiles(f);
      const data = {
        id_kendaraan: st.kend.id_kendaraan, id_supir: f.id_supir.value, tgl_pinjam: f.tgl_pinjam.value, tgl_kembali_rencana: f.tgl_kembali_rencana.value,
        biaya_tambahan: c.tambahan, harga_total: total, alasan_harga: f.alasan_harga.value, uang_muka: digits(f.uang_muka.value), metode: f.metode.value,
        catatan: f.catatan.value, bukti_bayar: files.bukti_bayar
      };
      if (st.mode === 'lama') data.id_pelanggan = st.pel.id_pelanggan;
      else data.pelanggan_baru = { nama: f.pb_nama.value, no_hp: f.pb_no_hp.value, no_ktp: f.pb_no_ktp.value, email: f.pb_email.value, alamat: f.pb_alamat.value, ktp: files.pb_ktp };
      const r = await API.call('sewa.create', data);
      UI.toast(r.perlu_approval ? 'Kontrak dibuat. Penyesuaian harga menunggu approval Admin.' : 'Kontrak sewa berhasil dibuat.', 'success');
      App.refreshBadges();
      App.go('sewa/' + encodeURIComponent(r.id_sewa));
    } catch (err) { UI.busy(btn, false); UI.toast(err.message, 'error'); }
  };
};

// =====================================================================
// SEWA — DETAIL
// =====================================================================
Pages.sewaDetail = async (el, id) => {
  const d = await API.call('sewa.detail', { id_sewa: id });
  const x = d.sewa, P = App.meta.pengaturan, pel = d.pelanggan || {};
  App.setCrumb('#' + x.id_sewa);
  const aktif = x.status_sewa === 'Aktif';
  const canU = App.can('sewa', 'u');
  const sisa = UI.n(x.sisa_bayar);
  const canPay = canU && x.status_sewa !== 'Dibatalkan' && sisa > 0;
  const pending = (d.approval || []).filter(a => a.status === 'Menunggu');
  const st = { tab: 'rincian' };

  el.innerHTML = UI.pageHead({
    crumbs: `<a href="#/sewa">Transaksi Sewa</a><span>›</span><b class="mono">#${esc(x.id_sewa)}</b>`,
    title: 'Detail sewa <span class="mono">#' + esc(x.id_sewa) + '</span>',
    badge: UI.status('sewa', x.status_sewa) + (x.terlambat ? UI.badge('Terlambat ' + x.terlambat_jam + ' jam', 'red', true) : ''),
    desc: `${UI.cab('Cabang ' + x.nama_cabang)} <span class="muted small">Dibuat ${UI.dt(x.dibuat_pada)} WITA${x.nomor_kwitansi ? ' • Kwitansi <span class="mono">' + esc(x.nomor_kwitansi) + '</span>' : ''}</span>`,
    actions: [
      `<button class="btn btn-outline" data-kw>${UI.ic('printer')} Cetak kwitansi PDF</button>`,
      `<button class="btn btn-outline" data-mail>${UI.ic('mail')} Kirim ke email</button>`,
      canU && aktif ? `<button class="btn btn-outline" data-supir>${UI.ic('user-round-cog')} Atur supir</button>` : '',
      App.can('sewa', 'd') && aktif ? `<button class="btn btn-danger-soft" data-batal>${UI.ic('ban')} Batalkan</button>` : ''
    ].join('')
  }) + `
  ${pending.length ? `<div class="callout amber" style="margin-bottom:16px">${UI.ic('hourglass')}<div>${pending.map(a => `<b>Menunggu approval:</b> ${esc(a.judul)}`).join('<br>')}</div></div>` : ''}
  <section class="card card-pad"><div class="grid g4" style="gap:16px">
    <div><div class="row"><span class="avatar" style="width:44px;height:44px">${esc(UI.initials(x.nama_pelanggan))}</span><div style="min-width:0"><b style="font-size:15px">${esc(x.nama_pelanggan)}</b>
      ${pel.id_foto_ktp_drive ? `<div><button class="badge green" style="border:0;cursor:pointer" data-file="${esc(pel.id_foto_ktp_drive)}" aria-label="KTP ${esc(x.nama_pelanggan)}">${UI.ic('circle-check', 'ic-sm')} KTP tersimpan</button></div>` : ''}</div></div>
      <div class="muted small mt-8 mono">${UI.ic('phone', 'ic-sm')} ${esc(x.no_hp || '-')}</div><div class="muted small">${esc(x.email_pelanggan || 'Email belum diisi')}</div></div>
    <div><div class="row between"><span class="muted xs">UNIT ARMADA</span>${UI.plat(x.plat, true)}</div><b style="font-size:15px;display:block;margin-top:6px">${esc(x.nama_kendaraan)}</b>
      <div class="muted small mt-8">KM awal <span class="mono">${UI.num(x.km_awal)}</span>${x.km_akhir ? ' → akhir <span class="mono">' + UI.num(x.km_akhir) + '</span>' : ''}</div>
      <div class="mt-8">${x.nama_supir ? UI.badge('Supir: ' + x.nama_supir, 'blue') : UI.badge('Lepas kunci', '')}</div></div>
    <div><span class="muted xs">JADWAL PENGGUNAAN</span>
      <div class="small mt-8"><span class="t-blue">●</span> Ambil: <b>${UI.dt(x.tgl_pinjam)}</b></div>
      <div class="small"><span class="t-red">●</span> Kembali: <b>${UI.dt(x.tgl_kembali_rencana)}</b></div>
      ${x.tgl_kembali_aktual ? `<div class="small"><span class="t-green">●</span> Aktual: <b>${UI.dt(x.tgl_kembali_aktual)}</b></div>` : ''}
      <div class="mt-8">${UI.badge('Total ' + x.durasi_hari + ' hari', 'blue')}</div></div>
    <div class="li" style="margin:0"><div class="row between"><span class="muted xs">STATUS TAGIHAN</span>${UI.status('bayar', x.status_bayar)}</div>
      <div class="muted small mt-8">Sisa pelunasan</div><div class="money-big ${sisa > 0 && x.status_sewa !== 'Dibatalkan' ? 't-blue' : 't-green'}">${UI.rp(sisa)}</div>
      <div class="row between small mt-8"><span class="muted">Total kontrak<br><b class="mono" style="color:var(--text)">${UI.rp(x.harga_total)}</b></span><span class="r muted">Telah diterima<br><b class="mono t-green">${UI.rp(x.total_dibayar)}</b></span></div></div>
  </div></section>

  <div class="grid g-side mt-20">
    <div class="stack">
      <section class="card"><div class="tabs" role="tablist">
        <button class="tab on" data-tab="rincian">Rincian biaya & kontrak</button>
        <button class="tab" data-tab="bayar">Riwayat pembayaran <span class="n">${d.pembayaran.length}</span></button>
        <button class="tab" data-tab="denda">Denda & kerusakan <span class="n ${d.denda_belum_bayar ? 'warn' : ''}">${d.denda.length}</span></button>
        <button class="tab" data-tab="riwayat">Log aktivitas <span class="n">${d.riwayat.length}</span></button>
      </div><div id="tab-body"></div></section>
      ${aktif && canU ? Pages._formKembali(x, P) : ''}
    </div>
    <aside class="stack">
      ${canPay ? `<section class="card"><div class="card-head" style="background:var(--navy);border-radius:10px 10px 0 0"><div><h3 style="color:#fff">${UI.ic('hand-coins')} Catat pembayaran</h3><p style="color:#AFC0EB">Pelunasan atau angsuran</p></div></div>
        <form class="card-body" id="f-bayar">
          <div class="li row between wrap" style="margin:0"><div><div class="xs muted">SISA TAGIHAN</div><b class="mono nowrap">${UI.rp(sisa)}</b></div><div class="seg"><button type="button" class="on" data-full>Lunas penuh</button><button type="button" data-part>Sebagian</button></div></div>
          <div class="field mt-12"><label>Jumlah pembayaran <span class="req">*</span></label><div class="input-group"><span class="addon">Rp</span><input class="input" name="nominal" inputmode="numeric" value="${sisa}" required></div></div>
          <div class="fgrid mt-12"><div class="field"><label>Metode</label><select class="input" name="metode">${UI.opts(P.metode_bayar)}</select></div><div class="field"><label>Tanggal bayar</label><input class="input" type="date" name="tanggal" value="${UI.today()}"></div></div>
          <div class="field mt-12"><label>No. referensi / memo</label><input class="input" name="catatan" placeholder="Mis. BCA-TRX-88290123"></div>
          <div class="mt-12">${UI.fileField('bukti', 'Bukti pembayaran')}</div>
          <button class="btn btn-success btn-lg mt-16" style="width:100%" type="submit">${UI.ic('circle-check')} Catat & konfirmasi pembayaran</button>
        </form></section>` : ''}
      <section class="card"><div class="card-head"><h3>Aksi cepat</h3></div><div class="card-body grid g2" style="gap:10px">
        <button class="li c" style="margin:0;cursor:pointer" data-kw>${UI.ic('file-text', 'ic-lg t-blue')}<h4 class="mt-8">Kwitansi PDF</h4><p>Unduh / cetak</p></button>
        <button class="li c" style="margin:0;cursor:pointer" data-mail>${UI.ic('send', 'ic-lg t-green')}<h4 class="mt-8">Kirim email</h4><p>Lampiran PDF</p></button>
        ${App.can('denda', 'c') && x.status_sewa !== 'Dibatalkan' ? `<button class="li c" style="margin:0;cursor:pointer" data-denda>${UI.ic('triangle-alert', 'ic-lg t-red')}<h4 class="mt-8">Catat denda</h4><p>Telat / kerusakan</p></button>` : ''}
        ${x.id_bukti_bayar_drive ? `<button class="li c" style="margin:0;cursor:pointer" data-file="${esc(x.id_bukti_bayar_drive)}" aria-label="Bukti bayar terakhir">${UI.ic('paperclip', 'ic-lg')}<h4 class="mt-8">Bukti bayar</h4><p>Unggahan terakhir</p></button>` : ''}
      </div></section>
      <div class="callout blue">${UI.ic('info')}<div>Keterlambatan ${UI.rp(P.denda_per_jam)}/jam. Lebih dari ${P.batas_jam_hari_penuh} jam dihitung sewa 1 hari penuh (${UI.rp(x.harga_per_hari)}).</div></div>
    </aside>
  </div>`;
  UI.icons(el);
  UI.bindDrops(el);
  Pages._bindFiles(el);

  const body = el.querySelector('#tab-body');
  const penyesuaian = UI.n(x.harga_total) - UI.n(x.harga_normal);
  const tabs = {
    rincian: () => {
      body.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Deskripsi item</th><th class="r">Tarif</th><th class="r">Durasi</th><th class="r">Subtotal</th></tr></thead><tbody>
        <tr><td><div class="t-main">Sewa ${esc(x.nama_kendaraan)}</div><div class="t-sub">${x.nama_supir ? 'Dengan supir ' + esc(x.nama_supir) : 'Paket lepas kunci'}</div></td><td class="num">${UI.rp(x.harga_per_hari)}</td><td class="num">${x.durasi_hari} hari</td><td class="num">${UI.rp(UI.n(x.harga_per_hari) * UI.n(x.durasi_hari))}</td></tr>
        ${UI.n(x.biaya_tambahan) ? `<tr><td><div class="t-main">Layanan tambahan</div></td><td></td><td></td><td class="num">${UI.rp(x.biaya_tambahan)}</td></tr>` : ''}
        ${penyesuaian ? `<tr><td><div class="t-main">Penyesuaian harga</div><div class="t-sub">Disetujui</div></td><td></td><td></td><td class="num ${penyesuaian < 0 ? 't-green' : ''}">${UI.rp(penyesuaian, true)}</td></tr>` : ''}
        </tbody></table></div>
        <div class="card-body"><div style="max-width:380px;margin-left:auto">
          <div class="sum-row"><span>Total kontrak sewa</span><b>${UI.rp(x.harga_total)}</b></div>
          <div class="sum-row"><span class="t-green">Telah dibayar</span><b class="t-green">- ${UI.rp(x.total_dibayar)}</b></div>
          <div class="sum-row sum-total"><span class="strong" style="color:var(--text)">Sisa tagihan</span><b class="${sisa ? 't-red' : 't-green'}">${UI.rp(sisa)}</b></div>
          ${d.total_denda ? `<div class="sum-row"><span>Denda & kerusakan (ditagih terpisah)</span><b class="${d.denda_belum_bayar ? 't-red' : ''}">${UI.rp(d.total_denda)}</b></div>` : ''}
        </div>${x.catatan ? `<div class="callout blue mt-16">${UI.ic('notebook-pen')}<div>${esc(x.catatan)}</div></div>` : ''}</div>`;
      UI.icons(body);
    },
    bayar: () => UI.table(body, {
      unit: 'pembayaran', empty: 'Belum ada pembayaran tercatat.', pageSize: 8,
      columns: [
        { key: 'tanggal', label: 'Tanggal', render: r => UI.date(r.tanggal) },
        { key: 'kategori', label: 'Keterangan', render: r => `<div class="t-main">${esc(r.kategori)}</div><div class="t-sub">${esc(r.deskripsi)}</div>` },
        { key: 'metode', label: 'Metode' },
        { key: 'nama_pencatat', label: 'Dicatat oleh' },
        { key: 'nominal', label: 'Nominal', num: true, render: r => `<span class="t-green">${UI.rp(r.nominal, true)}</span>` },
        { key: 'status_approval', label: 'Status', align: 'center', render: r => UI.status('approval', r.status_approval) },
        { label: '', align: 'right', render: r => r.id_bukti_drive ? `<button class="btn-icon" data-file="${esc(r.id_bukti_drive)}" aria-label="Bukti pembayaran">${UI.ic('paperclip')}</button>` : '' }
      ], bind: Pages._bindFiles
    }),
    denda: () => {
      const t = document.createElement('div');
      body.innerHTML = '';
      body.appendChild(t);
      UI.table(t, {
        unit: 'catatan', empty: 'Tidak ada denda atau kerusakan.',
        columns: [
          { key: 'jenis', label: 'Jenis', render: r => UI.badge(r.jenis, r.jenis === 'Kerusakan' ? 'red' : r.jenis === 'Keterlambatan' ? 'amber' : '') },
          { key: 'deskripsi', label: 'Deskripsi' },
          { key: 'nominal', label: 'Nominal', num: true, render: r => UI.n(r.nominal) ? UI.rp(r.nominal) : '<span class="muted">Belum ditetapkan</span>' },
          { key: 'status_bayar', label: 'Status', align: 'center', render: r => UI.status('denda', r.status_bayar) },
          { label: 'Aksi', align: 'right', render: r => `<div class="acts">${r.id_foto_drive ? `<button class="btn-icon" data-file="${esc(r.id_foto_drive)}" aria-label="Foto kerusakan">${UI.ic('image')}</button>` : ''}${r.status_bayar !== 'Lunas' && UI.n(r.nominal) > 0 && App.can('keuangan', 'c') ? `<button class="btn btn-success btn-sm" data-paydenda="${esc(r.id_denda)}">Terima bayar</button>` : ''}</div>` }
        ],
        bind: (box) => {
          Pages._bindFiles(box);
          box.querySelectorAll('[data-paydenda]').forEach(b => b.onclick = async () => {
            const r = d.denda.find(z => z.id_denda === b.dataset.paydenda);
            const ok = await UI.confirm({ title: 'Terima pembayaran denda?', message: `${esc(r.jenis)} — ${esc(r.deskripsi)}<br>Nominal <b class="mono">${UI.rp(r.nominal)}</b> akan dicatat sebagai pemasukan.`, ok: 'Catat pembayaran' });
            if (!ok) return;
            try { await API.call('denda.pay', { id_denda: r.id_denda, metode: 'Tunai' }); UI.toast('Pembayaran denda dicatat.', 'success'); App.route(); } catch (e) { UI.toast(e.message, 'error'); }
          });
        }
      });
    },
    riwayat: () => {
      body.innerHTML = `<div class="card-body">${d.riwayat.length ? `<div class="timeline">${d.riwayat.map(r => `<div class="tl-item"><div class="row between"><b>${esc(r.aksi.replace(/_/g, ' '))}</b><span class="muted xs mono">${UI.dt(r.timestamp)}</span></div><div class="muted small">${esc(r.keterangan || '-')} • oleh ${esc(r.nama_user)}</div></div>`).join('')}</div>` : UI.empty('Belum ada aktivitas', '', 'history')}</div>`;
      UI.icons(body);
    }
  };
  const show = t => { st.tab = t; el.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); tabs[t](); };
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => show(b.dataset.tab));
  show('rincian');

  el.querySelectorAll('[data-kw]').forEach(b => b.onclick = () => UI.pdfAction('sewa.receipt', { id_sewa: x.id_sewa }, 'Kwitansi ' + x.id_sewa).then(r => r && !x.nomor_kwitansi && App.route()));
  el.querySelectorAll('[data-mail]').forEach(b => b.onclick = async () => {
    const to = await UI.confirm({ title: 'Kirim kwitansi lewat email', message: 'Kwitansi PDF akan dikirim sebagai lampiran ke alamat berikut.', input: true, inputType: 'email', inputValue: x.email_pelanggan, inputLabel: 'Email penerima', required: true, ok: 'Kirim email' });
    if (!to) return;
    UI.pdfAction('sewa.receipt', { id_sewa: x.id_sewa, kirim_email: true, email: to }, 'Kwitansi ' + x.id_sewa);
  });
  const on = (s, f) => el.querySelectorAll(s).forEach(b => b.onclick = f);
  on('[data-denda]', () => Pages.dendaForm(x, () => App.route()));
  on('[data-batal]', async () => {
    const alasan = await UI.confirm({ title: 'Batalkan transaksi sewa?', message: 'Kendaraan akan kembali berstatus Tersedia. Pembayaran yang sudah tercatat tidak otomatis dikembalikan — batalkan transaksi keuangannya secara terpisah bila perlu.', input: true, inputLabel: 'Alasan pembatalan', required: true, danger: true, ok: 'Batalkan sewa' });
    if (!alasan) return;
    try { await API.call('sewa.cancel', { id_sewa: x.id_sewa, alasan }); UI.toast('Transaksi sewa dibatalkan.', 'success'); App.route(); } catch (e) { UI.toast(e.message, 'error'); }
  });
  on('[data-supir]', () => {
    const list = App.meta.supir || [];
    const m = UI.modal({
      title: 'Atur supir', sub: 'Supir yang ditugaskan dapat melihat jadwal ini dan melapor KM.', size: 'sm',
      body: `<div class="field"><label>Supir</label><select class="input" id="sp">${'<option value="">Lepas kunci (tanpa supir)</option>' + UI.opts(list.filter(u => !u.id_cabang || u.id_cabang === x.id_cabang), 'id_user', 'nama', x.id_supir)}</select></div>`,
      footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>`
    });
    m.q('[data-ok]').onclick = async () => {
      try { await API.call('sewa.assign', { id_sewa: x.id_sewa, id_supir: m.q('#sp').value }); UI.toast('Penugasan supir diperbarui.', 'success'); m.close(); App.route(); } catch (e) { UI.toast(e.message, 'error'); }
    };
  });

  const fb = el.querySelector('#f-bayar');
  if (fb) {
    fb.querySelector('[data-full]').onclick = e => { fb.nominal.value = sisa; e.target.classList.add('on'); fb.querySelector('[data-part]').classList.remove('on'); };
    fb.querySelector('[data-part]').onclick = e => { fb.nominal.value = ''; fb.nominal.focus(); e.target.classList.add('on'); fb.querySelector('[data-full]').classList.remove('on'); };
    fb.onsubmit = async e => {
      e.preventDefault();
      const b = fb.querySelector('button[type=submit]'); UI.busy(b, true);
      try {
        const data = Object.assign(UI.formData(fb), await UI.collectFiles(fb), { id_sewa: x.id_sewa });
        data.nominal = UI.n(String(data.nominal).replace(/\D/g, ''));
        const r = await API.call('sewa.pay', data);
        UI.toast(r.sisa_bayar ? 'Pembayaran dicatat. Sisa ' + UI.rp(r.sisa_bayar) : 'Pembayaran lunas dicatat.', 'success');
        App.route();
      } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
    };
  }
  Pages._bindKembali(el, x, P, sisa);
};

// Form serah-terima pengembalian unit (check-out)
Pages._formKembali = (x, P) => `<section class="card" id="kembali"><div class="card-head"><div><h3>${UI.ic('clipboard-check', 't-blue')} Protokol pengembalian unit</h3><p>Verifikasi kilometer, kondisi, dan keterlambatan saat kendaraan kembali ke pool</p></div>${UI.badge('Menunggu unit tiba', 'amber')}</div>
  <form class="card-body" id="f-kembali">
    <div class="fgrid c3">
      <div class="field"><label>Waktu kembali aktual <span class="req">*</span></label><input class="input" type="datetime-local" name="tgl_kembali_aktual" value="${UI.nowWita()}" required></div>
      <div class="field"><label>Odometer akhir <span class="req">*</span></label><div class="input-group"><input class="input" name="km_akhir" inputmode="numeric" placeholder="${UI.n(x.km_awal) + 100}" required><span class="addon" style="border-right:0;border-left:1px solid var(--line)">KM</span></div><span class="hint">KM awal: <span class="mono">${UI.num(x.km_awal)}</span></span></div>
      <div class="field"><label>Kondisi eksterior/interior</label><select class="input" name="kondisi">${UI.opts(['Mulus / bersih', 'Baret ringan', 'Kotor, perlu dicuci', 'Rusak, perlu perbaikan'])}</select></div>
      <div class="field"><label>Status kendaraan setelah kembali</label><select class="input" name="status_kendaraan"><option value="Tersedia">Tersedia (siap disewa)</option><option value="Servis">Masuk servis</option></select></div>
      <div class="field span-2"><label>Catatan serah terima</label><input class="input" name="catatan" placeholder="BBM, kelengkapan, dll."></div>
    </div>
    <div class="callout amber mt-16" id="telat-box" hidden></div>
    <div class="section-title mt-16">${UI.ic('triangle-alert', 'ic-sm t-red')} Denda & kerusakan</div>
    <div id="denda-rows"></div>
    <button type="button" class="btn btn-soft btn-sm" data-add-denda>${UI.ic('plus', 'ic-sm')} Tambah kerusakan / denda lain</button>
    <hr class="divider">
    <div class="fgrid">
      <div class="field"><label>Terima pembayaran sekarang</label><div class="input-group"><span class="addon">Rp</span><input class="input" name="bayar_nominal" inputmode="numeric" value="${UI.n(x.sisa_bayar) || ''}" placeholder="0"></div><span class="hint">Sisa sewa: ${UI.rp(x.sisa_bayar)}. Kosongkan bila belum dibayar.</span></div>
      <div class="field"><label>Metode</label><select class="input" name="bayar_metode">${UI.opts(P.metode_bayar)}</select></div>
    </div>
    <div class="row mt-16" style="justify-content:flex-end"><button class="btn btn-navy btn-lg" type="submit">${UI.ic('circle-check')} Selesaikan serah terima</button></div>
  </form></section>`;

Pages._bindKembali = (el, x, P, sisa) => {
  const f = el.querySelector('#f-kembali');
  if (!f) return;
  const rows = el.querySelector('#denda-rows');
  const addRow = (jenis, desk, nominal, auto) => {
    const r = document.createElement('div');
    r.className = 'fgrid c3 mt-8';
    r.dataset.auto = auto ? '1' : '';
    r.innerHTML = `<div class="field"><select class="input" data-j aria-label="Jenis">${UI.opts(['Keterlambatan', 'Kerusakan', 'Lainnya'], null, null, jenis)}</select></div>
      <div class="field"><input class="input" data-d placeholder="Deskripsi (mis. baret bumper depan)" value="${esc(desk || '')}" aria-label="Deskripsi"></div>
      <div class="row"><div class="input-group" style="flex:1"><span class="addon">Rp</span><input class="input" data-n inputmode="numeric" value="${nominal || ''}" aria-label="Nominal"></div><button type="button" class="btn-icon red" data-del aria-label="Hapus baris">${UI.ic('trash-2')}</button></div>`;
    r.querySelector('[data-del]').onclick = () => r.remove();
    rows.appendChild(r);
    UI.icons(r);
    return r;
  };
  const hitungTelat = () => {
    const aktual = Date.parse(f.tgl_kembali_aktual.value + ':00Z');
    const rencana = Date.parse(String(x.tgl_kembali_rencana).replace(' ', 'T').slice(0, 16) + ':00Z');
    const box = el.querySelector('#telat-box');
    const old = rows.querySelector('[data-auto="1"]');
    if (!isFinite(aktual) || aktual <= rencana) { box.hidden = true; if (old) old.remove(); return; }
    const jam = Math.ceil((aktual - rencana) / 3600000);
    const batas = UI.n(P.batas_jam_hari_penuh) || 5;
    const nominal = jam > batas ? Math.ceil(jam / 24) * UI.n(x.harga_per_hari) : jam * UI.n(P.denda_per_jam);
    const desk = jam > batas ? `Terlambat ${jam} jam (dihitung ${Math.ceil(jam / 24)} hari penuh)` : `Terlambat ${jam} jam × ${UI.rp(P.denda_per_jam)}`;
    box.hidden = false;
    box.innerHTML = `${UI.ic('clock')}<div>Unit kembali <b>${jam} jam</b> setelah jadwal. Denda keterlambatan otomatis: <b class="mono">${UI.rp(nominal)}</b> (bisa diubah atau dihapus di bawah).</div>`;
    UI.icons(box);
    if (old) { old.querySelector('[data-d]').value = desk; old.querySelector('[data-n]').value = nominal; }
    else addRow('Keterlambatan', desk, nominal, true);
  };
  f.tgl_kembali_aktual.addEventListener('change', hitungTelat);
  el.querySelector('[data-add-denda]').onclick = () => addRow('Kerusakan', '', '');
  hitungTelat();
  f.onsubmit = async e => {
    e.preventDefault();
    const denda = [...rows.children].map(r => ({ jenis: r.querySelector('[data-j]').value, deskripsi: r.querySelector('[data-d]').value.trim(), nominal: UI.n(r.querySelector('[data-n]').value.replace(/\D/g, '')) }))
      .filter(r => r.nominal > 0);
    if (denda.some(r => !r.deskripsi)) { UI.toast('Isi deskripsi untuk setiap denda/kerusakan.', 'error'); return; }
    const data = UI.formData(f);
    data.id_sewa = x.id_sewa;
    data.denda = denda;
    data.km_akhir = UI.n(String(data.km_akhir).replace(/\D/g, ''));
    data.bayar_nominal = UI.n(String(data.bayar_nominal).replace(/\D/g, ''));
    if (!data.km_akhir) { UI.toast('Odometer akhir wajib diisi.', 'error'); return; }
    const ok = await UI.confirm({ title: 'Selesaikan serah terima?', message: `Sewa ditutup, KM akhir <b class="mono">${UI.num(data.km_akhir)}</b>${denda.length ? `, ${denda.length} denda dicatat` : ''}${data.bayar_nominal ? `, pembayaran <b class="mono">${UI.rp(data.bayar_nominal)}</b>` : ''}.`, ok: 'Selesaikan' });
    if (!ok) return;
    const b = f.querySelector('button[type=submit]'); UI.busy(b, true);
    try { await API.call('sewa.close', data); UI.toast('Serah terima selesai. Kendaraan kembali ke pool.', 'success'); App.route(); }
    catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

Pages.dendaForm = (x, onDone) => {
  const m = UI.modal({
    title: 'Catat denda / kerusakan', sub: 'Sewa #' + esc(x.id_sewa) + ' • ' + esc(x.plat),
    body: `<form id="f-denda" class="fgrid">
      <div class="field"><label>Jenis</label><select class="input" name="jenis">${UI.opts(['Kerusakan', 'Keterlambatan', 'Lainnya'])}</select></div>
      <div class="field"><label>Nominal ${App.can('keuangan', 'c') ? '' : '(boleh dikosongkan)'}</label><div class="input-group"><span class="addon">Rp</span><input class="input" name="nominal" inputmode="numeric"></div></div>
      <div class="field span-all"><label>Deskripsi <span class="req">*</span></label><textarea class="input" name="deskripsi" rows="2" required placeholder="Jelaskan kerusakan atau alasan denda"></textarea></div>
      <div class="span-all">${UI.fileField('foto', 'Foto bukti')}</div></form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-danger" type="submit" form="f-denda">${UI.ic('check')} Simpan catatan</button>`
  });
  m.q('form').onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]'); UI.busy(b, true);
    try {
      const data = Object.assign(UI.formData(e.target), await UI.collectFiles(e.target), { id_sewa: x.id_sewa });
      data.nominal = UI.n(String(data.nominal).replace(/\D/g, ''));
      await API.call('denda.save', data);
      UI.toast('Denda/kerusakan dicatat.', 'success'); m.close(); onDone && onDone();
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

// =====================================================================
// PELANGGAN
// =====================================================================
Pages.pelanggan = async (el) => {
  const rows = await API.call('pelanggan.list');
  el.innerHTML = UI.pageHead({
    title: 'Pelanggan', badge: UI.badge(rows.length + ' terdaftar', 'navy'),
    desc: 'Data penyewa beserta foto KTP dan riwayat sewanya.',
    actions: App.can('pelanggan', 'c') ? `<button class="btn btn-primary" data-add>${UI.ic('user-plus')} Tambah pelanggan</button>` : ''
  }) + `<section class="card"><div class="filters"><label class="search">${UI.ic('search')}<input class="input" data-q placeholder="Cari nama, no. HP, atau no. KTP..." aria-label="Cari pelanggan"></label></div><div id="tbl-pel"></div></section>`;
  const tbl = UI.table(el.querySelector('#tbl-pel'), {
    unit: 'pelanggan', empty: 'Belum ada pelanggan. Tambahkan saat membuat sewa atau lewat tombol di atas.',
    onRow: p => Pages.pelangganDetail(p.id_pelanggan),
    columns: [
      { key: 'nama', label: 'Nama', render: p => `<div class="row"><span class="avatar lt" style="width:32px;height:32px;font-size:11px">${esc(UI.initials(p.nama))}</span><div><div class="t-main">${esc(p.nama)}</div><div class="t-sub">${esc(p.alamat || '')}</div></div></div>` },
      { key: 'no_hp', label: 'No. HP', render: p => `<span class="mono">${esc(p.no_hp)}</span>` },
      { key: 'email', label: 'Email' },
      { key: 'no_ktp', label: 'No. KTP', render: p => p.no_ktp ? `<span class="mono">${esc(p.no_ktp)}</span>` : '-' },
      { key: 'jumlah_sewa', label: 'Jumlah sewa', num: true },
      { label: 'Aksi', align: 'right', render: p => `<div class="acts">${p.id_foto_ktp_drive ? `<button class="btn-icon" data-file="${esc(p.id_foto_ktp_drive)}" aria-label="KTP ${esc(p.nama)}">${UI.ic('id-card')}</button>` : ''}${App.can('pelanggan', 'u') ? `<button class="btn-icon blue" data-edit="${esc(p.id_pelanggan)}" aria-label="Ubah">${UI.ic('pencil')}</button>` : ''}</div>` }
    ],
    bind: box => {
      Pages._bindFiles(box);
      box.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => Pages.pelangganForm(rows.find(p => p.id_pelanggan === b.dataset.edit), () => App.route()));
    }
  });
  el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => tbl.setRows(rows.filter(p => UI.match(p, e.target.value, ['nama', 'no_hp', 'no_ktp', 'email']))), 150));
  const add = el.querySelector('[data-add]');
  if (add) add.onclick = () => Pages.pelangganForm(null, () => App.route());
  UI.icons(el);
};

Pages.pelangganForm = (p, onDone) => {
  const x = p || {};
  const m = UI.modal({
    title: p ? 'Ubah data pelanggan' : 'Tambah pelanggan', size: 'lg',
    body: `<form id="f-pel" class="fgrid">
      <div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="${esc(x.nama || '')}" required></div>
      <div class="field"><label>No. HP / WhatsApp <span class="req">*</span></label><input class="input mono" name="no_hp" value="${esc(x.no_hp || '')}" inputmode="tel" required></div>
      <div class="field"><label>No. KTP (NIK)</label><input class="input mono" name="no_ktp" value="${esc(x.no_ktp || '')}" inputmode="numeric" maxlength="16"></div>
      <div class="field"><label>Email</label><input class="input" type="email" name="email" value="${esc(x.email || '')}"></div>
      <div class="field span-2"><label>Alamat</label><input class="input" name="alamat" value="${esc(x.alamat || '')}"></div>
      <div class="field span-2"><label>Catatan</label><textarea class="input" name="catatan" rows="2">${esc(x.catatan || '')}</textarea></div>
      <div class="span-all">${UI.fileField('ktp', x.id_foto_ktp_drive ? 'Foto KTP (ganti)' : 'Foto KTP')}</div></form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" type="submit" form="f-pel">${UI.ic('check')} Simpan</button>`
  });
  m.q('form').onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]'); UI.busy(b, true);
    try {
      const data = Object.assign(UI.formData(e.target), await UI.collectFiles(e.target));
      if (p) data.id_pelanggan = p.id_pelanggan;
      await API.call('pelanggan.save', data);
      UI.toast('Data pelanggan disimpan.', 'success'); m.close(); onDone && onDone();
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

Pages.pelangganDetail = async (id) => {
  const m = UI.modal({ title: 'Detail pelanggan', size: 'xl', body: '<div class="empty"><span class="spin"></span></div>' });
  try {
    const d = await API.call('pelanggan.detail', { id_pelanggan: id });
    const p = d.pelanggan;
    m.q('.modal-head h3').textContent = p.nama;
    m.q('.modal-body').innerHTML = `<dl class="kv c4"><div><dt>No. HP</dt><dd class="mono">${esc(p.no_hp)}</dd></div><div><dt>Email</dt><dd>${esc(p.email || '-')}</dd></div><div><dt>No. KTP</dt><dd class="mono">${esc(p.no_ktp || '-')}</dd></div><div><dt>Alamat</dt><dd>${esc(p.alamat || '-')}</dd></div></dl>
      ${p.id_foto_ktp_drive ? `<button class="btn btn-outline btn-sm mt-16" data-file="${esc(p.id_foto_ktp_drive)}" aria-label="KTP ${esc(p.nama)}">${UI.ic('id-card')} Lihat KTP</button>` : ''}
      <div class="section-title mt-20">Riwayat sewa (${d.riwayat.length})</div><div id="riw"></div>`;
    Pages._bindFiles(m.el);
    UI.table(m.q('#riw'), {
      unit: 'transaksi', pageSize: 6, empty: 'Belum pernah menyewa.', onRow: x => { m.close(); App.go('sewa/' + encodeURIComponent(x.id_sewa)); },
      columns: [
        { key: 'id_sewa', label: 'No. sewa', render: x => `<span class="mono t-blue strong">#${esc(x.id_sewa)}</span>` },
        { key: 'nama_kendaraan', label: 'Kendaraan', render: x => esc(x.nama_kendaraan) + ' ' + UI.plat(x.plat, true) },
        { key: 'tgl_pinjam', label: 'Periode', render: x => UI.date(x.tgl_pinjam) + ' – ' + UI.date(x.tgl_kembali_aktual || x.tgl_kembali_rencana) },
        { key: 'harga_total', label: 'Total', num: true, render: x => UI.rp(x.harga_total) },
        { key: 'status_sewa', label: 'Status', align: 'center', render: x => UI.status('sewa', x.status_sewa) }
      ]
    });
    UI.icons(m.el);
  } catch (e) { m.close(); UI.toast(e.message, 'error'); }
};
