/**
 * Halaman keuangan & SDM: Keuangan, Karyawan & Gaji, Approval, Laporan.
 */

// =====================================================================
// KEUANGAN
// =====================================================================
Pages.keuangan = async (el) => {
  const st = { bulan: UI.thisMonth(), tab: '', q: '', kategori: '' };
  const load = async () => render(await API.call('keuangan.list', { cabang: App.cabang, bulan: st.bulan }));
  const render = (d) => {
    const r = d.ringkasan;
    const laba = r.pemasukan - r.pengeluaran;
    const margin = UI.pct(laba, r.pemasukan);
    const cnt = t => d.rows.filter(x => t === 'Menunggu' ? x.status_approval === 'Menunggu' : x.tipe === t).length;
    const kats = [...new Set(d.rows.map(x => x.kategori))].sort();
    const top = (o) => Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 3).map(k => `${esc(k)}: <span class="mono">${UI.rpShort(o[k])}</span>`).join(' • ') || '-';
    el.innerHTML = UI.pageHead({
      title: 'Keuangan & arus kas',
      desc: 'Kas masuk, pengeluaran operasional cabang, servis armada, dan penggajian. Transaksi tidak dihapus — gunakan pembatalan agar jejak audit tetap ada.',
      actions: `${App.can('keuangan', 'c') ? `<button class="btn btn-outline t-green" data-new="Pemasukan">${UI.ic('circle-plus')} Catat pemasukan</button><button class="btn btn-outline t-red" data-new="Pengeluaran">${UI.ic('circle-minus')} Catat pengeluaran</button>` : ''}<button class="btn btn-outline" data-csv>${UI.ic('download')} Ekspor bulan ini</button>`
    }) + `
    <div class="grid g3">
      ${UI.kpi({ label: 'Total pemasukan ' + UI.month(st.bulan), extra: UI.delta(r.pemasukan, r.pemasukan_lalu), value: `<span class="t-green">${UI.rp(r.pemasukan)}</span>`, money: true, sub: top(r.kategori_pemasukan) })}
      ${UI.kpi({ label: 'Total pengeluaran ' + UI.month(st.bulan), extra: UI.delta(r.pengeluaran, r.pengeluaran_lalu, true), value: `<span class="t-red">${UI.rp(r.pengeluaran)}</span>`, money: true, sub: top(r.kategori_pengeluaran) })}
      ${UI.kpi({ dark: true, label: 'Laba bersih operasional', extra: UI.badge(laba >= 0 ? 'Sehat' : 'Defisit', laba >= 0 ? 'blue' : 'red'), value: UI.rp(laba), money: true, sub: `Margin ${String(margin).replace('.', ',')}% • hanya transaksi disetujui`, bar: Math.max(0, margin), barTone: 'green' })}
    </div>
    <section class="card mt-20">
      <div class="row between wrap" style="padding-right:16px">
        <div class="tabs" style="border:0">
          ${[['', 'Semua transaksi', d.rows.length], ['Pemasukan', 'Pemasukan', cnt('Pemasukan')], ['Pengeluaran', 'Pengeluaran', cnt('Pengeluaran')], ['Menunggu', 'Menunggu approval', cnt('Menunggu')]]
          .map(t => `<button class="tab ${st.tab === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]} <span class="n ${t[0] === 'Menunggu' && t[2] ? 'warn' : ''}">${t[2]}</span></button>`).join('')}
        </div>
        ${r.menunggu_count ? `<div class="callout amber small" style="padding:8px 12px">${UI.ic('shield-alert')}<div>Perlu tinjauan: <b class="mono">${UI.rp(r.menunggu_total)}</b> menunggu verifikasi Admin</div></div>` : ''}
      </div>
      <div class="filters" style="border-top:1px solid var(--line)">
        <label class="search">${UI.ic('search')}<input class="input" data-q value="${esc(st.q)}" placeholder="Cari deskripsi, kategori, atau no. referensi..." aria-label="Cari transaksi"></label>
        <select class="input" data-kat aria-label="Kategori"><option value="">Semua kategori</option>${UI.opts(kats, null, null, st.kategori)}</select>
        <input class="input" type="month" data-bulan value="${esc(st.bulan)}" aria-label="Bulan">
        <button class="btn-icon" data-reload aria-label="Muat ulang">${UI.ic('refresh-cw')}</button>
      </div>
      <div id="tbl-keu"></div>
    </section>
    <div class="callout blue mt-20">${UI.ic('shield-check')}<div>Pengeluaran di atas <b class="mono">${UI.rp(App.meta.pengaturan.ambang_approval)}</b> yang dicatat selain Admin otomatis masuk antrean approval dan belum dihitung di laporan sampai disetujui.</div></div>`;
    const tbl = UI.table(el.querySelector('#tbl-keu'), {
      unit: 'transaksi', pageSize: 12, empty: 'Tidak ada transaksi pada filter ini.',
      rowClass: x => x.status_approval === 'Menunggu' ? 'pending-row' : x.status_approval === 'Dibatalkan' || x.status_approval === 'Ditolak' ? 'faint' : '',
      footNote: rows => { const p = rows.filter(x => x.tipe === 'Pemasukan' && x.status_approval === 'Disetujui').reduce((a, x) => a + UI.n(x.nominal), 0), q = rows.filter(x => x.tipe === 'Pengeluaran' && x.status_approval === 'Disetujui').reduce((a, x) => a + UI.n(x.nominal), 0); return `<span>Masuk <b class="t-green mono">${UI.rp(p)}</b> • Keluar <b class="t-red mono">${UI.rp(q)}</b> • Selisih <b class="t-blue mono">${UI.rp(p - q, true)}</b></span>`; },
      columns: [
        { key: 'tanggal', label: 'Tanggal', render: x => `<div class="mono">${UI.date(x.tanggal)}</div><div class="t-sub mono">${UI.time(x.dibuat_pada)} WITA</div>`, sortVal: x => x.tanggal + x.dibuat_pada },
        { key: 'nama_cabang', label: 'Cabang', render: x => UI.cab(x.nama_cabang) },
        { key: 'tipe', label: 'Tipe', render: x => UI.badge(x.tipe === 'Pemasukan' ? '+ Pemasukan' : '- Pengeluaran', x.tipe === 'Pemasukan' ? 'green' : 'red') },
        { key: 'kategori', label: 'Kategori', render: x => `<span class="badge sans">${esc(x.kategori)}</span>` },
        { key: 'deskripsi', label: 'Deskripsi', render: x => `<div class="t-main" style="font-weight:500;max-width:340px">${esc(x.deskripsi)}</div><div class="t-sub">${esc(x.metode || '')}${x.metode ? ' • ' : ''}oleh ${esc(x.nama_pencatat)}</div>` },
        { key: 'nominal', label: 'Nominal', num: true, sortVal: x => UI.n(x.nominal), render: x => `<span class="${x.tipe === 'Pemasukan' ? 't-green' : 't-red'} strong">${x.tipe === 'Pemasukan' ? '+' : '-'} ${UI.rp(x.nominal)}</span>` },
        { key: 'referensi', label: 'Ref', render: x => x.referensi ? (/^SW-/.test(x.referensi) ? `<a class="mono small" href="#/sewa/${encodeURIComponent(x.referensi)}">#${esc(x.referensi)}</a>` : `<span class="mono small t-blue">#${esc(x.referensi)}</span>`) : '-' },
        { key: 'status_approval', label: 'Status', align: 'center', render: x => UI.status('approval', x.status_approval) },
        { label: '', align: 'right', render: x => `<div class="acts">${x.id_bukti_drive ? `<button class="btn-icon" data-file="${esc(x.id_bukti_drive)}" aria-label="Bukti transaksi">${UI.ic('paperclip')}</button>` : ''}${App.can('keuangan', 'd') && x.status_approval !== 'Dibatalkan' ? `<button class="btn-icon red" data-cancel="${esc(x.id_trx)}" aria-label="Batalkan">${UI.ic('ban')}</button>` : ''}</div>` }
      ],
      bind: box => {
        Pages._bindFiles(box);
        box.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => {
          const alasan = await UI.confirm({ title: 'Batalkan transaksi?', message: 'Transaksi tetap tersimpan dengan status Dibatalkan dan tidak dihitung di laporan.', input: true, inputLabel: 'Alasan pembatalan', required: true, danger: true, ok: 'Batalkan transaksi' });
          if (!alasan) return;
          try { await API.call('keuangan.cancel', { id_trx: b.dataset.cancel, alasan }); UI.toast('Transaksi dibatalkan.', 'success'); load(); } catch (e) { UI.toast(e.message, 'error'); }
        });
      }
    });
    const filt = () => tbl.setRows(d.rows.filter(x => (!st.tab || (st.tab === 'Menunggu' ? x.status_approval === 'Menunggu' : x.tipe === st.tab)) && (!st.kategori || x.kategori === st.kategori) && UI.match(x, st.q, ['deskripsi', 'kategori', 'referensi', 'id_trx', 'metode'])));
    filt();
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; el.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); filt(); });
    el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => { st.q = e.target.value; filt(); }, 150));
    el.querySelector('[data-kat]').onchange = e => { st.kategori = e.target.value; filt(); };
    el.querySelector('[data-bulan]').onchange = e => { if (e.target.value) { st.bulan = e.target.value; load().catch(er => UI.toast(er.message, 'error')); } };
    el.querySelector('[data-reload]').onclick = () => load().catch(er => UI.toast(er.message, 'error'));
    el.querySelectorAll('[data-new]').forEach(b => b.onclick = () => Pages.keuanganForm(b.dataset.new, () => load()));
    el.querySelector('[data-csv]').onclick = () => UI.downloadText(UI.csv(tbl.rows, [
      { label: 'ID', key: 'id_trx' }, { label: 'Tanggal', val: x => UI.date(x.tanggal) }, { label: 'Cabang', key: 'nama_cabang' }, { label: 'Tipe', key: 'tipe' }, { label: 'Kategori', key: 'kategori' },
      { label: 'Deskripsi', key: 'deskripsi' }, { label: 'Metode', key: 'metode' }, { label: 'Nominal', key: 'nominal' }, { label: 'Referensi', key: 'referensi' }, { label: 'Status', key: 'status_approval' }, { label: 'Pencatat', key: 'nama_pencatat' }
    ]), 'keuangan_' + st.bulan + '.csv');
    UI.icons(el);
  };
  await load();
};

