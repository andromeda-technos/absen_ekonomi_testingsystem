/**
 * core.js — inti aplikasi: ikon, util, penyimpanan, API (+SWR), router, shell, UI kit,
 * berkas, pemindai QR, grafik SVG, ekspor. Dimuat sekali; modul peran dimuat sesuai kebutuhan.
 */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- ikon (subset gaya Lucide, 24px, garis 1.5) ----------
  const P = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', 'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>', 'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    clip: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    chart: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
    qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    plus: '<path d="M5 12h14M12 5v14"/>', trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>', eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    down: '<path d="m6 9 6 6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', left: '<path d="m15 18-6-6 6-6"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    menu: '<path d="M4 12h16M4 6h16M4 18h16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>', mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41m11.32-11.32 1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"/>',
    layout: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>', send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    keyboard: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    mega: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>', building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>', dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>', table: '<path d="M12 3v18M3 9h18M3 15h18"/><rect width="18" height="18" x="3" y="3" rx="2"/>'
  };
  const ic = (n, c) => '<svg class="ic ' + (c || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.info) + '</svg>';

  // ---------- format ----------
  const TZ = 'Asia/Makassar';
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const fmt = {
    tgl: (d) => { if (!d) return '–'; const m = String(d).slice(0, 10).split('-'); return m.length === 3 ? (+m[2]) + ' ' + BLN[+m[1] - 1] + ' ' + m[0] : d; },
    tglPanjang: (d) => { if (!d) return '–'; const x = new Date(d + 'T12:00:00+08:00'); return HARI[((x.getUTCDay() + 6) % 7) + 1 ? ((new Date(d + 'T12:00:00+08:00')).getDay() + 6) % 7 + 1 : 1] + ', ' + fmt.tgl(d); },
    jam: (iso) => { if (!iso) return '–'; const x = new Date(iso); return isNaN(x) ? '–' : new Intl.DateTimeFormat('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(x).replace('.', ':'); },
    tglJam: (iso) => { if (!iso) return '–'; const x = new Date(iso); if (isNaN(x)) return '–'; const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(x).forEach((q) => { p[q.type] = q.value; }); return fmt.tgl(p.year + '-' + p.month + '-' + p.day) + ', ' + fmt.jam(iso); },
    tenggat: (s) => { if (!s) return '–'; return fmt.tgl(s.slice(0, 10)) + ', ' + s.slice(11, 16) + ' WITA'; },
    sisa: (s) => { const ms = new Date(s + ':00+08:00').getTime() - now(); if (isNaN(ms)) return ''; const a = Math.abs(ms), j = Math.floor(a / 36e5), m = Math.floor((a % 36e5) / 6e4), d = Math.floor(j / 24); const t = d >= 2 ? d + ' hari' : j + ' jam ' + m + ' mnt'; return ms < 0 ? 'Lewat ' + t : 'Sisa ' + t; },
    pct: (n) => (n === null || n === undefined ? '–' : (Math.round(n * 10) / 10).toString().replace('.', ',') + '%'),
    n1: (n) => (n === null || n === undefined ? '–' : (Math.round(n * 10) / 10).toString().replace('.', ',')),
    ukuran: (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'),
    bulan: (ym) => { const m = String(ym).split('-'); return BLN[+m[1] - 1] + ' ' + String(m[0]).slice(2); }
  };
  fmt.tglPanjang = (d) => { if (!d) return '–'; const w = new Date(d + 'T12:00:00+08:00').getUTCDay(); return HARI[w === 0 ? 7 : w] + ', ' + fmt.tgl(d); };
  const inisial = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  const STATUS = { H: ['Hadir', 'ok'], S: ['Sakit', 'warn'], I: ['Izin', 'info'], A: ['Alfa', 'bad'], '': ['Belum', ''] };
  const chip = (t, k, extra) => '<span class="chip ' + (k || '') + ' ' + (extra || '') + '">' + esc(t) + '</span>';
  const sChip = (s) => chip((STATUS[s] || STATUS[''])[0], (STATUS[s] || STATUS[''])[1]);
  const bar = (p, cls) => '<div class="bar ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, p || 0)) + '%"></i></div>';
  const empty = (icon, judul, pesan, cta) => '<div class="empty"><div class="ico-tile">' + ic(icon || 'info', 'lg') + '</div><b>' + esc(judul) + '</b><span class="small">' + esc(pesan || '') + '</span>' + (cta || '') + '</div>';
  const skel = (n, h) => Array.from({ length: n || 3 }, () => '<div class="skel card" style="height:' + (h || 96) + 'px;margin-bottom:12px"></div>').join('');
  const debounce = (fn, ms) => { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms || 200); }; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---------- penyimpanan lokal ----------
  const Store = {
    get(k) { try { const v = localStorage.getItem('smk1:' + k); return v === null ? null : JSON.parse(v); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('smk1:' + k, JSON.stringify(v)); } catch (e) { /* kuota penuh: abaikan */ } },
    del(k) { try { localStorage.removeItem('smk1:' + k); } catch (e) { /* abaikan */ } },
    clearCache() { try { Object.keys(localStorage).filter((k) => k.indexOf('smk1:c:') === 0).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* abaikan */ } }
  };
  const S = { token: '', me: null, role: '', boot: null, cfg: null, srv: 0 };
  const now = () => Date.now() + S.srv;

  // ---------- progres atas ----------
  const Bar = { n: 0, t: null, el: null,
    start() { this.el = this.el || $('#bar'); this.n++; if (this.n === 1) { this.el.classList.add('on'); this.el.style.width = '30%'; clearInterval(this.t); this.t = setInterval(() => { const w = parseFloat(this.el.style.width) || 0; if (w < 85) this.el.style.width = (w + (90 - w) * 0.08) + '%'; }, 250); } },
    done() { this.n = Math.max(0, this.n - 1); if (this.n === 0) { clearInterval(this.t); this.el.style.width = '100%'; setTimeout(() => { if (this.n === 0) { this.el.classList.remove('on'); this.el.style.width = '0'; } }, 250); } } };

  // ---------- API ----------
  async function api(action, data, opt) {
    opt = opt || {};
    if (!CFG.GAS_URL || /GANTI/.test(CFG.GAS_URL)) return { success: false, message: 'URL API belum diatur. Isi GAS_URL di js/config.js.' };
    const body = { action: action, data: data || {}, token: S.token || '', reqId: opt.write ? (opt.reqId || uid()) : '' };
    if (!opt.silent) Bar.start();
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), opt.timeout || 70000);
    try {
      const res = await fetch(CFG.GAS_URL, { method: 'POST', body: JSON.stringify(body), signal: ctl.signal, redirect: 'follow' });
      const j = await res.json();
      if (j && !j.success && j.data && j.data.code === 'AUTH' && S.token && action !== 'auth.login') { logout(true); }
      return j;
    } catch (e) {
      return { success: false, offline: true, reqId: body.reqId, message: e.name === 'AbortError' ? 'Koneksi lambat. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' };
    } finally { clearTimeout(to); if (!opt.silent) Bar.done(); }
  }
  /** Tulis data: reqId yang sama dipakai ulang saat ulang otomatis (idempoten di server). */
  async function post(action, data, opt) {
    opt = Object.assign({ write: true, reqId: uid() }, opt || {});
    let r = await api(action, data, opt);
    if (r.offline) { r = await api(action, data, Object.assign({}, opt, { silent: true })); }
    if (r.success) { Store.clearCache(); }
    return r;
  }
  /** SWR: tampilkan cache seketika, perbarui di belakang layar, panggil cb lagi bila data berubah. */
  function load(ctx, key, action, data, ttl, cb) {
    const ck = 'c:' + (S.me ? S.me.id : '-') + ':' + key, hit = Store.get(ck), fresh = hit && Date.now() - hit.t < (ttl || 60) * 1000;
    if (hit) cb(hit.d, true);
    if (fresh) return Promise.resolve(hit.d);
    return api(action, data, { silent: !!hit }).then((r) => {
      if (!ctx.alive()) return null;
      if (!r.success) { if (!hit) ctx.paint('<div class="card">' + empty('alert', 'Gagal memuat', r.message, '<button class="btn primary" data-act="muatUlang">Coba lagi</button>') + '</div>'); else toast(r.message, 'warn'); return null; }
      Store.set(ck, { d: r.data, t: Date.now() });
      if (!hit || JSON.stringify(hit.d) !== JSON.stringify(r.data)) cb(r.data, false);
      return r.data;
    });
  }

  // ---------- notifikasi, modal, konfirmasi ----------
  function toast(msg, type, ms) {
    const el = document.createElement('div'); el.className = 'toast ' + (type || ''); el.innerHTML = ic(type === 'ok' ? 'check-circle' : type === 'bad' ? 'x-circle' : 'info') + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(el); setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, ms || (type === 'bad' ? 5000 : 3000));
  }
  const layers = [];
  function overlay(html, cls, drawer, onClose) {
    const bg = document.createElement('div'); bg.className = 'layer-bg' + (drawer ? ' drawer-bg' : '');
    bg.innerHTML = '<div class="' + (drawer ? 'drawer' : 'modal') + ' ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    $('#layer').appendChild(bg); document.body.style.overflow = 'hidden';
    const box = bg.firstElementChild, o = { el: box, bg: bg, $: (s) => $(s, box), $$: (s) => $$(s, box), close() { if (!bg.isConnected) return; bg.remove(); layers.splice(layers.indexOf(o), 1); if (!layers.length) document.body.style.overflow = ''; if (onClose) onClose(); } };
    layers.push(o); setTimeout(() => fotoMuat(box), 0);
    bg.addEventListener('mousedown', (e) => { if (e.target === bg && !o.locked) o.close(); });
    const f = box.querySelector('input:not([type=hidden]),select,textarea'); if (f && !drawer && window.innerWidth > 700) setTimeout(() => f.focus(), 50);
    return o;
  }
  function modal(o) {
    const m = overlay('<div class="modal-h"><h3>' + esc(o.title || '') + '</h3><button class="btn icon sm ghost" data-act="tutup" aria-label="Tutup">' + ic('x') + '</button></div><div class="modal-b">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-f">' + o.foot + '</div>' : ''), o.cls, o.drawer, o.onClose);
    return m;
  }
  const drawer = (o) => modal(Object.assign({}, o, { drawer: true }));
  function closeTop() { const l = layers[layers.length - 1]; if (l) l.close(); }
  function confirmBox(o) {
    return new Promise((res) => {
      let done = false; const fin = (v) => { if (!done) { done = true; res(v); } };
      const m = modal({ title: o.title || 'Konfirmasi', body: '<p>' + esc(o.msg || '') + '</p>', foot: '<button class="btn" data-act="tutup">Batal</button><button class="btn ' + (o.danger ? 'danger' : 'primary') + '" data-ok>' + esc(o.ok || 'Ya, lanjutkan') + '</button>', onClose: () => fin(false) });
      m.$('[data-ok]').addEventListener('click', () => { fin(true); m.close(); });
    });
  }
  /** Jalankan aksi async pada tombol: nonaktif + spinner, cegah klik ganda. */
  async function busy(btn, fn) {
    if (btn && btn.classList.contains('busy')) return;
    if (btn) btn.classList.add('busy');
    try { return await fn(); } catch (e) { console.error(e); toast('Terjadi kesalahan: ' + (e && e.message ? e.message : e), 'bad'); } finally { if (btn) btn.classList.remove('busy'); }
  }

  // ---------- form ----------
  function formVal(root) {
    const o = {};
    $$('[name]', root).forEach((el) => {
      if (el.type === 'file') return;
      if (el.type === 'checkbox') { if (el.hasAttribute('data-multi')) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; }
      else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; else if (!(el.name in o)) o[el.name] = ''; }
      else o[el.name] = el.value;
    });
    return o;
  }
  function fieldErr(root, name, msg) {
    const el = $('[name="' + name + '"]', root); if (!el) return;
    el.classList.add('invalid'); const f = el.closest('.field'); if (f) { let e = $('.err', f); if (!e) { e = document.createElement('div'); e.className = 'err'; f.appendChild(e); } e.textContent = msg; }
    el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.addEventListener('input', () => { el.classList.remove('invalid'); const e = el.closest('.field') && $('.err', el.closest('.field')); if (e) e.remove(); }, { once: true });
  }
  const field = (label, inner, o) => { o = o || {}; return '<div class="field"' + (o.style ? ' style="' + o.style + '"' : '') + '><label' + (o.req ? ' class="req"' : '') + '>' + esc(label) + '</label>' + inner + (o.hint ? '<div class="hint">' + esc(o.hint) + '</div>' : '') + '</div>'; };
  const sel = (name, opts, cur, ph) => '<select name="' + name + '">' + (ph !== undefined ? '<option value="">' + esc(ph) + '</option>' : '') + opts.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
  const toggle = (name, on) => '<label class="toggle"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '><i></i></label>';

  // ---------- berkas ----------
  function bacaBerkas(file, maksMB) {
    return new Promise((res, rej) => {
      if (!file) return rej(new Error('Berkas tidak dipilih.'));
      const batas = (maksMB || 5) * 1048576;
      const kirim = (blob, nama) => { if (blob.size > batas) return rej(new Error('Ukuran berkas melebihi ' + (maksMB || 5) + ' MB.')); const r = new FileReader(); r.onload = () => res({ nama: nama, mime: blob.type || 'application/octet-stream', base64: String(r.result).split(',')[1], ukuran: blob.size }); r.onerror = () => rej(new Error('Gagal membaca berkas.')); r.readAsDataURL(blob); };
      if (/^image\/(jpeg|png|webp)$/.test(file.type) && file.size > 900 * 1024) {       // kompres foto agar unggahan cepat
        const img = new Image(), u = URL.createObjectURL(file);
        img.onload = () => { const s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob((b) => kirim(b, file.name.replace(/\.\w+$/, '') + '.jpg'), 'image/jpeg', 0.8); };
        img.onerror = () => { URL.revokeObjectURL(u); kirim(file, file.name); }; img.src = u;
      } else kirim(file, file.name);
    });
  }
  function dropzone(name, o) {
    o = o || {};
    return '<label class="drop" data-drop="' + name + '"><input type="file" name="' + name + '" ' + (o.accept ? 'accept="' + o.accept + '"' : '') + (o.capture ? ' capture="environment"' : '') + ' data-max="' + (o.max || 5) + '"><div class="ico-tile" style="margin:0 auto 8px">' + ic(o.icon || 'upload', 'lg') + '</div><b>' + esc(o.title || 'Ketuk untuk memilih berkas') + '</b><div class="small muted mt4">' + esc(o.hint || '') + '</div><div class="file-info small mt8"></div></label>';
  }
  const filePicked = {};
  async function onFileChange(inp) {
    const f = inp.files && inp.files[0], box = inp.closest('.drop'), info = box && $('.file-info', box);
    delete filePicked[inp.name]; if (info) info.innerHTML = '';
    if (!f) return;
    try { const p = await bacaBerkas(f, +inp.dataset.max || 5); filePicked[inp.name] = p; if (info) info.innerHTML = '<span class="chip ok">' + ic('check', 'sm') + ' ' + esc(p.nama) + ' · ' + fmt.ukuran(p.ukuran) + '</span>'; }
    catch (e) { inp.value = ''; toast(e.message, 'bad'); }
  }
  const fileOf = (name) => filePicked[name] || null;
  const fileReset = (name) => { delete filePicked[name]; };
  async function lihatBerkas(id, nama) {
    Bar.start(); const r = await api('berkas.ambil', { id: id }, { silent: true }); Bar.done();
    if (!r.success) return toast(r.message, 'bad');
    const bin = atob(r.data.base64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: r.data.mime })), isImg = /^image\//.test(r.data.mime), isPdf = /pdf/.test(r.data.mime);
    const m = modal({ title: nama || r.data.nama, cls: 'wide', body: isImg ? '<img src="' + url + '" alt="" style="width:100%;border-radius:12px">' : isPdf ? '<iframe src="' + url + '" style="width:100%;height:70vh;border:0;border-radius:12px" title="Pratinjau"></iframe>' : '<div class="empty">' + ic('file', 'xl') + '<b>' + esc(r.data.nama) + '</b><span class="small">Pratinjau tidak tersedia untuk jenis berkas ini.</span></div>', foot: '<a class="btn primary" href="' + url + '" download="' + esc(r.data.nama) + '">' + ic('download') + ' Unduh</a>', onClose: () => URL.revokeObjectURL(url) });
    return m;
  }


  // ---------- logo & kop ----------
  const logoIsi = () => (window.Tema && Tema.logo() ? '<img class="logo-img" src="' + esc(Tema.logo()) + '" alt="Logo ' + esc(CFG.NAMA || 'sekolah') + '">' : 'B1');
  const logoCls = () => (window.Tema && Tema.logo() ? ' has-img' : '');
  const kop = () => '<div class="kop">' + (Tema.logo() ? '<img src="' + esc(Tema.logo()) + '" alt="">' : '') + '<div><b>' + esc(CFG.NAMA || 'Absensi SMKN 1 Berau') + '</b><span style="font-size:11px">Sistem Informasi Akademik</span></div></div>';
  Tema.onChange(() => { $$('.js-logo').forEach((e) => { e.innerHTML = logoIsi(); e.classList.toggle('has-img', !!Tema.logo()); }); $$('.js-nama').forEach((e) => { e.textContent = CFG.NAMA; }); });
  async function muatTema() {
    const c = Tema.cache(), r = await api('tema.get', { v: c ? c.v : '' }, { silent: true });
    if (!r.success || r.data.sama) return false;
    Tema.simpan(r.data); Tema.terapkan(r.data.tema, { logo: r.data.logo, favicon: r.data.favicon, nama: r.data.nama }); return true;
  }
  /** Kecilkan gambar logo/favicon hingga muat di sel Sheets (data-URI). */
  async function gambarKecil(file, o) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Gunakan gambar PNG, JPEG, atau WebP.');
    const img = new Image(), url = URL.createObjectURL(file);
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Gambar tidak dapat dibaca.')); img.src = url; });
    URL.revokeObjectURL(url);
    for (const skala of [1, 0.8, 0.64, 0.5, 0.4, 0.3]) {
      const mk = Math.max(16, Math.round(o.maks * skala)), c = document.createElement('canvas');
      if (o.kotak) { c.width = c.height = mk; const s = Math.min(mk / img.width, mk / img.height); c.getContext('2d').drawImage(img, (mk - img.width * s) / 2, (mk - img.height * s) / 2, img.width * s, img.height * s); }
      else { const s = Math.min(1, mk / Math.max(img.width, img.height)); c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); }
      for (const f of ['image/png', 'image/webp']) { const uri = c.toDataURL(f, 0.9); if (uri.indexOf('data:' + f) === 0 && uri.length <= o.batas) return uri; }
    }
    throw new Error('Gambar terlalu kompleks untuk dikecilkan ke batas ukuran. Gunakan gambar yang lebih sederhana.');
  }

  // ---------- foto profil: pemilih & pemotong 3×4, avatar, gambar mini ber-cache ----------
  const FP = {}, FOTO = {}, FOTOT = {}, BESAR = {}, FOTO_TTL = 300000;   // gambar mini: simpan 5 menit; yang kosong tidak disimpan
  const fpHtml = (name) => '<div class="foto-picker" data-fp="' + name + '"><div class="fp-stage"><canvas width="240" height="320" data-fpc="' + name + '" aria-label="Pratinjau pas foto. Geser untuk mengatur posisi."></canvas><div class="fp-guide" aria-hidden="true"><i></i></div><div class="fp-empty"><div class="ico-tile">' + ic('camera', 'lg') + '</div><b>Pas foto resmi 3×4</b><span class="small">Pilih foto, lalu geser dan perbesar sampai wajah tepat di bingkai</span></div></div>' +
    '<div class="fp-ctl"><label class="btn sm" style="cursor:pointer">' + ic('upload', 'sm') + ' <span>Pilih foto</span><input type="file" accept="image/jpeg,image/png,image/webp" hidden data-change="fpPilih" data-fpn="' + name + '"></label><label class="fp-zoom">' + ic('search', 'sm') + '<input type="range" min="1" max="3" step="0.01" value="1" data-input="fpZoom" data-fpn="' + name + '" aria-label="Perbesar atau perkecil" disabled></label></div>' +
    '<ul class="small muted fp-tips"><li>Wajah menghadap depan, tanpa kacamata hitam atau topi.</li><li>Latar polos (merah/biru), cahaya merata, tanpa filter.</li><li>Berseragam atau berpakaian rapi, bahu terlihat.</li></ul><div class="fp-info small" data-fpi="' + name + '"></div></div>';
  const fpDraw = (n) => { const s = FP[n], c = $('[data-fpc="' + n + '"]'); if (!s || !s.img || !c) return; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 240, 320); const sc = s.base * s.zoom; x.drawImage(s.img, s.ox, s.oy, s.w * sc, s.h * sc); };
  const fpClamp = (s) => { const sc = s.base * s.zoom; s.ox = Math.min(0, Math.max(240 - s.w * sc, s.ox)); s.oy = Math.min(0, Math.max(320 - s.h * sc, s.oy)); };
  async function fpPilih(inp) {
    const n = inp.dataset.fpn, f = inp.files && inp.files[0], info = $('[data-fpi="' + n + '"]'); if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { inp.value = ''; return toast('Gunakan foto JPG, PNG, atau WebP.', 'bad'); }
    if (f.size > 15 * 1048576) { inp.value = ''; return toast('Ukuran foto terlalu besar (maks. 15 MB).', 'bad'); }
    const img = new Image(), url = URL.createObjectURL(f);
    try { await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Foto tidak dapat dibaca. Coba foto lain.')); img.src = url; }); } catch (e) { URL.revokeObjectURL(url); inp.value = ''; return toast(e.message, 'bad'); }
    URL.revokeObjectURL(url);
    if (img.naturalWidth < 300 || img.naturalHeight < 400) { inp.value = ''; return toast('Resolusi foto terlalu kecil (minimal 300×400 piksel). Gunakan foto yang lebih tajam.', 'bad'); }
    const base = Math.max(240 / img.naturalWidth, 320 / img.naturalHeight);
    FP[n] = { img: img, w: img.naturalWidth, h: img.naturalHeight, base: base, zoom: 1, ox: (240 - img.naturalWidth * base) / 2, oy: (320 - img.naturalHeight * base) / 2 };
    const box = inp.closest('.foto-picker'); box.classList.add('has'); const z = $('[data-fpn][type=range]', box); z.disabled = false; z.value = 1; fpDraw(n);
    if (info) info.innerHTML = '<span class="chip ok">' + ic('check', 'sm') + ' Foto dimuat. Geser untuk mengatur posisi.</span>';
  }
  function fpZoom(el) {
    const s = FP[el.dataset.fpn]; if (!s) return; const sc0 = s.base * s.zoom, cx = (120 - s.ox) / sc0, cy = (160 - s.oy) / sc0;
    s.zoom = +el.value; const sc = s.base * s.zoom; s.ox = 120 - cx * sc; s.oy = 160 - cy * sc; fpClamp(s); fpDraw(el.dataset.fpn);
  }
  let seret = null;
  function fpEvents() {
    document.addEventListener('pointerdown', (e) => { const c = e.target.closest && e.target.closest('canvas[data-fpc]'); if (!c || !FP[c.dataset.fpc]) return; seret = { n: c.dataset.fpc, x: e.clientX, y: e.clientY, k: 240 / c.getBoundingClientRect().width }; try { c.setPointerCapture(e.pointerId); } catch (x) { /* abaikan */ } e.preventDefault(); });
    document.addEventListener('pointermove', (e) => { if (!seret) return; const s = FP[seret.n]; s.ox += (e.clientX - seret.x) * seret.k; s.oy += (e.clientY - seret.y) * seret.k; seret.x = e.clientX; seret.y = e.clientY; fpClamp(s); fpDraw(seret.n); });
    document.addEventListener('pointerup', () => { seret = null; });
  }
  const fotoAda = (n) => !!(FP[n] && FP[n].img);
  function fotoPulihkan(n) { if (!fotoAda(n)) return; const box = $('.foto-picker[data-fp="' + n + '"]'); if (!box) return; box.classList.add('has'); const z = $('[type=range]', box); z.disabled = false; z.value = FP[n].zoom; fpDraw(n); }
  const fotoReset = (n) => { delete FP[n]; };
  const fotoPratinjau = (n) => { const c = $('[data-fpc="' + n + '"]'); return c && fotoAda(n) ? c.toDataURL('image/jpeg', 0.7) : ''; };
  const toBlob = (c, t, q) => new Promise((res) => c.toBlob(res, t, q));
  /** Hasilkan {full:{nama,mime,base64,ukuran} 600×800 JPEG ≤ 250 KB, thumb data-URI 60×80}; null bila belum ada foto. */
  async function fotoAmbil(n) {
    const s = FP[n]; if (!s || !s.img) return null;
    const sc = s.base * s.zoom, sx = -s.ox / sc, sy = -s.oy / sc, sw = 240 / sc, sh = 320 / sc;
    if (sw < 300 || sh < 400) throw new Error('Resolusi foto terlalu rendah pada area yang dipilih. Perkecil pembesaran atau pakai foto yang lebih tajam.');
    const c = document.createElement('canvas'); c.width = 600; c.height = 800; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 800); x.drawImage(s.img, sx, sy, sw, sh, 0, 0, 600, 800);
    let q = 0.88, blob = await toBlob(c, 'image/jpeg', q); while (blob && blob.size > 240 * 1024 && q > 0.45) { q -= 0.08; blob = await toBlob(c, 'image/jpeg', q); }
    if (!blob || blob.size > 250 * 1024) throw new Error('Ukuran foto masih terlalu besar setelah dikompres. Gunakan foto yang lebih sederhana.');
    const t = document.createElement('canvas'); t.width = 60; t.height = 80; const tx = t.getContext('2d'); tx.imageSmoothingQuality = 'high'; tx.drawImage(c, 0, 0, 60, 80);
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Gagal membaca foto.')); r.readAsDataURL(blob); });
    return { full: { nama: 'pasfoto.jpg', mime: 'image/jpeg', base64: b64, ukuran: blob.size }, thumb: t.toDataURL('image/jpeg', 0.7) };
  }
  const avatar = (id, nama, cls) => '<span class="avatar ' + (cls || '') + '" data-foto="' + esc(id) + '">' + esc(inisial(nama)) + '</span>';
  const pasfoto = (ownerId, fotoId, nama, cls) => '<div class="pasfoto ' + (cls || '') + '" data-foto="' + esc(ownerId) + '"' + (fotoId ? ' data-fotobesar="' + esc(fotoId) + '"' : '') + ' role="img" aria-label="Pas foto ' + esc(nama) + '">' + esc(inisial(nama)) + '</div>';
  const pasangFoto = (el, uri) => { el.style.backgroundImage = 'url("' + uri + '")'; el.classList.add('has-foto'); };
  async function fotoBesar(id) {
    if (BESAR[id]) return BESAR[id];
    const r = await api('berkas.ambil', { id: id }, { silent: true }); if (!r.success) return '';
    const bin = atob(r.data.base64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return (BESAR[id] = URL.createObjectURL(new Blob([a], { type: r.data.mime })));
  }
  /** Isi semua elemen [data-foto] di dalam root dengan gambar mini (satu panggilan batch), lalu timpa [data-fotobesar] dengan foto asli. */
  async function fotoMuat(root) {
    root = root || document; const els = $$('[data-foto]', root); if (!els.length) return;
    const butuh = Array.from(new Set(els.map((e) => e.dataset.foto))).filter((id) => id !== 'admin' && !(FOTO[id] && Date.now() - FOTOT[id] < FOTO_TTL));
    for (let i = 0; i < butuh.length; i += 60) { const g = butuh.slice(i, i + 60), r = await api('foto.thumb', { ids: g }, { silent: true }); if (r.success) g.forEach((id) => { if (r.data[id]) { FOTO[id] = r.data[id]; FOTOT[id] = Date.now(); } else { delete FOTO[id]; delete FOTOT[id]; } }); }
    $$('[data-foto]', root).forEach((e) => { const u = FOTO[e.dataset.foto]; if (u && !e.dataset.fd) { pasangFoto(e, u); e.dataset.fd = '1'; } });
    $$('[data-fotobesar]', root).forEach(async (e) => { if (e.dataset.fb) return; e.dataset.fb = '1'; const u = await fotoBesar(e.dataset.fotobesar); if (u && e.isConnected) pasangFoto(e, u); });
  }
  function fotoReseter() { Object.keys(BESAR).forEach((k) => { try { URL.revokeObjectURL(BESAR[k]); } catch (e) { /* abaikan */ } delete BESAR[k]; }); Object.keys(FOTO).forEach((k) => { delete FOTO[k]; delete FOTOT[k]; }); }


  // ---------- biodata (dipakai guru, admin) ----------
  const bioBaris = (a, b) => '<div class="li"><span class="muted small" style="width:130px;flex:none">' + esc(a) + '</span><b class="grow" style="word-break:break-word">' + (b === '' || b === null || b === undefined ? '–' : esc(b)) + '</b></div>';
  const bioChips = (arr) => '<div class="row wrap grow">' + (arr && arr.length ? arr.map((x) => chip(x, 'teal')).join('') : '–') + '</div>';
  function bioGuruHtml(d) {
    return '<div class="bio-head">' + pasfoto(d.id, d.foto_id, d.nama) + '<div class="grow" style="min-width:200px"><span class="cap">Biodata tenaga pendidik</span><h2>' + esc(d.nama) + '</h2><div class="row wrap mt8">' + chip(d.status, d.status === 'Aktif' ? 'ok' : 'warn') + (d.wali_kelas ? chip('Wali kelas ' + d.wali_kelas, 'teal') : '') + '</div></div></div><div class="mt16">' +
      bioBaris('NIP / NUPTK', d.nip) + bioBaris('Email', d.email) + bioBaris('HP / WhatsApp', d.hp) + '<div class="li"><span class="muted small" style="width:130px;flex:none">Mata pelajaran</span>' + bioChips(d.mapel) + '</div>' + bioBaris('Kelas diampu', (d.kelasDiampu || []).join(', ')) + bioBaris('Terdaftar sejak', d.created ? fmt.tgl(d.created.slice(0, 10)) : '') + '</div>' +
      (d.jadwal && d.jadwal.length ? '<h3 class="mt16 mb8">Jadwal mengajar</h3><div class="tbl-wrap"><table class="tbl" style="min-width:420px"><thead><tr><th>Hari</th><th>Jam</th><th>Kelas</th><th>Mapel</th></tr></thead><tbody>' + d.jadwal.map((j) => '<tr><td><b>' + HARI[j.hari] + '</b></td><td class="mono small nowrap">' + esc(j.mulai) + '–' + esc(j.selesai) + '</td><td>' + esc(j.kelas) + '</td><td>' + esc(j.mapel) + '</td></tr>').join('') + '</tbody></table></div>' : '');
  }
  function bioSiswaHtml(d) {
    const k = d.kehadiran || {};
    return '<div class="bio-head">' + pasfoto(d.id, d.foto_id, d.nama) + '<div class="grow" style="min-width:200px"><span class="cap">Biodata siswa</span><h2>' + esc(d.nama) + '</h2><div class="row wrap mt8">' + chip(d.kelas, 'info') + chip(d.status, d.status === 'Aktif' ? 'ok' : d.status === 'Menunggu' ? 'warn' : '') + (d.punyaPin ? chip('PIN aktif', 'ok') : chip('Belum atur PIN', 'warn')) + '</div></div></div><div class="mt16">' +
      bioBaris('NISN', d.nisn) + bioBaris('Jenis kelamin', d.jk === 'L' ? 'Laki-laki' : 'Perempuan') + bioBaris('Tanggal lahir', d.tgl_lahir ? fmt.tgl(d.tgl_lahir) : '') + bioBaris('Email', d.email) + bioBaris('HP siswa', d.hp) + bioBaris('Orang tua / wali', (d.nama_wali || '') + (d.hp_wali ? ' · ' + d.hp_wali : '')) + bioBaris('Alamat', d.alamat) + bioBaris('Asal sekolah', d.asal_sekolah) + bioBaris('Wali kelas', d.wali_kelas) + bioBaris('Lokasi rumah', d.koordinat) +
      (d.tambahan || []).map((t) => bioBaris(t.nama, t.nilai)).join('') + bioBaris('Kehadiran semester', k.total ? fmt.pct(k.efektif) + ' (H ' + k.H + ' · S ' + k.S + ' · I ' + k.I + ' · A ' + k.A + ')' : 'Belum ada data') + bioBaris('Terdaftar', d.created ? fmt.tglJam(d.created) : '') + bioBaris('Login terakhir', d.last_login ? fmt.tglJam(d.last_login) : 'Belum pernah') + '</div>';
  }
  let bioTerakhir = null;
  const bioSet = (jenis, d) => { bioTerakhir = { jenis: jenis, d: d }; };
  const bioCetakAksi = async (el) => {
    if (!bioTerakhir) return; const d = bioTerakhir.d, g = bioTerakhir.jenis === 'guru';
    await busy(el, async () => {
      const u = d.foto_id ? await fotoBesar(d.foto_id) : '';
      const rows = g ? [['NIP / NUPTK', d.nip], ['Email', d.email], ['HP', d.hp], ['Mata pelajaran', (d.mapel || []).join(', ')], ['Wali kelas', d.wali_kelas], ['Kelas diampu', (d.kelasDiampu || []).join(', ')], ['Status', d.status]] : [['NISN', d.nisn], ['Kelas', d.kelas], ['Jenis kelamin', d.jk === 'L' ? 'Laki-laki' : 'Perempuan'], ['Tanggal lahir', d.tgl_lahir ? fmt.tgl(d.tgl_lahir) : ''], ['Email', d.email], ['HP', d.hp], ['Orang tua / wali', (d.nama_wali || '') + ' ' + (d.hp_wali || '')], ['Alamat', d.alamat], ['Asal sekolah', d.asal_sekolah], ['Status', d.status]];
      cetak('<h1>Biodata ' + (g ? 'Tenaga Pendidik' : 'Siswa') + '</h1><div style="display:flex;gap:16px;align-items:flex-start;margin-top:10px">' + (u ? '<img class="foto-cetak" src="' + u + '" alt="Pas foto">' : '') + '<div style="flex:1"><h2 style="margin:0 0 6px">' + esc(d.nama) + '</h2><table>' + rows.map((r) => '<tr><th style="width:32%">' + esc(r[0]) + '</th><td>' + esc(r[1] || '-') + '</td></tr>').join('') + '</table></div></div><p style="font-size:10px;color:#555;margin-top:14px">Dicetak ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) + ' WITA.</p>');
    });
  };

  // ---------- pustaka eksternal (dimuat saat dibutuhkan) ----------
  const LIBS = { jsqr: 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js', xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', gsi: 'https://accounts.google.com/gsi/client' };
  const libP = {};
  function lib(name) { if (libP[name]) return libP[name]; libP[name] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = LIBS[name]; s.async = true; s.onload = () => res(); s.onerror = () => { delete libP[name]; rej(new Error('Gagal memuat pustaka ' + name + '. Periksa koneksi internet.')); }; document.head.appendChild(s); }); return libP[name]; }
  async function qrSvg(text) {
    try { return window.QR.svg(text); } catch (e) { return '<div class="small muted tc">QR tidak dapat dibuat: ' + esc(e.message) + '</div>'; }
  }
  /** Pemindai QR: BarcodeDetector bila ada, jika tidak jsQR. Mengembalikan {stop, error}. */
  async function scanner(host, onCode) {
    const o = { stop() { o.on = false; if (o.stream) o.stream.getTracks().forEach((t) => t.stop()); }, on: true };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Peramban tidak mendukung kamera. Gunakan kode token.');
    o.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    const v = document.createElement('video'); v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = o.stream; host.prepend(v); await v.play();
    let det = null; if ('BarcodeDetector' in window) { try { det = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { det = null; } }
    if (!det) await lib('jsqr');
    const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true }); let last = '', lastT = 0;
    const tick = async () => {
      if (!o.on) return;
      try {
        if (v.readyState >= 2) {
          let val = '';
          if (det) { const r = await det.detect(v); if (r.length) val = r[0].rawValue; }
          else { const w = v.videoWidth, h = v.videoHeight, sc = Math.min(1, 480 / Math.max(w, h)); cv.width = Math.round(w * sc); cv.height = Math.round(h * sc); cx.drawImage(v, 0, 0, cv.width, cv.height); const im = cx.getImageData(0, 0, cv.width, cv.height), r = window.jsQR(im.data, im.width, im.height); if (r) val = r.data; }
          if (val && (val !== last || Date.now() - lastT > 3000)) { last = val; lastT = Date.now(); onCode(val); }
        }
      } catch (e) { /* abaikan frame bermasalah */ }
      setTimeout(tick, 180);
    };
    tick(); return o;
  }
  function getPos(timeout) {
    return new Promise((res) => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition((p) => res({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), akurasi: Math.round(p.coords.accuracy) }), () => res(null), { enableHighAccuracy: true, timeout: timeout || 10000, maximumAge: 15000 });
    });
  }

  // ---------- grafik SVG ringan ----------
  const chart = {
    line(pts, o) {
      o = o || {}; if (!pts.length) return '<div class="empty small">Belum ada data.</div>';
      const W = 320, H = 156, pl = 14, pr = 14, pt = 24, pb = 26, mn = o.min === undefined ? 0 : o.min, mx = o.max === undefined ? 100 : o.max;
      const x = (i) => pl + (pts.length === 1 ? (W - pl - pr) / 2 : i * (W - pl - pr) / (pts.length - 1)), y = (v) => pt + (1 - (v - mn) / (mx - mn || 1)) * (H - pt - pb);
      const d = pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.value).toFixed(1)).join(' ');
      return '<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik garis"><defs><linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D9488" stop-opacity=".25"/><stop offset="1" stop-color="#0D9488" stop-opacity="0"/></linearGradient></defs>' + [0, 50, 100].map((g) => '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(mn + (mx - mn) * g / 100).toFixed(1) + '" y2="' + y(mn + (mx - mn) * g / 100).toFixed(1) + '" stroke="var(--line)" stroke-dasharray="3 3"/>').join('') + '<path d="' + d + ' L' + x(pts.length - 1).toFixed(1) + ' ' + (H - pb) + ' L' + x(0).toFixed(1) + ' ' + (H - pb) + ' Z" fill="url(#gl)"/><path d="' + d + '" fill="none" stroke="#0D9488" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' + pts.map((p, i) => '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.value).toFixed(1) + '" r="3.5" fill="var(--surface)" stroke="#0D9488" stroke-width="2"/><text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + esc(p.label) + '</text><text x="' + x(i).toFixed(1) + '" y="' + (y(p.value) - 8).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="700" fill="var(--ink)">' + fmt.n1(p.value) + '</text>').join('') + '</svg>';
    },
    donut(items, centerTop, centerBot) {
      const tot = items.reduce((a, b) => a + b.value, 0), R = 52, C = 2 * Math.PI * R; let off = 0;
      const seg = tot ? items.filter((i) => i.value > 0).map((i) => { const l = i.value / tot * C, s = '<circle r="' + R + '" cx="70" cy="70" fill="none" stroke="' + i.color + '" stroke-width="18" stroke-dasharray="' + l.toFixed(2) + ' ' + (C - l).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)"/>'; off += l; return s; }).join('') : '<circle r="' + R + '" cx="70" cy="70" fill="none" stroke="var(--line)" stroke-width="18"/>';
      return '<svg viewBox="0 0 140 140" style="width:150px;height:150px;flex:none" role="img" aria-label="Diagram distribusi">' + seg + '<text x="70" y="68" text-anchor="middle" font-size="20" font-weight="800" font-family="Manrope, system-ui, sans-serif" fill="var(--ink)">' + esc(centerTop) + '</text><text x="70" y="86" text-anchor="middle" font-size="9" font-weight="700" letter-spacing=".06em" font-family="system-ui, sans-serif" fill="var(--muted)">' + esc(centerBot) + '</text></svg>';
    },
    bars(list, kkm) {
      if (!list.length) return '<div class="empty small">Belum ada nilai.</div>';
      const top = kkm ? '<div class="kkm" style="bottom:' + (kkm / 100 * 100) + '%"><em>KKM ' + fmt.n1(kkm) + '</em></div>' : '';
      return '<div class="bar-chart">' + top + list.map((x) => '<div class="bc ' + (x.bad ? 'bad' : '') + '" title="' + esc(x.label) + '"><b>' + fmt.n1(x.value) + '</b><i style="height:' + Math.max(2, x.value) * 1.4 + 'px"></i><span>' + esc(x.short || x.label) + '</span></div>').join('') + '</div>';
    }
  };

  // ---------- ekspor ----------
  async function xlsxSimpan(rows, sheet, file) { await lib('xlsx'); const ws = window.XLSX.utils.json_to_sheet(rows), wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, String(sheet).slice(0, 30)); window.XLSX.writeFile(wb, file); }
  async function xlsxBaca(file) {
    await lib('xlsx'); const buf = await file.arrayBuffer(), wb = window.XLSX.read(buf, { type: 'array', cellDates: false }), ws = wb.Sheets[wb.SheetNames[0]];
    const raw = window.XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
    const alias = { nisn: 'nisn', nama: 'nama', 'nama lengkap': 'nama', jk: 'jk', 'jenis kelamin': 'jk', kelas: 'kelas', rombel: 'kelas', email: 'email', hp: 'hp', 'no hp': 'hp', 'hp siswa': 'hp', 'nama wali': 'nama_wali', 'nama orang tua': 'nama_wali', 'hp wali': 'hp_wali', 'no hp wali': 'hp_wali', 'tanggal lahir': 'tgl_lahir', tgl_lahir: 'tgl_lahir', 'tgl lahir': 'tgl_lahir', alamat: 'alamat', 'asal sekolah': 'asal_sekolah', nilai: 'nilai', skor: 'nilai' };
    return raw.map((r) => { const o = {}; Object.keys(r).forEach((k) => { const a = alias[String(k).trim().toLowerCase()]; if (a) o[a] = String(r[k]).trim(); }); if (o.tgl_lahir) { const m = o.tgl_lahir.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); if (m) o.tgl_lahir = m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); } return o; }).filter((o) => Object.keys(o).length);
  }
  function cetak(html) {
    let root = $('#print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    root.innerHTML = kop() + html; setTimeout(() => { window.print(); }, 50);
  }

  // ---------- router ----------
  const R = [], NAV = {}, ACT = {}, FORM = {};
  const MODUL = {}; let navId = 0, cur = null, cleanups = [];
  function route(pattern, def) { def.pattern = pattern; def.parts = pattern.split('/'); R.push(def); }
  function match(path) {
    const seg = path.split('/');
    for (const r of R) { if (r.parts.length !== seg.length) continue; const params = {}; let ok = true; for (let i = 0; i < seg.length; i++) { if (r.parts[i][0] === ':') params[r.parts[i].slice(1)] = decodeURIComponent(seg[i]); else if (r.parts[i] !== seg[i]) { ok = false; break; } } if (ok) return { r, params }; }
    return null;
  }
  const homeOf = (role) => '#/' + (role || 'masuk') + '/beranda';
  const go = (h) => { if (location.hash === h) onHash(); else location.hash = h; };
  const onLeave = (fn) => cleanups.push(fn);
  function parseHash() { const h = location.hash.replace(/^#\/?/, ''), i = h.indexOf('?'); return { path: (i > -1 ? h.slice(0, i) : h).replace(/\/$/, ''), q: Object.fromEntries(new URLSearchParams(i > -1 ? h.slice(i + 1) : '')) }; }

  function loadModul(role) {
    if (MODUL[role]) return MODUL[role];
    MODUL[role] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/' + role + '.js'; s.onload = () => res(); s.onerror = () => { delete MODUL[role]; rej(new Error('Gagal memuat modul ' + role)); }; document.head.appendChild(s); });
    return MODUL[role];
  }
  async function onHash() {
    const id = ++navId; cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* abaikan */ } });
    closeAllLayers(); document.body.classList.remove('menu-open'); $$('.menu-pop').forEach((e) => e.remove());
    const { path, q } = parseHash();
    let p = path || ''; const first = p.split('/')[0];
    const publik = ['', 'masuk', 'daftar-siswa', 'daftar-guru', 'atur-pin'];
    if (S.token && S.role && publik.indexOf(first) > -1 && first !== '') { return go(homeOf(S.role)); }
    if (!S.token && publik.indexOf(first) === -1) return go('#/masuk');
    if (S.token && ['siswa', 'guru', 'admin'].indexOf(first) > -1 && first !== S.role) return go(homeOf(S.role));
    if (S.token && !p) { return go(homeOf(S.role)); }
    if (S.token && ['siswa', 'guru', 'admin'].indexOf(first) > -1) { try { await loadModul(S.role); } catch (e) { return toast(e.message, 'bad'); } if (id !== navId) return; }
    const m = match(p);
    if (!m) { if (S.token) return go(homeOf(S.role)); return go('#/'); }
    const ctx = { id: id, params: m.params, q: q, path: p, alive: () => id === navId, onLeave: onLeave, paint: null, def: m.r };
    cur = ctx;
    if (m.r.shell) { showShell(m.r); ctx.paint = (html) => { if (ctx.alive()) { $('#view').innerHTML = html; fotoMuat($('#view')); } }; }
    else { showPub(); ctx.paint = (html) => { if (ctx.alive()) { $('#pub').innerHTML = html; } }; window.scrollTo(0, 0); }
    document.title = (m.r.title ? m.r.title + ' · ' : '') + (CFG.NAMA || 'Absensi SMKN 1 Berau');
    try { await m.r.view(ctx); } catch (e) { console.error(e); ctx.paint('<div class="card">' + empty('alert', 'Terjadi kesalahan', e.message) + '</div>'); }
    if (m.r.shell && id === navId) { const v = $('#view'); window.scrollTo(0, 0); }
  }
  function closeAllLayers() { while (layers.length) layers[layers.length - 1].close(); }

  // ---------- shell ----------
  let shellRole = '';
  function showPub() { $('#shell').hidden = true; $('#pub').hidden = false; }
  function showShell(r) {
    $('#pub').hidden = true; $('#shell').hidden = false; $('#shell').dataset.role = S.role;
    if (shellRole !== S.role) { renderShell(); shellRole = S.role; }
    setActive(r);
  }
  function setActive(r) {
    const path = cur ? cur.path : '';
    $$('#side a.nv, #bottom a').forEach((a) => { const t = a.getAttribute('href').replace('#/', ''); a.classList.toggle('on', path === t || path.indexOf(t + '/') === 0 || (a.dataset.also && a.dataset.also.split(',').some((x) => path.indexOf(x) === 0))); });
    const t = $('#top .ttl'); if (t) t.innerHTML = esc(r.title || '') + (r.sub ? '<small>' + esc(typeof r.sub === 'function' ? r.sub() : r.sub) + '</small>' : '');
  }
  function badges() { const b = (S.boot && S.boot.badge) || {}; return b; }
  function renderShell() {
    const nav = NAV[S.role] || { items: [], bottom: [] }, role = S.role;
    $('#side').innerHTML = '<div class="brand"><div class="logo js-logo' + logoCls() + '">' + logoIsi() + '</div><div><b class="js-nama">' + esc(CFG.NAMA || 'SMKN 1 Berau') + '</b><small>' + ({ admin: 'Admin Akademik', guru: 'Portal Guru', siswa: 'Portal Siswa' }[role]) + '</small></div></div><nav>' + nav.items.map((i) => '<a class="nv" href="#/' + i.path + '" data-also="' + (i.also || '') + '">' + ic(i.icon) + '<span>' + esc(i.label) + '</span>' + (i.badge ? '<span class="cnt" data-badge="' + i.badge + '" hidden></span>' : '') + '</a>').join('') + '</nav><div class="foot">' + ic('shield-check', 'sm') + '<span>Sesi terenkripsi · ' + esc(S.me ? S.me.nama.split(' ')[0] : '') + '</span></div>';
    $('#top').innerHTML = '<button class="btn icon ghost menu-btn" data-act="menuBuka" aria-label="Menu">' + ic('menu') + '</button><div class="ttl"></div><button class="btn icon ghost" data-act="tema" aria-label="Ganti tema">' + ic('moon') + '</button><button class="btn icon ghost bell" data-act="bell" aria-label="Pemberitahuan">' + ic('bell') + '<span class="pip" hidden></span></button><button class="avatar" data-act="menuAkun" style="border:0" aria-label="Akun"' + (S.role !== 'admin' ? ' data-foto="' + esc(S.me.id) + '"' : '') + '>' + esc(inisial(S.me && S.me.nama)) + '</button>';
    $('#bottom').innerHTML = nav.bottom.map((i) => '<a href="#/' + i.path + '" data-also="' + (i.also || '') + '">' + ic(i.icon) + '<span>' + esc(i.label) + '</span>' + (i.badge ? '<span class="cnt" data-badge="' + i.badge + '" hidden></span>' : '') + '</a>').join('');
    updateBadges(); fotoMuat($('#top'));
  }
  function updateBadges() {
    const b = (S.boot && S.boot.badge) || {};
    $$('[data-badge]').forEach((el) => { const n = b[el.dataset.badge] || 0; el.hidden = !n; el.textContent = n > 99 ? '99+' : n; });
    const pip = $('#top .pip'); if (pip) pip.hidden = !(b.bell > 0);
  }
  function badgeFrom(boot, role) {
    const b = {};
    if (role === 'siswa') { b.tugas = boot.tugasBelum || 0; b.bell = b.tugas; }
    if (role === 'guru') { b.izin = boot.stat ? boot.stat.izinPending : 0; b.koreksi = boot.stat ? boot.stat.koreksi : 0; b.bell = (b.izin || 0) + (b.koreksi || 0); }
    if (role === 'admin' && boot.stat) { b.daftar = boot.stat.menungguSiswa + boot.stat.menungguGuru; b.ubah = boot.stat.menungguUbah; b.bell = b.daftar + b.ubah; }
    return b;
  }
  function setBoot(boot) { if (!boot) return; boot.badge = badgeFrom(boot, S.role); S.boot = boot; if (boot.me && boot.me.foto_thumb && boot.me.id) { FOTO[boot.me.id] = boot.me.foto_thumb; FOTOT[boot.me.id] = Date.now(); } if (boot.waktuServer) S.srv = boot.waktuServer - Date.now(); Store.set('boot', boot); updateBadges(); }
  async function refreshBoot(silent) { const r = await api('boot', {}, { silent: silent !== false }); if (r.success) { setBoot(r.data); return r.data; } return null; }

  // ---------- sesi ----------
  function masuk(d) {
    S.token = d.token; S.me = d.me; S.role = d.me.role; Store.set('sesi', { token: d.token, me: d.me }); setBoot(d.boot); shellRole = '';
  }
  function logout(diam) {
    const t = S.token; S.token = ''; S.me = null; S.role = ''; S.boot = null; shellRole = ''; Store.del('sesi'); Store.del('boot'); Store.clearCache(); fotoReseter();
    if (!diam && t) api('auth.keluar', {}, { silent: true }).catch(() => 0);
    if (diam) toast('Sesi berakhir. Silakan masuk kembali.', 'warn');
    closeAllLayers(); go('#/masuk');
  }
  function temaToggle() { const g = document.documentElement.getAttribute('data-tema') === 'gelap'; try { localStorage.setItem('smk1:tema', g ? 'terang' : 'gelap'); } catch (e) { /* abaikan */ } const c = Tema.cache(); Tema.terapkan(c ? c.tema : Tema.DEF, c ? { logo: c.logo, favicon: c.favicon } : {}); }

  // ---------- aksi & event global ----------
  const on = (name, fn) => { ACT[name] = fn; };
  const onForm = (name, fn) => { FORM[name] = fn; };
  on('tutup', () => closeTop());
  on('muatUlang', () => onHash());
  on('tema', () => temaToggle());
  on('menuBuka', () => document.body.classList.add('menu-open'));
  on('menuTutup', () => document.body.classList.remove('menu-open'));
  on('bell', () => { const r = S.role; go(r === 'admin' ? '#/admin/persetujuan' : r === 'guru' ? '#/guru/izin' : '#/siswa/tugas'); });
  on('menuAkun', (el) => {
    const old = $('.menu-pop'); if (old) return old.remove();
    const m = document.createElement('div'); m.className = 'menu-pop';
    m.innerHTML = '<div style="padding:10px 12px"><b class="trunc" style="display:block">' + esc(S.me.nama) + '</b><span class="small muted">' + ({ admin: 'Administrator', guru: 'Guru', siswa: 'Siswa' }[S.role]) + '</span></div><hr style="border:0;border-top:1px solid var(--line);margin:4px 0">' + (S.role !== 'admin' ? '<a href="#/' + S.role + '/profil">' + ic('user') + ' Profil saya</a>' : '') + (S.role === 'guru' ? '<a href="#/guru/biodata">' + ic('file') + ' Biodata</a>' : '') + (S.role !== 'admin' ? '<button data-act="fotoGanti">' + ic('camera') + ' Ganti foto profil</button>' : '') + '<button data-act="gantiSandi">' + ic('lock') + ' ' + (S.role === 'siswa' ? 'Ganti PIN' : 'Ganti kata sandi') + '</button><button data-act="tema">' + ic('moon') + ' Mode gelap / terang</button><button data-act="keluar">' + ic('logout') + ' Keluar</button>';
    $('#top').appendChild(m); setTimeout(() => document.addEventListener('click', function f(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', f); } }), 0);
    m.addEventListener('click', () => setTimeout(() => m.remove(), 0));
  });
  on('keluar', async () => { if (await confirmBox({ title: 'Keluar', msg: 'Keluar dari aplikasi di perangkat ini?', ok: 'Keluar' })) logout(); });
  on('gantiSandi', () => {
    const s = S.role === 'siswa';
    const m = modal({ title: s ? 'Ganti PIN' : 'Ganti kata sandi', body: '<form class="col" data-submit="gantiSandi">' + field(s ? 'PIN lama' : 'Sandi lama', '<input type="password" name="lama" autocomplete="current-password" ' + (s ? 'inputmode="numeric" maxlength="6"' : '') + ' required>') + field(s ? 'PIN baru (6 angka)' : 'Sandi baru', '<input type="password" name="baru" autocomplete="new-password" ' + (s ? 'inputmode="numeric" maxlength="6"' : '') + ' required>', { hint: s ? '' : 'Minimal ' + (S.role === 'admin' ? 12 : 8) + ' karakter, kombinasi huruf dan angka.' }) + '<p class="small muted">Perangkat lain akan dikeluarkan otomatis.</p><button class="btn primary block" type="submit">Simpan</button></form>' });
  });
  onForm('gantiSandi', async (f) => {
    const v = formVal(f); const btn = $('button[type=submit]', f);
    await busy(btn, async () => { const r = await post('auth.gantiSandi', v); if (!r.success) return toast(r.message, 'bad'); S.token = r.data.token; Store.set('sesi', { token: S.token, me: S.me }); closeTop(); toast('Berhasil diperbarui.', 'ok'); refreshBoot(); });
  });
  on('lihatBerkas', (el) => lihatBerkas(el.dataset.id, el.dataset.nama));
  on('bioCetak', bioCetakAksi);
  on('fpPilih', (el) => fpPilih(el)); on('fpZoom', (el) => fpZoom(el));
  on('fotoGanti', () => { document.body.classList.remove('menu-open'); modal({ title: 'Ganti foto profil', body: '<div class="col">' + fpHtml('ganti') + '<button class="btn primary lg block" data-act="fotoSimpan">' + ic('check') + ' Simpan foto</button></div>', onClose: () => fotoReset('ganti') }); });
  on('fotoSimpan', async (el) => {
    await busy(el, async () => {
      let f; try { f = await fotoAmbil('ganti'); } catch (e) { return toast(e.message, 'bad'); }
      if (!f) return toast('Pilih foto terlebih dahulu.', 'warn');
      const r = await post('foto.simpan', { foto: f }, { timeout: 120000 }); if (!r.success) return toast(r.message, 'bad');
      FOTO[S.me.id] = f.thumb; FOTOT[S.me.id] = Date.now(); fotoReset('ganti'); closeTop(); toast(r.message, 'ok');
      $$('[data-foto="' + S.me.id + '"]').forEach((e) => { delete e.dataset.fd; delete e.dataset.fb; pasangFoto(e, f.thumb); });
      await refreshBoot(); if (cur && cur.def && cur.def.view && /profil|biodata/.test(cur.path)) cur.def.view(cur);
    });
  });

  on('acc', () => {});
  function onClick(e) {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = ACT[el.dataset.act]; if (fn) { if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault(); const r = fn(el, e); if (r && r.catch) r.catch((x) => { console.error(x); toast(String(x.message || x), 'bad'); }); }
  }
  function onSubmit(e) { const f = e.target.closest('form[data-submit]'); if (!f) return; e.preventDefault(); const fn = FORM[f.dataset.submit]; if (fn) { const r = fn(f, e); if (r && r.catch) r.catch((x) => { console.error(x); toast(String(x.message || x), 'bad'); }); } }
  function onChange(e) { if (e.target.type === 'file' && e.target.closest('.drop')) onFileChange(e.target); const d = e.target.closest('[data-change]'); if (d && ACT[d.dataset.change]) ACT[d.dataset.change](d, e); }
  function onInput(e) { const d = e.target.closest('[data-input]'); if (d && ACT[d.dataset.input]) ACT[d.dataset.input](d, e); if (e.target.matches('.otp input')) { const t = e.target; t.value = t.value.replace(/\D/g, '').slice(-1); if (t.value && t.nextElementSibling) t.nextElementSibling.focus(); } }
  function onKey(e) { if (e.key === 'Escape') closeTop(); if (e.key === 'Backspace' && e.target.matches('.otp input') && !e.target.value && e.target.previousElementSibling) e.target.previousElementSibling.focus(); }
  function onPaste(e) { if (!e.target.matches('.otp input')) return; const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, ''); if (!t) return; e.preventDefault(); const bx = $$('input', e.target.parentElement); bx.forEach((b, i) => { b.value = t[i] || ''; }); (bx[Math.min(t.length, bx.length - 1)]).focus(); }
  function dropEvents() { document.addEventListener('dragover', (e) => { const d = e.target.closest && e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('on'); } }); document.addEventListener('dragleave', (e) => { const d = e.target.closest && e.target.closest('.drop'); if (d) d.classList.remove('on'); }); document.addEventListener('drop', (e) => { const d = e.target.closest && e.target.closest('.drop'); if (!d) return; e.preventDefault(); d.classList.remove('on'); const inp = $('input[type=file]', d); if (inp && e.dataTransfer.files.length) { inp.files = e.dataTransfer.files; onFileChange(inp); } }); }

  // ---------- mulai ----------
  async function start() {
    document.addEventListener('click', onClick); document.addEventListener('submit', onSubmit); document.addEventListener('change', onChange); document.addEventListener('input', onInput); document.addEventListener('keydown', onKey); document.addEventListener('paste', onPaste); dropEvents();
    window.addEventListener('hashchange', onHash); fpEvents(); muatTema();
    window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); });
    const saved = Store.get('sesi');
    if (saved && saved.token) {
      S.token = saved.token; S.me = saved.me; S.role = saved.me.role; const b = Store.get('boot'); if (b) { S.boot = b; b.badge = badgeFrom(b, S.role); }
      if (S.role !== 'admin') loadModul(S.role);            // unduh modul peran sambil menunggu
      refreshBoot().then((b2) => { if (b2 && cur && cur.def && cur.def.onBoot) cur.def.onBoot(cur, b2); });
    } else if (CFG.GAS_URL && !/GANTI/.test(CFG.GAS_URL)) { fetch(CFG.GAS_URL + '?ping=1', { mode: 'cors' }).catch(() => 0); }   // pemanasan server
    await onHash();
  }

  window.App = { CFG, S, $, $$, esc, ic, fmt, chip, sChip, bar, empty, skel, inisial, debounce, uid, STATUS, HARI, Store, api, post, load, toast, modal, drawer, closeTop, confirm: confirmBox, busy, formVal, fieldErr, field, sel, toggle, bacaBerkas, dropzone, fileOf, fileReset, lihatBerkas, aksi: (n) => ACT[n] && ACT[n](), bioGuruHtml, bioSiswaHtml, bioSet, fpHtml, fotoAda, fotoPulihkan, fotoAmbil, fotoPratinjau, fotoReset, avatar, pasfoto, fotoMuat, fotoBesar, gambarKecil, kop, logoIsi, logoCls, muatTema, FOTO, lib, qrSvg, scanner, getPos, chart, xlsxSimpan, xlsxBaca, cetak, route, NAV, on, onForm, go, onLeave, now, setBoot, refreshBoot, masuk, logout, start, homeOf, loadModul, overlay, badgeFrom, updateBadges, get cur() { return cur; } };
})();
