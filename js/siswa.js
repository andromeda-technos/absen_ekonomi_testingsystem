/**
 * siswa.js — modul peran siswa (dimuat hanya saat siswa masuk).
 */
(function () {
  'use strict';
  const { $, $$, esc, ic, fmt, api, post, toast, busy, formVal, fieldErr, field, sel, load, route, on, onForm, go, chip, sChip, bar, empty, skel, S, dropzone, fileOf, fileReset, modal, chart, NAV, onLeave } = App;

  NAV.siswa = {
    items: [{ path: 'siswa/beranda', label: 'Beranda', icon: 'home' }, { path: 'siswa/absensi', label: 'Absensi', icon: 'qr', also: 'siswa/scan' }, { path: 'siswa/tugas', label: 'Tugas & materi', icon: 'book', badge: 'tugas' }, { path: 'siswa/nilai', label: 'Nilai', icon: 'cap' }, { path: 'siswa/profil', label: 'Profil', icon: 'user' }],
    bottom: [{ path: 'siswa/beranda', label: 'Beranda', icon: 'home' }, { path: 'siswa/absensi', label: 'Absensi', icon: 'qr', also: 'siswa/scan' }, { path: 'siswa/tugas', label: 'Tugas', icon: 'book', badge: 'tugas' }, { path: 'siswa/nilai', label: 'Nilai', icon: 'cap' }, { path: 'siswa/profil', label: 'Profil', icon: 'user' }]
  };
  const R = (p, def) => route(p, Object.assign({ shell: true }, def));
  const sisaMs = (ts) => Math.max(0, ts - App.now());
  const mmss = (ms) => { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  /** Hitung mundur: elemen [data-cd="<epoch ms>"] diperbarui tiap detik; [data-cd-tenggat] untuk tenggat tugas tiap menit. */
  function tickLoop() {
    const t = setInterval(() => { $$('[data-cd]').forEach((el) => { const ms = sisaMs(+el.dataset.cd); el.textContent = mmss(ms); if (ms <= 0 && el.dataset.done !== '1') { el.dataset.done = '1'; el.textContent = '00:00'; } }); $$('[data-tenggat]').forEach((el) => { el.textContent = fmt.sisa(el.dataset.tenggat); }); }, 1000);
    onLeave(() => clearInterval(t));
  }

  // ================= BERANDA =================
  function berandaHtml(b) {
    const m = b.me, r = b.ringkas, hadirHariIni = (b.hariIni || []).indexOf('H') > -1;
    const sesi = b.sesi || [];
    const sesiHtml = sesi.length ? sesi.map((x) => '<div class="card"><div class="row between"><span class="chip ok live">Presensi dibuka</span><span class="chip">' + ic('clock', 'sm') + ' sisa <b class="mono" data-cd="' + x.akhir_ts + '">' + mmss(sisaMs(x.akhir_ts)) + '</b></span></div><h3 class="mt8">' + esc(x.mapel) + '</h3><p class="muted small">' + esc(x.guru) + (x.ruang ? ' · ' + esc(x.ruang) : '') + ' · Jam ke-' + esc(x.jam_ke) + '</p>' + (x.sudah ? '<div class="callout ok mt16">' + ic('check-circle') + '<span>Kehadiran Anda sudah tercatat.</span></div>' : '<a class="btn primary lg block mt16" href="#/siswa/scan">' + ic('camera') + ' Buka kamera & scan presensi</a><button class="btn block mt8" data-act="kodeManual">' + ic('keyboard') + ' Input kode token manual</button>') + '</div>').join('')
      : '<div class="card tint">' + '<div class="row"><div class="ico-tile">' + ic('clock') + '</div><div class="grow"><b>Belum ada sesi presensi terbuka</b><div class="small muted">Presensi muncul di sini saat guru membuka sesi di kelas.</div></div><button class="btn sm" data-act="segarkan">' + ic('refresh', 'sm') + '</button></div></div>';
    const jadwal = (b.jadwal || []).length ? b.jadwal.map((j) => '<div class="li' + (j.status === 'Berjalan' ? ' status-kuning' : '') + '" style="' + (j.status === 'Berjalan' ? 'background:var(--teal-l);margin:0 -16px;padding:12px 16px' : '') + '"><div class="mono small muted" style="width:92px;flex:none">' + esc(j.mulai) + '–' + esc(j.selesai) + '</div><div class="grow"><b>' + esc(j.mapel) + '</b><div class="small muted">' + esc(j.guru) + (j.ruang ? ' · ' + esc(j.ruang) : '') + '</div></div>' + (j.absen ? sChip(j.absen) : j.status === 'Berjalan' ? chip('Berjalan', 'teal') : j.status === 'Selesai' ? chip('Selesai') : chip('Berikutnya')) + '</div>').join('') : empty('calendar', 'Tidak ada jadwal hari ini', 'Nikmati harimu!');
    const tugas = (b.tugasDekat || []).length ? b.tugasDekat.map((t) => '<a class="li act" href="#/siswa/tugas/' + esc(t.id) + '" style="color:inherit;text-decoration:none"><div class="ico-tile ' + (t.lewat ? 'bad' : 'warn') + '">' + ic('clip') + '</div><div class="grow"><b class="trunc" style="display:block">' + esc(t.judul) + '</b><div class="small muted">' + esc(t.mapel) + '</div><div class="small ' + (t.lewat ? 'bad-t' : 'warn-t') + '" data-tenggat="' + esc(t.tenggat) + '">' + esc(fmt.sisa(t.tenggat)) + '</div></div>' + ic('right', 'muted') + '</a>').join('') : empty('check-circle', 'Semua tugas beres', 'Tidak ada tugas yang menunggu.');
    return '<div class="col gap16">' + (m.foto_id ? '' : '<div class="callout warn"><span class="grow">' + ic('camera') + ' <b>Lengkapi profil Anda:</b> unggah pas foto resmi 3×4. Foto menjadi foto profil dan identitas Anda di sekolah.</span><button class="btn sm primary" data-act="fotoGanti">Unggah foto</button></div>') + '<div class="card"><div class="row top between"><div class="grow"><span class="cap">SMKN 1 Berau · ' + esc(m.semester) + ' ' + esc(m.tahun_ajaran) + '</span><h1 class="mt4">Halo, ' + esc(m.nama.split(' ')[0]) + ' 👋</h1><div class="small muted mt4">NISN ' + esc(m.nisn) + ' · ' + esc(m.kelas) + '</div></div>' + App.avatar(m.id, m.nama, 'lg') + '</div><div class="row mt16 wrap">' + (hadirHariIni ? chip('Hadir hari ini', 'ok') : chip('Belum presensi hari ini', 'warn')) + (b.geofence ? chip('Geofence aktif', 'teal') : '') + '</div></div>' +
      '<div class="g2"><div class="card stat"><span class="l">Kehadiran</span><span class="v">' + fmt.pct(r.efektif) + '</span>' + bar(r.efektif, r.efektif < r.ambang ? 'bad' : '') + '<span class="small muted">' + r.H + ' hadir · ' + r.S + ' sakit · ' + r.I + ' izin · ' + r.A + ' alfa</span></div><div class="card stat"><span class="l">Tugas tertunda</span><span class="v">' + (b.tugasBelum || 0) + '</span><span class="small ' + ((b.tugasDekat || []).some((t) => !t.lewat) ? 'warn-t' : 'muted') + '">' + ((b.tugasDekat || []).length ? esc(fmt.sisa(b.tugasDekat[0].tenggat)) : 'Tidak ada') + '</span></div></div>' +
      '<section class="col"><h3>Presensi sekarang</h3>' + sesiHtml + '</section>' +
      '<div class="split"><section class="card"><div class="card-h"><h3>Jadwal hari ini</h3><span class="small muted">' + esc(fmt.tglPanjang(new Date(App.now()).toLocaleDateString('sv-SE', { timeZone: 'Asia/Makassar' }))) + '</span></div>' + jadwal + '</section><section class="card"><div class="card-h"><h3>Tugas mendekati tenggat</h3><a class="small" href="#/siswa/tugas">Lihat semua</a></div>' + tugas + '</section></div>' +
      ((b.pengumuman || []).length ? '<section class="card"><div class="card-h"><h3>Pengumuman</h3></div>' + b.pengumuman.slice(0, 3).map((p) => '<div class="li"><div class="ico-tile info">' + ic('mega') + '</div><div class="grow"><b>' + esc(p.judul) + '</b><div class="small muted">' + esc(fmt.tgl(p.tanggal)) + '</div><div class="small mt4" style="white-space:pre-line">' + esc(p.isi) + '</div></div></div>').join('') + '</section>' : '') + '</div>';
  }
  R('siswa/beranda', {
    title: 'Beranda', sub: () => 'Ringkasan hari ini',
    view(ctx) {
      const b = S.boot; ctx.paint(b && b.me ? berandaHtml(b) : skel(4)); tickLoop();
      const muat = async () => { const nb = await App.refreshBoot(); if (nb && ctx.alive()) { const y = window.scrollY; ctx.paint(berandaHtml(nb)); window.scrollTo(0, y); } };
      muat(); const t = setInterval(muat, 45000); onLeave(() => clearInterval(t));
    }
  });
  on('segarkan', async (el) => { await busy(el, async () => { const nb = await App.refreshBoot(false); if (nb) { App.cur.paint(berandaHtml(nb)); toast('Diperbarui.', 'ok'); } }); });
  on('kodeManual', () => {
    const m = modal({ title: 'Input kode token', body: '<p class="muted small mb16">Masukkan 6 digit kode yang tampil di layar proyektor guru.</p><div class="otp mb16">' + [0, 1, 2, 3, 4, 5].map((i) => '<input inputmode="numeric" maxlength="1" data-otp="' + i + '" aria-label="Digit ' + (i + 1) + '">').join('') + '</div><div id="kode-msg"></div><button class="btn primary lg block" data-act="kodeKirim">Verifikasi presensi</button>' });
  });
  on('kodeKirim', async (el) => { const kode = $$('[data-otp]', el.closest('.modal')).map((i) => i.value).join(''); if (kode.length !== 6) return toast('Isi 6 digit kode.', 'warn'); await busy(el, async () => { const r = await kirimPresensi({ kode: kode }); const box = $('#kode-msg'); if (r.success) { App.closeTop(); hasilScan(true, r.data, r.message); } else if (box) box.innerHTML = '<div class="callout bad mb16">' + ic('alert') + '<span>' + esc(r.message) + '</span></div>'; }); });

  // ================= SCAN PRESENSI =================
  const Sc = { tab: 'kamera', scan: null, proses: false };
  async function kirimPresensi(payload) {
    if (Sc.proses) return { success: false, message: 'Sedang memproses…' };
    Sc.proses = true;
    try {
      let pos = null; if (S.boot && S.boot.geofence) { pos = await App.getPos(10000); if (!pos) return { success: false, message: 'Aktifkan izin lokasi di peramban untuk presensi (geofence sekolah aktif).' }; }
      const r = await post('absen.scan', Object.assign({}, payload, pos ? { lat: pos.lat, lng: pos.lng } : {}));
      if (r.success) App.refreshBoot();
      return r;
    } finally { Sc.proses = false; }
  }
  function hasilScan(ok, data, msg) {
    const box = $('#scan-hasil');
    const html = ok ? '<div class="card ok col tc" style="align-items:center"><div class="ico-tile" style="width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,.5)">' + ic('check-circle', 'xl') + '</div><h2>' + (data && data.sudah ? 'Sudah tercatat' : 'Presensi tercatat') + '</h2><p>' + esc(msg || '') + (data && data.mapel ? '<br><b>' + esc(data.mapel) + '</b> · ' + esc(fmt.jam(data.waktu)) + ' WITA · ' + esc(data.metode) : '') + '</p><a class="btn primary" href="#/siswa/beranda">Selesai</a></div>' : '<div class="callout bad">' + ic('alert') + '<span>' + esc(msg) + '</span></div>';
    if (box) { box.innerHTML = html; if (ok) { Sc.scan && Sc.scan.stop(); $('#scan-ui') && ($('#scan-ui').hidden = true); } } else if (ok) { go('#/siswa/beranda'); toast(msg || 'Presensi tercatat.', 'ok'); }
  }
  function scanHtml(sesi) {
    return '<div class="col gap16 proj"><div class="card"><div class="row between"><span class="chip ok live">Sesi aktif</span><span class="chip">sisa <b class="mono" data-cd="' + sesi.akhir_ts + '">' + mmss(sisaMs(sesi.akhir_ts)) + '</b></span></div><h3 class="mt8">' + esc(sesi.mapel) + '</h3><div class="small muted">' + esc(sesi.guru) + (sesi.ruang ? ' · ' + esc(sesi.ruang) : '') + '</div></div><div id="scan-hasil"></div><div id="scan-ui" class="col gap16"><div class="seg"><button class="' + (Sc.tab === 'kamera' ? 'on' : '') + '" data-act="scanTab" data-v="kamera">' + ic('camera', 'sm') + ' Scan kamera</button><button class="' + (Sc.tab === 'kode' ? 'on' : '') + '" data-act="scanTab" data-v="kode">' + ic('keyboard', 'sm') + ' Kode token</button></div>' +
      (Sc.tab === 'kamera' ? '<div class="scan-box" id="scan-box"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span><span class="line"></span><div class="msg" id="scan-msg">Menyalakan kamera…</div></div><div class="tc"><b>Arahkan ke QR di layar proyektor</b><div class="small muted">Posisikan kode di dalam bingkai. QR berganti tiap 15 detik.</div></div>' : '<div class="card col"><p class="muted small">Kamera bermasalah? Masukkan 6 digit token yang tampil di layar guru.</p><div class="otp">' + [0, 1, 2, 3, 4, 5].map((i) => '<input inputmode="numeric" maxlength="1" data-otp="' + i + '" aria-label="Digit ' + (i + 1) + '">').join('') + '</div><button class="btn primary lg block" data-act="scanKode">Verifikasi presensi</button></div>') +
      (S.boot && S.boot.geofence ? '<div class="callout">' + ic('pin') + '<span>Lokasi Anda diperiksa terhadap radius sekolah saat presensi.</span></div>' : '') + '</div></div>';
  }
  route('siswa/scan', {
    shell: true, title: 'Presensi', sub: () => 'Scan QR kelas',
    async view(ctx) {
      Sc.tab = 'kamera'; Sc.scan = null; Sc.proses = false; ctx.paint(skel(2)); tickLoop();
      onLeave(() => { if (Sc.scan) Sc.scan.stop(); Sc.scan = null; });
      const nb = await App.refreshBoot(); if (!ctx.alive()) return;
      const sesi = ((nb || S.boot).sesi || []).filter((x) => !x.sudah)[0] || ((nb || S.boot).sesi || [])[0];
      if (!sesi) return ctx.paint('<div class="proj"><div class="card">' + empty('qr', 'Tidak ada sesi presensi terbuka', 'Minta guru membuka sesi presensi, lalu segarkan halaman ini.', '<div class="row"><button class="btn primary" data-act="muatUlang">' + ic('refresh') + ' Segarkan</button><a class="btn" href="#/siswa/beranda">Beranda</a></div>') + '</div></div>');
      Sc.sesi = sesi; ctx.paint(scanHtml(sesi)); if (sesi.sudah) hasilScan(true, { sudah: true }, 'Kehadiran Anda sudah tercatat.'); else mulaiKamera();
    }
  });
  async function mulaiKamera() {
    const box = $('#scan-box'); if (!box) return; const msg = $('#scan-msg');
    try {
      Sc.scan = await App.scanner(box, async (val) => {
        const p = String(val).split('|'); if (p[0] !== 'S1B' || p.length !== 3) return;
        if (Sc.proses) return; if (Sc.scan) navigator.vibrate && navigator.vibrate(60);
        const r = await kirimPresensi({ sesi_id: p[1], token: p[2] });
        if (r.success) hasilScan(true, r.data, r.message); else { const h = $('#scan-hasil'); if (h) h.innerHTML = '<div class="callout bad">' + ic('alert') + '<span>' + esc(r.message) + '</span></div>'; }
      });
      if (msg) msg.remove();
    } catch (e) { if (msg) msg.innerHTML = esc(e.message || 'Kamera tidak dapat diakses.') + '<br><br><button class="btn sm" data-act="scanTab" data-v="kode">Gunakan kode token</button>'; }
  }
  on('scanTab', (el) => { if (Sc.scan) { Sc.scan.stop(); Sc.scan = null; } Sc.tab = el.dataset.v; const keep = $('#scan-hasil').innerHTML; App.cur.paint(scanHtml(Sc.sesi)); $('#scan-hasil').innerHTML = keep; if (Sc.tab === 'kamera') mulaiKamera(); });
  on('scanKode', async (el) => { const kode = $$('[data-otp]').map((i) => i.value).join(''); if (kode.length !== 6) return toast('Isi 6 digit kode.', 'warn'); await busy(el, async () => { const r = await kirimPresensi({ sesi_id: Sc.sesi && Sc.sesi.id, kode: kode }); if (r.success) hasilScan(true, r.data, r.message); else { const h = $('#scan-hasil'); h.innerHTML = '<div class="callout bad">' + ic('alert') + '<span>' + esc(r.message) + '</span></div>'; } }); });

  // ================= ABSENSI =================
  const Ab = { filter: 'all', data: null, izin: null };
  const METODE_IC = { 'Scan QR': 'qr', 'Kode Token': 'keyboard', Manual: 'edit', Izin: 'file', Kartu: 'user' };
  function absensiHtml() {
    const d = Ab.data, r = d.ringkas, kurang = r.efektif < r.ambang;
    const log = d.log.filter((x) => Ab.filter === 'all' || (Ab.filter === 'SI' ? (x.status === 'S' || x.status === 'I') : x.status === Ab.filter));
    const izin = Ab.izin || [];
    return '<div class="col gap16"><div class="card"><div class="row between top"><div><span class="cap">Kualifikasi kehadiran semester</span><div class="row mt4" style="align-items:baseline"><span class="stat"><span class="v" style="font-size:40px">' + fmt.pct(r.efektif) + '</span></span><span class="muted">target minimal ' + fmt.pct(r.ambang) + '</span></div></div>' + (kurang ? chip('Belum memenuhi', 'bad') : chip('Memenuhi', 'ok')) + '</div><div class="bar mt8" style="position:relative;overflow:visible"><i style="width:' + Math.min(100, r.efektif) + '%;background:' + (kurang ? '#B91C1C' : 'var(--teal)') + '"></i><span style="position:absolute;left:' + r.ambang + '%;top:-4px;width:2px;height:16px;background:var(--ink)"></span></div><p class="small muted mt8">Kehadiran efektif = hadir + sakit/izin sah, dibagi seluruh sesi tercatat (' + r.total + ' sesi). Alfa mengurangi persentase.</p></div>' +
      '<div class="g4">' + [['H', 'Hadir', 'check-circle', 'ok'], ['S', 'Sakit', 'alert', 'warn'], ['I', 'Izin', 'file', 'info'], ['A', 'Alfa', 'x-circle', 'bad']].map((x) => '<div class="card stat"><div class="row between"><span class="l">' + x[1] + '</span><div class="ico-tile ' + (x[3] === 'ok' ? '' : x[3]) + '" style="width:32px;height:32px">' + ic(x[2], 'sm') + '</div></div><span class="v">' + r[x[0]] + '</span><span class="small muted">sesi</span></div>').join('') + '</div>' +
      '<details class="acc card" style="padding:0" ' + (Ab.buka ? 'open' : '') + '><summary style="background:var(--navy);color:#fff">' + ic('plus') + '<span>Ajukan bukti sakit / izin / dispensasi</span>' + ic('down', 'ch') + '</summary><div class="acc-b" style="padding:16px"><form class="col" data-submit="izinKirim" novalidate><div class="field"><label>Jenis pengajuan</label><div class="seg" id="izin-jenis">' + ['Sakit', 'Izin', 'Dispensasi'].map((j, i) => '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-act="izinJenis" data-v="' + j + '">' + j + '</button>').join('') + '</div><input type="hidden" name="jenis" value="Sakit"></div><div class="g2">' + field('Dari tanggal', '<input type="date" name="tgl_mulai" value="' + new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Makassar' }) + '">', { req: 1 }) + field('Sampai tanggal', '<input type="date" name="tgl_akhir" value="' + new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Makassar' }) + '">', { req: 1 }) + '</div>' + field('Keterangan', '<textarea name="keterangan" placeholder="Contoh: demam tinggi, rawat jalan di RSUD…"></textarea>', { req: 1 }) + '<div class="field"><label id="izin-bukti-l" class="req">Bukti (surat dokter / foto obat)</label>' + dropzone('bukti', { title: 'Ambil foto atau pilih berkas', hint: 'JPG, PNG, atau PDF · maks. 5 MB · foto otomatis dikompres', accept: 'image/*,.pdf', max: 5, icon: 'camera' }) + '</div><div class="callout">' + ic('pin') + '<span>Lokasi Anda dicatat <b>sekali saat mengirim</b> untuk membantu guru memeriksa kesesuaian dengan domisili. Tidak dipakai untuk pelacakan.</span></div><button class="btn primary lg block" type="submit">' + ic('send') + ' Kirim pengajuan</button></form></div></details>' +
      (izin.length ? '<section class="card"><div class="card-h"><h3>Pengajuan saya</h3></div>' + izin.slice(0, 6).map((z) => '<div class="li"><div class="ico-tile ' + (z.status === 'Menunggu' ? 'warn' : z.keputusan === 'A' ? 'bad' : '') + '">' + ic(z.status === 'Menunggu' ? 'clock' : z.keputusan === 'A' ? 'x-circle' : 'check-circle') + '</div><div class="grow"><b>' + esc(z.jenis) + '</b> · ' + esc(fmt.tgl(z.tgl_mulai)) + (z.tgl_akhir !== z.tgl_mulai ? ' – ' + esc(fmt.tgl(z.tgl_akhir)) : '') + '<div class="small muted trunc">' + esc(z.keterangan) + '</div>' + (z.catatan_guru ? '<div class="small mt4">Catatan guru: ' + esc(z.catatan_guru) + '</div>' : '') + '</div>' + (z.status === 'Menunggu' ? chip('Menunggu', 'warn') : z.keputusan === 'A' ? chip('Alfa', 'bad') : chip('Disetujui · ' + (z.keputusan === 'S' ? 'Sakit' : 'Izin'), 'ok')) + '</div>').join('') + '</section>' : '') +
      (d.tren.length > 1 ? '<section class="card"><div class="card-h"><h3>Tren kehadiran bulanan</h3></div>' + chart.line(d.tren.map((t) => ({ label: fmt.bulan(t.bulan), value: t.persen })), { min: 0, max: 100 }) + '</section>' : '') +
      '<section><div class="row between mb8"><h3>Riwayat kehadiran</h3></div><div class="chips-scroll mb8">' + [['all', 'Semua (' + d.log.length + ')'], ['H', 'Hadir'], ['SI', 'Sakit/Izin'], ['A', 'Alfa']].map((c) => '<button class="chip btn-like ' + (Ab.filter === c[0] ? 'on' : '') + '" data-act="absFilter" data-v="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' +
      (log.length ? '<div class="card" style="padding:4px 16px">' + log.map((x) => '<div class="li"><div class="grow"><div class="small muted">' + esc(fmt.tgl(x.tanggal)) + (x.waktu && x.metode !== 'Izin' ? ' · ' + esc(fmt.jam(x.waktu)) + ' WITA' : '') + '</div><b>' + esc(x.mapel) + '</b><div class="small muted">' + ic(METODE_IC[x.metode] || 'info', 'sm') + ' ' + esc(x.metode) + (x.catatan ? ' · ' + esc(x.catatan) : '') + '</div></div>' + sChip(x.status) + '</div>').join('') + '</div>' : '<div class="card">' + empty('history', 'Belum ada riwayat absensi', 'Belum ada presensi tercatat untuk filter ini.', '<button class="btn primary" data-act="bukaAjukan">' + ic('plus') + ' Ajukan bukti / izin</button>') + '</div>') + '</section></div>';
  }
  R('siswa/absensi', {
    title: 'Absensi', sub: () => 'Riwayat & pengajuan',
    view(ctx) {
      ctx.paint(skel(4)); Ab.filter = 'all';
      load(ctx, 'abs', 'siswa.absensi', {}, 30, (d) => { Ab.data = d; if (Ab.izin) ctx.paint(absensiHtml()); });
      load(ctx, 'izinsaya', 'izin.saya', {}, 30, (z) => { Ab.izin = z; if (Ab.data) ctx.paint(absensiHtml()); });
    }
  });
  on('absFilter', (el) => { Ab.filter = el.dataset.v; App.cur.paint(absensiHtml()); });
  on('bukaAjukan', () => { Ab.buka = true; App.cur.paint(absensiHtml()); Ab.buka = false; $('.acc').scrollIntoView({ behavior: 'smooth' }); });
  on('izinJenis', (el) => { $$('#izin-jenis button').forEach((b) => b.classList.toggle('on', b === el)); const f = el.closest('form'); f.jenis.value = el.dataset.v; $('#izin-bukti-l').className = el.dataset.v === 'Izin' ? '' : 'req'; $('#izin-bukti-l').textContent = el.dataset.v === 'Sakit' ? 'Bukti (surat dokter / foto obat)' : el.dataset.v === 'Dispensasi' ? 'Surat dispensasi' : 'Bukti pendukung (opsional)'; });
  onForm('izinKirim', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f), bukti = fileOf('bukti');
    if (!v.tgl_mulai || !v.tgl_akhir || v.tgl_akhir < v.tgl_mulai) return fieldErr(f, 'tgl_akhir', 'Tanggal tidak valid.');
    if (v.keterangan.trim().length < 5) return fieldErr(f, 'keterangan', 'Isi keterangan minimal 5 karakter.');
    if (v.jenis !== 'Izin' && !bukti) return toast('Unggah bukti terlebih dahulu.', 'warn');
    await busy(btn, async () => {
      const pos = await App.getPos(6000);
      const r = await post('izin.ajukan', { jenis: v.jenis, tgl_mulai: v.tgl_mulai, tgl_akhir: v.tgl_akhir, keterangan: v.keterangan, bukti: bukti, lat: pos ? pos.lat : '', lng: pos ? pos.lng : '' }, { timeout: 120000 });
      if (!r.success) return toast(r.message, 'bad');
      fileReset('bukti'); toast(r.message, 'ok'); Ab.izin = null; Ab.data = null; go('#/siswa/absensi'); App.cur && App.cur.def.view(App.cur);
    });
  });

  // ================= TUGAS & MATERI =================
  const Tg = { tab: 'tugas', q: '', st: 'all', mapel: 'all', list: null, materi: null };
  const stTugas = (t) => (!t.kumpul ? 'belum' : t.kumpul.nilai !== null ? 'dinilai' : 'dikumpul');
  function tugasKartu(t) {
    const s = stTugas(t), tag = s === 'belum' ? (t.lewat ? chip('Terlambat · belum dikumpulkan', 'bad') : chip('Belum dikumpulkan', 'warn')) : s === 'dinilai' ? chip('Dinilai: ' + fmt.n1(t.kumpul.nilai) + ' / 100 · ' + (t.kumpul.nilai >= t.kkm ? 'Lulus KKM' : 'Di bawah KKM'), t.kumpul.nilai >= t.kkm ? 'ok' : 'bad') : chip('Sudah dikumpulkan' + (t.kumpul.terlambat ? ' (terlambat)' : ''), 'info');
    return '<article class="card col gap8"><div class="row between wrap">' + tag + '<span class="small muted">Bobot ' + fmt.n1(t.bobot) + '%</span></div><h4>' + esc(t.judul) + '</h4><div class="small muted">' + esc(t.mapel) + ' · ' + esc(t.guru) + '</div><div class="card sunk small col gap4" style="padding:12px"><div class="row between"><span class="muted">Format berkas</span><b>' + esc(t.format || 'Bebas') + '</b></div><div class="row between"><span class="muted">Standar KKM</span><b>' + fmt.n1(t.kkm) + '</b></div><div class="row between"><span class="muted">Batas akhir</span><b class="' + (t.lewat && s === 'belum' ? 'bad-t' : '') + '">' + esc(fmt.tenggat(t.tenggat)) + '</b></div></div>' + (s === 'dinilai' && t.kumpul.catatan_guru ? '<div class="callout">' + ic('mega') + '<span><b>Catatan guru:</b> <i>' + esc(t.kumpul.catatan_guru) + '</i></span></div>' : '') + '<a class="btn ' + (s === 'belum' ? 'primary' : '') + ' block" href="#/siswa/tugas/' + esc(t.id) + '">' + (s === 'belum' ? 'Buka detail & kumpulkan' : 'Lihat rincian pengumpulan') + ' ' + ic('right') + '</a></article>';
  }
  function tugasHtml() {
    const mapel = Array.from(new Set((Tg.list || []).map((t) => t.mapel)));
    const hit = (Tg.list || []).filter((t) => (Tg.st === 'all' || stTugas(t) === Tg.st) && (Tg.mapel === 'all' || t.mapel === Tg.mapel) && (!Tg.q || (t.judul + ' ' + t.mapel + ' ' + t.guru).toLowerCase().indexOf(Tg.q.toLowerCase()) > -1));
    const mendesak = (Tg.list || []).filter((t) => !t.kumpul && !t.lewat).length;
    let body;
    if (Tg.tab === 'tugas') body = '<div class="row wrap"><div class="input-icon grow" style="min-width:200px">' + ic('search') + '<input placeholder="Cari tugas, mapel, atau guru" value="' + esc(Tg.q) + '" data-input="tgCari"></div><div style="min-width:170px">' + sel('st', [['all', 'Semua status'], ['belum', 'Belum dikumpulkan'], ['dikumpul', 'Menunggu penilaian'], ['dinilai', 'Sudah dinilai']], Tg.st).replace('<select ', '<select data-change="tgSt" ') + '</div></div><div class="chips-scroll mt8">' + ['all'].concat(mapel).map((m) => '<button class="chip btn-like ' + (Tg.mapel === m ? 'on' : '') + '" data-act="tgMapel" data-v="' + esc(m) + '">' + (m === 'all' ? 'Semua mapel' : esc(m)) + '</button>').join('') + '</div><div class="g2 g2-md mt16" style="align-items:start">' + (hit.length ? hit.map(tugasKartu).join('') : '<div class="card" style="grid-column:1/-1">' + empty('clip', 'Tidak ada tugas', 'Tidak ada tugas yang cocok dengan filter.') + '</div>') + '</div>';
    else body = materiHtml();
    return '<div class="col gap16"><div class="tabs"><button class="' + (Tg.tab === 'tugas' ? 'on' : '') + '" data-act="tgTab" data-v="tugas">Daftar tugas ' + (mendesak ? '<span class="cnt bad">' + mendesak + '</span>' : '') + '</button><button class="' + (Tg.tab === 'materi' ? 'on' : '') + '" data-act="tgTab" data-v="materi">Silabus & materi</button></div>' + body + '</div>';
  }
  function materiHtml() {
    const m = Tg.materi; if (!m) return skel(2);
    if (!m.length) return '<div class="card">' + empty('book', 'Belum ada materi', 'Guru belum mengunggah bab atau media belajar.') + '</div>';
    const per = {}; m.forEach((x) => { (per[x.mapel] = per[x.mapel] || []).push(x); });
    return Object.keys(per).sort().map((mp, i) => '<details class="acc" ' + (i === 0 ? 'open' : '') + '><summary><div class="ico-tile">' + ic('folder') + '</div><span>' + esc(mp) + '</span><span class="cnt">' + per[mp].length + '</span>' + ic('down', 'ch') + '</summary><div class="acc-b">' + per[mp].map((x) => '<div class="card sunk mt8"><div class="row between top"><div><span class="cap">' + esc(x.bab || 'Bab') + '</span><h4>' + esc(x.judul) + '</h4></div></div>' + (x.deskripsi ? '<p class="small muted mt4" style="white-space:pre-line">' + esc(x.deskripsi) + '</p>' : '') + (x.media.length ? '<div class="col gap8 mt8">' + x.media.map((md) => md.tipe === 'file' ? '<button class="file-row" style="text-align:left;cursor:pointer" data-act="lihatBerkas" data-id="' + esc(md.berkas_id) + '" data-nama="' + esc(md.judul) + '">' + ic('file') + '<span class="grow trunc">' + esc(md.judul) + '</span>' + ic('eye', 'sm') + '</button>' : '<a class="file-row" style="text-decoration:none;color:inherit" href="' + esc(md.url) + '" target="_blank" rel="noopener noreferrer">' + ic(md.tipe === 'video' ? 'camera' : 'link') + '<span class="grow trunc">' + esc(md.judul) + '</span>' + ic('share', 'sm') + '</a>').join('') + '</div>' : '') + '</div>').join('') + '</div></details>').join('');
  }
  R('siswa/tugas', {
    title: 'Tugas & materi', sub: () => 'Pengumpulan dan bahan belajar',
    view(ctx) {
      Tg.tab = ctx.q.tab === 'materi' ? 'materi' : 'tugas'; Tg.q = ''; Tg.st = 'all'; Tg.mapel = 'all'; ctx.paint(skel(3));
      load(ctx, 'tugas', 'tugas.siswa', {}, 30, (l) => { Tg.list = l; ctx.paint(tugasHtml()); });
      load(ctx, 'materi', 'materi.siswa', {}, 120, (m) => { Tg.materi = m; if (Tg.tab === 'materi' && Tg.list) ctx.paint(tugasHtml()); });
    }
  });
  on('tgTab', (el) => { Tg.tab = el.dataset.v; App.cur.paint(tugasHtml()); });
  on('tgMapel', (el) => { Tg.mapel = el.dataset.v; App.cur.paint(tugasHtml()); });
  on('tgSt', (el) => { Tg.st = el.value; App.cur.paint(tugasHtml()); });
  on('tgCari', App.debounce((el) => { Tg.q = el.value; const pos = el.selectionStart; App.cur.paint(tugasHtml()); const n = $('[data-input=tgCari]'); n.focus(); n.setSelectionRange(pos, pos); }, 250));

  // ----- detail tugas -----
  const Dt = { mode: 'berkas' };
  function detailHtml(t) {
    const k = t.kumpul, dinilai = k && k.nilai !== null, bolehKirim = !dinilai;
    const ext = (String(t.format || '').toLowerCase().match(/[a-z0-9]+/g) || []).map((e) => '.' + e).join(',');
    return '<div class="col gap16 proj" style="max-width:760px"><a class="small" href="#/siswa/tugas">← Kembali ke daftar tugas</a><div class="card col gap8"><div class="row between wrap">' + (k ? (dinilai ? chip('Dinilai', 'ok') : chip('Sudah dikumpulkan', 'info')) : (t.lewat ? chip('Lewat tenggat', 'bad') : chip('Belum dikumpulkan', 'warn'))) + chip(t.mapel, 'teal') + '</div><h2>' + esc(t.judul) + '</h2>' +
      (!k && !t.lewat ? '<div class="callout warn">' + ic('clock') + '<span>Tenggat: <b>' + esc(fmt.tenggat(t.tenggat)) + '</b> · <b data-tenggat="' + esc(t.tenggat) + '">' + esc(fmt.sisa(t.tenggat)) + '</b></span></div>' : '') +
      '<div class="g2"><div class="card sunk" style="padding:12px"><span class="cap">Pengampu</span><div><b>' + esc(t.guru) + '</b></div></div><div class="card sunk" style="padding:12px"><span class="cap">Batas akhir</span><div><b>' + esc(fmt.tenggat(t.tenggat)) + '</b></div></div><div class="card sunk" style="padding:12px"><span class="cap">Bobot</span><div><b>' + fmt.n1(t.bobot) + '%</b></div></div><div class="card sunk" style="padding:12px"><span class="cap">KKM</span><div><b>' + fmt.n1(t.kkm) + ' / 100</b></div></div></div></div>' +
      (t.deskripsi ? '<div class="card"><h3 class="mb8">Instruksi pengerjaan</h3><p style="white-space:pre-line">' + esc(t.deskripsi) + '</p></div>' : '') +
      (t.lampiran.length ? '<div class="card"><h3 class="mb8">Lampiran dari guru</h3><div class="col gap8">' + t.lampiran.map((l) => '<button class="file-row" style="text-align:left;cursor:pointer" data-act="lihatBerkas" data-id="' + esc(l.id) + '" data-nama="' + esc(l.nama) + '">' + ic('file') + '<span class="grow trunc">' + esc(l.nama) + '</span><span class="small muted">' + (l.ukuran ? fmt.ukuran(l.ukuran) : '') + '</span>' + ic('eye', 'sm') + '</button>').join('') + '</div></div>' : '') +
      (k ? '<div class="card col gap8 ' + '"><h3>Status pengumpulan</h3><div class="callout ok">' + ic('check-circle') + '<span>Terkirim <b>' + esc(fmt.tglJam(k.waktu)) + ' WITA</b>' + (k.terlambat ? ' · <b>terlambat</b>' : ' · tepat waktu') + '</span></div>' + (k.berkas_id ? '<button class="file-row" style="text-align:left;cursor:pointer" data-act="lihatBerkas" data-id="' + esc(k.berkas_id) + '" data-nama="Pengumpulan saya">' + ic('file') + '<span class="grow">Berkas saya</span>' + ic('eye', 'sm') + '</button>' : '') + (k.link ? '<a class="file-row" style="text-decoration:none;color:inherit" target="_blank" rel="noopener noreferrer" href="' + esc(k.link) + '">' + ic('link') + '<span class="grow trunc">' + esc(k.link) + '</span></a>' : '') + (k.catatan ? '<div class="small muted">Catatan saya: ' + esc(k.catatan) + '</div>' : '') + (dinilai ? '<div class="card sunk"><div class="row between"><span class="cap">Nilai</span><span class="stat"><span class="v">' + fmt.n1(k.nilai) + '</span></span></div>' + (k.catatan_guru ? '<p class="mt8"><i>“' + esc(k.catatan_guru) + '”</i></p>' : '') + '</div>' : '<div class="small muted">Menunggu penilaian guru. Anda dapat mengirim ulang selama belum dinilai.</div>') + '</div>' : '') +
      (bolehKirim ? '<form class="card col" data-submit="tugasKirim" data-id="' + esc(t.id) + '" novalidate><h3>' + (k ? 'Kirim ulang' : 'Unggah lembar jawaban') + '</h3><div class="seg"><button type="button" class="' + (Dt.mode === 'berkas' ? 'on' : '') + '" data-act="dtMode" data-v="berkas">' + ic('upload', 'sm') + ' Berkas</button><button type="button" class="' + (Dt.mode === 'link' ? 'on' : '') + '" data-act="dtMode" data-v="link">' + ic('link', 'sm') + ' Tautan repo / cloud</button></div>' +
        (Dt.mode === 'berkas' ? dropzone('tugas', { title: 'Seret atau ketuk untuk memilih berkas', hint: (t.format ? 'Format: ' + t.format + ' · ' : '') + 'maks. 10 MB', accept: ext, max: 10 }) : field('Tautan', '<input name="link" type="url" placeholder="https://github.com/…">')) +
        field('Catatan untuk guru (opsional)', '<textarea name="catatan" placeholder="Tuliskan catatan atau asumsi pengerjaan"></textarea>') + '<label class="check"><input type="checkbox" name="jujur"><span>Saya menyatakan pekerjaan ini dikerjakan secara mandiri sesuai pakta integritas akademik.</span></label><button class="btn primary lg block" type="submit">' + ic('send') + ' ' + (k ? 'Kirim ulang tugas' : 'Kirim pengumpulan tugas') + '</button></form>' : '') + '</div>';
  }
  route('siswa/tugas/:id', {
    shell: true, title: 'Detail tugas',
    view(ctx) {
      Dt.mode = 'berkas'; ctx.paint(skel(3)); tickLoop();
      load(ctx, 'tugas', 'tugas.siswa', {}, 20, (l) => { Tg.list = l; const t = l.find((x) => x.id === ctx.params.id); Dt.t = t; ctx.paint(t ? detailHtml(t) : '<div class="card">' + empty('clip', 'Tugas tidak ditemukan', 'Tugas mungkin sudah dihapus guru.', '<a class="btn" href="#/siswa/tugas">Kembali</a>') + '</div>'); });
    }
  });
  on('dtMode', (el) => { Dt.mode = el.dataset.v; App.fileReset && App.fileReset('tugas'); const c = $('[name=catatan]') ? $('[name=catatan]').value : ''; App.cur.paint(detailHtml(Dt.t)); if ($('[name=catatan]')) $('[name=catatan]').value = c; });
  onForm('tugasKirim', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f), berkas = Dt.mode === 'berkas' ? fileOf('tugas') : null;
    if (Dt.mode === 'berkas' && !berkas) return toast('Pilih berkas jawaban terlebih dahulu.', 'warn');
    if (Dt.mode === 'link' && !/^https?:\/\/\S+$/i.test(v.link || '')) return fieldErr(f, 'link', 'Isi tautan yang diawali http:// atau https://');
    if (!v.jujur) return toast('Centang pernyataan integritas akademik.', 'warn');
    await busy(btn, async () => {
      const r = await post('tugas.kumpul', { tugas_id: f.dataset.id, berkas: berkas, link: Dt.mode === 'link' ? v.link : '', catatan: v.catatan }, { timeout: 180000 });
      if (!r.success) return toast(r.message, 'bad');
      fileReset('tugas'); toast(r.message, r.data.terlambat ? 'warn' : 'ok'); App.refreshBoot(); App.cur.def.view(App.cur);
    });
  });

  // ================= NILAI =================
  function nilaiHtml(d) {
    const rem = d.daftar.filter((x) => x.tuntas === false);
    return '<div class="col gap16"><div class="row between wrap"><div><span class="cap">Periode akademik</span><h3>Semester ' + esc(d.semester) + ' ' + esc(d.tahun_ajaran) + '</h3></div><button class="btn" data-act="cetakNilai">' + ic('print') + ' Cetak / simpan PDF</button></div>' +
      '<div class="g4"><div class="card stat"><span class="l">Rata-rata nilai</span><span class="v">' + fmt.n1(d.rata) + '</span><span class="small muted">dari ' + d.jumlah + ' mapel bernilai</span></div><div class="card stat"><span class="l">Ketuntasan KKM</span><span class="v">' + d.tuntas + ' / ' + d.jumlah + '</span>' + bar(d.jumlah ? d.tuntas / d.jumlah * 100 : 0) + '</div><div class="card stat ' + (rem.length ? 'bad' : '') + '" style="' + (rem.length ? 'background:var(--bad-bg);border-color:transparent' : '') + '"><span class="l">Perlu remedial</span><span class="v ' + (rem.length ? 'bad-t' : '') + '">' + rem.length + '</span><span class="small">' + (rem.length ? esc(rem.map((x) => x.mapel).join(', ')) : 'Tidak ada') + '</span></div><div class="card stat"><span class="l">Peringkat kelas</span><span class="v">' + (d.peringkat ? d.peringkat + '<small class="muted" style="font-size:16px"> / ' + d.dari + '</small>' : '–') + '</span><span class="small muted">berdasarkan rata-rata</span></div></div>' +
      '<div class="card"><div class="card-h"><h3>Perbandingan nilai vs KKM</h3></div>' + chart.bars(d.daftar.filter((x) => x.akhir !== null).map((x) => ({ label: x.mapel, short: x.mapel.split(' ')[0], value: x.akhir, bad: !x.tuntas })), d.daftar.filter((x) => x.akhir !== null)[0] ? d.daftar.filter((x) => x.akhir !== null)[0].kkm : 75) + '<div class="legend row wrap gap16 mt8"><span class="lg"><i style="background:var(--navy)"></i>Tuntas</span><span class="lg"><i style="background:#B91C1C"></i>Di bawah KKM</span></div></div>' +
      '<section class="col"><h3>Rincian per mata pelajaran</h3>' + d.daftar.map((x) => '<details class="acc" style="' + (x.tuntas === false ? 'border-color:var(--bad)' : '') + '"><summary><div class="grow"><b>' + esc(x.mapel) + '</b><div class="small muted">' + esc(x.guru) + '</div></div><div class="tc"><b style="font-size:20px" class="' + (x.tuntas === false ? 'bad-t' : '') + '">' + fmt.n1(x.akhir) + '</b><div class="small muted">KKM ' + fmt.n1(x.kkm) + '</div></div>' + (x.tuntas === null ? chip('Belum ada') : x.tuntas ? chip('Tuntas', 'ok') : chip('Remedial', 'bad')) + ic('down', 'ch') + '</summary><div class="acc-b">' + (Object.keys(x.komp).length ? '<div class="g2" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">' + Object.keys(x.komp).map((j) => '<div class="card sunk tc" style="padding:12px"><span class="cap">' + esc(j) + '</span><div><b>' + fmt.n1(x.komp[j]) + '</b></div><span class="small muted">bobot ' + (d.bobot[j] || 10) + '</span></div>').join('') + '</div>' : '<p class="muted small">Belum ada komponen nilai.</p>') + '</div></details>').join('') + '</section><p class="small muted tc">Nilai akhir = rata-rata komponen berbobot (hanya komponen yang sudah bernilai).</p></div>';
  }
  R('siswa/nilai', {
    title: 'Nilai', sub: () => 'Hasil belajar',
    view(ctx) { ctx.paint(skel(4)); load(ctx, 'nilai', 'nilai.saya', {}, 60, (d) => { App.nilaiD = d; ctx.paint(d.daftar.length ? nilaiHtml(d) : '<div class="card">' + empty('cap', 'Belum ada nilai', 'Daftar mapel akan muncul setelah jadwal kelas diatur.') + '</div>'); }); }
  });
  on('cetakNilai', () => {
    const d = App.nilaiD, m = S.boot.me;
    App.cetak('<h1>Rapor Bayangan — ' + esc(App.CFG.NAMA) + '</h1><p>' + esc(m.nama) + ' · NISN ' + esc(m.nisn) + ' · ' + esc(m.kelas) + '<br>Semester ' + esc(d.semester) + ' ' + esc(d.tahun_ajaran) + '</p><table><thead><tr><th>Mata pelajaran</th><th>Guru</th><th class="num">Nilai akhir</th><th class="num">KKM</th><th>Status</th></tr></thead><tbody>' + d.daftar.map((x) => '<tr><td>' + esc(x.mapel) + '</td><td>' + esc(x.guru) + '</td><td class="num">' + fmt.n1(x.akhir) + '</td><td class="num">' + fmt.n1(x.kkm) + '</td><td>' + (x.tuntas === null ? '-' : x.tuntas ? 'Tuntas' : 'Remedial') + '</td></tr>').join('') + '</tbody></table><p style="margin-top:10px">Rata-rata: <b>' + fmt.n1(d.rata) + '</b> · Peringkat: <b>' + (d.peringkat || '-') + ' / ' + d.dari + '</b></p><p style="font-size:10px;color:#555">Dokumen bayangan, bukan rapor resmi. Dicetak ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) + ' WITA.</p>');
  });

  // ================= PROFIL =================
  const Pf = { tab: 'profil' };
  const FIELD_LABEL = { nama: 'Nama lengkap', tgl_lahir: 'Tanggal lahir', email: 'Email', hp: 'Nomor HP siswa', nama_wali: 'Nama orang tua/wali', hp_wali: 'Nomor HP wali', alamat: 'Alamat domisili', asal_sekolah: 'Asal sekolah', kelas_id: 'Kelas / rombel' };
  function profilHtml(m, riwayat, kelas) {
    const isiField = (f) => f === 'kelas_id' ? '<select name="nilai_baru">' + kelas.map((k) => '<option value="' + esc(k.id) + '">' + esc(k.nama) + (k.sisa <= 0 ? ' (penuh)' : '') + '</option>').join('') + '</select>' : f === 'alamat' ? '<textarea name="nilai_baru"></textarea>' : '<input name="nilai_baru" type="' + (f === 'tgl_lahir' ? 'date' : f === 'email' ? 'email' : 'text') + '">';
    let body;
    if (Pf.tab === 'profil') body = '<div class="split"><div class="id-card"><div class="row">' + App.pasfoto(m.id, m.foto_id, m.nama, 'sm') + '<div><b style="font-size:18px">' + esc(m.nama) + '</b><div style="color:#B6C7E0" class="small">NISN ' + esc(m.nisn) + ' · ' + esc(m.kelas) + '</div></div></div><div class="qr-wrap" id="kartu-qr">' + skel(1, 160) + '</div><div class="tc small mt8" style="color:#B6C7E0">Kartu identitas digital · ' + esc(m.barcode) + '</div><button class="btn sm block mt8" data-act="fotoGanti">' + ic('camera', 'sm') + ' ' + (m.foto_id ? 'Ganti foto profil' : 'Unggah pas foto') + '</button></div><div class="card col"><h3>Data saya</h3>' + [['Nama', m.nama], ['Jenis kelamin', m.jk === 'L' ? 'Laki-laki' : 'Perempuan'], ['Tanggal lahir', fmt.tgl(m.tgl_lahir)], ['Email', m.email || '–'], ['HP', m.hp || '–'], ['Orang tua/wali', (m.nama_wali || '–') + (m.hp_wali ? ' · ' + m.hp_wali : '')], ['Alamat', m.alamat || '–'], ['Asal sekolah', m.asal_sekolah || '–'], ['Tahun ajaran', m.semester + ' ' + m.tahun_ajaran]].map((r) => '<div class="li"><span class="muted small" style="width:120px;flex:none">' + esc(r[0]) + '</span><b class="grow" style="word-break:break-word">' + esc(r[1]) + '</b></div>').join('') + '<div class="callout">' + ic('lock') + '<span>Data pokok dikunci. Untuk mengubahnya, ajukan perubahan di tab <b>Pengajuan ubah</b>; Tata Usaha akan memverifikasi.</span></div></div></div>';
    else body = '<div class="split"><form class="card col" data-submit="ubahKirim" novalidate><div class="callout">' + ic('info') + '<span>Perubahan data pokok memerlukan verifikasi Tata Usaha. Lampirkan dokumen pendukung bila ada.</span></div>' + field('Data yang ingin diubah', sel('field', Object.keys(FIELD_LABEL).map((k) => [k, FIELD_LABEL[k]]), 'hp').replace('<select ', '<select data-change="ubahField" '), { req: 1 }) + '<div class="field"><label>Nilai terdaftar saat ini</label><input id="ubah-lama" value="" readonly style="background:var(--surface-2)"></div><div class="field" id="ubah-baru-w"><label class="req">Nilai baru yang diajukan</label>' + isiField('hp') + '</div>' + field('Alasan / justifikasi', '<textarea name="alasan" maxlength="250" placeholder="Jelaskan alasan perubahan"></textarea>', { req: 1, hint: 'Min. 10 karakter, maks. 250.' }) + '<div class="field"><label>Dokumen pendukung (opsional)</label>' + dropzone('lampiran', { title: 'Unggah dokumen', hint: 'PDF/JPG/PNG · maks. 5 MB', accept: '.pdf,.jpg,.jpeg,.png', max: 5 }) + '</div><button class="btn primary lg block" type="submit">' + ic('send') + ' Ajukan perubahan data</button></form><section class="card"><h3 class="mb8">Riwayat pengajuan</h3>' + (riwayat.length ? riwayat.map((u) => '<div class="li"><div class="grow"><b class="mono small">' + esc(u.id) + '</b> · ' + esc(fmt.tgl(u.created.slice(0, 10))) + '<div>' + esc(u.label) + ': <span class="muted">' + esc(u.lama || '–') + '</span> → <b>' + esc(u.baru) + '</b></div>' + (u.catatan_admin ? '<div class="small muted">Catatan TU: ' + esc(u.catatan_admin) + '</div>' : '') + '</div>' + chip(u.status, u.status === 'Disetujui' ? 'ok' : u.status === 'Ditolak' ? 'bad' : 'warn') + '</div>').join('') : empty('history', 'Belum ada pengajuan', 'Riwayat pengajuan Anda akan tampil di sini.')) + '</section></div>';
    return '<div class="col gap16"><div class="tabs"><button class="' + (Pf.tab === 'profil' ? 'on' : '') + '" data-act="pfTab" data-v="profil">Profil saya</button><button class="' + (Pf.tab === 'ubah' ? 'on' : '') + '" data-act="pfTab" data-v="ubah">Pengajuan ubah ' + (riwayat.some((u) => u.status === 'Menunggu') ? '<span class="dot"></span>' : '') + '</button></div>' + body + '<div class="row wrap"><button class="btn" data-act="gantiSandi">' + ic('lock') + ' Ganti PIN</button><button class="btn danger" data-act="keluar">' + ic('logout') + ' Keluar</button></div></div>';
  }
  R('siswa/profil', {
    title: 'Profil', sub: () => 'Identitas & pengajuan',
    async view(ctx) {
      Pf.tab = ctx.q.tab === 'ubah' ? 'ubah' : 'profil'; ctx.paint(skel(3));
      const [b, rw, op] = await Promise.all([App.refreshBoot(), api('profil.riwayat', {}, { silent: true }), api('daftar.opsi', {}, { silent: true })]);
      if (!ctx.alive()) return; Pf.m = (b || S.boot).me; Pf.rw = rw.success ? rw.data : []; Pf.kelas = op.success ? op.data.kelas : []; renderProfil();
    }
  });
  async function renderProfil() {
    App.cur.paint(profilHtml(Pf.m, Pf.rw, Pf.kelas));
    if (Pf.tab === 'profil') { const el = $('#kartu-qr'); if (el) el.innerHTML = await App.qrSvg(Pf.m.barcode); } else ubahField($('[name=field]'));
  }
  on('pfTab', (el) => { Pf.tab = el.dataset.v; renderProfil(); });
  function ubahField(el) {
    if (!el) return; const f = el.value, m = Pf.m, lama = f === 'kelas_id' ? m.kelas : f === 'jk' ? m.jk : (m[f] || '');
    $('#ubah-lama').value = lama || '–';
    const w = $('#ubah-baru-w'); const tipe = f === 'tgl_lahir' ? 'date' : f === 'email' ? 'email' : 'text';
    w.innerHTML = '<label class="req">Nilai baru yang diajukan</label>' + (f === 'kelas_id' ? '<select name="nilai_baru">' + Pf.kelas.filter((k) => k.nama !== m.kelas).map((k) => '<option value="' + esc(k.id) + '"' + (k.sisa <= 0 ? ' disabled' : '') + '>' + esc(k.nama) + (k.sisa <= 0 ? ' (penuh)' : '') + '</option>').join('') + '</select>' : f === 'alamat' ? '<textarea name="nilai_baru"></textarea>' : '<input name="nilai_baru" type="' + tipe + '">');
  }
  on('ubahField', ubahField);
  onForm('ubahKirim', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f);
    if (!String(v.nilai_baru || '').trim()) return fieldErr(f, 'nilai_baru', 'Isi nilai baru.');
    if (v.alasan.trim().length < 10) return fieldErr(f, 'alasan', 'Alasan minimal 10 karakter.');
    await busy(btn, async () => { const r = await post('profil.ubah', { field: v.field, nilai_baru: v.nilai_baru, alasan: v.alasan, lampiran: fileOf('lampiran') }, { timeout: 120000 }); if (!r.success) return toast(r.message, 'bad'); fileReset('lampiran'); toast(r.message, 'ok'); App.cur.def.view(App.cur); });
  });
})();