Pages.keuanganForm = (tipe, onDone) => {
  const P = App.meta.pengaturan;
  const semua = App.scope('keuangan') === 'SEMUA';
  const m = UI.modal({
    title: 'Catat transaksi kas', sub: 'Setiap catatan menyimpan cabang, tanggal, nominal, dan nama pencatat.', size: 'lg',
    body: `<form id="f-keu" class="fgrid">
      <div class="field span-all"><span class="lbl">Tipe transaksi</span><div class="seg" id="seg-tipe"><button type="button" data-t="Pemasukan">${UI.ic('circle-plus', 'ic-sm')} Pemasukan</button><button type="button" data-t="Pengeluaran">${UI.ic('circle-minus', 'ic-sm')} Pengeluaran</button></div><input type="hidden" name="tipe" value="${esc(tipe)}"></div>
      <div class="field"><label>Tanggal <span class="req">*</span></label><input class="input" type="date" name="tanggal" value="${UI.today()}" required></div>
      <div class="field"><label>Cabang <span class="req">*</span></label>${semua ? `<select class="input" name="id_cabang" required>${UI.opts(App.meta.cabang, 'id_cabang', 'nama_cabang', App.cabang, 'Pilih cabang')}</select>` : `<input class="input" value="${esc(App.user.nama_cabang)}" disabled>`}</div>
      <div class="field"><label>Kategori <span class="req">*</span></label><select class="input" name="kategori" id="kat" required></select></div>
      <div class="field"><label>Nominal <span class="req">*</span></label><div class="input-group"><span class="addon">IDR</span><input class="input" name="nominal" inputmode="numeric" required></div></div>
      <div class="field span-2"><label>Deskripsi & vendor/penyewa <span class="req">*</span></label><input class="input" name="deskripsi" placeholder="Mis. Pembelian solar untuk HiAce KT 7721 LA — SPBU Juanda" required></div>
      <div class="field"><label>Metode</label><select class="input" name="metode">${UI.opts(P.metode_bayar)}</select></div>
      <div class="field"><label>No. referensi (opsional)</label><input class="input mono" name="referensi" placeholder="Nota / RRN"></div>
      <div class="span-all">${UI.fileField('bukti', 'Bukti / nota')}</div>
      <div class="callout amber span-all" id="warn-ambang" hidden>${UI.ic('shield-alert')}<div>Nominal di atas <b class="mono">${UI.rp(P.ambang_approval)}</b>. Pengeluaran ini akan menunggu persetujuan Admin sebelum dihitung di laporan.</div></div>
    </form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" type="submit" form="f-keu">${UI.ic('check')} Simpan transaksi</button>`
  });
  const f = m.q('form');
  const setTipe = t => {
    f.tipe.value = t;
    m.qa('#seg-tipe [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    m.q('#kat').innerHTML = UI.opts(t === 'Pemasukan' ? P.kategori_pemasukan : P.kategori_pengeluaran, null, null, '', 'Pilih kategori');
    cek();
  };
  const cek = () => { m.q('#warn-ambang').hidden = !(f.tipe.value === 'Pengeluaran' && !App.user.isAdmin && P.ambang_approval && UI.n(f.nominal.value.replace(/\D/g, '')) > P.ambang_approval); };
  m.qa('#seg-tipe [data-t]').forEach(b => b.onclick = () => setTipe(b.dataset.t));
  f.nominal.addEventListener('input', cek);
  setTipe(tipe || 'Pengeluaran');
  f.onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]'); UI.busy(b, true);
    try {
      const data = Object.assign(UI.formData(f), await UI.collectFiles(f));
      data.nominal = UI.n(String(data.nominal).replace(/\D/g, ''));
      const r = await API.call('keuangan.save', data);
      UI.toast(r.status_approval === 'Menunggu' ? 'Tersimpan. Menunggu approval Admin.' : 'Transaksi tersimpan.', 'success');
      m.close(); onDone && onDone(); App.refreshBadges();
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

// =====================================================================
// KARYAWAN & PENGGAJIAN
// =====================================================================
Pages.karyawan = async (el) => {
  if (App.scope('karyawan') === 'SENDIRI') return Pages.slipSaya(el);
  const st = { tab: 'gaji', periode: UI.thisMonth(), q: '', sel: new Set() };
  const load = async () => {
    const [kary, gaji] = await Promise.all([API.call('karyawan.list', { cabang: App.cabang }), API.call('gaji.list', { cabang: App.cabang, periode: st.periode })]);
    st.sel.clear();
    render(kary, gaji);
  };
  const render = (kary, g) => {
    const aktif = kary.filter(k => k.status === 'Aktif');
    const draft = g.rows.filter(x => x.status === 'Draft').length;
    const disetujui = g.rows.filter(x => x.status === 'Disetujui');
    const perCab = App.meta.cabang.map(c => aktif.filter(k => k.id_cabang === c.id_cabang).length + ' ' + c.nama_cabang).join(' • ');
    const statusPeriode = !g.rows.length ? 'Belum diproses' : g.rows.every(x => x.status === 'Dibayar') ? 'Semua dibayar' : g.approval_menunggu ? 'Menunggu approval' : draft ? draft + ' draft' : disetujui.length + ' siap dibayar';
    el.innerHTML = UI.pageHead({
      crumbs: '<span>SDM</span><span>›</span><b>Karyawan & penggajian</b>',
      title: 'Karyawan & Penggajian',
      desc: 'Data personel kedua cabang dan pemrosesan gaji bulanan: gaji pokok + bonus − potongan.',
      actions: `${App.can('karyawan', 'c') ? `<button class="btn btn-outline" data-addk>${UI.ic('user-plus')} Tambah karyawan</button><button class="btn btn-primary" data-gen>${UI.ic('circle-play')} Proses gaji ${esc(UI.month(st.periode))}</button>` : ''}`
    }) + `
    <div class="grid g3">
      ${UI.kpi({ label: 'Total karyawan aktif', value: aktif.length, unit: 'Personel', icon: 'users', sub: esc(perCab) })}
      ${UI.kpi({ label: 'Periode penggajian', value: `<span style="font-family:var(--sans);font-size:24px;letter-spacing:-.02em">${esc(UI.month(st.periode))}</span>`, icon: 'calendar', tone: 'navy', sub: UI.badge(statusPeriode, g.approval_menunggu ? 'amber' : '') })}
      ${UI.kpi({ label: 'Total gaji bersih periode ini', value: UI.rp(g.total.total_diterima), money: true, icon: 'wallet', tone: 'green', sub: `Bonus ${UI.rp(g.total.bonus)} • potongan ${UI.rp(g.total.potongan)}` })}
    </div>
    <section class="card mt-20">
      <div class="tabs"><button class="tab ${st.tab === 'gaji' ? 'on' : ''}" data-tab="gaji">Penggajian bulanan <span class="n">${g.rows.length}</span></button><button class="tab ${st.tab === 'dir' ? 'on' : ''}" data-tab="dir">Direktori karyawan <span class="n">${kary.length}</span></button></div>
      <div class="filters"><label class="search">${UI.ic('search')}<input class="input" data-q value="${esc(st.q)}" placeholder="Cari nama atau jabatan..." aria-label="Cari karyawan"></label>
        ${st.tab === 'gaji' ? `<input class="input" type="month" data-periode value="${esc(st.periode)}" aria-label="Periode">` : ''}</div>
      <div id="tbl-k"></div>
      ${st.tab === 'gaji' && g.rows.length ? `<div class="card-foot" style="background:var(--soft)">
        <div class="row wrap" style="gap:24px"><div class="small muted">Gaji pokok<br><b class="mono" style="color:var(--text)">${UI.rp(g.total.gaji_pokok)}</b></div><div class="small muted">Bonus<br><b class="mono t-green">+ ${UI.rp(g.total.bonus)}</b></div><div class="small muted">Potongan<br><b class="mono t-red">- ${UI.rp(g.total.potongan)}</b></div><div class="small t-blue strong">Total bersih<br><b class="mono" style="font-size:18px">${UI.rp(g.total.total_diterima)}</b></div></div>
        <div class="row wrap">
          ${draft && App.can('karyawan', 'c') && !g.approval_menunggu ? `<button class="btn btn-outline" data-ajukan>${UI.ic(App.can('karyawan', 'a') ? 'circle-check' : 'send')} ${App.can('karyawan', 'a') ? 'Setujui ' + draft + ' draft' : 'Ajukan approval ke Owner'}</button>` : ''}
          ${g.approval_menunggu ? `<a class="btn btn-outline" href="#/approval/${encodeURIComponent(g.approval_menunggu)}">${UI.ic('hourglass')} Lihat pengajuan</a>` : ''}
          ${disetujui.length && App.can('karyawan', 'a') ? `<button class="btn btn-success" data-bayar>${UI.ic('banknote')} Tandai dibayar (kas keluar)</button>` : ''}
        </div></div>` : ''}
    </section>
    <div class="callout blue mt-20">${UI.ic('info')}<div>Saat ditandai dibayar, gaji tercatat sebagai pengeluaran "Gaji Karyawan" dan slip PDF tersimpan otomatis di Google Drive: <span class="mono">MTB Manajemen/Slip Gaji PDF/${esc(st.periode)}/</span></div></div>`;

    const box = el.querySelector('#tbl-k');
    let tbl;
    if (st.tab === 'gaji') {
      tbl = UI.table(box, {
        unit: 'karyawan', pageSize: 15,
        empty: `Belum ada data gaji untuk ${esc(UI.month(st.periode))}. ${App.can('karyawan', 'c') ? 'Klik "Proses gaji" untuk membuat draft dari data karyawan aktif.' : ''}`,
        columns: [
          { label: `<input type="checkbox" data-all aria-label="Pilih semua">`, render: x => x.status === 'Disetujui' ? `<input type="checkbox" data-sel="${esc(x.id_gaji)}" ${st.sel.has(x.id_gaji) ? 'checked' : ''} aria-label="Pilih ${esc(x.nama)}">` : '' },
          { key: 'nama', label: 'Karyawan & posisi', render: x => `<div class="row"><span class="avatar" style="width:36px;height:36px;font-size:12px">${esc(UI.initials(x.nama))}</span><div><div class="t-main">${esc(x.nama)} <span class="mono muted xs">#${esc(x.id_karyawan)}</span></div><div class="t-sub">${esc(x.jabatan)} • ${esc(x.nama_cabang)}</div></div></div>` },
          { key: 'gaji_pokok', label: 'Gaji pokok', num: true, render: x => UI.rp(x.gaji_pokok) },
          { key: 'bonus', label: 'Bonus', num: true, render: x => `<span class="t-green">+ ${UI.rp(x.bonus)}</span>` },
          { key: 'potongan', label: 'Potongan', num: true, render: x => `<span class="${UI.n(x.potongan) ? 't-red' : 'muted'}">- ${UI.rp(x.potongan)}</span>${x.keterangan ? `<div class="t-sub" style="font-family:var(--sans)">${esc(x.keterangan)}</div>` : ''}` },
          { key: 'total_diterima', label: 'Total diterima', num: true, render: x => `<b>${UI.rp(x.total_diterima)}</b>` },
          { key: 'status', label: 'Status', align: 'center', render: x => UI.status('gaji', x.status) },
          { label: 'Aksi', align: 'right', render: x => `<div class="acts"><button class="btn-icon blue" data-slip="${esc(x.id_gaji)}" aria-label="Slip gaji">${UI.ic('file-text')}</button>${x.status === 'Draft' && App.can('karyawan', 'u') ? `<button class="btn-icon" data-editg="${esc(x.id_gaji)}" aria-label="Ubah bonus/potongan">${UI.ic('pencil')}</button>` : ''}${x.status === 'Dibayar' && App.can('karyawan', 'u') ? `<button class="btn-icon green" data-mailg="${esc(x.id_gaji)}" aria-label="Kirim slip email">${UI.ic('send')}</button>` : ''}</div>` }
        ],
        bind: b => {
          b.querySelectorAll('[data-sel]').forEach(c => c.onchange = () => c.checked ? st.sel.add(c.dataset.sel) : st.sel.delete(c.dataset.sel));
          const all = b.querySelector('[data-all]');
          if (all) all.onchange = () => b.querySelectorAll('[data-sel]').forEach(c => { c.checked = all.checked; c.onchange(); });
          b.querySelectorAll('[data-slip]').forEach(x => x.onclick = () => UI.pdfAction('gaji.slip', { id_gaji: x.dataset.slip }, 'Slip gaji'));
          b.querySelectorAll('[data-mailg]').forEach(x => x.onclick = async () => {
            const r = g.rows.find(z => z.id_gaji === x.dataset.mailg);
            if (!r.email) { UI.toast('Email karyawan belum diisi di direktori.', 'error'); return; }
            const ok = await UI.confirm({ title: 'Kirim slip gaji?', message: `Slip ${esc(UI.month(r.periode))} dikirim ke <b>${esc(r.email)}</b>.`, ok: 'Kirim' });
            if (ok) UI.pdfAction('gaji.slip', { id_gaji: r.id_gaji, kirim_email: true }, 'Slip gaji');
          });
          b.querySelectorAll('[data-editg]').forEach(x => x.onclick = () => Pages.gajiForm(g.rows.find(z => z.id_gaji === x.dataset.editg), () => load()));
        }
      });
      const filt = () => tbl.setRows(g.rows.filter(x => UI.match(x, st.q, ['nama', 'jabatan', 'nama_cabang'])));
      filt();
      el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => { st.q = e.target.value; filt(); }, 150));
    } else {
      tbl = UI.table(box, {
        unit: 'karyawan', empty: 'Belum ada karyawan.',
        columns: [
          { key: 'nama', label: 'Nama', render: k => `<div class="row"><span class="avatar lt" style="width:34px;height:34px;font-size:12px">${esc(UI.initials(k.nama))}</span><div><div class="t-main">${esc(k.nama)}</div><div class="t-sub mono">#${esc(k.id_karyawan)}</div></div></div>` },
          { key: 'jabatan', label: 'Jabatan' },
          { key: 'nama_cabang', label: 'Cabang', render: k => UI.cab(k.nama_cabang) },
          { key: 'tgl_masuk', label: 'Tgl masuk', render: k => UI.date(k.tgl_masuk) },
          { key: 'gaji_pokok', label: 'Gaji pokok', num: true, render: k => UI.rp(k.gaji_pokok) },
          { key: 'no_rekening', label: 'Rekening', render: k => `<span class="mono small">${esc(k.no_rekening || '-')}</span>` },
          { key: 'username', label: 'Akun', render: k => k.username ? `<span class="mono small">@${esc(k.username)}</span>` : '<span class="muted">-</span>' },
          { key: 'status', label: 'Status', align: 'center', render: k => UI.status('akun', k.status) },
          { label: '', align: 'right', render: k => App.can('karyawan', 'u') ? `<button class="btn-icon blue" data-editk="${esc(k.id_karyawan)}" aria-label="Ubah">${UI.ic('pencil')}</button>` : '' }
        ],
        bind: b => b.querySelectorAll('[data-editk]').forEach(x => x.onclick = () => Pages.karyawanForm(kary.find(k => k.id_karyawan === x.dataset.editk), () => load()))
      });
      const filt = () => tbl.setRows(kary.filter(k => UI.match(k, st.q, ['nama', 'jabatan', 'nama_cabang'])));
      filt();
      el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => { st.q = e.target.value; filt(); }, 150));
    }

    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { st.tab = b.dataset.tab; render(kary, g); });
    const per = el.querySelector('[data-periode]');
    if (per) per.onchange = () => { if (per.value) { st.periode = per.value; load().catch(e => UI.toast(e.message, 'error')); } };
    const on = (s, fn) => { const b = el.querySelector(s); if (b) b.onclick = () => fn(b); };
    on('[data-addk]', () => Pages.karyawanForm(null, () => load()));
    on('[data-gen]', async b => {
      UI.busy(b, true);
      try { const r = await API.call('gaji.generate', { periode: st.periode, cabang: App.cabang }); UI.toast(r.dibuat ? r.dibuat + ' draft gaji dibuat untuk ' + UI.month(st.periode) + '.' : 'Semua karyawan aktif sudah memiliki data gaji periode ini.', 'success'); st.tab = 'gaji'; await load(); }
      catch (e) { UI.busy(b, false); UI.toast(e.message, 'error'); }
    });
    on('[data-ajukan]', async b => {
      const admin = App.can('karyawan', 'a');
      const ok = await UI.confirm({ title: admin ? 'Setujui penggajian?' : 'Ajukan approval penggajian?', message: admin ? 'Semua draft periode ini berubah menjadi Disetujui dan siap dibayar.' : 'Draft dikunci dan dikirim ke Admin/Owner untuk disetujui.', ok: admin ? 'Setujui' : 'Ajukan' });
      if (!ok) return;
      UI.busy(b, true);
      try { const r = await API.call('gaji.ajukan', { periode: st.periode, cabang: App.cabang }); UI.toast(r.langsung_disetujui ? r.jumlah + ' gaji disetujui.' : 'Pengajuan terkirim ke Admin.', 'success'); App.refreshBadges(); await load(); }
      catch (e) { UI.busy(b, false); UI.toast(e.message, 'error'); }
    });
    on('[data-bayar]', () => {
      const ids = st.sel.size ? [...st.sel] : disetujui.map(x => x.id_gaji);
      const total = g.rows.filter(x => ids.indexOf(x.id_gaji) >= 0).reduce((a, x) => a + UI.n(x.total_diterima), 0);
      const m = UI.modal({
        title: 'Tandai gaji dibayar', sub: `${ids.length} karyawan • total <span class="mono">${UI.rp(total)}</span>`, size: 'sm',
        body: `<form id="f-bayar-gaji"><div class="field"><label>Tanggal bayar</label><input class="input" type="date" name="tgl_bayar" value="${UI.today()}"></div>
          <div class="field mt-12"><label>Metode</label><select class="input" name="metode">${UI.opts(App.meta.pengaturan.metode_bayar, null, null, 'Transfer Bank')}</select></div>
          <label class="check mt-16"><input type="checkbox" name="kirim_email" checked> Kirim slip gaji PDF ke email karyawan</label>
          <p class="hint mt-12">Proses membuat PDF untuk setiap karyawan dan dapat memakan waktu ±2 detik per orang.</p></form>`,
        footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-success" type="submit" form="f-bayar-gaji">${UI.ic('banknote')} Tandai dibayar</button>`
      });
      m.q('form').onsubmit = async e => {
        e.preventDefault();
        const b = m.q('button[type=submit]'); UI.busy(b, true, 'Membuat slip...');
        try {
          const r = await API.call('gaji.bayar', Object.assign(UI.formData(e.target), { ids }));
          UI.toast(`${r.dibayar} gaji dibayar, ${r.email_terkirim} slip terkirim.${r.gagal.length ? ' Lewati: ' + r.gagal.join(', ') : ''}`, r.gagal.length ? '' : 'success');
          m.close(); load();
        } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
      };
    });
    UI.icons(el);
  };
  await load();
};

