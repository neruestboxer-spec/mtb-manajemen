# MTB Manajemen — Frontend

Aplikasi manajemen rental mobil MTB (cabang Samarinda & Balikpapan): armada, sewa, pelanggan, keuangan, approval, karyawan & penggajian, laporan, tugas supir, serta manajemen akun & role.

- Frontend statis (HTML/CSS/JavaScript murni) untuk GitHub Pages.
- Backend: Google Apps Script sebagai REST API JSON (berkas `.gs` dipasang terpisah di script.google.com).
- Sebelum dipublikasikan, isi `GAS_URL` di `js/config.js` dengan URL `/exec` Web App Anda.

Langkah lengkap: lihat **PANDUAN-INSTALASI.md**.

## Struktur
```
index.html
css/style.css
js/config.js            ← URL backend
js/api.js               ← komunikasi fetch ke Apps Script
js/ui.js                ← komponen tampilan (tabel, modal, grafik)
js/app.js               ← login, menu, router
js/pages-operasional.js ← dashboard, kendaraan, sewa, pelanggan
js/pages-keuangan.js    ← keuangan, karyawan & gaji, approval, laporan
js/pages-sistem.js      ← tugas supir, akun, role, pengaturan, audit, profil
```
