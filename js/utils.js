// ====================================================================
//  utils.js — Fungsi bantu murni (tidak menyentuh DOM / state global)
// ====================================================================

/**
 * Escape karakter HTML berbahaya agar aman disisipkan ke innerHTML.
 * @param {*} s Nilai apa pun, akan dikonversi ke string.
 * @returns {string} String yang sudah di-escape.
 */
export function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Format angka ke format ribuan Indonesia. Nilai 0/null/undefined -> '—'.
 * @param {number|null|undefined} n
 * @returns {string}
 */
export function fmt(n) {
    return (n == null || n === 0) ? '—' : n.toLocaleString('id-ID');
}

/**
 * Konversi nilai apa pun menjadi angka. Mendukung string dengan koma ribuan.
 * @param {*} v
 * @returns {number} 0 jika tidak bisa di-parse.
 */
export function num(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}

/**
 * Konversi nilai apa pun menjadi string yang sudah di-trim.
 * @param {*} v
 * @returns {string}
 */
export function str(v) {
    return v == null ? '' : String(v).trim();
}

/**
 * Padding angka menjadi 2 digit (mis. 5 -> "05").
 * @param {number} n
 * @returns {string}
 */
export function pad2(n) {
    return String(n).padStart(2, '0');
}

/**
 * Format objek Date menjadi "DD/MM/YYYY".
 * @param {Date} d
 * @returns {string} String kosong jika d bukan Date valid.
 */
export function formatDate(d) {
    if (!(d instanceof Date) || isNaN(d)) return '';
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
}

/**
 * Bangun kunci angka untuk pengurutan tanggal (YYYYMMDD), dengan fallback
 * membaca pola tanggal dari nama sheet jika dateStr tidak mengandung tanggal.
 * @param {string} dateStr
 * @param {string} sheet
 * @returns {number}
 */
export function dateSortKey(dateStr, sheet) {
    const m = String(dateStr).match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (m) {
        const y = m[3] ? parseInt(m[3]) : 2026;
        return y * 10000 + parseInt(m[2]) * 100 + parseInt(m[1]);
    }
    const s = String(sheet).match(/(\d{1,2})-(\d{1,2})/);
    if (s) return 2026 * 10000 + parseInt(s[2]) * 100 + parseInt(s[1]);
    return 0;
}

/**
 * Parse berbagai format tanggal penjualan (Date, "DD/MM/YYYY", "DD-MM-YY", dll)
 * menjadi objek Date.
 * @param {*} s
 * @returns {Date|null}
 */
export function parseSalesDate(s) {
    if (!s) return null;
    if (s instanceof Date && !isNaN(s)) return s;
    const str = String(s).trim();
    let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) {
        let d = parseInt(m[1], 10),
            mo = parseInt(m[2], 10) - 1,
            y = parseInt(m[3], 10);
        if (y < 100) y += 2000;
        const dt = new Date(y, mo, d);
        return isNaN(dt) ? null : dt;
    }
    const dt = new Date(str);
    return isNaN(dt) ? null : dt;
}

/**
 * Tambah n hari ke tanggal d (tanpa mengubah d).
 * @param {Date} d
 * @param {number} n
 * @returns {Date}
 */
export function addDays(d, n) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
}

/**
 * Hitung selisih hari (b - a) dalam satuan hari penuh, berbasis UTC agar
 * tidak terpengaruh perubahan DST.
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
export function daysBetween(a, b) {
    const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
        Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    return Math.floor(ms / 86400000);
}

/**
 * Format tanggal untuk tampilan ID, mengembalikan '—' jika tidak valid.
 * @param {Date} d
 * @returns {string}
 */
export function fmtDateID(d) {
    if (!d || isNaN(d)) return '—';
    return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
}

/** Urutan nama bulan (index 0 = Januari) dipakai di seluruh aplikasi. */
export const MONTH_ORDER = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober',
    'November', 'Desember', 'Lainnya'
];