Pages.gajiForm = (g, onDone) => {
  const m = UI.modal({
    title: 'Ubah gaji ' + esc(g.nama), sub: esc(UI.month(g.periode)) + ' • ' + esc(g.jabatan), size: 'sm',
    body: `<form id="f-gaji">
      <div class="field"><label>Gaji pokok</label><div class="input-group"><span class="addon">Rp</span><input class="input" name="gaji_pokok" inputmode="numeric" value="${UI.n(g.gaji_pokok)}"></div></div>
      <div class="field mt-12"><label>Bonus / insentif / ritase</label><div class="input-group"><span class="addon">Rp</span><input class="input" name="bonus" inputmode="numeric" value="${UI.n(g.bonus) || ''}"></div></div>
      <div class="field mt-12"><label>Potongan / kasbon</label><div class="input-group"><span class="addon">Rp</span><input class="input" name="potongan" inputmode="numeric" value="${UI.n(g.potongan) || ''}"></div></div>
      <div class="field mt-12"><label>Keterangan</label><input class="input" name="keterangan" value="${esc(g.keterangan || '')}" placeholder="Mis. 11 ritase IKN, kasbon BBM"></div>
      <div class="summary-dark mt-16"><div class="xs">TOTAL DITERIMA</div><div class="money-big" id="tot"></div></div></form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" type="submit" form="f-gaji">Simpan</button>`
  });
  const f = m.q('form');
  const v = n => UI.n(String(f[n].value).replace(/\D/g, ''));
  const calc = () => { m.q('#tot').textContent = UI.rp(v('gaji_pokok') + v('bonus') - v('potongan')); };
  ['gaji_pokok', 'bonus', 'potongan'].forEach(n => f[n].addEventListener('input', calc));
  calc();
  f.onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]'); UI.busy(b, true);
    try { await API.call('gaji.save', { id_gaji: g.id_gaji, gaji_pokok: v('gaji_pokok'), bonus: v('bonus'), potongan: v('potongan'), keterangan: f.keterangan.value }); UI.toast('Data gaji diperbarui.', 'success'); m.close(); onDone && onDone(); }
    catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

