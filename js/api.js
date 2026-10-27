/**
 * Lapisan komunikasi ke backend Google Apps Script.
 * Semua panggilan memakai POST dengan Content-Type text/plain
 * (menghindari CORS preflight yang tidak didukung GAS).
 */
const API = {
  _busy: 0,
  get token() { try { return localStorage.getItem('mtb_token') || ''; } catch (e) { return API._mem || ''; } },
  set token(v) {
    API._mem = v;
    try { v ? localStorage.setItem('mtb_token', v) : localStorage.removeItem('mtb_token'); } catch (e) { /* mode privat */ }
  },

  async call(action, data = {}) {
    if (!CONFIG.GAS_URL || CONFIG.GAS_URL.indexOf('GANTI_DENGAN') >= 0) {
      throw new Error('URL backend belum diisi. Buka js/config.js dan isi GAS_URL dengan URL /exec Apps Script.');
    }
    API._progress(1);
    let res;
    try {
      const r = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data, token: API.token }),
        redirect: 'follow'
      });
      if (!r.ok) throw new Error('Server merespons ' + r.status);
      res = await r.json();
    } catch (err) {
      const msg = /Failed to fetch|NetworkError|Load failed/i.test(err.message)
        ? 'Tidak dapat terhubung ke server. Periksa koneksi internet atau URL backend.'
        : (err instanceof SyntaxError ? 'Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone".' : err.message);
      throw new Error(msg);
    } finally {
      API._progress(-1);
    }
    if (!res.success) {
      if (res.code === 'SESSION_EXPIRED' && action !== 'auth.login') {
        API.token = '';
        if (window.App) App.sessionExpired(res.message);
      }
      const e = new Error(res.message || 'Terjadi kesalahan.');
      e.code = res.code;
      throw e;
    }
    return res.data;
  },

  _progress(d) {
    API._busy = Math.max(0, API._busy + d);
    const el = document.getElementById('progress');
    if (el) el.classList.toggle('on', API._busy > 0);
  }
};