/**
 * Ambil nama bulan (Indonesia) dari objek Date.
 * @param {Date} d
 * @returns {string}
 */
export function monthNameFromDate(d) {
    if (!d || isNaN(d)) return 'Lainnya';
    return MONTH_ORDER[d.getMonth()] || 'Lainnya';
}

/**
 * Nama bulan kalender saat ini (dipakai sebagai bulan default aplikasi).
 * @returns {string}
 */
export function currentMonthName() {
    return MONTH_ORDER[new Date().getMonth()] || 'Lainnya';
}

/**
 * Tentukan bulan yang sebaiknya dipilih otomatis: bulan kalender saat ini
 * jika tersedia di data, jika tidak gunakan bulan terbaru dari data.
 * @param {string[]} months
 * @returns {string|null}
 */
export function preferredMonth(months) {
    const list = Array.isArray(months) ? months.filter(Boolean) : [];
    const now = currentMonthName();
    if (list.includes(now)) return now;
    const ordered = [...new Set(list)].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
    return ordered.length ? ordered[ordered.length - 1] : null;
}

/**
 * Deteksi nama bulan dari nama sheet dan/atau label tanggal.
 * @param {string} sheetName
 * @param {string} dateLabel
 * @returns {string|null}
 */
export function detectMonth(sheetName, dateLabel) {
    const src = (dateLabel + ' ' + sheetName).toUpperCase();
    let m = src.match(/\/(\d{1,2})\/(\d{4})/);
    if (m) return MONTH_ORDER[parseInt(m[1], 10) - 1] || null;
    m = src.match(/(\d{1,2})-(\d{2})/);
    if (m) return MONTH_ORDER[parseInt(m[2], 10) - 1] || null;
    for (const [k, v] of Object.entries(MONTH_ORDER)) {
        if (src.includes(k) && k.length > 2) return v;
    }
    return null;
}

/**
 * Render badge status HTML untuk baris Uang Masuk.
 * @param {string} s
 * @returns {string} HTML badge.
 */
export function statusBadge(s) {
    if (s === 'LUNAS') return '<span class="badge badge-lunas">LUNAS</span>';
    if (s === 'TITIP') return '<span class="badge badge-titip">TITIP</span>';
    if (s === 'TF') return '<span class="badge badge-tf">TF</span>';
    if (s === 'RETUR') return '<span class="badge badge-retur">RETUR</span>';
    return '<span class="muted">' + esc(s) + '</span>';
}

/**
 * Render badge section (PIUTANG / DROPPING).
 * @param {string} s
 * @returns {string} HTML badge.
 */
export function sectionBadge(s) {
    return '<span class="badge badge-section">' + (s === 'PIUTANG TEMPO' ? 'PIUTANG' : 'DROPPING') + '</span>';
}

/**
 * Render badge status untuk tab Cek Data (Lunas/Overdue/Titip/Belum Jatuh Tempo).
 * @param {object|string} rOrSt Baris cek atau string status langsung.
 * @returns {string} HTML badge.
 */
export function statusBadgeCek(rOrSt) {
    const st = (rOrSt && typeof rOrSt === 'object') ? rOrSt.statusCek : rOrSt;
    const umur = (rOrSt && typeof rOrSt === 'object') ? (rOrSt.umurOverdue || 0) : 0;
    if (st === 'Lunas') return '<span class="badge badge-lunas">LUNAS</span>';
    if (st === 'Overdue') return '<span class="badge badge-retur">OVERDUE ' + umur + ' hr</span>';
    if (st === 'Titip') return '<span class="badge badge-titip">TITIP</span>';
    if (st === 'Belum Jatuh Tempo') return '<span class="badge badge-tf">BELUM JT</span>';
    return '<span class="badge badge-section">' + esc(st || '') + '</span>';
}