Pages.karyawanForm = async (k, onDone) => {
  const x = k || { status: 'Aktif', id_cabang: App.cabang };
  let users = [];
  if (App.can('akun', 'r')) { try { users = (await API.call('akun.list')).users; } catch (e) { users = []; } }
  const cabOpts = App.scope('karyawan') === 'SEMUA' ? App.meta.cabang : App.meta.cabang.filter(c => c.id_cabang === App.user.id_cabang);
  const m = UI.modal({
    title: k ? 'Ubah data karyawan' : 'Tambah karyawan', size: 'lg',
    body: `<form id="f-kary" class="fgrid">
      <div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="${esc(x.nama || '')}" required></div>
      <div class="field"><label>Jabatan <span class="req">*</span></label><input class="input" name="jabatan" value="${esc(x.jabatan || '')}" placeholder="Supir, Staf Operasional, Kasir..." required></div>
      <div class="field"><label>Cabang <span class="req">*</span></label><select class="input" name="id_cabang" required>${UI.opts(cabOpts, 'id_cabang', 'nama_cabang', x.id_cabang, 'Pilih cabang')}</select></div>
      <div class="field"><label>Tanggal masuk</label><input class="input" type="date" name="tgl_masuk" value="${esc(x.tgl_masuk || '')}"></div>
      <div class="field"><label>Gaji pokok</label><div class="input-group"><span class="addon">IDR</span><input class="input" name="gaji_pokok" inputmode="numeric" value="${esc(x.gaji_pokok || '')}"></div></div>
      <div class="field"><label>No. rekening</label><input class="input mono" name="no_rekening" value="${esc(x.no_rekening || '')}" placeholder="BCA 728-019-3382 a/n ..."></div>
      <div class="field"><label>Email (untuk slip gaji)</label><input class="input" type="email" name="email" value="${esc(x.email || '')}"></div>
      <div class="field"><label>Akun aplikasi (opsional)</label>${users.length ? `<select class="input" name="id_user">${UI.opts(users, 'id_user', u => u.nama + ' (@' + u.username + ')', x.id_user, 'Tidak terhubung')}</select>` : `<input class="input" value="${esc(x.username ? '@' + x.username : '-')}" disabled>`}<span class="hint">Hubungkan agar karyawan bisa melihat slip gajinya sendiri.</span></div>
      <div class="field"><label>Status</label><select class="input" name="status">${UI.opts(['Aktif', 'Nonaktif'], null, null, x.status)}</select></div>
    </form>`,
    footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" type="submit" form="f-kary">${UI.ic('check')} Simpan</button>`
  });
  m.q('form').onsubmit = async e => {
    e.preventDefault();
    const b = m.q('button[type=submit]'); UI.busy(b, true);
    try {
      const data = UI.formData(e.target);
      if (!users.length) data.id_user = x.id_user || '';
      if (k) data.id_karyawan = k.id_karyawan;
      data.gaji_pokok = UI.n(String(data.gaji_pokok).replace(/\D/g, ''));
      await API.call('karyawan.save', data);
      UI.toast('Data karyawan disimpan.', 'success'); m.close(); onDone && onDone();
    } catch (err) { UI.busy(b, false); UI.toast(err.message, 'error'); }
  };
};

