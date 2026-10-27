# Panduan Instalasi — MTB Manajemen

Aplikasi terdiri dari dua bagian yang dipasang terpisah:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** | `Kode.gs`, `Modul.gs`, `Otomasi.gs`, `appsscript.json` | Google Apps Script (akun Google pemilik usaha) |
| **Frontend** | folder `mtb-manajemen/` (berisi `index.html`, `css/`, `js/`) | GitHub Pages |

Kerjakan **Bagian A dulu**, karena URL backend dibutuhkan di Bagian B.

---

## Bagian A — Backend (Google Apps Script)

### A1. Buat proyek
1. Login ke akun Google yang akan menjadi pemilik data (disarankan akun khusus usaha).
2. Buka https://script.google.com → **Proyek baru**.
3. Klik judul "Proyek tanpa judul" → ganti menjadi **MTB Manajemen API**.

### A2. Tempel 3 berkas kode
1. Berkas `Code.gs` yang sudah ada → ganti namanya menjadi **Kode** → hapus isinya → tempel seluruh isi **Kode.gs**.
2. Klik **+** di samping "Files" → **Script** → beri nama **Modul** → tempel isi **Modul.gs**.
3. Ulangi: buat script **Otomasi** → tempel isi **Otomasi.gs**.
4. Tekan **Ctrl+S** (simpan).

### A3. Atur appsscript.json (zona waktu WITA)
1. Klik ikon ⚙️ **Project Settings** (kiri).
2. Centang **Show "appsscript.json" manifest file in editor**.
3. Kembali ke Editor, buka `appsscript.json`, ganti seluruh isinya dengan isi **appsscript.json** yang diberikan, lalu simpan.

### A4. Jalankan setup (SEKALI saja)
1. Di bilah atas, pilih fungsi **setupAppEnvironment** → klik **▶ Run**.
2. Muncul "Authorization required" → **Review permissions** → pilih akun Anda → **Advanced** → **Go to MTB Manajemen API (unsafe)** → **Allow**.
   (Peringatan "unsafe" normal untuk skrip buatan sendiri.)
3. Buka **Execution log** di bawah. Anda akan melihat:
   ```
   🔑 Login Admin   → username: admin   password: Mtb.......
   ```
   **Catat password ini** — hanya tampil sekali. Segera ganti setelah login pertama (menu profil → Profil & ganti password).
4. Cek Google Drive: ada folder **MTB Manajemen** berisi spreadsheet database dan subfolder Kendaraan, Pelanggan, Bukti Bayar, dst.

> ⚠️ Jangan jalankan `setupAppEnvironment` dua kali. Bila dijalankan ulang, fungsi ini menolak dan hanya menampilkan lokasi spreadsheet.
> Lupa password admin? Jalankan fungsi **resetPasswordAdmin** → password baru muncul di log.

**Opsional — data contoh untuk uji coba:** jalankan **isiDataContoh** sekali. Ini menambah 6 kendaraan, 3 pelanggan, 3 karyawan, serta akun `staf.smd` (Staf Samarinda) dan `supir.bpp` (Supir Balikpapan); password keduanya muncul di log. Lewati langkah ini bila langsung memakai data asli.

### A5. Deploy sebagai Web App
1. Kanan atas: **Deploy → New deployment**.
2. Ikon ⚙️ di samping "Select type" → **Web app**.
3. Isi:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy** → salin **Web app URL** (berakhiran `/exec`).
5. Uji: buka URL itu di browser. Harus tampil:
   `{"success":true,"app":"MTB Manajemen","message":"API MTB Manajemen aktif.", ...}`

> "Anyone" diperlukan karena login memakai username/password aplikasi sendiri. Semua data tetap dilindungi: setiap permintaan diperiksa token sesi dan izin role **di server**.

---

## Bagian B — Frontend (GitHub Pages)

### B1. Isi URL backend
Ekstrak ZIP. Buka `mtb-manajemen/js/config.js` dengan Notepad, ganti baris:
```js
GAS_URL: 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT/exec',
```
dengan URL `/exec` dari langkah A5. Simpan.