/**
 * Normalisasi teks pencarian: lowercase, hilangkan diakritik & pemisah,
 * rapikan spasi ganda.
 * @param {*} v
 * @returns {string}
 */
export function normalizeSearchText(v) {
    return String(v == null ? '' : v)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[\/\\,;|:_\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Cocokkan query multi-kata terhadap kumpulan field secara fleksibel:
 * setiap kata pada query harus ditemukan di SALAH SATU field (bisa beda
 * field untuk tiap kata), sehingga "RAJU KARANGSAMBUNG" bisa cocok walau
 * "RAJU" ada di kolom SALES dan "KARANGSAMBUNG" ada di kolom ALAMAT.
 * @param {string} query
 * @param {Array<*>} fields
 * @returns {boolean}
 */
export function flexibleSearchMatch(query, fields) {
    const q = normalizeSearchText(query);
    if (!q) return true;
    const fieldValues = (fields || [])
        .filter(v => v != null && String(v).trim() !== '')
        .map(v => normalizeSearchText(v));
    const tokens = q.split(' ').filter(Boolean);
    return tokens.every(token =>
        fieldValues.some(field => field.includes(token))
    );
}

/**
 * Normalisasi teks untuk pencocokan fuzzy di tab Cek Data (huruf kecil,
 * hanya alfanumerik).
 * @param {*} v
 * @returns {string}
 */
export function normCekText(v) {
    return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

/**
 * Bandingkan dua teks apakah "mirip" (sama persis atau salah satu substring
 * dari yang lain) setelah dinormalisasi.
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function cekTextSimilar(a, b) {
    a = normCekText(a);
    b = normCekText(b);
    if (!a || !b) return false;
    return a === b || a.includes(b) || b.includes(a);
}

/**
 * Skor kecocokan nominal pembayaran vs tagihan (0-4) untuk fuzzy matching
 * di tab Cek Data. Semakin tinggi skor semakin yakin cocok.
 * @param {number} paid Jumlah yang dibayar.
 * @param {number} nominal Nominal tagihan.
 * @returns {number} 0-4.
 */
export function cekAmountScore(paid, nominal) {
    paid = Number(paid) || 0;
    nominal = Number(nominal) || 0;
    if (!paid || !nominal) return 0;
    const diff = Math.abs(paid - nominal);
    if (diff <= 1) return 4;
    if (diff <= Math.max(1000, nominal * 0.03)) return 3;
    if (paid < nominal && paid >= nominal * 0.45) return 2;
    return 0;
}

/**
 * Pecah token kata dari teks yang sudah dinormalisasi lewat normCekText.
 * Dipakai untuk membangun index pencarian fuzzy (lihat cekTextSimilar).
 * @param {*} v
 * @returns {string[]}
 */
export function normCekTokens(v) {
    const n = normCekText(v);
    return n ? n.split(' ').filter(Boolean) : [];
}

/**
 * Serahkan kendali sebentar ke browser (event loop) supaya proses yang
 * berat tidak membuat UI freeze. Dipakai oleh chunkedFilter dan proses
 * berat lain yang jalan per-chunk (mis. fuzzy matching Cek Data Tempo).
 * @returns {Promise<void>}
 */
export function yieldToMain() {
    return new Promise(resolve => {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => resolve());
        } else {
            setTimeout(resolve, 0);
        }
    });
}

/**
 * Filter array besar tanpa memblokir UI: proses per-chunk, lalu kasih
 * jeda ke browser (yieldToMain) di antara chunk.
 * @param {Array<*>} arr
 * @param {function(*): boolean} predicate
 * @param {number} [chunkSize=300]
 * @returns {Promise<Array<*>>}
 */
export async function chunkedFilter(arr, predicate, chunkSize = 300) {
    const out = [];
    const list = arr || [];
    for (let i = 0; i < list.length; i++) {
        if (predicate(list[i])) out.push(list[i]);
        if ((i + 1) % chunkSize === 0) await yieldToMain();
    }
    return out;
}