Pages.slipSaya = async (el) => {
  const g = await API.call('gaji.list');
  el.innerHTML = UI.pageHead({ title: 'Slip Gaji Saya', desc: 'Riwayat gaji yang sudah disetujui atau dibayar. Unduh slip PDF untuk arsip Anda.' }) +
    `<section class="card"><div id="tbl-slip"></div></section>`;
  UI.table(el.querySelector('#tbl-slip'), {
    unit: 'periode', empty: 'Belum ada data gaji. Hubungi Admin jika akun Anda belum terhubung ke data karyawan.',
    columns: [
      { key: 'periode', label: 'Periode', render: x => `<b>${esc(UI.month(x.periode))}</b>` },
      { key: 'gaji_pokok', label: 'Gaji pokok', num: true, render: x => UI.rp(x.gaji_pokok) },
      { key: 'bonus', label: 'Bonus', num: true, render: x => `<span class="t-green">+ ${UI.rp(x.bonus)}</span>` },
      { key: 'potongan', label: 'Potongan', num: true, render: x => `<span class="t-red">- ${UI.rp(x.potongan)}</span>` },
      { key: 'total_diterima', label: 'Diterima', num: true, render: x => `<b>${UI.rp(x.total_diterima)}</b>` },
      { key: 'status', label: 'Status', align: 'center', render: x => UI.status('gaji', x.status) },
      { label: '', align: 'right', render: x => x.status === 'Dibayar' || x.status === 'Disetujui' ? `<button class="btn btn-soft btn-sm" data-slip="${esc(x.id_gaji)}">${UI.ic('download', 'ic-sm')} Slip PDF</button>` : '' }
    ],
    rows: g.rows,
    bind: b => b.querySelectorAll('[data-slip]').forEach(x => x.onclick = () => UI.pdfAction('gaji.slip', { id_gaji: x.dataset.slip }, 'Slip gaji'))
  });
  UI.icons(el);
};