### B2. Push ke GitHub
Folder yang di-`git init` adalah **`mtb-manajemen`** — folder yang langsung berisi `index.html`. Bukan folder di atasnya.

1. Install Git (https://git-scm.com/download/win), lalu buka **PowerShell**.
2. Sekali saja per komputer:
   ```
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   ```
3. Di github.com: **+ → New repository** → nama mis. `mtb-manajemen` → **Public** → JANGAN centang README → **Create repository**.
4. Masuk ke folder frontend dan pastikan isinya benar:
   ```
   cd "C:\Users\NAMA\Downloads\mtb-manajemen"
   dir
   ```
   Wajib terlihat `index.html`, `css`, `js`. Kalau belum, Anda di folder yang salah — jangan lanjut.
5. Jalankan satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/mtb-manajemen.git
   git push -u origin main
   ```
   Saat diminta password, tempel **Personal Access Token** (bukan password GitHub). Buat di https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo**. Saat menempel token, layar memang tidak menampilkan apa-apa — itu normal, tekan Enter.

### B3. Aktifkan Pages
Repository → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **(root)** → **Save**. Centang **Enforce HTTPS**.
Tunggu 1–2 menit, situs tersedia di `https://USERNAME.github.io/mtb-manajemen/`.

---

## Bagian C — Uji setelah online

1. Buka situs → login `admin` dengan password dari log → ganti password.
2. **Pengaturan**: isi nama perusahaan, alamat, kontak (muncul di kwitansi & slip gaji), email notifikasi, ambang approval (default Rp1.000.000).
3. **Manajemen Akun**: buat akun Staf dan Supir untuk tiap cabang.
4. **Kendaraan → Tambah Kendaraan**, lalu **Sewa → Sewa Baru**. Pastikan status kendaraan berubah menjadi Disewa.
5. Login sebagai Staf di jendela Incognito: pastikan hanya data cabangnya yang tampil dan menu Admin tidak ada.
6. Catat pengeluaran > Rp1.000.000 sebagai Staf → muncul di **Approval** Admin.

## Otomatisasi yang sudah terpasang
- **Pengingat pajak/STNK/servis**: setiap hari pukul 07.00 WITA, satu email ringkasan. Tiap jatuh tempo diingatkan sekali saat memasuki ambang 30/14/7 hari (bisa diubah di Pengaturan), pada hari-H, lalu seminggu sekali bila terlewat.
- **Backup spreadsheet**: setiap Minggu 02.00 WITA ke folder Drive *MTB Manajemen/Backup* (8 cadangan terakhir disimpan).
- Bila trigger hilang, jalankan fungsi **pasangTrigger** dari editor.

## Cara memperbarui
- **Kode backend berubah:** tempel kode baru → **Deploy → Manage deployments** → ikon ✏️ → Version: **New version** → **Deploy**. URL tetap sama, frontend tidak perlu diubah. (Jangan pakai "New deployment" — itu membuat URL baru.)
- **Frontend berubah:** dari folder `mtb-manajemen`:
  ```
  git add .
  git commit -m "Update"
  git push
  ```
  Bila tampilan masih lama, tekan **Ctrl+Shift+R**.

## Masalah umum
| Gejala | Penyebab & solusi |
|---|---|
| "URL backend belum diisi" | `js/config.js` belum diisi URL `/exec` (B1). |
| "Respons server tidak valid" | Web App belum di-deploy dengan *Who has access: Anyone*, atau URL yang disalin adalah URL `/dev`. |
| "Backend belum di-setup" | `setupAppEnvironment` belum dijalankan (A4). |
| Situs 404 di GitHub Pages | `git init` dijalankan di folder yang salah — pastikan `index.html` terlihat di halaman utama repository. |
| Tampilan polos tanpa warna | Folder `css/` atau `js/` tidak ikut ter-push; selalu push lewat terminal, bukan "Upload files" di web. |
| Email tidak terkirim | Kuota harian Gmail biasa ±100 email/hari; cek di Pengaturan bahwa `email_notifikasi` terisi. |
| Lupa password admin | Jalankan `resetPasswordAdmin` di editor Apps Script. |
