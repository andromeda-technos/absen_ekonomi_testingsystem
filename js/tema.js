/**
 * tema.js — tema & merek. Dimuat di <head> (sinkron, kecil) agar tema, logo, dan favicon terpasang SEBELUM halaman tergambar.
 * Sumber kebenaran ada di server (tema.get); di sini hanya cache lokal + penerap.
 *   Tema.PRESET, Tema.DEF, Tema.terapkan(tema, opsi), Tema.muat(), Tema.simpan(dataServer), Tema.cache(), Tema.pulihkan(), Tema.kontras(a,b)
 */
(function () {
  'use strict';
  const PRESET = {
    bawaan: { nama: 'Navy & Teal', aksen: '#0D9488', merek: '#1E3A5F' },
    zamrud: { nama: 'Zamrud', aksen: '#15803D', merek: '#14532D' },
    indigo: { nama: 'Indigo', aksen: '#4F46E5', merek: '#312E81' },
    marun: { nama: 'Marun', aksen: '#DC2626', merek: '#7F1D1D' },
    jingga: { nama: 'Jingga', aksen: '#C2410C', merek: '#7C2D12' },
    grafit: { nama: 'Grafit', aksen: '#475569', merek: '#1F2937' }
  };
  const DEF = { preset: 'bawaan', aksen: '#0D9488', merek: '#1E3A5F', mode: 'terang', gaya: 'modern', kepadatan: 'nyaman', sidebar: 'gelap' };
  const GAYA = { modern: [16, 12, 10], klasik: [6, 6, 4], lembut: [24, 16, 14] };
  const KEY = 'smk1:merek', PREF = 'smk1:tema', FAV0 = (document.getElementById('favicon') || {}).href || '';

  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = (h) => { const c = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const kontras = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const gelapkan = (h, target, lawan) => { let c = h, n = 0; while (kontras(c, lawan || '#FFFFFF') < target && n++ < 30) c = mix(c, '#000000', 0.07); return c; };
  const terangkan = (h, target, lawan) => { let c = h, n = 0; while (kontras(c, lawan) < target && n++ < 30) c = mix(c, '#FFFFFF', 0.08); return c; };
  const sah = (h) => /^#[0-9A-Fa-f]{6}$/.test(h || '');
  const rgba = (h, a) => 'rgba(' + rgb(h).join(',') + ',' + a + ')';

  function css(t) {
    const a = sah(t.aksen) ? t.aksen.toUpperCase() : DEF.aksen, m = sah(t.merek) ? t.merek.toUpperCase() : DEF.merek, g = GAYA[t.gaya] || GAYA.modern;
    const aTeks = gelapkan(a, 4.5, '#FFFFFF'), aGelap = terangkan(a, 4.5, '#111B2E'), mGelap = mix(m, '#FFFFFF', 0.14);
    return ':root{--teal:' + a + ';--teal-d:' + aTeks + ';--teal-l:' + rgba(a, 0.12) + ';--navy:' + m + ';--side-bg:' + mix(m, '#000000', 0.34) + ';--r-card:' + g[0] + 'px;--r-btn:' + g[1] + 'px;--r-in:' + g[2] + 'px}' +
      'html[data-tema="gelap"]{--teal-d:' + aGelap + ';--teal-l:' + rgba(aGelap, 0.16) + ';--navy:' + mGelap + ';--side-bg:' + mix(m, '#000000', 0.62) + '}';
  }
  function modeAwal(mode) {
    let pref = null; try { pref = localStorage.getItem(PREF); } catch (e) { /* abaikan */ }
    if (pref === 'gelap' || pref === 'terang') return pref;                         // pilihan pribadi pengguna menang
    if (mode === 'gelap') return 'gelap';
    if (mode === 'sistem') return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang';
    return 'terang';
  }
  const dengar = [];
  /** Pasang tema ke dokumen. opsi.logo / opsi.favicon (data-URI) opsional. Tidak menyimpan apa pun. */
  function terapkan(t, o) {
    t = Object.assign({}, DEF, t || {}); o = o || {};
    let el = document.getElementById('tema-dinamis'); if (!el) { el = document.createElement('style'); el.id = 'tema-dinamis'; document.head.appendChild(el); }
    el.textContent = css(t);
    const h = document.documentElement;
    h.setAttribute('data-dens', t.kepadatan); h.setAttribute('data-sidebar', t.sidebar);
    if (modeAwal(t.mode) === 'gelap') h.setAttribute('data-tema', 'gelap'); else h.removeAttribute('data-tema');
    const meta = document.getElementById('meta-warna'); if (meta) meta.setAttribute('content', sah(t.merek) ? t.merek : DEF.merek);
    if (o.favicon !== undefined) { const f = document.getElementById('favicon'); if (f) f.href = o.favicon || FAV0; }
    if (o.logo !== undefined) Tema._logo = o.logo || '';
    if (o.nama) { window.APP_CONFIG = window.APP_CONFIG || {}; window.APP_CONFIG.NAMA = o.nama; }
    dengar.forEach((fn) => { try { fn(t, o); } catch (e) { /* abaikan */ } });
  }
  function cache() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function simpan(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* kuota */ } }
  function muat() { const c = cache(); terapkan(c ? c.tema : DEF, c ? { logo: c.logo, favicon: c.favicon, nama: c.nama } : {}); return c; }
  function pulihkan() { muat(); }

  const Tema = { PRESET, DEF, GAYA, terapkan, cache, simpan, muat, pulihkan, kontras, gelapkan, sah, onChange: (fn) => dengar.push(fn), _logo: '', logo: () => Tema._logo || '' };
  window.Tema = Tema;
  muat();
})();