// =====================================================================
// APPROVAL
// =====================================================================
Pages.approval = async (el, selId) => {
  const st = { status: 'Menunggu', tipe: '', q: '', sel: selId || '' };
  const canA = App.can('approval', 'a');
  const loadList = async () => {
    const d = await API.call('approval.list', { status: st.status });
    if (st.sel && !d.rows.some(a => a.id_approval === st.sel) && selId === st.sel && st.status === 'Menunggu') {
      // pengajuan yang dibuka dari tautan mungkin sudah diputuskan — tampilkan di tab yang sesuai
      const all = await API.call('approval.list', {});
      const hit = all.rows.find(a => a.id_approval === st.sel);
      if (hit) { st.status = hit.status; return loadList(); }
    }
    render(d);
  };
  const render = (d) => {
    el.innerHTML = UI.pageHead({
      title: canA ? 'Approval khusus Admin' : 'Pengajuan saya', badge: canA ? UI.badge('Otorisasi finansial & operasional', 'blue') : '',
      desc: canA ? `Tinjau pengeluaran kas di atas ${UI.rp(App.meta.pengaturan.ambang_approval)}, penyesuaian harga sewa, dan penggajian karyawan.` : 'Status pengajuan yang Anda kirim ke Admin.',
      actions: `<div class="card" style="padding:10px 16px;display:flex;gap:24px"><div class="small muted">Perlu tindakan<br><b class="mono" style="color:var(--text)">${d.counts.Menunggu || 0} tiket</b></div><div class="small muted">Nilai tertunda<br><b class="mono t-blue">${UI.rp(st.status === 'Menunggu' ? d.rows.reduce((a, x) => a + UI.n(x.nominal), 0) : 0)}</b></div></div>`
    }) + `
    <section class="card"><div class="tabs">
      ${[['Menunggu', 'Menunggu tindakan', 'hourglass'], ['Disetujui', 'Telah disetujui', 'circle-check'], ['Ditolak', 'Ditolak', 'circle-x']].map(t => `<button class="tab ${st.status === t[0] ? 'on' : ''}" data-st="${t[0]}">${UI.ic(t[2], 'ic-sm')} ${t[1]} <span class="n ${t[0] === 'Menunggu' && d.counts.Menunggu ? 'warn' : ''}">${d.counts[t[0]] || 0}</span></button>`).join('')}
    </div>
    <div class="grid" style="grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:0" id="ap-grid">
      <div style="border-right:1px solid var(--line)">
        <div style="padding:12px 12px 0"><label class="search">${UI.ic('search')}<input class="input" data-q value="${esc(st.q)}" placeholder="Cari nomor, judul, pemohon..." aria-label="Cari pengajuan"></label>
          <div class="chips mt-8">${['', 'Keuangan', 'Diskon Sewa', 'Penggajian'].map(t => `<button class="chip-btn ${st.tipe === t ? 'on' : ''}" data-tipe="${t}">${t || 'Semua tipe'}</button>`).join('')}</div></div>
        <div class="list-pane" id="ap-list"></div>
      </div>
      <div id="ap-detail" style="min-width:0"></div>
    </div></section>`;
    const list = el.querySelector('#ap-list');
    const rows = d.rows.filter(a => (!st.tipe || a.modul === st.tipe) && UI.match(a, st.q, ['id_approval', 'judul', 'nama_pengaju', 'id_referensi']));
    const tone = { Keuangan: 'amber', 'Diskon Sewa': 'blue', Penggajian: 'purple' };
    list.innerHTML = rows.length ? rows.map(a => `<button class="ap-item ${a.id_approval === st.sel ? 'on' : ''}" data-id="${esc(a.id_approval)}">
      <div class="row between">${UI.badge(a.modul, tone[a.modul] || '')}<span class="mono xs muted">#${esc(a.id_approval)}</span></div>
      <div class="strong mt-8" style="line-height:19px">${esc(a.judul)}</div>
      <div class="row between mt-8 small"><span class="muted">${UI.ic('user', 'ic-sm')} ${esc(a.nama_pengaju)} • ${UI.dt(a.tgl_ajuan)}</span><b class="mono t-blue">${UI.rp(a.nominal)}</b></div></button>`).join('')
      : UI.empty(st.status === 'Menunggu' ? 'Tidak ada pengajuan menunggu' : 'Tidak ada data', '', 'inbox');
    list.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { st.sel = b.dataset.id; list.querySelectorAll('.ap-item').forEach(x => x.classList.toggle('on', x === b)); history.replaceState(null, '', '#/approval/' + encodeURIComponent(st.sel)); showDetail(); });
    el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { st.status = b.dataset.st; st.sel = ''; loadList().catch(e => UI.toast(e.message, 'error')); });
    el.querySelectorAll('[data-tipe]').forEach(b => b.onclick = () => { st.tipe = b.dataset.tipe; render(d); });
    el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => { st.q = e.target.value; render(d); const i = el.querySelector('[data-q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300));
    if (!st.sel && rows.length) st.sel = rows[0].id_approval;
    if (window.matchMedia('(max-width: 1023px)').matches) el.querySelector('#ap-grid').style.gridTemplateColumns = 'minmax(0,1fr)';
    UI.icons(el);
    showDetail();
  };
  const showDetail = async () => {
    const box = el.querySelector('#ap-detail');
    if (!st.sel) { box.innerHTML = UI.empty('Pilih pengajuan', 'Detail pengajuan tampil di sini.', 'mouse-pointer-click'); UI.icons(box); return; }
    box.innerHTML = '<div class="empty"><span class="spin"></span></div>';
    try {
      const d = await API.call('approval.detail', { id_approval: st.sel });
      const a = d.approval;
      const P = App.meta.pengaturan;
      let detail = '';
      if (a.modul === 'Keuangan' && d.keuangan) {
        const k = d.keuangan;
        detail = `<dl class="kv c4"><div><dt>Kategori</dt><dd>${esc(k.kategori)}</dd></div><div><dt>Tanggal transaksi</dt><dd>${UI.dateLong(k.tanggal)}</dd></div><div><dt>Metode</dt><dd>${esc(k.metode || '-')}</dd></div><div><dt>Kendaraan terkait</dt><dd>${d.kendaraan ? UI.plat(d.kendaraan.plat, true) + `<div class="t-sub">${esc(d.kendaraan.nama)} • ${UI.num(d.kendaraan.km_saat_ini)} km</div>` : '-'}</dd></div></dl>
          <div class="section-title mt-20">${UI.ic('align-left', 'ic-sm')} Deskripsi & justifikasi</div><div class="li" style="border-left:3px solid var(--blue)">${esc(k.deskripsi)}</div>
          ${d.servis ? `<div class="section-title mt-20">${UI.ic('wrench', 'ic-sm')} Rincian servis</div><dl class="kv c4"><div><dt>Jenis servis</dt><dd>${esc(d.servis.jenis_servis)}</dd></div><div><dt>Bengkel</dt><dd>${esc(d.servis.bengkel || '-')}</dd></div><div><dt>KM saat servis</dt><dd class="mono">${UI.num(d.servis.km_saat_servis)}</dd></div><div><dt>Biaya</dt><dd class="mono">${UI.rp(d.servis.biaya)}</dd></div></dl>` : ''}
          ${k.id_bukti_drive ? `<button class="btn btn-outline btn-sm mt-16" data-file="${esc(k.id_bukti_drive)}" aria-label="Bukti pengeluaran">${UI.ic('paperclip')} Lihat bukti / nota</button>` : '<p class="muted small mt-16">Tidak ada bukti terlampir.</p>'}`;
      } else if (a.modul === 'Diskon Sewa') {
        const x = d.sewa || {};
        detail = `<dl class="kv c4"><div><dt>No. sewa</dt><dd><a class="mono" href="#/sewa/${encodeURIComponent(a.id_referensi)}">#${esc(a.id_referensi)}</a></dd></div><div><dt>Penyewa</dt><dd>${esc(x.nama_pelanggan || '-')}</dd></div><div><dt>Kendaraan</dt><dd>${UI.plat(x.plat, true)}</dd></div><div><dt>Durasi</dt><dd>${esc(x.durasi_hari || '-')} hari</dd></div></dl>
          <div class="grid g3 mt-20" style="gap:12px"><div class="li" style="margin:0"><p>Harga normal</p><b class="mono" style="font-size:17px">${UI.rp(a.data.harga_normal)}</b></div><div class="li" style="margin:0"><p>Harga usulan</p><b class="mono t-blue" style="font-size:17px">${UI.rp(a.data.harga_usulan)}</b></div><div class="li ${a.data.harga_usulan < a.data.harga_normal ? 'amber' : ''}" style="margin:0"><p>Selisih</p><b class="mono" style="font-size:17px">${UI.rp(UI.n(a.data.harga_usulan) - UI.n(a.data.harga_normal), true)}</b></div></div>
          <div class="section-title mt-20">Alasan</div><div class="li" style="border-left:3px solid var(--blue)">${esc(a.data.alasan || '-')}</div>`;
      } else if (a.modul === 'Penggajian') {
        const rows = d.gaji || [];
        detail = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Karyawan</th><th class="r">Gaji pokok</th><th class="r">Bonus</th><th class="r">Potongan</th><th class="r">Total</th></tr></thead><tbody>
          ${rows.map(g => `<tr><td><div class="t-main">${esc(g.nama)}</div><div class="t-sub">${esc(g.jabatan)} • ${esc(g.nama_cabang)}</div></td><td class="num">${UI.rp(g.gaji_pokok)}</td><td class="num t-green">+ ${UI.rp(g.bonus)}</td><td class="num t-red">- ${UI.rp(g.potongan)}</td><td class="num"><b>${UI.rp(g.total_diterima)}</b></td></tr>`).join('')}
          </tbody><tfoot><tr><td>Total ${rows.length} karyawan</td><td></td><td></td><td></td><td class="num">${UI.rp(rows.reduce((s, g) => s + UI.n(g.total_diterima), 0))}</td></tr></tfoot></table></div>`;
      }
      const decided = a.status !== 'Menunggu';
      box.innerHTML = `<div class="card-body">
        <div class="row between wrap"><div class="row wrap">${UI.badge('#' + a.id_approval, 'navy')}${UI.badge('Tipe: ' + a.modul, 'amber')}</div>${UI.status('approval', a.status)}</div>
        <h2 style="font-size:22px;line-height:28px;font-weight:600;letter-spacing:-.015em;margin-top:12px">${esc(a.judul)}</h2>
        <dl class="kv c4 mt-16" style="padding-bottom:16px;border-bottom:1px solid var(--line-2)"><div><dt>Pemohon</dt><dd>${esc(a.nama_pengaju)}</dd></div><div><dt>Cabang</dt><dd>${esc(a.nama_cabang)}</dd></div><div><dt>Diajukan</dt><dd>${UI.dt(a.tgl_ajuan)}</dd></div><div><dt>Nilai pengajuan</dt><dd class="mono t-blue" style="font-size:17px">${UI.rp(a.nominal)}</dd></div></dl>
        <div class="mt-16">${detail}</div>
        ${a.modul === 'Keuangan' ? `<div class="callout amber mt-20">${UI.ic('shield-alert')}<div><b>Ambang wewenang pengeluaran kas.</b> Batas pengeluaran tanpa approval adalah <b class="mono">${UI.rp(P.ambang_approval)}</b>. Pengajuan ini sebesar <b class="mono">${UI.rp(a.nominal)}</b> sehingga butuh keputusan Admin/Owner.</div></div>` : ''}
      </div>
      ${decided ? `<div class="card-foot" style="background:var(--soft)"><div><b>${a.status === 'Disetujui' ? 'Disetujui' : 'Ditolak'}</b> oleh ${esc(a.nama_pemutus || '-')} • ${UI.dt(a.tgl_putusan)}${a.catatan ? `<div class="muted small mt-8">Catatan: ${esc(a.catatan)}</div>` : ''}</div></div>`
        : canA ? `<div class="card-body" style="background:var(--soft);border-top:1px solid var(--line)">
          <h3 style="font-size:16px;font-weight:600" class="row">${UI.ic('gavel', 't-blue')} Keputusan otorisasi Admin</h3>
          <div class="field mt-12"><label>Catatan keputusan (wajib bila menolak)</label><textarea class="input" id="ap-cat" rows="3" placeholder="Mis. Disetujui. Simpan faktur asli untuk rekonsiliasi bulanan."></textarea></div>
          <label class="check mt-12"><input type="checkbox" id="ap-notif" checked> Kirim notifikasi keputusan lewat email ke pemohon</label>
          <div class="grid g2 mt-16" style="gap:12px"><button class="btn btn-danger-soft btn-lg" data-dec="Ditolak">${UI.ic('x')} Tolak pengajuan</button><button class="btn btn-success btn-lg" data-dec="Disetujui">${UI.ic('circle-check')} Setujui (${UI.rp(a.nominal)})</button></div>
          <p class="muted xs mt-12 c">Persetujuan otomatis memperbarui status transaksi terkait dan tercatat di audit log.</p></div>`
          : `<div class="card-foot"><span class="muted small">${UI.ic('hourglass', 'ic-sm')} Menunggu keputusan Admin.</span></div>`}`;
      Pages._bindFiles(box);
      box.querySelectorAll('[data-dec]').forEach(b => b.onclick = async () => {
        const keputusan = b.dataset.dec;
        const catatan = box.querySelector('#ap-cat').value.trim();
        if (keputusan === 'Ditolak' && !catatan) { UI.toast('Isi catatan alasan penolakan.', 'error'); box.querySelector('#ap-cat').focus(); return; }
        UI.busy(b, true);
        try {
          await API.call('approval.decide', { id_approval: a.id_approval, keputusan, catatan, notifikasi: box.querySelector('#ap-notif').checked });
          UI.toast(keputusan === 'Disetujui' ? 'Pengajuan disetujui.' : 'Pengajuan ditolak.', 'success');
          st.sel = ''; App.refreshBadges(); loadList();
        } catch (e) { UI.busy(b, false); UI.toast(e.message, 'error'); }
      });
      UI.icons(box);
    } catch (e) { box.innerHTML = `<div class="card-body"><div class="callout red">${UI.ic('triangle-alert')}<div>${esc(e.message)}</div></div></div>`; UI.icons(box); }
  };
  await loadList();
};

// =====================================================================
// LAPORAN BULANAN & GRAFIK
// =====================================================================
Pages.laporan = async (el) => {
  const st = { bulan: UI.thisMonth(), cabang: App.cabang, q: '', tipe: '' };
  const semua = App.scope('laporan') === 'SEMUA';
  const load = async () => render(await API.call('laporan.get', { bulan: st.bulan, cabang: st.cabang }));
  const render = (d) => {
    const r = d.ringkasan, l = d.ringkasan_lalu;
    const komp = Object.entries(d.komposisi_pengeluaran).sort((a, b) => b[1] - a[1]);
    const kompTotal = komp.reduce((a, x) => a + x[1], 0);
    const colors = ['#0F2557', '#1D4ED8', '#16A34A', '#D97706', '#64748B', '#DC2626', '#7E22CE', '#0891B2'];
    const cabLabel = st.cabang ? 'Cabang ' + App.cabName(st.cabang) : (semua ? 'Konsolidasi semua cabang' : 'Cabang ' + App.user.nama_cabang);
    el.innerHTML = UI.pageHead({
      crumbs: '<span>Audit finansial & utilisasi armada</span>',
      title: 'Laporan bulanan & grafik',
      desc: 'Kinerja keuangan, perbandingan cabang, dan utilisasi armada. Hanya transaksi berstatus Disetujui yang dihitung.',
      actions: `<button class="btn btn-outline" data-print>${UI.ic('printer')} Ekspor PDF</button><button class="btn btn-outline" data-csv>${UI.ic('file-spreadsheet')} Ekspor CSV</button>`
    }) + `
    <section class="card card-pad no-print"><div class="row wrap" style="gap:16px">
      <label class="row small muted">Periode <input class="input" type="month" data-bulan value="${esc(st.bulan)}" style="width:auto"></label>
      ${semua ? `<div class="seg">${[['', 'Semua cabang (konsolidasi)']].concat(App.meta.cabang.map(c => [c.id_cabang, 'Cabang ' + c.nama_cabang])).map(c => `<button data-cab="${esc(c[0])}" class="${st.cabang === c[0] ? 'on' : ''}">${esc(c[1])}</button>`).join('')}</div>` : ''}
      <span class="muted small" style="margin-left:auto">${esc(cabLabel)} • ${esc(UI.month(d.bulan))}</span>
    </div></section>
    <div class="grid g4 kpis mt-20">
      ${UI.kpi({ label: 'Total pemasukan', icon: 'trending-up', tone: 'green', value: UI.rp(r.pemasukan), money: true, sub: UI.delta(r.pemasukan, l.pemasukan) + ' vs ' + esc(UI.month(UI.addMonths(d.bulan, -1))) })}
      ${UI.kpi({ label: 'Pengeluaran operasional', icon: 'trending-down', tone: 'red', value: UI.rp(r.pengeluaran), money: true, sub: UI.delta(r.pengeluaran, l.pengeluaran, true) + ' vs bulan lalu' })}
      ${UI.kpi({ label: 'Laba bersih operasional', icon: 'landmark', value: `<span class="${r.laba >= 0 ? 't-blue' : 't-red'}">${UI.rp(r.laba)}</span>`, money: true, sub: UI.badge('Margin ' + String(r.margin).replace('.', ',') + '%', r.laba >= 0 ? 'blue' : 'red') })}
      ${UI.kpi({ label: 'Total kontrak sewa', icon: 'key-round', tone: 'navy', value: d.sewa.jumlah, unit: 'Transaksi', sub: `Utilisasi armada ${String(d.armada.utilisasi).replace('.', ',')}% • ${d.armada.jumlah} unit`, bar: d.armada.utilisasi })}
    </div>
    <div class="grid ${d.cabang ? 'g-main' : ''} mt-20">
      <section class="card"><div class="card-head"><div><h3>Tren arus kas 6 bulan terakhir</h3><p>${esc(UI.month(UI.addMonths(d.bulan, -5)))} – ${esc(UI.month(d.bulan))}</p></div><div class="legend"><span><i style="background:#16A34A"></i>Pemasukan</span><span><i style="background:#DC2626"></i>Pengeluaran</span><span><i style="background:#1D4ED8;height:3px"></i>Laba</span></div></div>
        <div class="card-body"><div class="chart-box"><canvas id="ch-tren" aria-label="Grafik tren arus kas"></canvas></div>
        <div class="callout blue mt-12">${UI.ic('chart-line')}<div>Rata-rata laba 6 bulan: <b class="mono">${UI.rp(d.tren.reduce((a, t) => a + t.laba, 0) / 6)}</b> per bulan.</div></div></div></section>
      ${d.cabang ? `<section class="card"><div class="card-head"><div><h3>Komparasi antarcabang</h3><p>${esc(d.cabang.map(c => c.nama_cabang).join(' vs '))}</p></div>${UI.badge(UI.BULAN[+d.bulan.slice(5) - 1] + ' ' + d.bulan.slice(0, 4), 'blue')}</div>
        <div class="card-body">${[['Omzet (pemasukan)', 'pemasukan', 'rp'], ['Beban pengeluaran', 'pengeluaran', 'rp'], ['Laba bersih', 'laba', 'rp'], ['Kekuatan armada', 'armada', 'unit'], ['Utilisasi armada', 'utilisasi', 'pct']].map(m => {
          const vals = d.cabang.map(c => Math.max(0, UI.n(c[m[1]])));
          const tot = vals.reduce((a, b) => a + b, 0) || 1;
          const fmt = v => m[2] === 'rp' ? UI.rpShort(v) : m[2] === 'pct' ? String(v).replace('.', ',') + '%' : v + ' unit';
          return `<div style="margin-bottom:18px"><div class="row between small"><span>${m[0]}</span><span class="mono">${d.cabang.map((c, i) => `<span style="color:${colors[i]}">${esc(fmt(c[m[1]]))}</span>`).join(' vs ')}</span></div>
            <div class="bar mt-8" style="height:8px">${vals.map((v, i) => `<i style="width:${m[2] === 'pct' ? UI.pct(v, vals.reduce((a, b) => a + b, 0) || 1) : UI.pct(v, tot)}%;background:${colors[i]};border-radius:0"></i>`).join('')}</div></div>`;
        }).join('')}
        <div class="legend">${d.cabang.map((c, i) => `<span><i style="background:${colors[i]}"></i>${esc(c.nama_cabang)}</span>`).join('')}</div></div></section>` : ''}
    </div>
    <div class="grid g2 mt-20">
      <section class="card"><div class="card-head"><div><h3>Komposisi pengeluaran</h3><p>Total ${UI.rp(kompTotal)} • ${esc(UI.month(d.bulan))}</p></div></div>
        <div class="card-body">${komp.length ? `<div class="grid" style="grid-template-columns:200px minmax(0,1fr);gap:20px;align-items:center"><div class="chart-box sm"><canvas id="ch-komp" aria-label="Diagram komposisi pengeluaran"></canvas></div>
          <div>${komp.map((k, i) => `<div class="row between small" style="padding:7px 0;border-bottom:1px solid var(--line-2)"><span class="row"><i style="width:10px;height:10px;border-radius:3px;background:${colors[i % colors.length]};display:inline-block"></i>${esc(k[0])}</span><span class="mono r"><b>${UI.rp(k[1])}</b> <span class="muted xs">(${String(UI.pct(k[1], kompTotal)).replace('.', ',')}%)</span></span></div>`).join('')}</div></div>`
          : UI.empty('Belum ada pengeluaran disetujui', '', 'chart-pie')}</div></section>
      <section class="card"><div class="card-head"><div><h3>5 kendaraan paling produktif</h3><p>Berdasarkan hari disewa dan omzet kontrak</p></div></div>
        <div class="card-body">${d.top_kendaraan.filter(t => t.hari || t.omzet).length ? d.top_kendaraan.map((t, i) => `<div class="li"><div class="li-top"><div class="row"><span class="avatar ${i ? 'lt' : ''}" style="width:26px;height:26px;font-size:11px">${i + 1}</span><div><h4>${esc(t.nama)}</h4><p><span class="mono">${esc(t.plat)}</span> • ${String(t.hari).replace('.', ',')} hari disewa (${String(t.persen).replace('.', ',')}%)</p></div></div><b class="mono t-blue">${UI.rp(t.omzet)}</b></div><div class="bar mt-8"><i class="${i ? '' : 'navy'}" style="width:${Math.min(100, t.persen)}%"></i></div></div>`).join('')
          : UI.empty('Belum ada sewa pada periode ini', '', 'car-front')}</div></section>
    </div>
    <section class="card mt-20"><div class="card-head"><div><h3>Rincian transaksi ${esc(UI.month(d.bulan))}</h3><p>Buku besar transaksi disetujui${d.lihat_gaji ? '' : ' (tanpa rincian gaji)'}</p></div>
      <div class="seg no-print">${['', 'Pemasukan', 'Pengeluaran'].map(t => `<button data-tipe="${t}" class="${st.tipe === t ? 'on' : ''}">${t || 'Semua'} (${d.transaksi.filter(x => !t || x.tipe === t).length})</button>`).join('')}</div></div>
      <div class="filters no-print"><label class="search">${UI.ic('search')}<input class="input" data-q value="${esc(st.q)}" placeholder="Cari ID, kategori, keterangan..." aria-label="Cari transaksi"></label></div>
      <div id="tbl-lap"></div></section>`;

    UI.chart(el.querySelector('#ch-tren'), {
      data: {
        labels: d.tren.map(t => UI.BULAN[+t.bulan.slice(5) - 1]),
        datasets: [
          { type: 'line', label: 'Laba', data: d.tren.map(t => t.laba), borderColor: '#1D4ED8', backgroundColor: '#1D4ED8', tension: .3, pointRadius: 4, borderWidth: 2.5, order: 0 },
          { type: 'bar', label: 'Pemasukan', data: d.tren.map(t => t.pemasukan), backgroundColor: '#16A34A', borderRadius: 4, maxBarThickness: 22, order: 1 },
          { type: 'bar', label: 'Pengeluaran', data: d.tren.map(t => t.pengeluaran), backgroundColor: '#DC2626', borderRadius: 4, maxBarThickness: 22, order: 1 }
        ]
      },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + UI.rp(c.parsed.y) } } }, scales: { y: UI.axisRp(), x: { grid: { display: false } } } }
    });
    const komC = el.querySelector('#ch-komp');
    if (komC) UI.chart(komC, {
      type: 'doughnut',
      data: { labels: komp.map(k => k[0]), datasets: [{ data: komp.map(k => k[1]), backgroundColor: komp.map((k, i) => colors[i % colors.length]), borderWidth: 2, borderColor: '#fff' }] },
      options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.label + ': ' + UI.rp(c.parsed) } } } }
    });
    const tbl = UI.table(el.querySelector('#tbl-lap'), {
      unit: 'catatan', pageSize: 10, empty: 'Tidak ada transaksi.',
      columns: [
        { key: 'id_trx', label: 'ID transaksi', render: x => `<span class="mono t-blue small">${esc(x.id_trx)}</span>` },
        { key: 'tanggal', label: 'Tanggal', render: x => `<span class="mono">${UI.date(x.tanggal)}</span>` },
        { key: 'nama_cabang', label: 'Cabang', render: x => UI.cab(x.nama_cabang) },
        { key: 'kategori', label: 'Kategori' },
        { key: 'deskripsi', label: 'Keterangan', render: x => `<div style="max-width:360px">${esc(x.deskripsi)}</div>` },
        { key: 'tipe', label: 'Arus', align: 'center', render: x => UI.badge(x.tipe, x.tipe === 'Pemasukan' ? 'green' : 'red') },
        { key: 'nominal', label: 'Nominal', num: true, sortVal: x => UI.n(x.nominal), render: x => `<span class="${x.tipe === 'Pemasukan' ? 't-green' : 't-red'}">${x.tipe === 'Pemasukan' ? '+' : '-'}${UI.rp(x.nominal)}</span>` }
      ],
      footNote: rows => { const p = rows.filter(x => x.tipe === 'Pemasukan').reduce((a, x) => a + UI.n(x.nominal), 0), q = rows.filter(x => x.tipe === 'Pengeluaran').reduce((a, x) => a + UI.n(x.nominal), 0); return `<span>Masuk <b class="mono t-green">${UI.rp(p)}</b> • Keluar <b class="mono t-red">${UI.rp(q)}</b> • Net <b class="mono t-blue">${UI.rp(p - q, true)}</b></span>`; }
    });
    const filt = () => tbl.setRows(d.transaksi.filter(x => (!st.tipe || x.tipe === st.tipe) && UI.match(x, st.q, ['id_trx', 'kategori', 'deskripsi', 'nama_cabang'])));
    filt();
    el.querySelector('[data-q]').addEventListener('input', UI.debounce(e => { st.q = e.target.value; filt(); }, 150));
    el.querySelectorAll('[data-tipe]').forEach(b => b.onclick = () => { st.tipe = b.dataset.tipe; el.querySelectorAll('[data-tipe]').forEach(x => x.classList.toggle('on', x === b)); filt(); });
    el.querySelector('[data-bulan]').onchange = e => { if (e.target.value) { st.bulan = e.target.value; load().catch(er => UI.toast(er.message, 'error')); } };
    el.querySelectorAll('[data-cab]').forEach(b => b.onclick = () => { st.cabang = b.dataset.cab; load().catch(er => UI.toast(er.message, 'error')); });
    el.querySelector('[data-print]').onclick = () => window.print();
    el.querySelector('[data-csv]').onclick = () => {
      const head = [['Laporan Bulanan MTB Manajemen'], ['Periode', UI.month(d.bulan)], ['Cakupan', cabLabel], ['Pemasukan', r.pemasukan], ['Pengeluaran', r.pengeluaran], ['Laba bersih', r.laba], ['Margin (%)', r.margin], ['Jumlah sewa', d.sewa.jumlah], ['Utilisasi armada (%)', d.armada.utilisasi], []]
        .map(x => x.join(';')).join('\n');
      const body = UI.csv(d.transaksi, [{ label: 'ID', key: 'id_trx' }, { label: 'Tanggal', val: x => UI.date(x.tanggal) }, { label: 'Cabang', key: 'nama_cabang' }, { label: 'Tipe', key: 'tipe' }, { label: 'Kategori', key: 'kategori' }, { label: 'Keterangan', key: 'deskripsi' }, { label: 'Nominal', key: 'nominal' }]);
      UI.downloadText('﻿' + head + '\n' + body.replace(/^﻿/, ''), 'laporan_' + d.bulan + (st.cabang ? '_' + App.cabName(st.cabang) : '') + '.csv');
    };
    UI.icons(el);
  };
  await load();
};
