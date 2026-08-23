# Catatan Modularisasi

## Yang sudah dipindah (Fase 1)

| Modul | Isi | Baris |
|---|---|---|
| `js/utils.js` | Fungsi murni: `esc`, `fmt`, `num`, `str`, `pad2`, semua fungsi tanggal, `MONTH_ORDER`, badge renderer, `normalizeSearchText`/`flexibleSearchMatch`, `normCekText`/`cekTextSimilar`/`cekAmountScore` | ~300 |
| `js/db.js` | Lapisan IndexedDB: `openDB`, `saveRowsToDB`, `loadRowsFromDB`, konstanta `DB_*` | ~80 |
| `js/excelParser.js` | `parseWorkbook` (Uang Masuk) dan `parseSalesWorkbook` (Penjualan) | ~180 |

`index.html` sekarang memuat script utamanya sebagai `<script type="module">` dan
meng-import ketiga modul di atas. Semua definisi duplikat sudah dihapus dari
`index.html`.

### Verifikasi yang sudah dilakukan
- `node --check` pada seluruh script gabungan → lolos, tidak ada syntax error.
- `utils.js`: 13 assertion test (esc, fmt, num, formatDate, monthNameFromDate,
  detectMonth, pencarian fleksibel, skor nominal Cek Data) → semua lolos.
- `excelParser.js`: dites dengan file `.xlsx` sungguhan (dibuat via openpyxl)
  memakai package `xlsx` asli — hasil parse dibandingkan field-per-field
  (faktur, toko, status, tagihan, produk, hargaBeli, dll) → identik dengan
  logika aslinya.
- Semua 32 fungsi yang dipanggil lewat atribut inline (`onclick="..."` dsb.
  pada HTML yang di-render via `innerHTML`) sudah diverifikasi terdaftar di
  `window` lewat `Object.assign(window, {...})` di akhir script — ini WAJIB
  karena `<script type="module">` tidak lagi otomatis membuat fungsi
  top-level jadi global seperti `<script>` biasa.

### Perubahan perilaku kecil yang disengaja
`saveRowsToDB` di `db.js` **tidak lagi otomatis memanggil `queueCloudSync()`**
(dulu dipanggil langsung di dalam fungsi). Ini untuk menghindari circular
import (db.js akan butuh import dari bagian cloud sync di `index.html`, yang
mana sebaliknya mengimpor dari db.js). Sebagai gantinya:
- `saveRowsToDB(rows, key, onSaved)` menerima callback opsional.
- Di `index.html` ada wrapper `saveRowsToDBAndSync(rows, key)` yang
  memanggil `saveRowsToDB(rows, key, () => queueCloudSync())`, dan semua
  13 titik pemanggilan lama sudah diarahkan ke wrapper ini.
- Perilaku end-to-end tetap sama seperti sebelumnya.

## Yang BELUM dipindah (Fase 2 — belum dikerjakan)

`ui.js`, `cek.js`, `rapikan.js` (dan bagian sales/rendering) sengaja belum
dipisah. Alasannya: bagian-bagian ini berbagi state mutable global secara
sangat erat —

```js
let allRows = [];
let salesRows = [];
let cleanRows = [];
let fakturIndexDirty, rowsByFaktur, fakturLastPayMap;
let salesFakturMapDirty, salesFakturMap;
let cekFakturCacheDirty, cekFakturCache;
```

— dengan ~39 titik *reassignment* (`allRows = ...`, bukan cuma
`allRows.push(...)`) tersebar di banyak fungsi. Import binding di ES module
itu *live* untuk pembacaan, tapi modul lain **tidak bisa** melakukan
reassignment terhadap binding yang di-import dari modul lain — hanya modul
pemilik yang boleh. Supaya `ui.js`/`cek.js`/`rapikan.js` bisa saling
mengubah `allRows` dkk., saya perlu membungkusnya jadi getter/setter
eksplisit (state.js) dan mengubah puluhan titik pemanggilan.

Ada juga isu event-wiring: sebagian besar tombol di UI memakai
`onclick="namaFungsi(...)"` inline di HTML yang di-generate lewat
`innerHTML`, bukan `addEventListener`. Memisah `cek.js`/`rapikan.js` berarti
lebih banyak lagi fungsi yang harus didaftarkan manual ke `window`, dan
risiko salah-hitung satu nama saja akan membuat tombol tertentu diam-diam
tidak berfungsi — sulit dideteksi tanpa browser sungguhan untuk klik-klik
manual (saya hanya punya lingkungan Node/CLI di sini, bukan browser).

**Rencana Fase 2 (jika mau dilanjutkan):**
1. Buat `js/state.js` — satu sumber kebenaran untuk `allRows`, `salesRows`,
   `cleanRows`, dan semua cache, diekspos lewat getter/setter, bukan `let`
   langsung.
2. Pindahkan fungsi index/cache-building (`invalidateFakturIndex`,
   `buildLastPayMap`, `rebuildSalesFakturMap`, dst.) ke `js/indexCache.js`,
   yang bergantung pada `state.js`.
3. Pindahkan rendering tabel + virtual scroll (`createVirtualTable`,
   `renderTable`, `renderSalesTable`, dst.) ke `js/ui.js`.
4. Pindahkan logika tab Cek Data (`findCekFuzzyPayment`, `buildCekFakturList`,
   `renderCekTable`, dst. — sudah agak modular karena `toDate` dkk. lokal)
   ke `js/cek.js`.
5. Pindahkan logika tab Rapikan (sudah punya konvensi `window.__rapXxx` untuk
   ekspos fungsi — pola ini bisa dipertahankan) ke `js/rapikan.js`.
6. Di setiap tahap, kumpulkan ulang daftar fungsi yang dipanggil lewat
   `onclick`/`onchange` inline dan pastikan semuanya terdaftar ke `window`.

Karena setiap tahap di atas menyentuh titik-titik yang saling terhubung dan
sulit ditest otomatis (butuh klik tombol sungguhan di browser), saya
sarankan mengerjakannya satu tab UI per sesi, lalu Anda coba langsung di
browser sebelum lanjut ke tab berikutnya — supaya kalau ada yang diam-diam
rusak, gampang dilacak.

## Cara menjalankan
File `index.html` + folder `js/` harus tetap satu folder yang sama (relative
import `./js/utils.js` dkk.). Karena browser tidak mengizinkan ES module
dimuat lewat `file://` (CORS), jalankan lewat local server, misalnya:

```bash
npx serve .
# atau
python3 -m http.server 8000
```
lalu buka `http://localhost:8000/index.html` (atau port dari `serve`).
Membuka file langsung dengan dobel-klik (`file://...`) TIDAK akan berhasil
memuat modulnya — ini satu-satunya perubahan cara pakai dibanding sebelumnya.
