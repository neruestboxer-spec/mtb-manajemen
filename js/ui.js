/**
 * Komponen & utilitas antarmuka bersama.
 */
const UI = {
  BULAN: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  BULAN_PANJANG: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  HARI: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],

  // ---------------- Format ----------------
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  n(v) { const x = Number(v); return isFinite(x) ? x : 0; },
  num(v) { return Math.round(UI.n(v)).toLocaleString('id-ID'); },
  rp(v, sign) {
    const x = Math.round(UI.n(v));
    const s = 'Rp ' + Math.abs(x).toLocaleString('id-ID');
    if (sign) return (x < 0 ? '- ' : '+ ') + s;
    return x < 0 ? '- ' + s : s;
  },
  rpShort(v) {
    const x = UI.n(v);
    if (Math.abs(x) >= 1e9) return (x / 1e9).toFixed(1).replace('.', ',') + ' M';
    if (Math.abs(x) >= 1e6) return (x / 1e6).toFixed(1).replace('.', ',') + ' jt';
    if (Math.abs(x) >= 1e3) return Math.round(x / 1e3) + ' rb';
    return String(Math.round(x));
  },
  parts(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    return m ? { y: +m[1], mo: +m[2], d: +m[3], h: m[4], mi: m[5] } : null;
  },
  date(s) { const p = UI.parts(s); return p ? String(p.d).padStart(2, '0') + '/' + String(p.mo).padStart(2, '0') + '/' + p.y : '-'; },
  dateLong(s) { const p = UI.parts(s); return p ? p.d + ' ' + UI.BULAN[p.mo - 1] + ' ' + p.y : '-'; },
  dt(s) { const p = UI.parts(s); return p ? UI.dateLong(s) + (p.h ? ', ' + p.h + ':' + p.mi : '') : '-'; },
  time(s) { const p = UI.parts(s); return p && p.h ? p.h + ':' + p.mi : ''; },
  month(ym) { const m = String(ym || '').match(/^(\d{4})-(\d{2})/); return m ? UI.BULAN_PANJANG[+m[2] - 1] + ' ' + m[1] : '-'; },
  // Waktu "sekarang" di WITA dalam format yyyy-MM-ddTHH:mm
  nowWita() {
    const d = new Date(Date.now() + 8 * 3600000);
    return d.toISOString().slice(0, 16);
  },
  today() { return UI.nowWita().slice(0, 10); },
  thisMonth() { return UI.nowWita().slice(0, 7); },
  addMonths(ym, n) {
    const y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n;
    const d = new Date(Date.UTC(y, m, 1));
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  },
  initials(name) { return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); },
  pct(a, b) { return b ? Math.round(a / b * 1000) / 10 : 0; },
  sisaHari(n) {
    if (n === null || n === undefined || n === '') return '';
    if (n < 0) return `<span class="t-red xs mono">● terlambat ${Math.abs(n)} hari</span>`;
    if (n === 0) return `<span class="t-red xs mono">● hari ini</span>`;
    if (n <= 7) return `<span class="t-red xs mono">● ${n} hari lagi (kritis)</span>`;
    if (n <= 30) return `<span class="t-amber xs mono">● ${n} hari lagi</span>`;
    return `<span class="muted xs">Aman${n > 60 ? ' (>60 hari)' : ''}</span>`;
  },

  // ---------------- Elemen kecil ----------------
  ic(name, cls) { return `<i data-lucide="${name}" class="ic ${cls || ''}"></i>`; },
  icons(root) {
    if (window.lucide && lucide.createIcons) {
      try { lucide.createIcons({ icons: lucide.icons, attrs: { 'stroke-width': 2 }, nameAttr: 'data-lucide', root: root || document }); }
      catch (e) { try { lucide.createIcons(); } catch (e2) { /* ikon opsional */ } }
    }
  },
  badge(text, tone, dot) { return `<span class="badge ${tone || ''} ${dot ? 'dot' : ''}">${UI.esc(text)}</span>`; },
  plat(p, sm) { return p ? `<span class="plat ${sm ? 'sm' : ''}">${UI.esc(p)}</span>` : '-'; },
  cab(name) { return name ? `<span class="cab">${UI.esc(name)}</span>` : '-'; },
  delta(cur, prev, invert) {
    if (!prev) return cur ? '<span class="delta flat">baru</span>' : '';
    const d = Math.round((cur - prev) / prev * 1000) / 10;
    const good = invert ? d <= 0 : d >= 0;
    return `<span class="delta ${d === 0 ? 'flat' : good ? 'up' : 'down'}">${d > 0 ? '↑' : d < 0 ? '↓' : ''} ${Math.abs(d).toString().replace('.', ',')}%</span>`;
  },
  status(kind, v) {
    const map = {
      kendaraan: { Tersedia: 'green', Disewa: 'blue', Servis: 'red', Nonaktif: '' },
      sewa: { Aktif: 'blue', Selesai: 'green', Dibatalkan: '' },
      bayar: { Lunas: 'green', DP: 'amber', 'Belum Bayar': 'red' },
      approval: { Disetujui: 'green', Menunggu: 'amber', Ditolak: 'red', Dibatalkan: '' },
      gaji: { Draft: '', Diajukan: 'amber', Disetujui: 'green', Dibayar: 'blue' },
      denda: { Lunas: 'green', 'Belum Bayar': 'red' },
      akun: { Aktif: 'green', Nonaktif: '' }
    };
    const label = kind === 'gaji' && v === 'Diajukan' ? 'Menunggu Approval' : v;
    return UI.badge(label || '-', (map[kind] || {})[v] || '', true);
  },
  opts(list, valKey, labelKey, selected, placeholder) {
    let h = placeholder !== undefined ? `<option value="">${UI.esc(placeholder)}</option>` : '';
    (list || []).forEach(it => {
      const v = typeof it === 'object' ? it[valKey] : it;
      const l = typeof it === 'object' ? (typeof labelKey === 'function' ? labelKey(it) : it[labelKey]) : it;
      h += `<option value="${UI.esc(v)}" ${String(v) === String(selected == null ? '' : selected) ? 'selected' : ''}>${UI.esc(l)}</option>`;
    });
    return h;
  },
  empty(title, text, icon) {
    return `<div class="empty">${UI.ic(icon || 'inbox')}<b>${UI.esc(title)}</b>${text ? `<div class="small">${UI.esc(text)}</div>` : ''}</div>`;
  },
  skeleton(rows) {
    let h = '<div class="card card-pad">';
    for (let i = 0; i < (rows || 5); i++) h += `<div class="skel" style="height:${i ? 18 : 28}px;margin:${i ? 12 : 0}px 0 0;width:${i ? 60 + (i * 13) % 40 : 40}%"></div>`;
    return h + '</div>';
  },
  errorBox(el, err, retry) {
    el.innerHTML = `<div class="card err-box">${UI.ic('triangle-alert', 'ic-lg t-red')}<p class="strong mt-8">Data gagal dimuat</p><p class="muted small mt-8">${UI.esc(err.message || err)}</p>${retry ? '<button class="btn btn-outline mt-16" data-retry>' + UI.ic('refresh-cw') + ' Muat ulang</button>' : ''}</div>`;
    UI.icons(el);
    if (retry) el.querySelector('[data-retry]').onclick = retry;
  },
  pageHead({ crumbs, title, badge, desc, actions }) {
    return `<div class="page-head"><div>${crumbs ? `<div class="crumbs">${crumbs}</div>` : ''}<h1>${title}${badge || ''}</h1>${desc ? `<p class="desc">${desc}</p>` : ''}</div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</div>`;
  },
  kpi({ label, value, unit, sub, icon, tone, bar, barTone, money, extra, dark }) {
    return `<div class="card kpi ${dark ? 'dark' : ''}"><div class="kpi-top"><div class="kpi-label">${label}${extra || ''}</div>${icon ? `<div class="kpi-icon ${tone || ''}">${UI.ic(icon, 'ic-lg')}</div>` : ''}</div>
      <div class="kpi-value ${money ? 'money' : ''}">${value}${unit ? `<small>${unit}</small>` : ''}</div>${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
      ${bar !== undefined ? `<div class="bar"><i class="${barTone || ''}" style="width:${Math.max(0, Math.min(100, bar))}%"></i></div>` : ''}</div>`;
  },

  // ---------------- Notifikasi ----------------
  toast(msg, type) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.setAttribute('role', 'status');
    el.innerHTML = UI.ic(type === 'error' ? 'circle-x' : type === 'success' ? 'circle-check' : 'info') + `<div>${UI.esc(msg)}</div>`;
    root.appendChild(el);
    UI.icons(el);
    setTimeout(() => el.remove(), type === 'error' ? 6000 : 3500);
  },

  modal({ title, sub, body, footer, size, onClose }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal modal-${size || 'md'}" role="dialog" aria-modal="true" aria-label="${UI.esc(title)}">
      <div class="modal-head"><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button type="button" class="btn-icon" data-close aria-label="Tutup">${UI.ic('x')}</button></div>
      <div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div>`;
    document.getElementById('modal-root').appendChild(wrap);
    let closed = false;
    const esc = e => { if (e.key === 'Escape') close(); };
    const close = () => { if (closed) return; closed = true; wrap.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); };
    wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
    wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', esc);
    UI.icons(wrap);
    UI.bindDrops(wrap);
    const first = wrap.querySelector('input:not([type=hidden]):not([type=file]),select,textarea');
    if (first) setTimeout(() => first.focus(), 50);
    return { el: wrap, close, q: s => wrap.querySelector(s), qa: s => wrap.querySelectorAll(s) };
  },

  // Dialog konfirmasi; jika input=true mengembalikan teks (alasan), selain itu true/false
  confirm({ title, message, ok, danger, input, inputLabel, inputValue, inputType, required }) {
    return new Promise(resolve => {
      let done = false;
      const field = inputType ? `<input class="input" data-in type="${inputType}" value="${UI.esc(inputValue || '')}">` : `<textarea class="input" data-in rows="3">${UI.esc(inputValue || '')}</textarea>`;
      const m = UI.modal({
        title, size: 'sm',
        body: `<p class="small" style="line-height:20px">${message || ''}</p>${input ? `<div class="field mt-16"><label>${UI.esc(inputLabel || 'Catatan')}${required ? ' <span class="req">*</span>' : ''}</label>${field}</div>` : ''}`,
        footer: `<button class="btn btn-outline" data-close>Batal</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${UI.esc(ok || 'Lanjutkan')}</button>`,
        onClose: () => { if (!done) resolve(input ? null : false); }
      });
      m.q('[data-ok]').onclick = () => {
        const v = input ? m.q('[data-in]').value.trim() : true;
        if (input && required && !v) { UI.toast((inputLabel || 'Catatan') + ' wajib diisi.', 'error'); return; }
        done = true; m.close(); resolve(v);
      };
    });
  },

  busy(btn, on, text) {
    if (!btn) return;
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span> ${UI.esc(text || 'Memproses...')}`; }
    else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; UI.icons(btn); }
  },

  // ---------------- Form & berkas ----------------
  formData(form) {
    const o = {};
    form.querySelectorAll('input[name],select[name],textarea[name]').forEach(el => {
      if (el.type === 'file') return;
      if (el.type === 'checkbox') { o[el.name] = el.checked; return; }
      if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; return; }
      o[el.name] = el.value.trim();
    });
    return o;
  },
  fileField(name, label, hint) {
    return `<div class="field"><span class="lbl">${UI.esc(label)}</span><label class="drop">${UI.ic('cloud-upload', 'ic-lg')}<input type="file" name="${name}" accept="image/jpeg,image/png,application/pdf"><span class="drop-txt">Klik atau tarik berkas ke sini</span><span class="xs">${UI.esc(hint || 'JPG, PNG, atau PDF (maks. 5 MB)')}</span></label></div>`;
  },
  bindDrops(root) {
    root.querySelectorAll('.drop').forEach(d => {
      if (d.dataset.bound) return;
      d.dataset.bound = '1';
      const inp = d.querySelector('input[type=file]');
      const txt = d.querySelector('.drop-txt');
      const show = () => { const f = inp.files[0]; d.classList.toggle('has', !!f); txt.textContent = f ? f.name + ' (' + Math.round(f.size / 1024) + ' KB)' : 'Klik atau tarik berkas ke sini'; };
      inp.addEventListener('change', show);
      d.addEventListener('dragover', e => { e.preventDefault(); d.classList.add('drag'); });
      d.addEventListener('dragleave', () => d.classList.remove('drag'));
      d.addEventListener('drop', e => { e.preventDefault(); d.classList.remove('drag'); if (e.dataTransfer.files.length) { inp.files = e.dataTransfer.files; show(); } });
    });
  },
  async collectFiles(form) {
    const out = {};
    for (const inp of form.querySelectorAll('input[type=file][name]')) {
      if (inp.files && inp.files[0]) out[inp.name] = await UI.readFile(inp.files[0]);
    }
    return out;
  },
  async readFile(file) {
    const ok = ['image/jpeg', 'image/png', 'application/pdf'];
    if (ok.indexOf(file.type) < 0) throw new Error('Format berkas "' + file.name + '" harus JPG, PNG, atau PDF.');
    let blob = file;
    if (file.type !== 'application/pdf') {
      try { blob = await UI.compressImage(file); } catch (e) { blob = file; }
    }
    if (blob.size > 5 * 1024 * 1024) throw new Error('Ukuran berkas "' + file.name + '" melebihi 5 MB.');
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = () => rej(new Error('Gagal membaca berkas.'));
      r.readAsDataURL(blob);
    });
    return { base64: b64, mimeType: blob.type || file.type, name: file.name };
  },
  // Kompres gambar di browser (maks. sisi 1600px, JPEG 82%) sebelum diunggah
  compressImage(file, max = 1600, q = 0.82) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 600 * 1024) { resolve(file); return; }
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => (b && b.size < file.size ? resolve(b) : resolve(file)), 'image/jpeg', q);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak valid.')); };
      img.src = url;
    });
  },
  b64Blob(b64, mime) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  },
  download(b64, name, mime) {
    const url = URL.createObjectURL(UI.b64Blob(b64, mime));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },
  downloadText(text, name, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime || 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },
  csv(rows, cols) {
    const q = v => { const s = String(v == null ? '' : v); return /[";\n,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + [cols.map(c => q(c.label)).join(';')].concat(rows.map(r => cols.map(c => q(typeof c.val === 'function' ? c.val(r) : r[c.key])).join(';'))).join('\n');
  },
  // Pratinjau berkas Drive (diambil lewat API dengan otorisasi role)
  async openFile(id, title) {
    if (!id) return;
    const m = UI.modal({ title: title || 'Pratinjau berkas', size: 'lg', body: '<div class="empty"><span class="spin"></span><div class="mt-8">Memuat berkas...</div></div>' });
    try {
      const f = await API.call('file.get', { id });
      UI.showBlob(m, f.base64, f.mimeType, f.name);
    } catch (e) { m.q('.modal-body').innerHTML = `<div class="callout red">${UI.ic('triangle-alert')}<div>${UI.esc(e.message)}</div></div>`; UI.icons(m.el); }
  },
  showBlob(m, b64, mime, name) {
    const url = URL.createObjectURL(UI.b64Blob(b64, mime));
    const isImg = /^image\//.test(mime);
    m.q('.modal-body').innerHTML = (isImg ? `<img class="preview-img" src="${url}" alt="${UI.esc(name)}">` : `<iframe class="preview-frame" src="${url}" title="${UI.esc(name)}"></iframe>`) +
      `<div class="row mt-12 between"><span class="muted small">${UI.esc(name)}</span><a class="btn btn-primary btn-sm" href="${url}" download="${UI.esc(name)}">${UI.ic('download')} Unduh</a></div>`;
    UI.icons(m.el);
  },
  async pdfAction(action, data, title) {
    const m = UI.modal({ title: title || 'Dokumen PDF', size: 'lg', body: '<div class="empty"><span class="spin"></span><div class="mt-8">Menyiapkan PDF...</div></div>' });
    try {
      const r = await API.call(action, data);
      UI.showBlob(m, r.base64, r.mimeType || 'application/pdf', r.fileName);
      if (r.terkirim) UI.toast('PDF berhasil dikirim lewat email.', 'success');
      return r;
    } catch (e) { m.close(); UI.toast(e.message, 'error'); return null; }
  },

  // ---------------- Tabel: urut, halaman, klik baris ----------------
  table(el, opt) {
    const st = { page: 1, sortKey: opt.sortKey || '', dir: opt.sortDir || 'asc', size: opt.pageSize || 10 };
    let rows = opt.rows || [];
    const cols = opt.columns;
    const render = () => {
      let data = rows.slice();
      if (st.sortKey) {
        const col = cols.find(c => c.key === st.sortKey) || {};
        const get = col.sortVal || (r => r[st.sortKey]);
        data.sort((a, b) => {
          const x = get(a), y = get(b);
          const r = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), 'id', { numeric: true });
          return st.dir === 'asc' ? r : -r;
        });
      }
      const pages = Math.max(1, Math.ceil(data.length / st.size));
      st.page = Math.min(st.page, pages);
      const from = (st.page - 1) * st.size;
      const slice = data.slice(from, from + st.size);
      const cls = c => [c.align === 'right' ? 'r' : '', c.align === 'center' ? 'c' : '', c.num ? 'num' : '', c.cls || ''].join(' ');
      const head = cols.map(c => `<th class="${c.align === 'right' || c.num ? 'r' : ''} ${c.align === 'center' ? 'c' : ''} ${c.key && c.sort !== false ? 'sortable' : ''}" data-k="${c.key || ''}" ${c.width ? `style="width:${c.width}"` : ''}>${c.label}${st.sortKey === c.key && c.key ? (st.dir === 'asc' ? ' ↑' : ' ↓') : ''}</th>`).join('');
      const body = slice.length ? slice.map((r, i) => `<tr data-i="${i}" class="${opt.onRow ? 'clickable' : ''} ${opt.rowClass ? opt.rowClass(r) : ''}">${cols.map(c => `<td class="${cls(c)}">${c.render ? c.render(r) : UI.esc(r[c.key] == null || r[c.key] === '' ? '-' : r[c.key])}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${cols.length}" class="empty-row">${opt.empty || 'Belum ada data.'}</td></tr>`;
      let pager = '';
      if (pages > 1) {
        const nums = [];
        for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - st.page) <= 1) nums.push(p);
        let last = 0;
        pager = `<div class="pager"><button data-p="${st.page - 1}" ${st.page === 1 ? 'disabled' : ''} aria-label="Sebelumnya">‹</button>` +
          nums.map(p => { const gap = p - last > 1 ? '<span class="faint">…</span>' : ''; last = p; return gap + `<button data-p="${p}" class="${p === st.page ? 'on' : ''}">${p}</button>`; }).join('') +
          `<button data-p="${st.page + 1}" ${st.page === pages ? 'disabled' : ''} aria-label="Berikutnya">›</button></div>`;
      }
      el.innerHTML = `<div class="tbl-wrap"><table class="tbl ${opt.cls || ''}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${opt.footer && data.length ? `<tfoot>${opt.footer(data)}</tfoot>` : ''}</table></div>` +
        (opt.noFoot ? '' : `<div class="tbl-foot"><span>Menampilkan <b>${data.length ? from + 1 : 0}–${from + slice.length}</b> dari <b>${data.length}</b> ${opt.unit || 'data'}</span>${opt.footNote ? opt.footNote(data) : ''}${pager}</div>`);
      el.querySelectorAll('th.sortable').forEach(th => th.onclick = () => {
        const k = th.dataset.k;
        if (st.sortKey === k) st.dir = st.dir === 'asc' ? 'desc' : 'asc'; else { st.sortKey = k; st.dir = 'asc'; }
        render();
      });
      el.querySelectorAll('.pager button[data-p]').forEach(b => b.onclick = () => { st.page = +b.dataset.p; render(); });
      if (opt.onRow) el.querySelectorAll('tbody tr[data-i]').forEach(tr => tr.addEventListener('click', e => {
        if (e.target.closest('button,a,input,select,label')) return;
        opt.onRow(slice[+tr.dataset.i]);
      }));
      if (opt.bind) opt.bind(el, slice);
      UI.icons(el);
    };
    render();
    return { render, setRows(r) { rows = r; st.page = 1; render(); }, get rows() { return rows; } };
  },

  // ---------------- Grafik (Chart.js) ----------------
  chart(canvas, config) {
    if (!window.Chart) { canvas.parentNode.innerHTML = UI.empty('Grafik tidak dapat dimuat', 'Periksa koneksi internet (Chart.js).', 'chart-line'); return null; }
    if (canvas._chart) canvas._chart.destroy();
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = '#64748B';
    canvas._chart = new Chart(canvas, config);
    return canvas._chart;
  },
  axisRp() { return { beginAtZero: true, suggestedMax: 1000000, ticks: { callback: v => UI.rpShort(v), maxTicksLimit: 6, precision: 0 }, grid: { color: '#F1F5F9' }, border: { display: false } }; },

  debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 250); }; },
  match(r, q, keys) { if (!q) return true; q = q.toLowerCase(); return keys.some(k => String(r[k] == null ? '' : r[k]).toLowerCase().indexOf(q) >= 0); }
};
