/**
 * auth.js — halaman publik: beranda, masuk (siswa/guru/admin), atur PIN, registrasi, cek status.
 */
(function () {
  'use strict';
  const { $, $$, esc, ic, fmt, api, post, toast, busy, formVal, fieldErr, field, sel, load, route, on, onForm, go, chip, empty, skel, S, Store, dropzone, fileOf, modal } = App;
  const NAMA = (App.CFG && App.CFG.NAMA) || 'SMKN 1 Berau';

  const pubNav = (aktif) => '<header class="pnav"><div class="in"><a class="brand" href="#/" style="text-decoration:none"><div class="logo js-logo' + App.logoCls() + '" style="background:var(--navy);width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#fff;font-family:var(--f-head);font-weight:800">' + App.logoIsi() + '</div><div><b class="js-nama" style="font-family:var(--f-head)">' + esc(App.CFG.NAMA || 'SMKN 1 Berau') + '</b><small style="display:block;color:var(--muted);font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:700">Sistem Informasi Akademik</small></div></a><span class="grow"></span><button class="btn icon ghost" data-act="tema" aria-label="Ganti tema">' + ic('moon') + '</button><a class="btn primary" href="#/masuk">Masuk</a></div></header>';
  const foot = () => '<div class="foot-note"><span>' + ic('shield-check', 'sm') + ' Data terenkripsi · Sesi diaudit</span><span>© ' + new Date().getFullYear() + ' ' + esc(App.CFG.NAMA || 'SMKN 1 Berau') + '</span></div>';
  const kartuLogo = () => '<div class="row" style="margin-bottom:16px"><div class="logo-t js-logo' + App.logoCls() + '">' + App.logoIsi() + (App.logoCls() ? '' : '<span class="vf">' + ic('check', 'sm').replace('class="ic ', 'style="color:#fff;width:12px;height:12px" class="ic ') + '</span>') + '</div><div><h2 class="js-nama" style="font-size:20px">' + esc(App.CFG.NAMA || 'SMKN 1 Berau') + '</h2><span class="muted small">Sistem Informasi Akademik · Presensi Digital</span></div></div>';

  // ================= BERANDA PUBLIK =================
  route('', {
    title: '',
    view(ctx) {
      ctx.paint(pubNav() + '<div class="pwrap"><div class="skel card" style="height:220px"></div>' + skel(2) + '</div>');
      load(ctx, 'pub', 'publik.beranda', {}, 300, (d) => {
        ctx.paint(pubNav() + '<div class="pwrap col gap24">' +
          '<section class="hero"><span class="chip teal" style="background:rgba(255,255,255,.14);color:#fff">T.A. ' + esc(d.tahunAjaran) + ' · ' + esc(d.semester) + '</span><h1 style="margin-top:12px">Presensi, tugas, dan nilai<br>dalam satu aplikasi.</h1><p>Siswa mencatat kehadiran dengan memindai QR di kelas, mengumpulkan tugas, dan memantau nilai. Guru merekap kehadiran otomatis.</p><div class="row wrap"><a class="btn primary lg" href="#/masuk">Masuk</a>' + (d.regSiswa ? '<a class="btn lg" href="#/daftar-siswa">Daftar siswa baru</a>' : '') + (d.regGuru ? '<a class="btn lg ghost" style="color:#fff" href="#/daftar-guru">Daftar guru</a>' : '') + '</div></section>' +
          '<section><div class="page-h"><h2>Pengumuman</h2></div>' + (d.pengumuman.length ? '<div class="g2 g2-md">' + d.pengumuman.map((p) => '<article class="card"><div class="row between top"><h4>' + esc(p.judul) + '</h4>' + chip(fmt.tgl(p.tanggal), 'teal') + '</div><p class="muted mt8" style="white-space:pre-line">' + esc(p.isi) + '</p></article>').join('') + '</div>' : '<div class="card">' + empty('mega', 'Belum ada pengumuman', 'Pengumuman sekolah akan tampil di sini.') + '</div>') + '</section>' +
          '<section><div class="page-h"><div><h2>Jadwal pelajaran</h2><p>Pilih kelas untuk melihat jadwal mingguan.</p></div><div style="min-width:200px">' + sel('kelas', d.kelas.map((k) => [k.id, k.nama]), '', 'Pilih kelas…').replace('<select ', '<select data-change="jadwalPub" ') + '</div></div><div id="jadwal-pub" class="card">' + empty('calendar', 'Pilih kelas', 'Jadwal akan tampil setelah kelas dipilih.') + '</div></section>' + foot() + '</div>');
      });
    }
  });
  on('jadwalPub', async (el) => {
    const box = $('#jadwal-pub'); if (!el.value) return;
    box.innerHTML = skel(1, 160); const r = await api('publik.jadwal', { kelas_id: el.value }, { silent: true });
    if (!r.success) return (box.innerHTML = empty('alert', 'Gagal memuat', r.message));
    if (!r.data.length) return (box.innerHTML = empty('calendar', 'Belum ada jadwal', 'Jadwal kelas ini belum diatur.'));
    box.innerHTML = '<div class="tbl-wrap" style="border:0"><table class="tbl"><thead><tr><th>Hari</th><th>Jam</th><th>Mata pelajaran</th><th>Guru</th><th>Ruang</th></tr></thead><tbody>' + r.data.map((j) => '<tr><td><b>' + App.HARI[j.hari] + '</b></td><td class="nowrap">' + esc(j.mulai) + '–' + esc(j.selesai) + '</td><td>' + esc(j.mapel) + '</td><td>' + esc(j.guru) + '</td><td>' + esc(j.ruang || '–') + '</td></tr>').join('') + '</tbody></table></div>';
  });

  // ================= MASUK =================
  let peran = 'siswa', cfgPub = null;
  const SANDI_MATA = (nama) => '<div class="input-icon">' + ic('lock') + '<input type="password" name="' + nama + '" required autocomplete="current-password"><button type="button" class="btn icon sm ghost tog" data-act="lihatSandi" aria-label="Tampilkan">' + ic('eye') + '</button></div>';
  function loginForm() {
    const gbtn = cfgPub && cfgPub.googleClientId && peran !== 'admin' ? '<div id="gbtn" style="display:flex;justify-content:center;min-height:44px"></div><div class="row gap8 muted small" style="margin:12px 0"><hr class="grow" style="border:0;border-top:1px solid var(--line)"><span class="cap">atau gunakan ' + (peran === 'siswa' ? 'NISN' : 'NIP') + '</span><hr class="grow" style="border:0;border-top:1px solid var(--line)"></div>' : '';
    const info = peran === 'siswa' ? '<div class="callout">' + ic('clock') + '<span>Presensi dilakukan di kelas dengan memindai QR dari layar guru.</span></div>' : peran === 'guru' ? '<div class="callout">' + ic('info') + '<span>Guru baru perlu mendaftar dan menunggu persetujuan admin.</span></div>' : '<div class="callout warn">' + ic('shield') + '<span><b>Protokol keamanan ketat.</b> Akses admin memerlukan kode 2FA dari aplikasi autentikator. Seluruh aktivitas dicatat.</span></div>';
    let f;
    if (peran === 'siswa') f = field('NISN', '<div class="input-icon">' + ic('user') + '<input name="id" inputmode="numeric" maxlength="10" autocomplete="username" placeholder="Contoh: 0064829103" required></div>', { req: 1 }) + field('PIN', SANDI_MATA('secret').replace('required', 'required inputmode="numeric" maxlength="6" placeholder="6 angka"'), { req: 1 });
    else if (peran === 'guru') f = field('NIP / NUPTK', '<div class="input-icon">' + ic('user') + '<input name="id" autocomplete="username" placeholder="Contoh: 198203152008011004" required></div>', { req: 1 }) + field('Kata sandi', SANDI_MATA('secret'), { req: 1 });
    else f = field('Admin ID', '<div class="input-icon">' + ic('user') + '<input name="id" autocomplete="username" placeholder="ADM-…" required></div>', { req: 1 }) + field('Kata sandi', SANDI_MATA('secret'), { req: 1 }) + field('Kode 2FA (6 angka)', '<div class="otp">' + [0, 1, 2, 3, 4, 5].map((i) => '<input inputmode="numeric" maxlength="1" data-otp="' + i + '" aria-label="Digit ' + (i + 1) + '" autocomplete="' + (i ? 'off' : 'one-time-code') + '">').join('') + '</div>', { hint: 'Kode berganti setiap 30 detik di Google Authenticator atau aplikasi serupa.' });
    return info + gbtn + '<form class="col" data-submit="login" novalidate>' + f + '<div id="login-msg"></div><button class="btn primary lg block" type="submit">' + ({ siswa: 'Masuk ke aplikasi siswa', guru: 'Masuk ke panel guru', admin: 'Autentikasi hak akses admin' }[peran]) + ' ' + ic('right') + '</button></form>' +
      '<div class="col gap8 mt16 small tc">' + (peran === 'siswa' ? '<span class="muted">Belum punya akun? <a href="#/daftar-siswa"><b>Daftar siswa baru</b></a></span><span class="muted">Akun dari data sekolah belum punya PIN? <a href="#/atur-pin"><b>Atur PIN</b></a></span>' : peran === 'guru' ? '<span class="muted">Pendidik baru? <a href="#/daftar-guru"><b>Daftar akun guru</b></a></span>' : '<span class="muted">Kendala akun? Hubungi pengelola TIK sekolah.</span>') + (peran !== 'admin' ? '<a href="#" data-act="cekStatus">Cek status pendaftaran</a>' : '') + '</div>';
  }
  function loginPage(ctx) {
    const q = ctx.q.peran; if (['siswa', 'guru', 'admin'].indexOf(q) > -1) peran = q;
    ctx.paint(pubNav() + '<div class="auth-wrap">' + kartuLogo() + '<div class="seg mb16" role="tablist">' + [['siswa', 'cap', 'Siswa'], ['guru', 'book', 'Guru'], ['admin', 'shield', 'Admin']].map((t) => '<button type="button" role="tab" class="' + (peran === t[0] ? 'on' : '') + '" data-act="peran" data-v="' + t[0] + '">' + ic(t[1], 'sm') + ' ' + t[2] + '</button>').join('') + '</div><div class="card col" id="login-card">' + loginForm() + '</div>' + foot() + '</div>');
    initGoogle();
  }
  async function initGoogle() {
    const host = $('#gbtn'); if (!host) return;
    try {
      await App.lib('gsi');
      window.google.accounts.id.initialize({ client_id: cfgPub.googleClientId, callback: async (resp) => { const r = await api('auth.google', { idToken: resp.credential }); selesaiLogin(r); }, ux_mode: 'popup' });
      window.google.accounts.id.renderButton(host, { theme: 'outline', size: 'large', text: 'signin_with', width: Math.min(360, host.parentElement.clientWidth - 32), locale: 'id' });
    } catch (e) { host.innerHTML = '<span class="small muted">Login Google tidak tersedia saat ini.</span>'; }
  }
  route('masuk', {
    title: 'Masuk',
    async view(ctx) {
      if (!cfgPub) { const c = Store.get('cfgpub'); if (c) cfgPub = c; }
      loginPage(ctx);
      const r = await api('auth.config', {}, { silent: true });
      if (r.success && ctx.alive()) { const baru = JSON.stringify(r.data) !== JSON.stringify(cfgPub); cfgPub = r.data; Store.set('cfgpub', r.data); if (baru && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) loginPage(ctx); }
    }
  });
  on('peran', (el) => { peran = el.dataset.v; loginPage(App.cur); });
  on('lihatSandi', (el) => { const i = el.parentElement.querySelector('input'); const t = i.type === 'password'; i.type = t ? 'text' : 'password'; el.innerHTML = ic(t ? 'eye-off' : 'eye'); });
  function selesaiLogin(r) {
    const box = $('#login-msg');
    if (!r.success) {
      const code = r.data && r.data.code;
      if (box) box.innerHTML = '<div class="callout ' + (code === 'PENDING' ? 'warn' : 'bad') + '">' + ic(code === 'PENDING' ? 'clock' : 'alert') + '<span>' + esc(r.message) + (code === 'NO_PIN' ? ' <a href="#/atur-pin"><b>Atur PIN sekarang</b></a>' : '') + '</span></div>';
      else toast(r.message, 'bad');
      return false;
    }
    App.masuk(r.data); toast('Selamat datang, ' + r.data.me.nama.split(' ')[0] + '!', 'ok'); go(App.homeOf(r.data.me.role)); if (r.data.wajibGanti) setTimeout(() => { App.toast('Ganti kata sandi awal Anda sekarang.', 'warn', 6000); App.aksi('gantiSandi'); }, 700); return true;
  }
  onForm('login', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f);
    if (peran === 'admin') v.otp = $$('[data-otp]', f).map((i) => i.value).join('');
    if (!v.id || !v.secret) return toast('Lengkapi data masuk.', 'warn');
    if (peran === 'siswa' && !/^\d{6}$/.test(v.secret)) return fieldErr(f, 'secret', 'PIN terdiri dari 6 angka.');
    if (peran === 'admin' && !/^\d{6}$/.test(v.otp || '')) return toast('Isi 6 digit kode 2FA.', 'warn');
    await busy(btn, async () => { const r = await api('auth.login', { peran: peran, id: v.id, secret: v.secret, otp: v.otp }); selesaiLogin(r); });
  });

  // ================= ATUR PIN =================
  route('atur-pin', {
    title: 'Atur PIN',
    view(ctx) {
      ctx.paint(pubNav() + '<div class="auth-wrap">' + kartuLogo() + '<div class="card col"><h3>Atur PIN pertama kali</h3><p class="muted small">Untuk siswa yang datanya sudah dimasukkan sekolah. Verifikasi dengan NISN dan tanggal lahir.</p><form class="col" data-submit="aturPin" novalidate>' + field('NISN', '<input name="nisn" inputmode="numeric" maxlength="10" required>', { req: 1 }) + field('Tanggal lahir', '<input type="date" name="tgl_lahir" required>', { req: 1 }) + field('PIN baru (6 angka)', '<input type="password" name="pin" inputmode="numeric" maxlength="6" required autocomplete="new-password">', { req: 1 }) + field('Ulangi PIN', '<input type="password" name="pin2" inputmode="numeric" maxlength="6" required autocomplete="new-password">', { req: 1 }) + '<button class="btn primary lg block" type="submit">Simpan PIN</button></form><a class="small tc" href="#/masuk">← Kembali ke halaman masuk</a></div>' + foot() + '</div>');
    }
  });
  onForm('aturPin', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f);
    if (!/^\d{10}$/.test(v.nisn)) return fieldErr(f, 'nisn', 'NISN terdiri dari 10 angka.');
    if (!v.tgl_lahir) return fieldErr(f, 'tgl_lahir', 'Isi tanggal lahir.');
    if (!/^\d{6}$/.test(v.pin)) return fieldErr(f, 'pin', 'PIN harus 6 angka.');
    if (v.pin !== v.pin2) return fieldErr(f, 'pin2', 'PIN tidak sama.');
    await busy(btn, async () => { const r = await post('auth.aturPin', { nisn: v.nisn, tgl_lahir: v.tgl_lahir, pin: v.pin }); if (!r.success) return toast(r.message, 'bad'); toast('PIN berhasil diatur. Silakan masuk.', 'ok'); go('#/masuk'); });
  });

  // ================= CEK STATUS =================
  on('cekStatus', () => {
    modal({ title: 'Cek status pendaftaran', body: '<form class="col" data-submit="cekStatus">' + field('Jenis', sel('jenis', [['siswa', 'Siswa (NISN)'], ['guru', 'Guru (NIP/NUPTK)']], 'siswa')) + field('NISN / NIP', '<input name="id" required>', { req: 1 }) + '<div id="status-out"></div><button class="btn primary block" type="submit">Periksa</button></form>' });
  });
  onForm('cekStatus', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f), out = $('#status-out');
    await busy(btn, async () => {
      const r = await api('daftar.status', v, { silent: true });
      if (!r.success) return (out.innerHTML = '<div class="callout bad">' + ic('alert') + '<span>' + esc(r.message) + '</span></div>');
      const k = { Aktif: ['ok', 'check-circle', 'Akun aktif. Anda sudah dapat masuk.'], Menunggu: ['warn', 'clock', 'Menunggu verifikasi admin. Biasanya diproses dalam 1×24 jam kerja.'], Ditolak: ['bad', 'x-circle', 'Pendaftaran ditolak.' + (r.data.alasan ? ' Alasan: ' + r.data.alasan : '')], Nonaktif: ['bad', 'lock', 'Akun dinonaktifkan. Hubungi Tata Usaha.'] }[r.data.status] || ['', 'info', r.data.status];
      out.innerHTML = '<div class="callout ' + k[0] + '">' + ic(k[1]) + '<span><b>' + esc(r.data.nama) + '</b> · ' + esc(k[2]) + '</span></div>';
    });
  });

  // ================= DAFTAR SISWA =================
  const D = { step: 1, opsi: null, pos: null, selesai: null };
  function stepper(n, labels) { return '<div class="stepper">' + labels.map((l, i) => '<div class="st ' + (n === i + 1 ? 'on' : n > i + 1 ? 'done' : '') + '"><i>' + (n > i + 1 ? '✓' : i + 1) + '</i><span class="only-d">' + esc(l) + '</span></div>' + (i < labels.length - 1 ? '<div class="ln ' + (n > i + 1 ? 'done' : '') + '"></div>' : '')).join('') + '</div>'; }
  function atributInput(a) {
    const n = 'x_' + a.key, w = a.wajib ? '' : ' (opsional)';
    if (a.tipe === 'pilihan') return field(a.nama + w, sel(n, String(a.opsi).split(',').map((x) => x.trim()).filter(Boolean), '', 'Pilih…'), { req: a.wajib });
    return field(a.nama + w, '<input name="' + n + '" type="' + (a.tipe === 'tanggal' ? 'date' : a.tipe === 'angka' ? 'number' : 'text') + '">', { req: a.wajib });
  }
  function dsView(ctx) {
    const o = D.opsi;
    if (D.selesai) { ctx.paint(pubNav() + '<div class="auth-wrap">' + '<div class="card col tc" style="align-items:center"><div class="ico-tile" style="width:64px;height:64px;border-radius:20px">' + ic('check-circle', 'xl') + '</div><h2>Pendaftaran terkirim</h2><p class="muted">Kode referensi <b class="mono">' + esc(D.selesai.ref) + '</b>. Akun Anda berstatus <b>Menunggu verifikasi admin</b> (maks. 1×24 jam kerja). Setelah disetujui, masuk dengan NISN dan PIN yang tadi Anda buat.</p><a class="btn primary" href="#/masuk">Ke halaman masuk</a><a href="#" data-act="cekStatus" class="small">Cek status pendaftaran</a></div></div>'); return; }
    if (!o.regSiswa) { ctx.paint(pubNav() + '<div class="auth-wrap"><div class="card">' + empty('lock', 'Pendaftaran ditutup', 'Pendaftaran siswa baru sedang tidak dibuka. Hubungi Tata Usaha.', '<a class="btn" href="#/">Kembali</a>') + '</div></div>'); return; }
    ctx.paint(pubNav() + '<div class="auth-wrap wide"><div class="page-h"><div><h1>Formulir pendaftaran siswa</h1><p>Isi data dengan benar sesuai dokumen resmi. Data digunakan untuk verifikasi oleh Tata Usaha.</p></div></div>' + stepper(1, ['Data pribadi & akun', 'Kelas & domisili', 'Tinjau & kirim']) + '<form class="col mt16" id="ds-form" data-submit="dsKirim" novalidate>' +
      '<div data-step="1" class="col"><div class="card col"><div class="row"><div class="ico-tile">' + ic('camera') + '</div><div><h3>Pas foto resmi</h3><span class="small muted">Wajib · ukuran 3×4 · akan menjadi foto profil Anda</span></div></div>' + App.fpHtml('ds') + '</div><div class="card col"><h3>Data pribadi siswa</h3>' + field('NISN', '<input name="nisn" inputmode="numeric" maxlength="10" placeholder="10 angka">', { req: 1, hint: 'Nomor Induk Siswa Nasional, 10 digit.' }) + field('Nama lengkap (sesuai ijazah/akta)', '<input name="nama" autocomplete="name">', { req: 1 }) +
      '<div class="g2">' + field('Jenis kelamin', '<div class="row gap16" style="min-height:46px"><label class="check"><input type="radio" name="jk" value="L"> Laki-laki</label><label class="check"><input type="radio" name="jk" value="P"> Perempuan</label></div>', { req: 1 }) + field('Tanggal lahir', '<input type="date" name="tgl_lahir">', { req: 1 }) + '</div>' +
      '<div class="g2 g2-md" style="grid-template-columns:1fr">' + field('Email aktif', '<input type="email" name="email" autocomplete="email" placeholder="siswa@gmail.com">', { req: 1, hint: 'Dipakai untuk notifikasi dan, bila mau, masuk dengan Google.' }) + field('Nomor WhatsApp/HP siswa', '<input name="hp" inputmode="tel" placeholder="08xxxxxxxxxx">', { req: 1 }) + '</div></div>' +
      '<div class="card col"><h3>Orang tua / wali</h3>' + field('Nama orang tua / wali', '<input name="nama_wali">', { req: 1 }) + field('Nomor HP wali', '<input name="hp_wali" inputmode="tel" placeholder="08xxxxxxxxxx">', { req: 1 }) + '</div>' +
      '<div class="card col"><h3>Keamanan akun</h3><div class="g2">' + field('PIN (6 angka)', '<input type="password" name="pin" inputmode="numeric" maxlength="6" autocomplete="new-password">', { req: 1 }) + field('Ulangi PIN', '<input type="password" name="pin2" inputmode="numeric" maxlength="6" autocomplete="new-password">', { req: 1 }) + '</div></div></div>' +
      '<div data-step="2" class="col" hidden><div class="card col"><h3>Pilihan kelas</h3>' + field('Kelas / rombel', sel('kelas_id', o.kelas.map((k) => [k.id, k.nama + ' — ' + (k.jurusan || '') + (k.sisa <= 0 ? ' (penuh)' : ' (sisa ' + k.sisa + ' kursi)')]), '', 'Pilih kelas…'), { req: 1 }) + (o.atribut.length ? o.atribut.map(atributInput).join('') : '') + '</div>' +
      '<div class="card col"><h3>Asal sekolah & domisili</h3>' + field('Asal sekolah (SMP/MTs)', '<input name="asal_sekolah" placeholder="SMP Negeri 1 …">') + field('Alamat domisili lengkap', '<textarea name="alamat" placeholder="Jl., RT/RW, kelurahan, kecamatan"></textarea>', { req: 1 }) + '<div class="callout">' + ic('pin') + '<span id="gps-info">Titik lokasi rumah (opsional) membantu guru memeriksa kesesuaian lokasi bukti sakit. Tidak dipakai untuk melacak Anda.</span></div><button type="button" class="btn" data-act="dsGps">' + ic('pin') + ' Deteksi lokasi rumah</button></div></div>' +
      '<div data-step="3" class="col" hidden><div class="card col" id="ds-ringkas"></div><div class="card col"><label class="check"><input type="checkbox" name="setuju"><span>Saya menyatakan bahwa seluruh data yang diisi benar dan sesuai dokumen asli. Jika ditemukan ketidaksesuaian, saya bersedia akunnya ditolak atau dinonaktifkan.</span></label><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"></div></div>' +
      '<div class="row between"><button type="button" class="btn" data-act="dsPrev" id="ds-prev" hidden>' + ic('left') + ' Kembali</button><span class="grow"></span><button type="button" class="btn primary" data-act="dsNext" id="ds-next">Lanjut ' + ic('right') + '</button><button type="submit" class="btn primary" id="ds-submit" hidden>' + ic('send') + ' Kirim pendaftaran</button></div></form>' + foot() + '</div>');
  }
  route('daftar-siswa', {
    title: 'Daftar siswa',
    async view(ctx) {
      D.step = 1; D.selesai = null; D.pos = null; ctx.paint(pubNav() + '<div class="auth-wrap wide">' + skel(3) + '</div>');
      const r = await api('daftar.opsi', {}, { silent: true });
      if (!r.success) return ctx.paint(pubNav() + '<div class="auth-wrap"><div class="card">' + empty('alert', 'Gagal memuat formulir', r.message, '<button class="btn primary" data-act="muatUlang">Coba lagi</button>') + '</div></div>');
      D.opsi = r.data; D.ctx = ctx; dsView(ctx);
    }
  });
  function dsTampil() {
    $$('[data-step]').forEach((s) => { s.hidden = +s.dataset.step !== D.step; });
    $('#ds-prev').hidden = D.step === 1; $('#ds-next').hidden = D.step === 3; $('#ds-submit').hidden = D.step !== 3;
    const st = $('.stepper'); st.outerHTML = stepper(D.step, ['Data pribadi & akun', 'Kelas & domisili', 'Tinjau & kirim']); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function dsValid(f, n) {
    const v = formVal(f), E = (name, msg) => { fieldErr(f, name, msg); return false; };
    if (n === 1) {
      if (!App.fotoAda('ds')) { toast('Unggah pas foto resmi 3×4 terlebih dahulu.', 'warn'); const p = $('.foto-picker'); if (p) p.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
      if (!/^\d{10}$/.test(v.nisn)) return E('nisn', 'NISN harus 10 angka.');
      if (v.nama.trim().length < 3) return E('nama', 'Isi nama lengkap.');
      if (!v.jk) { toast('Pilih jenis kelamin.', 'warn'); return false; }
      if (!v.tgl_lahir) return E('tgl_lahir', 'Isi tanggal lahir.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return E('email', 'Email tidak valid.');
      if (v.hp.replace(/\D/g, '').length < 9) return E('hp', 'Nomor HP tidak valid.');
      if (v.nama_wali.trim().length < 3) return E('nama_wali', 'Isi nama orang tua/wali.');
      if (v.hp_wali.replace(/\D/g, '').length < 9) return E('hp_wali', 'Nomor HP wali tidak valid.');
      if (!/^\d{6}$/.test(v.pin)) return E('pin', 'PIN harus 6 angka.');
      if (v.pin !== v.pin2) return E('pin2', 'PIN tidak sama.');
    }
    if (n === 2) {
      if (!v.kelas_id) return E('kelas_id', 'Pilih kelas.');
      const k = D.opsi.kelas.find((x) => x.id === v.kelas_id); if (k && k.sisa <= 0) return E('kelas_id', 'Kuota kelas ini penuh. Pilih kelas lain.');
      for (const a of D.opsi.atribut) if (a.wajib && !String(v['x_' + a.key] || '').trim()) return E('x_' + a.key, a.nama + ' wajib diisi.');
      if (v.alamat.trim().length < 5) return E('alamat', 'Isi alamat domisili.');
    }
    return true;
  }
  on('dsNext', () => { const f = $('#ds-form'); if (!dsValid(f, D.step)) return; D.step++; if (D.step === 3) dsRingkas(f); dsTampil(); });
  on('dsPrev', () => { D.step--; dsTampil(); });
  function dsRingkas(f) {
    const v = formVal(f), k = D.opsi.kelas.find((x) => x.id === v.kelas_id);
    const rows = [['NISN', v.nisn], ['Nama', v.nama], ['Jenis kelamin', v.jk === 'L' ? 'Laki-laki' : 'Perempuan'], ['Tanggal lahir', fmt.tgl(v.tgl_lahir)], ['Email', v.email], ['HP siswa', v.hp], ['Orang tua/wali', v.nama_wali + ' · ' + v.hp_wali], ['Kelas', k ? k.nama : '-'], ['Asal sekolah', v.asal_sekolah || '–'], ['Alamat', v.alamat]].concat(D.opsi.atribut.map((a) => [a.nama, v['x_' + a.key] || '–'])).concat(D.pos ? [['Lokasi rumah', D.pos.lat + ', ' + D.pos.lng]] : []);
    $('#ds-ringkas').innerHTML = '<h3>Periksa kembali data Anda</h3><div class="pasfoto has-foto sm" style="background-image:url(' + App.fotoPratinjau('ds') + ')" role="img" aria-label="Pas foto"></div>' + rows.map((r) => '<div class="li"><span class="muted small" style="width:130px;flex:none">' + esc(r[0]) + '</span><b class="grow" style="word-break:break-word">' + esc(r[1]) + '</b></div>').join('');
  }
  on('dsGps', async (el) => { await busy(el, async () => { const p = await App.getPos(12000); if (!p) return toast('Lokasi tidak dapat dibaca. Izinkan akses lokasi di peramban.', 'warn'); D.pos = p; $('#gps-info').innerHTML = '<b>Lokasi tersimpan</b> (akurasi ±' + p.akurasi + ' m): ' + p.lat + ', ' + p.lng; toast('Lokasi rumah terdeteksi.', 'ok'); }); });
  onForm('dsKirim', async (f) => {
    const v = formVal(f), btn = $('#ds-submit');
    if (!v.setuju) return toast('Centang pernyataan kebenaran data.', 'warn');
    const extra = {}; D.opsi.atribut.forEach((a) => { if (v['x_' + a.key]) extra[a.key] = v['x_' + a.key]; });
    await busy(btn, async () => {
      let foto; try { foto = await App.fotoAmbil('ds'); } catch (e) { return toast(e.message, 'bad'); }
      if (!foto) { D.step = 1; dsTampil(); return toast('Unggah pas foto resmi 3×4.', 'warn'); }
      const r = await post('daftar.siswa', { foto: foto, nisn: v.nisn, nama: v.nama, jk: v.jk, tgl_lahir: v.tgl_lahir, email: v.email, hp: v.hp, nama_wali: v.nama_wali, hp_wali: v.hp_wali, pin: v.pin, kelas_id: v.kelas_id, asal_sekolah: v.asal_sekolah, alamat: v.alamat, lat: D.pos ? D.pos.lat : '', lng: D.pos ? D.pos.lng : '', extra: extra, setuju: true, website: v.website });
      if (!r.success) { toast(r.message, 'bad'); if (/NISN|Email/.test(r.message)) { D.step = 1; dsTampil(); } return; }
      App.fotoReset('ds'); D.selesai = r.data; dsView(D.ctx);
    });
  });

  // ================= DAFTAR GURU =================
  const G = { tab: 'form', opsi: null, selesai: null };
  function guruView(ctx) {
    const o = G.opsi;
    if (G.selesai) return ctx.paint(pubNav() + '<div class="auth-wrap"><div class="card col tc" style="align-items:center"><div class="ico-tile" style="width:64px;height:64px;border-radius:20px">' + ic('check-circle', 'xl') + '</div><h2>Pendaftaran terkirim</h2><p class="muted">Kode referensi <b class="mono">' + esc(G.selesai.ref) + '</b>. Data diteruskan ke Tata Usaha untuk validasi NIP/NUPTK dan SK. Anda dapat memeriksa statusnya kapan saja.</p><a class="btn primary" href="#/masuk?peran=guru">Ke halaman masuk</a></div></div>');
    const tabs = '<div class="seg mb16"><button type="button" class="' + (G.tab === 'form' ? 'on' : '') + '" data-act="guruTab" data-v="form">' + ic('edit', 'sm') + ' Formulir guru baru</button><button type="button" class="' + (G.tab === 'status' ? 'on' : '') + '" data-act="guruTab" data-v="status">' + ic('clock', 'sm') + ' Cek status</button></div>';
    let body;
    if (G.tab === 'status') body = '<div class="card col"><form class="col" data-submit="cekStatus">' + '<input type="hidden" name="jenis" value="guru">' + field('NIP / NUPTK', '<input name="id" required>', { req: 1 }) + '<div id="status-out"></div><button class="btn primary block" type="submit">Periksa status</button></form></div>';
    else if (!o.regGuru) body = '<div class="card">' + empty('lock', 'Pendaftaran ditutup', 'Hubungi Tata Usaha untuk membuat akun guru.') + '</div>';
    else body = '<form class="col" data-submit="guruKirim" novalidate><div class="card col"><div class="row"><div class="ico-tile">' + ic('cap') + '</div><div><h3>Data identitas resmi</h3><span class="small muted">Tahap 1 dari 3</span></div></div>' + field('NIP / NUPTK', '<input name="nip" inputmode="numeric" placeholder="18 digit atau NUPTK">', { req: 1, hint: 'Guru honorer tanpa NIP dapat memakai NUPTK.' }) + field('Nama lengkap & gelar', '<input name="nama" autocomplete="name" placeholder="Drs. Nama, M.Pd.">', { req: 1 }) + '<div class="g2">' + field('Email aktif', '<input type="email" name="email" autocomplete="email" placeholder="nama@smkn1berau.sch.id">', { req: 1 }) + field('Nomor HP/WhatsApp', '<input name="hp" inputmode="tel" placeholder="08xxxxxxxxxx">', { req: 1 }) + '</div></div>' +
      '<div class="card col"><div class="row"><div class="ico-tile">' + ic('book') + '</div><div><h3>Penugasan akademik</h3><span class="small muted">Tahap 2 dari 3</span></div></div><div class="field"><label class="req">Mata pelajaran yang diampu</label><div class="g2" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">' + (o.mapel.length ? o.mapel.map((m) => '<label class="check card flat" style="padding:10px 12px"><input type="checkbox" data-multi name="mapel_ids" value="' + esc(m.id) + '"> ' + esc(m.nama) + '</label>').join('') : '<span class="muted small">Admin belum menambahkan mata pelajaran.</span>') + '</div></div>' + field('Wali kelas (opsional)', sel('wali_kelas_id', o.kelas.map((k) => [k.id, k.nama]), '', 'Bukan wali kelas')) + '</div>' +
      '<div class="card col"><div class="row"><div class="ico-tile">' + ic('file') + '</div><div><h3>Berkas verifikasi</h3><span class="small muted">Tahap 3 dari 3</span></div></div>' + '<div class="field"><label class="req">Pas foto resmi 3×4</label>' + App.fpHtml('gf') + '</div>' + dropzone('sk', { title: 'Unggah SK pembagian tugas / kartu guru', hint: 'PDF, JPG, atau PNG · maks. 5 MB', accept: '.pdf,.jpg,.jpeg,.png', max: 5, icon: 'upload' }) + '<div class="g2">' + field('Kata sandi', '<input type="password" name="password" autocomplete="new-password">', { req: 1, hint: 'Min. 8 karakter, huruf dan angka.' }) + field('Ulangi kata sandi', '<input type="password" name="password2" autocomplete="new-password">', { req: 1 }) + '</div><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"></div>' +
      '<button class="btn primary lg block" type="submit">' + ic('send') + ' Daftarkan akun guru</button><p class="small muted tc">Data diteruskan ke Tata Usaha untuk validasi NIP/NUPTK.</p></form>';
    setTimeout(() => App.fotoPulihkan('gf'), 0);
    ctx.paint(pubNav() + '<div class="auth-wrap wide"><div class="page-h"><div><h1>Registrasi tenaga pendidik</h1><p>Akun aktif setelah diverifikasi admin.</p></div></div>' + tabs + body + foot() + '</div>');
  }
  route('daftar-guru', {
    title: 'Daftar guru',
    async view(ctx) {
      G.tab = 'form'; G.selesai = null; G.ctx = ctx; ctx.paint(pubNav() + '<div class="auth-wrap wide">' + skel(3) + '</div>');
      const r = await api('daftar.opsi', {}, { silent: true });
      if (!r.success) return ctx.paint(pubNav() + '<div class="auth-wrap"><div class="card">' + empty('alert', 'Gagal memuat formulir', r.message, '<button class="btn primary" data-act="muatUlang">Coba lagi</button>') + '</div></div>');
      G.opsi = r.data; guruView(ctx);
    }
  });
  on('guruTab', (el) => { G.tab = el.dataset.v; guruView(G.ctx); });
  onForm('guruKirim', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f);
    if (v.nip.trim().length < 8) return fieldErr(f, 'nip', 'NIP/NUPTK minimal 8 karakter.');
    if (v.nama.trim().length < 3) return fieldErr(f, 'nama', 'Isi nama lengkap.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return fieldErr(f, 'email', 'Email tidak valid.');
    if (v.hp.replace(/\D/g, '').length < 9) return fieldErr(f, 'hp', 'Nomor HP tidak valid.');
    if (!(v.mapel_ids || []).length) return toast('Pilih minimal satu mata pelajaran.', 'warn');
    if (!App.fotoAda('gf')) return toast('Unggah pas foto resmi 3×4.', 'warn');
    if (!fileOf('sk')) return toast('Unggah SK pembagian tugas atau kartu guru.', 'warn');
    if (v.password.length < 8 || !/\d/.test(v.password) || !/[A-Za-z]/.test(v.password)) return fieldErr(f, 'password', 'Min. 8 karakter dengan huruf dan angka.');
    if (v.password !== v.password2) return fieldErr(f, 'password2', 'Kata sandi tidak sama.');
    await busy(btn, async () => {
      let foto; try { foto = await App.fotoAmbil('gf'); } catch (e) { return toast(e.message, 'bad'); }
      const r = await post('daftar.guru', { foto: foto, nip: v.nip, nama: v.nama, email: v.email, hp: v.hp, mapel_ids: v.mapel_ids, wali_kelas_id: v.wali_kelas_id, password: v.password, sk: fileOf('sk'), website: v.website }, { timeout: 120000 });
      if (!r.success) return toast(r.message, 'bad'); App.fotoReset('gf'); G.selesai = r.data; guruView(G.ctx);
    });
  });
})();
