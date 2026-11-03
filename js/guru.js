/**
 * guru.js — modul peran guru (dimuat hanya saat guru masuk).
 */
(function () {
  'use strict';
  const { $, $$, esc, ic, fmt, api, post, toast, busy, formVal, fieldErr, field, sel, load, route, on, onForm, go, chip, sChip, bar, empty, skel, S, dropzone, fileOf, fileReset, modal, drawer, chart, NAV, onLeave } = App;

  NAV.guru = {
    items: [{ path: 'guru/beranda', label: 'Beranda', icon: 'home' }, { path: 'guru/absensi', label: 'Absensi kelas', icon: 'clip', also: 'guru/proyektor' }, { path: 'guru/izin', label: 'Persetujuan izin', icon: 'file', badge: 'izin' }, { path: 'guru/tugas', label: 'Tugas & nilai', icon: 'book', badge: 'koreksi' }, { path: 'guru/rekap', label: 'Rekap kehadiran', icon: 'chart' }, { path: 'guru/biodata', label: 'Biodata', icon: 'file' }, { path: 'guru/profil', label: 'Profil', icon: 'user' }],
    bottom: [{ path: 'guru/beranda', label: 'Beranda', icon: 'home' }, { path: 'guru/absensi', label: 'Absensi', icon: 'clip', also: 'guru/proyektor' }, { path: 'guru/izin', label: 'Izin', icon: 'file', badge: 'izin' }, { path: 'guru/tugas', label: 'Tugas', icon: 'book', badge: 'koreksi' }, { path: 'guru/rekap', label: 'Rekap', icon: 'chart' }]
  };
  const R = (p, def) => route(p, Object.assign({ shell: true }, def));
  const today = () => new Date(App.now()).toLocaleDateString('sv-SE', { timeZone: 'Asia/Makassar' });
  const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const uniq = (a, k) => { const s = {}, o = []; a.forEach((x) => { if (!s[x[k]]) { s[x[k]] = 1; o.push(x); } }); return o; };

  // pasangan kelas–mapel yang diampu (dipakai di banyak halaman)
  let KM = null;
  async function muatKM(force) { if (KM && !force) return KM; const r = await api('guru.kelasku', {}, { silent: true }); if (r.success) KM = r.data; return KM; }
  function pilihKM(pas, st, o) {
    o = o || {};
    const kelas = uniq(pas, 'kelas_id'); if (!st.kelas_id || !kelas.some((k) => k.kelas_id === st.kelas_id)) st.kelas_id = kelas[0] ? kelas[0].kelas_id : '';
    const mapel = pas.filter((p) => p.kelas_id === st.kelas_id); if ((!st.mapel_id || !mapel.some((m) => m.mapel_id === st.mapel_id)) && !(o.semua && st.mapel_id === '')) st.mapel_id = mapel[0] ? mapel[0].mapel_id : '';
    return '<div class="field" style="min-width:150px">' + (o.label === false ? '' : '<label>Kelas</label>') + sel('kelas_id', kelas.map((k) => [k.kelas_id, k.kelas + ' (' + k.siswa + ')']), st.kelas_id).replace('<select ', '<select data-change="' + o.chg + '" ') + '</div><div class="field" style="min-width:190px">' + (o.label === false ? '' : '<label>Mata pelajaran</label>') + sel('mapel_id', mapel.map((m) => [m.mapel_id, m.mapel]), st.mapel_id, o.semua ? 'Semua mapel' : undefined).replace('<select ', '<select data-change="' + o.chg + '" ') + '</div>';
  }
  const tanpaKelas = (judul) => '<div class="card">' + empty('building', judul || 'Belum ada kelas yang Anda ampu', 'Minta admin menambahkan jadwal mengajar untuk akun Anda.') + '</div>';

  // ================= BERANDA =================
  function berandaHtml(b) {
    const m = b.me, st = b.stat, aktif = (b.sesiAktif || [])[0];
    const hero = aktif ? '<div class="card dark"><div class="row between"><span class="chip live" style="background:rgba(255,255,255,.14);color:#fff;border-color:transparent">Sesi presensi berlangsung</span><span class="chip" style="background:rgba(255,255,255,.14);color:#fff;border-color:transparent">sisa <b class="mono" data-cd="' + aktif.akhir_ts + '">' + mmss(aktif.akhir_ts - App.now()) + '</b></span></div><h2 class="mt8" style="color:#fff">' + esc(aktif.kelas) + '</h2><p style="color:#B6C7E0">' + esc(aktif.mapel) + '</p><div class="row wrap mt16"><a class="btn" href="#/guru/proyektor/' + esc(aktif.id) + '">' + ic('qr') + ' Tampilkan barcode</a><a class="btn ghost" style="color:#fff" href="#/guru/absensi">Buka absensi kelas</a></div></div>' : '';
    const jadwal = (b.jadwal || []).length ? b.jadwal.map((j) => '<div class="li"><div class="mono small muted" style="width:92px;flex:none">' + esc(j.mulai) + '–' + esc(j.selesai) + '</div><div class="grow"><b>' + esc(j.kelas) + ' · ' + esc(j.mapel) + '</b><div class="small muted">' + esc(j.ruang || 'Ruang -') + ' · ' + j.siswa + ' siswa</div></div>' + (j.sesi_id ? chip('Presensi buka', 'ok', 'live') : chip(j.status, j.status === 'Aktif' ? 'teal' : '')) + '<a class="btn sm' + (j.status === 'Aktif' ? ' primary' : '') + '" href="#/guru/absensi?kelas=' + esc(j.kelas_id) + '&mapel=' + esc(j.mapel_id) + '&jam=' + esc(j.jam_ke) + '">Absensi</a></div>').join('') : empty('calendar', 'Tidak ada jadwal mengajar hari ini', 'Anda tetap dapat membuka absensi untuk kelas pengganti.', '<a class="btn" href="#/guru/absensi">Buka absensi</a>');
    return '<div class="col gap16">' + (m.foto_id ? '' : '<div class="callout warn"><span class="grow">' + ic('camera') + ' <b>Lengkapi profil Anda:</b> unggah pas foto resmi 3×4. Foto menjadi foto profil dan identitas Anda di sekolah.</span><button class="btn sm primary" data-act="fotoGanti">Unggah foto</button></div>') + '<div class="card row top between"><div class="grow"><span class="cap">' + esc(b.semester) + ' ' + esc(b.tahun_ajaran) + '</span><h1 class="mt4">' + esc(m.nama) + '</h1><div class="small muted mt4">NIP ' + esc(m.nip) + (m.wali_kelas ? ' · Wali kelas ' + esc(m.wali_kelas) : '') + '</div><div class="row wrap mt8">' + m.mapel.map((x) => chip(x, 'teal')).join('') + '</div></div>' + App.avatar(m.id, m.nama, 'lg') + '</div>' + hero +
      '<div class="g4"><div class="card stat"><span class="l">Jadwal hari ini</span><span class="v">' + st.kelasHariIni + ' kelas</span>' + bar(st.kelasHariIni ? st.selesai / st.kelasHariIni * 100 : 0) + '<span class="small muted">' + st.selesai + ' selesai</span></div><div class="card stat"><span class="l">Kehadiran hari ini</span><span class="v">' + (st.kehadiranHariIni === null ? '–' : fmt.pct(st.kehadiranHariIni)) + '</span><span class="small muted">' + st.sesiHariIni + ' catatan presensi</span></div><a class="card stat" href="#/guru/izin" style="color:inherit;text-decoration:none"><span class="l">Izin menunggu</span><span class="v ' + (st.izinPending ? 'bad-t' : '') + '">' + st.izinPending + '</span><span class="small muted">butuh keputusan</span></a><a class="card stat" href="#/guru/tugas" style="color:inherit;text-decoration:none"><span class="l">Perlu dinilai</span><span class="v">' + st.koreksi + '</span><span class="small muted">' + st.tugasAktif + ' tugas aktif</span></a></div>' +
      '<div class="split"><section class="card"><div class="card-h"><h3>Jadwal mengajar hari ini</h3></div>' + jadwal + '</section><div class="col"><section class="card"><div class="card-h"><h3>Validasi ketidakhadiran</h3>' + ((b.izinBaru || []).length ? '<span class="cnt bad">' + st.izinPending + '</span>' : '') + '</div>' + ((b.izinBaru || []).length ? b.izinBaru.map((z) => '<div class="li"><div class="avatar">' + esc(App.inisial(z.nama)) + '</div><div class="grow"><b>' + esc(z.nama) + '</b><div class="small muted">' + esc(z.kelas) + ' · ' + esc(z.jenis) + ' · ' + esc(fmt.tgl(z.tgl_mulai)) + '</div></div><a class="btn sm" href="#/guru/izin">Review</a></div>').join('') : empty('check-circle', 'Tidak ada pengajuan', 'Semua pengajuan sudah diputuskan.')) + '</section><section class="card"><div class="card-h"><h3>Progres penilaian</h3><a class="small" href="#/guru/tugas">Semua</a></div>' + ((b.tugasProgres || []).length ? b.tugasProgres.map((t) => '<div class="li" style="flex-direction:column;align-items:stretch;gap:6px"><div class="row between"><b class="trunc">' + esc(t.judul) + '</b><span class="small muted nowrap">' + t.kumpul + '/' + t.total + '</span></div><span class="small muted">' + esc(t.kelas) + (t.belumDinilai ? ' · ' + t.belumDinilai + ' menunggu penilaian' : '') + '</span>' + bar(t.total ? t.kumpul / t.total * 100 : 0, 'navy') + '</div>').join('') : empty('clip', 'Belum ada tugas', 'Buat tugas pertama Anda.', '<a class="btn primary" href="#/guru/tugas">Buat tugas</a>')) + '</section></div></div></div>';
  }
  R('guru/beranda', {
    title: 'Beranda', sub: () => 'Portal guru',
    view(ctx) {
      const b = S.boot; ctx.paint(b && b.me ? berandaHtml(b) : skel(4));
      const t = setInterval(() => $$('[data-cd]').forEach((el) => { el.textContent = mmss(+el.dataset.cd - App.now()); }), 1000); onLeave(() => clearInterval(t));
      const muat = async () => { const nb = await App.refreshBoot(); if (nb && ctx.alive()) { const y = window.scrollY; ctx.paint(berandaHtml(nb)); window.scrollTo(0, y); } };
      muat(); const p = setInterval(muat, 60000); onLeave(() => clearInterval(p));
    }
  });

  // ================= ABSENSI KELAS =================
  const At = { kelas_id: '', mapel_id: '', tanggal: '', jam_ke: '1', rows: [], sesi_id: '', filter: 'all', q: '', dirty: false, ready: false };
  const hitungAt = () => { const c = { H: 0, S: 0, I: 0, A: 0, kosong: 0 }; At.rows.forEach((r) => { if (r.status) c[r.status]++; else c.kosong++; }); return c; };
  function ringkasAt() {
    const c = hitungAt(), t = At.rows.length || 1;
    return '<div class="card"><div class="row between"><b>Rekapitulasi sesi</b><span class="small muted">' + At.rows.length + ' siswa' + (At.dirty ? ' · <b class="warn-t">belum disimpan</b>' : '') + '</span></div><div class="bar stack mt8"><i style="width:' + c.H / t * 100 + '%;background:var(--navy)"></i><i style="width:' + c.S / t * 100 + '%;background:#B45309"></i><i style="width:' + c.I / t * 100 + '%;background:var(--info)"></i><i style="width:' + c.A / t * 100 + '%;background:#B91C1C"></i></div><div class="g4 mt8" style="grid-template-columns:repeat(5,1fr);gap:6px">' + [['Hadir', c.H, 'ok'], ['Sakit', c.S, 'warn'], ['Izin', c.I, 'info'], ['Alfa', c.A, 'bad'], ['Kosong', c.kosong, '']].map((x) => '<div class="card sunk tc" style="padding:8px 4px;' + (x[0] === 'Alfa' && x[1] ? 'background:var(--bad-bg)' : '') + '"><div class="stat"><span class="v" style="font-size:20px">' + x[1] + '</span></div><span class="cap" style="font-size:10px">' + x[0] + '</span></div>').join('') + '</div></div>';
  }
  function barisAt(r, i) {
    const iz = r.izin;
    return '<div class="card" data-sid="' + esc(r.siswa_id) + '" style="padding:12px 14px;' + (r.status === 'A' ? 'border-color:#FCA5A5' : '') + '"><div class="row top"><span class="mono small muted" style="width:26px;flex:none;padding-top:10px">' + String(i + 1).padStart(2, '0') + '</span><div class="grow" style="min-width:0"><b class="trunc" style="display:block">' + esc(r.nama) + '</b><div class="small muted">NISN ' + esc(r.nisn) + '</div><div class="row wrap gap4 mt4">' + (r.metode ? chip(r.metode + (r.waktu ? ' · ' + fmt.jam(r.waktu) : ''), 'teal') : '') + (iz ? '<a href="#/guru/izin" style="text-decoration:none">' + chip(iz.jenis + (iz.status === 'Menunggu' ? ' menunggu' : ' ' + (iz.keputusan === 'A' ? 'ditolak' : 'disetujui')), iz.status === 'Menunggu' ? 'warn' : iz.keputusan === 'A' ? 'bad' : 'info') + '</a>' : '') + '</div></div><div class="seg-hsia" role="group" aria-label="Status ' + esc(r.nama) + '">' + ['H', 'S', 'I', 'A'].map((s) => '<button type="button" data-act="atSet" data-s="' + s + '" class="' + (r.status === s ? 'on' : '') + '" aria-pressed="' + (r.status === s) + '" aria-label="' + App.STATUS[s][0] + '">' + s + '</button>').join('') + '</div></div><input class="mt8" data-input="atCatatan" placeholder="Catatan (opsional)" value="' + esc(r.catatan) + '" maxlength="200" style="min-height:38px;font-size:15px"></div>';
  }
  function absensiHtml(pas) {
    const rows = At.rows.map((r, i) => ({ r: r, i: i })).filter((x) => (At.filter === 'all' || (At.filter === 'kosong' ? !x.r.status : At.filter === 'izin' ? (x.r.izin && x.r.izin.status === 'Menunggu') : x.r.status === At.filter)) && (!At.q || (x.r.nama + x.r.nisn).toLowerCase().indexOf(At.q.toLowerCase()) > -1));
    return '<div class="col gap16"><div class="card"><div class="row wrap gap16" style="align-items:flex-end">' + pilihKM(pas, At, { chg: 'atGanti' }) + '<div class="field" style="min-width:150px"><label>Tanggal</label><input type="date" name="tanggal" value="' + esc(At.tanggal) + '" max="' + today() + '" data-change="atGanti"></div><div class="field" style="width:90px"><label>Jam ke</label><input name="jam_ke" value="' + esc(At.jam_ke) + '" maxlength="3" data-change="atGanti"></div></div><div class="row wrap mt16"><button class="btn navy" data-act="atBarcode">' + ic('qr') + ' ' + (At.sesi_id ? 'Layar barcode sesi' : 'Buka barcode sesi') + '</button><button class="btn" data-act="atKartu">' + ic('camera') + ' Scan kartu siswa</button><button class="btn" data-act="atSemuaHadir">' + ic('check') + ' Tandai kosong → hadir</button><button class="btn ghost" data-act="atSegarkan">' + ic('refresh') + '</button></div></div><div id="at-ringkas">' + ringkasAt() + '</div>' +
      '<div class="row wrap"><div class="input-icon grow" style="min-width:200px">' + ic('search') + '<input placeholder="Cari nama atau NISN" value="' + esc(At.q) + '" data-input="atCari"></div><div class="chips-scroll">' + [['all', 'Semua (' + At.rows.length + ')'], ['kosong', 'Belum diabsen'], ['izin', 'Perlu konfirmasi'], ['A', 'Alfa']].map((c) => '<button class="chip btn-like ' + (At.filter === c[0] ? 'on' : '') + '" data-act="atFilter" data-v="' + c[0] + '">' + c[1] + '</button>').join('') + '</div></div>' +
      (At.rows.length ? '<div class="g2 g2-md" id="at-list" style="align-items:start">' + rows.map((x) => barisAt(x.r, x.i)).join('') + '</div>' : '<div class="card">' + empty('users', 'Tidak ada siswa', 'Kelas ini belum memiliki siswa aktif.') + '</div>') +
      '<div class="sticky-bar"><span class="small muted grow" id="at-info">' + (At.dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.') + '</span><button class="btn primary lg" data-act="atSimpan"' + (At.rows.length ? '' : ' disabled') + '>' + ic('check') + ' Simpan absensi</button></div></div>';
  }
  async function muatAbsensi(ctx, tenang) {
    if (!At.kelas_id) return;
    const r = await api('absen.muat', { kelas_id: At.kelas_id, mapel_id: At.mapel_id, tanggal: At.tanggal, jam_ke: At.jam_ke }, { silent: !!tenang });
    if (!ctx.alive()) return;
    if (!r.success) return toast(r.message, 'bad');
    At.rows = r.data.rows.map((x) => Object.assign({}, x, { orig: x.status })); At.sesi_id = r.data.sesi_id; At.dirty = false;
    if (r.data.waktuServer) S.srv = r.data.waktuServer - Date.now();
  }
  R('guru/absensi', {
    title: 'Absensi kelas', sub: () => 'Pencatatan kehadiran KBM',
    async view(ctx) {
      ctx.paint(skel(3)); const km = await muatKM(true); if (!ctx.alive()) return;
      if (!km || !km.pasangan.length) return ctx.paint(tanpaKelas());
      At.tanggal = ctx.q.tanggal || today(); At.filter = 'all'; At.q = '';
      if (ctx.q.kelas) { At.kelas_id = ctx.q.kelas; At.mapel_id = ctx.q.mapel || ''; At.jam_ke = ctx.q.jam || '1'; }
      pilihKM(km.pasangan, At, {});
      const j = App.S.boot && (S.boot.jadwal || []).find((x) => x.kelas_id === At.kelas_id && x.mapel_id === At.mapel_id); if (j && !ctx.q.jam) At.jam_ke = j.jam_ke;
      await muatAbsensi(ctx); if (!ctx.alive()) return; ctx.paint(absensiHtml(km.pasangan));
      const t = setInterval(async () => { if (At.dirty || !At.sesi_id || document.hidden || !ctx.alive()) return; const bef = JSON.stringify(At.rows.map((r) => r.status)); await muatAbsensi(ctx, true); if (ctx.alive() && !At.dirty && JSON.stringify(At.rows.map((r) => r.status)) !== bef) { const y = window.scrollY; ctx.paint(absensiHtml(km.pasangan)); window.scrollTo(0, y); } }, 8000); onLeave(() => clearInterval(t));
    }
  });
  on('atGanti', async (el) => {
    if (At.dirty && !(await App.confirm({ title: 'Perubahan belum disimpan', msg: 'Pindah kelas/tanggal akan membuang perubahan yang belum disimpan. Lanjutkan?', ok: 'Buang perubahan', danger: true }))) { return App.cur.paint(absensiHtml(KM.pasangan)); }
    const f = el.name; At[f] = el.value; if (f === 'kelas_id') At.mapel_id = ''; if (f === 'jam_ke') At.jam_ke = el.value.trim() || '1';
    pilihKM(KM.pasangan, At, {}); const jd = (S.boot.jadwal || []).find((x) => x.kelas_id === At.kelas_id && x.mapel_id === At.mapel_id); if ((f === 'kelas_id' || f === 'mapel_id') && jd) At.jam_ke = jd.jam_ke;
    await muatAbsensi(App.cur); App.cur.paint(absensiHtml(KM.pasangan));
  });
  on('atSegarkan', async (el) => { await busy(el, async () => { await muatAbsensi(App.cur); App.cur.paint(absensiHtml(KM.pasangan)); }); });
  function refreshRingkas() { const r = $('#at-ringkas'); if (r) r.innerHTML = ringkasAt(); const i = $('#at-info'); if (i) i.textContent = At.dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan tersimpan.'; }
  on('atSet', (el) => {
    const card = el.closest('[data-sid]'), r = At.rows.find((x) => x.siswa_id === card.dataset.sid), s = el.dataset.s;
    r.status = r.status === s ? '' : s; At.dirty = true;
    $$('.seg-hsia button', card).forEach((b) => { const on = b.dataset.s === r.status; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); card.style.borderColor = r.status === 'A' ? '#FCA5A5' : ''; refreshRingkas();
  });
  on('atCatatan', (el) => { const r = At.rows.find((x) => x.siswa_id === el.closest('[data-sid]').dataset.sid); r.catatan = el.value; At.dirty = true; const i = $('#at-info'); if (i) i.textContent = 'Ada perubahan yang belum disimpan.'; });
  on('atFilter', (el) => { At.filter = el.dataset.v; App.cur.paint(absensiHtml(KM.pasangan)); });
  on('atCari', App.debounce((el) => { At.q = el.value; const p = el.selectionStart; App.cur.paint(absensiHtml(KM.pasangan)); const n = $('[data-input=atCari]'); n.focus(); n.setSelectionRange(p, p); }, 250));
  on('atSemuaHadir', () => { let n = 0; At.rows.forEach((r) => { if (!r.status) { r.status = 'H'; n++; } }); if (!n) return toast('Semua siswa sudah memiliki status.', 'warn'); At.dirty = true; App.cur.paint(absensiHtml(KM.pasangan)); toast(n + ' siswa ditandai hadir. Jangan lupa simpan.', 'ok'); });
  on('atSimpan', async (el) => {
    const kosong = At.rows.filter((r) => !r.status).length;
    if (kosong && !(await App.confirm({ title: kosong + ' siswa belum diabsen', msg: 'Siswa tanpa status tidak akan disimpan. Lanjutkan menyimpan?', ok: 'Simpan' }))) return;
    await busy(el, async () => {
      const r = await post('absen.simpan', { kelas_id: At.kelas_id, mapel_id: At.mapel_id, tanggal: At.tanggal, jam_ke: At.jam_ke, rows: At.rows.filter((x) => x.status).map((x) => ({ siswa_id: x.siswa_id, status: x.status, catatan: x.catatan })) });
      if (!r.success) return toast(r.message, 'bad'); At.dirty = false; toast(r.message + ' (' + r.data.baru + ' baru, ' + r.data.diubah + ' diubah)', 'ok'); refreshRingkas(); App.refreshBoot();
    });
  });
  on('atBarcode', async (el) => {
    if (At.tanggal !== today()) return toast('Sesi barcode hanya untuk hari ini.', 'warn');
    await busy(el, async () => { const r = await post('sesi.mulai', { kelas_id: At.kelas_id, mapel_id: At.mapel_id, jam_ke: At.jam_ke }); if (!r.success) return toast(r.message, 'bad'); App.refreshBoot(); go('#/guru/proyektor/' + r.data.id); });
  });
  // scan kartu siswa (QR di kartu identitas digital)
  on('atKartu', () => {
    const m = modal({ title: 'Scan kartu siswa', body: '<p class="small muted mb16">Arahkan kamera ke QR pada kartu identitas digital siswa (menu Profil siswa).</p><div class="scan-box" id="kartu-box"><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span><span class="line"></span><div class="msg" id="kartu-msg">Menyalakan kamera…</div></div><div id="kartu-hasil" class="mt16 col gap8"></div>', onClose: () => { if (At.kartu) At.kartu.stop(); At.kartu = null; muatAbsensi(App.cur, true).then(() => App.cur.paint(absensiHtml(KM.pasangan))); } });
    let proses = false;
    App.scanner($('#kartu-box'), async (val) => {
      if (proses || !/^S1B-\d+$/.test(val)) return; proses = true;
      const r = await post('absen.kartu', { kelas_id: At.kelas_id, mapel_id: At.mapel_id, jam_ke: At.jam_ke, kode: val });
      const h = $('#kartu-hasil'); if (h) h.insertAdjacentHTML('afterbegin', '<div class="callout ' + (r.success ? 'ok' : 'bad') + '">' + ic(r.success ? 'check-circle' : 'alert') + '<span>' + esc(r.message) + '</span></div>');
      setTimeout(() => { proses = false; }, 1500);
    }).then((s) => { At.kartu = s; const mm = $('#kartu-msg'); if (mm) mm.remove(); }).catch((e) => { const mm = $('#kartu-msg'); if (mm) mm.textContent = e.message || 'Kamera tidak dapat diakses.'; });
  });

  // ================= PROYEKTOR BARCODE =================
  const Pj = { data: null, tAmbil: 0 };
  route('guru/proyektor/:id', {
    shell: true, title: 'Barcode sesi', sub: () => 'Tampilkan di layar kelas',
    async view(ctx) {
      ctx.paint(skel(3)); Pj.data = null; let payloadTerakhir = '', mati = false; onLeave(() => { mati = true; });
      const gambar = (d) => {
        const buka = d.terbuka;
        return '<div class="col gap16 proj"><div class="card"><div class="row between top"><div><span class="chip ' + (buka ? 'ok live' : 'bad') + '">' + (buka ? 'Presensi terbuka' : 'Sesi berakhir') + '</span><h2 class="mt8">' + esc(d.kelas) + '</h2><div class="muted small">' + esc(d.mapel) + (d.ruang ? ' · ' + esc(d.ruang) : '') + ' · Jam ke-' + esc(d.jam_ke) + '</div></div><div class="tc"><span class="cap">Sisa waktu</span><div class="timer-big" id="pj-sisa">' + mmss(d.sisaMs) + '</div></div></div></div>' +
          (buka ? '<div class="card col gap8"><div class="row between"><span class="small muted">' + ic('refresh', 'sm') + ' QR berganti otomatis tiap ' + d.jendelaDetik + ' detik</span><b class="mono" id="pj-detik">' + d.detikToken + 's</b></div><div class="bar"><i id="pj-bar" style="width:' + (d.detikToken / d.jendelaDetik * 100) + '%"></i></div><div class="qr-wrap" id="pj-qr"></div><div class="tc muted small">Atau masukkan kode token manual</div><div class="code-digits" id="pj-kode"></div></div>' : '<div class="card tc">' + empty('clock', 'Sesi presensi telah berakhir', 'Tambah waktu bila masih ada siswa yang belum presensi.') + '</div>') +
          '<div class="card"><div class="row between"><b>Tingkat kehadiran</b><b id="pj-hadir">' + d.hadir + ' / ' + d.total + '</b></div><div class="bar mt8"><i id="pj-hbar" style="width:' + (d.total ? d.hadir / d.total * 100 : 0) + '%"></i></div><div class="cap mt16 mb8">Presensi terakhir</div><div id="pj-live">' + live(d) + '</div></div><div class="row wrap"><button class="btn" data-act="pjTambah" data-id="' + esc(ctx.params.id) + '">' + ic('clock') + ' Tambah waktu (+5 menit)</button><button class="btn danger" data-act="pjTutup" data-id="' + esc(ctx.params.id) + '">' + ic('lock') + ' Kunci & akhiri sesi</button><a class="btn ghost" href="#/guru/absensi?kelas=' + esc(d.kelas_id || '') + '">Selesai & tutup layar</a></div></div>';
      };
      const live = (d) => (d.terbaru.length ? d.terbaru.map((x) => '<div class="li"><div class="avatar">' + esc(App.inisial(x.nama)) + '</div><div class="grow"><b>' + esc(x.nama) + '</b><div class="small muted">NISN ' + esc(x.nisn) + '</div></div><div class="tc"><div class="mono small">' + esc(fmt.jam(x.waktu)) + '</div><span class="small ok-t">' + esc(x.metode) + '</span></div></div>').join('') : '<div class="small muted">Belum ada siswa yang presensi.</div>');
      const isiQr = async (d) => { const q = $('#pj-qr'); if (q && d.payload !== payloadTerakhir) { payloadTerakhir = d.payload; q.innerHTML = await App.qrSvg(d.payload); const k = d.kode.replace('-', ''); $('#pj-kode').innerHTML = k.slice(0, 3).split('').map((c) => '<span>' + c + '</span>').join('') + '<em>–</em>' + k.slice(3).split('').map((c) => '<span>' + c + '</span>').join(''); } };
      const ambil = async () => {
        if (mati || !ctx.alive()) return;
        const r = await api('sesi.qr', { sesi_id: ctx.params.id }, { silent: true });
        if (mati || !ctx.alive()) return;
        if (!r.success) { if (!Pj.data) ctx.paint('<div class="card">' + empty('alert', 'Sesi tidak ditemukan', r.message, '<a class="btn" href="#/guru/absensi">Kembali</a>') + '</div>'); return setTimeout(ambil, 6000); }
        const d = r.data; Pj.tAmbil = Date.now(); const lama = Pj.data; Pj.data = d;
        if (!lama || lama.terbuka !== d.terbuka) { ctx.paint(gambar(d)); payloadTerakhir = ''; } else { const h = $('#pj-hadir'); if (h) { h.textContent = d.hadir + ' / ' + d.total; $('#pj-hbar').style.width = (d.total ? d.hadir / d.total * 100 : 0) + '%'; $('#pj-live').innerHTML = live(d); } }
        if (d.terbuka) await isiQr(d);
        setTimeout(ambil, Math.max(2500, Math.min(5000, d.detikToken * 1000 + 300)));
      };
      ambil();
      const t = setInterval(() => { const d = Pj.data; if (!d) return; const lewat = Date.now() - Pj.tAmbil; const sisa = Math.max(0, d.sisaMs - lewat); const e = $('#pj-sisa'); if (e) e.textContent = mmss(sisa); const dt = Math.max(0, d.detikToken - Math.floor(lewat / 1000)); const x = $('#pj-detik'); if (x) { x.textContent = dt + 's'; $('#pj-bar').style.width = (dt / d.jendelaDetik * 100) + '%'; } }, 500); onLeave(() => clearInterval(t));
    }
  });
  on('pjTambah', async (el) => { await busy(el, async () => { const r = await post('sesi.perpanjang', { sesi_id: el.dataset.id, menit: 5 }); if (!r.success) return toast(r.message, 'bad'); toast(r.message, 'ok'); Pj.data = null; App.cur.def.view(App.cur); }); });
  on('pjTutup', async (el) => { if (!(await App.confirm({ title: 'Akhiri sesi presensi?', msg: 'Siswa tidak dapat lagi presensi dengan barcode. Siswa yang belum tercatat dapat ditandai manual di halaman Absensi.', ok: 'Akhiri sesi', danger: true }))) return; await busy(el, async () => { const r = await post('sesi.tutup', { sesi_id: el.dataset.id }); if (!r.success) return toast(r.message, 'bad'); toast('Sesi ditutup.', 'ok'); App.refreshBoot(); go('#/guru/absensi'); }); });

  // ================= PERSETUJUAN IZIN =================
  const Iz = { tab: 'Menunggu', list: [], hitung: {}, pilih: {} };
  const DEF_KEP = { Sakit: 'S', Izin: 'I', Dispensasi: 'I' };
  function izinKartu(z) {
    const lok = { Sesuai: ['ok', 'Lokasi sesuai domisili'], Anomali: ['bad', 'Anomali lokasi'], 'Tanpa lokasi': ['warn', 'Tanpa lokasi'], 'Domisili belum tercatat': ['', 'Domisili belum tercatat'] }[z.lokasi];
    const pil = Iz.pilih[z.id] || DEF_KEP[z.jenis];
    return '<article class="card col gap8" data-izin="' + esc(z.id) + '"><div class="row between wrap"><div class="row"><div class="avatar">' + esc(App.inisial(z.nama)) + '</div><div><b>' + esc(z.nama) + '</b><div class="small muted">NISN ' + esc(z.nisn) + ' · ' + esc(z.kelas) + '</div></div></div>' + chip(z.jenis, z.jenis === 'Sakit' ? 'warn' : 'info') + '</div><div class="card sunk small col gap4" style="padding:12px"><div class="row between"><span class="muted">Tanggal</span><b>' + esc(fmt.tgl(z.tgl_mulai)) + (z.tgl_akhir !== z.tgl_mulai ? ' – ' + esc(fmt.tgl(z.tgl_akhir)) : '') + '</b></div>' + (z.terdampak.length ? '<div class="row between top"><span class="muted">Mapel terdampak</span><b style="text-align:right">' + esc(z.terdampak.join(', ')) + '</b></div>' : '') + '</div><p style="white-space:pre-line">“' + esc(z.keterangan) + '”</p>' + (z.bukti_id ? '<button class="file-row" style="text-align:left;cursor:pointer" data-act="lihatBerkas" data-id="' + esc(z.bukti_id) + '" data-nama="Bukti ' + esc(z.nama) + '">' + ic('file') + '<span class="grow">Lihat bukti terlampir</span>' + ic('eye', 'sm') + '</button>' : '<div class="small muted">Tidak ada bukti terlampir.</div>') +
      '<div class="card sunk small" style="padding:12px"><div class="row between"><b>' + ic('pin', 'sm') + ' Audit lokasi</b>' + (lok ? chip(lok[1], lok[0]) : '') + '</div>' + (z.jarak_m !== null ? '<div class="mt4">Jarak dari domisili terdaftar: <b>' + (z.jarak_m >= 1000 ? (z.jarak_m / 1000).toFixed(1) + ' km' : z.jarak_m + ' m') + '</b> (batas wajar ' + (z.radius >= 1000 ? (z.radius / 1000).toFixed(1) + ' km' : z.radius + ' m') + ')</div>' : '') + (z.alamat ? '<div class="muted mt4">Domisili: ' + esc(z.alamat) + '</div>' : '') + '</div>' +
      (z.status === 'Menunggu' ? '<div class="field"><label>Keputusan guru</label><div class="g3">' + [['S', 'Sakit', 'alert'], ['I', 'Izin', 'file'], ['A', 'Alfa', 'x-circle']].map((o) => '<button type="button" class="card hover tc" data-act="izPilih" data-id="' + esc(z.id) + '" data-v="' + o[0] + '" style="padding:10px;' + (pil === o[0] ? 'border-color:var(--teal);background:var(--teal-l)' : '') + '"><div>' + ic(o[2]) + '</div><b class="small">' + o[1] + '</b></button>').join('') + '</div></div><textarea data-izcat placeholder="Catatan verifikasi (wajib bila Alfa)" style="min-height:70px">' + '</textarea><button class="btn primary block" data-act="izKeputusan" data-id="' + esc(z.id) + '">' + ic('check') + ' Simpan keputusan</button>' : '<div class="callout ' + (z.keputusan === 'A' ? 'bad' : 'ok') + '">' + ic(z.keputusan === 'A' ? 'x-circle' : 'check-circle') + '<span>Diputuskan: <b>' + ({ S: 'Sakit', I: 'Izin', A: 'Alfa' }[z.keputusan] || z.status) + '</b>' + (z.catatan_guru ? ' — ' + esc(z.catatan_guru) : '') + '</span></div>') + '</article>';
  }
  function izinHtml() {
    const h = Iz.hitung, ls = Iz.list.filter((z) => z.status === Iz.tab);
    return '<div class="col gap16"><div class="seg">' + ['Menunggu', 'Disetujui', 'Ditolak'].map((t) => '<button class="' + (Iz.tab === t ? 'on' : '') + '" data-act="izTab" data-v="' + t + '">' + t + ' <span class="cnt ' + (t === 'Menunggu' && h[t] ? 'bad' : '') + '">' + (h[t] || 0) + '</span></button>').join('') + '</div>' + (ls.length ? '<div class="g2 g2-md" style="align-items:start">' + ls.map(izinKartu).join('') + '</div>' : '<div class="card">' + empty('check-circle', Iz.tab === 'Menunggu' ? 'Tidak ada pengajuan menunggu' : 'Belum ada data', Iz.tab === 'Menunggu' ? 'Semua pengajuan sakit/izin sudah diputuskan.' : 'Belum ada pengajuan dengan status ini.') + '</div>') + '</div>';
  }
  R('guru/izin', {
    title: 'Persetujuan izin', sub: () => 'Validasi ketidakhadiran siswa',
    view(ctx) { ctx.paint(skel(3)); Iz.pilih = {}; load(ctx, 'izin', 'izin.list', { status: 'all' }, 20, (d) => { Iz.list = d.list; Iz.hitung = d.hitung; ctx.paint(izinHtml()); }); }
  });
  on('izTab', (el) => { Iz.tab = el.dataset.v; App.cur.paint(izinHtml()); });
  on('izPilih', (el) => { Iz.pilih[el.dataset.id] = el.dataset.v; const a = el.closest('article'); $$('[data-act=izPilih]', a).forEach((b) => { const on = b.dataset.v === el.dataset.v; b.style.borderColor = on ? 'var(--teal)' : ''; b.style.background = on ? 'var(--teal-l)' : ''; }); });
  on('izKeputusan', async (el) => {
    const id = el.dataset.id, z = Iz.list.find((x) => x.id === id), a = el.closest('article'), kep = Iz.pilih[id] || DEF_KEP[z.jenis], cat = $('[data-izcat]', a).value.trim();
    if (kep === 'A') { if (cat.length < 5) { $('[data-izcat]', a).classList.add('invalid'); return toast('Isi alasan penetapan Alfa (min. 5 karakter).', 'warn'); } if (!(await App.confirm({ title: 'Tetapkan Alfa?', msg: 'Kehadiran ' + z.nama + ' pada tanggal tersebut akan ditulis Alfa. Siswa diberi tahu lewat email bila tersedia.', ok: 'Tetapkan Alfa', danger: true }))) return; }
    await busy(el, async () => { const r = await post('izin.putuskan', { id: id, keputusan: kep, catatan: cat }); if (!r.success) return toast(r.message, 'bad'); toast(r.message, 'ok'); App.refreshBoot(); App.cur.def.view(App.cur); });
  });

  // ================= TUGAS, MATERI, NILAI =================
  const Tn = { tab: 'tugas', tugas: [], materi: [], tgKelas: '', nilai: { kelas_id: '', mapel_id: '', jenis: 'UTS', rows: [], kkm: 75, dirty: false } };
  function tugasTab() {
    const tl = Tn.tugas.filter((t) => !Tn.tgKelas || t.kelas_id === Tn.tgKelas), kelas = uniq(KM.pasangan, 'kelas_id');
    const perlu = tl.reduce((a, t) => a + t.belumDinilai, 0);
    return '<div class="row between wrap"><div class="row wrap"><div style="min-width:170px">' + sel('tgKelas', kelas.map((k) => [k.kelas_id, k.kelas]), Tn.tgKelas, 'Semua kelas').replace('<select ', '<select data-change="tgKelasGanti" ') + '</div></div><button class="btn primary" data-act="tgBaru">' + ic('plus') + ' Buat tugas</button></div><div class="g3"><div class="card stat"><span class="l">Total tugas</span><span class="v">' + tl.length + '</span></div><div class="card stat"><span class="l">Perlu koreksi</span><span class="v ' + (perlu ? 'bad-t' : '') + '">' + perlu + '</span></div><div class="card stat"><span class="l">Rata-rata kelas</span><span class="v">' + (function () { const x = tl.filter((t) => t.rata !== null); return x.length ? fmt.n1(x.reduce((a, t) => a + t.rata, 0) / x.length) : '–'; })() + '</span></div></div>' +
      (tl.length ? '<div class="g2 g2-md" style="align-items:start">' + tl.map((t) => '<article class="card col gap8"><div class="row between wrap"><div class="row gap8">' + chip(t.kelas, 'teal') + (t.status === 'Arsip' ? chip('Arsip') : '') + (t.tenggat < new Date(App.now() + 8 * 36e5).toISOString().slice(0, 16) ? chip('Tenggat lewat', 'bad') : '') + '</div><div class="row gap4"><button class="btn icon sm ghost" data-act="tgEdit" data-id="' + esc(t.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button><button class="btn icon sm ghost" data-act="tgHapus" data-id="' + esc(t.id) + '" aria-label="Hapus">' + ic('trash', 'sm') + '</button></div></div><h4>' + esc(t.judul) + '</h4><div class="small muted">' + esc(t.mapel) + ' · tenggat ' + esc(fmt.tenggat(t.tenggat)) + '</div><div><div class="row between small"><b>Pengumpulan</b><span>' + t.kumpul + ' / ' + t.total + ' siswa</span></div>' + bar(t.total ? t.kumpul / t.total * 100 : 0, 'navy') + '<div class="small muted mt4">' + (t.total - t.kumpul) + ' belum mengunggah' + (t.belumDinilai ? ' · <b class="bad-t">' + t.belumDinilai + ' menunggu dinilai</b>' : '') + '</div></div><div class="g3 small" style="gap:6px"><div class="card sunk tc" style="padding:8px"><span class="cap">Format</span><div><b>' + esc(t.format || 'Bebas') + '</b></div></div><div class="card sunk tc" style="padding:8px"><span class="cap">Bobot</span><div><b>' + fmt.n1(t.bobot) + '%</b></div></div><div class="card sunk tc" style="padding:8px"><span class="cap">KKM</span><div><b>' + fmt.n1(t.kkm) + '</b></div></div></div><button class="btn navy block" data-act="tgKumpul" data-id="' + esc(t.id) + '">' + ic('users') + ' Daftar pengumpulan (' + t.kumpul + ')</button></article>').join('') + '</div>' : '<div class="card">' + empty('clip', 'Belum ada tugas', 'Buat tugas untuk kelas yang Anda ampu. Siswa akan diberi tahu lewat email.', '<button class="btn primary" data-act="tgBaru">' + ic('plus') + ' Buat tugas</button>') + '</div>');
  }
  function materiTab() {
    const per = {}; Tn.materi.forEach((m) => { (per[m.kelas + ' · ' + m.mapel] = per[m.kelas + ' · ' + m.mapel] || []).push(m); });
    return '<div class="row between wrap"><p class="muted">Bab dan media belajar yang tampil di menu Silabus & Materi siswa.</p><button class="btn primary" data-act="mtBaru">' + ic('plus') + ' Tambah materi</button></div>' + (Object.keys(per).length ? Object.keys(per).sort().map((k, i) => '<details class="acc" ' + (i === 0 ? 'open' : '') + '><summary><div class="ico-tile">' + ic('folder') + '</div><span>' + esc(k) + '</span><span class="cnt">' + per[k].length + '</span>' + ic('down', 'ch') + '</summary><div class="acc-b">' + per[k].map((m) => '<div class="li"><div class="grow"><span class="cap">' + esc(m.bab || 'Bab') + ' · urutan ' + m.urut + '</span><div><b>' + esc(m.judul) + '</b></div><div class="small muted">' + m.media.length + ' media</div></div><button class="btn icon sm ghost" data-act="mtEdit" data-id="' + esc(m.id) + '" aria-label="Ubah">' + ic('edit', 'sm') + '</button><button class="btn icon sm ghost" data-act="mtHapus" data-id="' + esc(m.id) + '" aria-label="Hapus">' + ic('trash', 'sm') + '</button></div>').join('') + '</div></details>').join('') : '<div class="card">' + empty('book', 'Belum ada materi', 'Tambahkan bab dan media belajar untuk kelas Anda.', '<button class="btn primary" data-act="mtBaru">' + ic('plus') + ' Tambah materi</button>') + '</div>');
  }
  function nilaiTab() {
    const n = Tn.nilai, rows = n.rows, isi = rows.filter((r) => r.nilai !== null && r.nilai !== ''), tuntas = isi.filter((r) => +r.nilai >= n.kkm).length;
    return '<div class="card"><div class="row wrap gap16" style="align-items:flex-end">' + pilihKM(KM.pasangan, n, { chg: 'nlGanti' }) + '<div class="field" style="min-width:150px"><label>Jenis penilaian</label>' + sel('jenis', KM.jenisNilai.map((j) => [j, j]), n.jenis).replace('<select ', '<select data-change="nlGanti" ') + '</div><div class="small muted" style="padding-bottom:12px">KKM <b>' + fmt.n1(n.kkm) + '</b> · bobot <b>' + (n.bobot || '-') + '</b> · nilai tugas dihitung otomatis dari penilaian tugas</div></div><div class="row wrap mt16"><button class="btn" data-act="nlTemplate">' + ic('download') + ' Template Excel</button><label class="btn" style="cursor:pointer">' + ic('upload') + ' Impor Excel/CSV<input type="file" accept=".xlsx,.xls,.csv" hidden data-change="nlImpor"></label></div></div>' +
      '<div class="g3"><div class="card stat"><span class="l">Terinput</span><span class="v">' + isi.length + '<small class="muted" style="font-size:16px"> / ' + rows.length + '</small></span>' + bar(rows.length ? isi.length / rows.length * 100 : 0) + '</div><div class="card stat"><span class="l">Tuntas</span><span class="v">' + tuntas + '</span></div><div class="card stat"><span class="l">Remedial</span><span class="v ' + (isi.length - tuntas ? 'bad-t' : '') + '">' + (isi.length - tuntas) + '</span></div></div>' +
      (rows.length ? '<div class="g2 g2-md" id="nl-list" style="align-items:start">' + rows.map((r, i) => nilaiBaris(r, i, n.kkm)).join('') + '</div>' : '<div class="card">' + empty('users', 'Tidak ada siswa', 'Pilih kelas yang memiliki siswa aktif.') + '</div>') + '<div class="sticky-bar"><span class="small muted grow" id="nl-info">' + (n.dirty ? 'Ada perubahan belum disimpan.' : 'Nilai tersimpan.') + '</span><button class="btn primary lg" data-act="nlSimpan"' + (rows.length ? '' : ' disabled') + '>' + ic('check') + ' Simpan & publikasikan nilai</button></div>';
  }
  const nilaiBaris = (r, i, kkm) => { const v = r.nilai; const bad = v !== null && v !== '' && +v < kkm; return '<div class="card row' + (bad ? ' row-bad' : '') + '" data-nid="' + esc(r.siswa_id) + '" style="padding:10px 14px"><span class="mono small muted" style="width:26px">' + String(i + 1).padStart(2, '0') + '</span><div class="grow" style="min-width:0"><b class="trunc" style="display:block">' + esc(r.nama) + '</b><div class="small muted">NISN ' + esc(r.nisn) + ' · <span data-nst>' + (v === null || v === '' ? 'Belum' : (+v >= kkm ? 'Tuntas' : 'Remedial')) + '</span></div></div><input type="number" min="0" max="100" step="0.1" inputmode="decimal" value="' + (v === null ? '' : esc(v)) + '" data-input="nlIsi" style="width:84px;text-align:center;font-weight:700" aria-label="Nilai ' + esc(r.nama) + '"></div>'; };
  function tnHtml() {
    return '<div class="col gap16"><div class="tabs"><button class="' + (Tn.tab === 'tugas' ? 'on' : '') + '" data-act="tnTab" data-v="tugas">Tugas</button><button class="' + (Tn.tab === 'materi' ? 'on' : '') + '" data-act="tnTab" data-v="materi">Materi</button><button class="' + (Tn.tab === 'nilai' ? 'on' : '') + '" data-act="tnTab" data-v="nilai">Input nilai</button></div>' + (Tn.tab === 'tugas' ? tugasTab() : Tn.tab === 'materi' ? materiTab() : nilaiTab()) + '</div>';
  }
  async function muatTn(ctx) {
    const [a, b] = await Promise.all([api('tugas.guru', {}, { silent: true }), api('materi.guru', {}, { silent: true })]);
    if (!ctx.alive()) return; if (a.success) Tn.tugas = a.data; if (b.success) Tn.materi = b.data;
  }
  async function muatNilai(ctx) {
    const n = Tn.nilai; if (!n.kelas_id || !n.mapel_id) { n.rows = []; return; }
    const r = await api('nilai.muat', { kelas_id: n.kelas_id, mapel_id: n.mapel_id, jenis: n.jenis }, { silent: true });
    if (ctx && !ctx.alive()) return; if (!r.success) { toast(r.message, 'bad'); n.rows = []; return; }
    n.rows = r.data.rows; n.kkm = r.data.kkm; n.bobot = r.data.bobot; n.dirty = false;
  }
  R('guru/tugas', {
    title: 'Tugas & nilai', sub: () => 'Penugasan, materi, dan penilaian',
    async view(ctx) {
      ctx.paint(skel(3)); Tn.tab = ['tugas', 'materi', 'nilai'].indexOf(ctx.q.tab) > -1 ? ctx.q.tab : 'tugas';
      const km = await muatKM(true); if (!ctx.alive()) return; if (!km || !km.pasangan.length) return ctx.paint(tanpaKelas());
      await muatTn(ctx); pilihKM(KM.pasangan, Tn.nilai, {}); if (Tn.tab === 'nilai') await muatNilai(ctx); if (ctx.alive()) ctx.paint(tnHtml());
    }
  });
  on('tnTab', async (el) => { if (Tn.nilai.dirty && Tn.tab === 'nilai' && !(await App.confirm({ title: 'Nilai belum disimpan', msg: 'Perubahan nilai akan hilang. Lanjutkan?', ok: 'Buang', danger: true }))) return; Tn.tab = el.dataset.v; if (Tn.tab === 'nilai' && !Tn.nilai.rows.length) { App.cur.paint(skel(2)); await muatNilai(App.cur); } App.cur.paint(tnHtml()); });
  on('tgKelasGanti', (el) => { Tn.tgKelas = el.value; App.cur.paint(tnHtml()); });

  // ----- CRUD tugas -----
  function tugasForm(t) {
    t = t || {}; const pas = KM.pasangan, kelas = uniq(pas, 'kelas_id'), kid = t.kelas_id || (kelas[0] && kelas[0].kelas_id) || '', mapel = pas.filter((p) => p.kelas_id === kid);
    return '<form class="col" data-submit="tgSimpan" data-id="' + esc(t.id || '') + '" novalidate><div class="g2">' + field('Kelas', sel('kelas_id', kelas.map((k) => [k.kelas_id, k.kelas]), kid).replace('<select ', '<select data-change="tgFormKelas" '), { req: 1 }) + field('Mata pelajaran', '<span id="tg-mapel">' + sel('mapel_id', mapel.map((m) => [m.mapel_id, m.mapel]), t.mapel_id || '') + '</span>', { req: 1 }) + '</div>' + field('Judul tugas', '<input name="judul" value="' + esc(t.judul || '') + '" maxlength="150">', { req: 1 }) + field('Instruksi / deskripsi', '<textarea name="deskripsi" style="min-height:120px">' + esc(t.deskripsi || '') + '</textarea>') + '<div class="g2">' + field('Batas pengumpulan (WITA)', '<input type="datetime-local" name="tenggat" value="' + esc(t.tenggat || '') + '">', { req: 1 }) + field('Bobot nilai (%)', '<input type="number" name="bobot" min="0" max="100" value="' + esc(t.bobot === undefined ? 10 : t.bobot) + '">') + '</div><div class="g2">' + field('Format berkas yang diizinkan', '<input name="format" placeholder=".ZIP / .SQL / .PDF" value="' + esc(t.format || '') + '">', { hint: 'Kosongkan untuk semua format.' }) + field('KKM tugas', '<input type="number" name="kkm" min="0" max="100" value="' + esc(t.kkm === undefined ? 75 : t.kkm) + '">') + '</div>' + field('Status', sel('status', [['Aktif', 'Aktif (tampil ke siswa)'], ['Arsip', 'Arsip (disembunyikan)']], t.status || 'Aktif')) + '<div class="field"><label>Lampiran untuk siswa' + (t.lampiran && t.lampiran.length ? ' (tersimpan: ' + t.lampiran.length + ')' : '') + '</label>' + (t.lampiran && t.lampiran.length ? '<div class="col gap8 mb8" id="tg-lamp">' + t.lampiran.map((l) => '<div class="file-row" data-lid="' + esc(l.id) + '" data-lnama="' + esc(l.nama) + '" data-lukuran="' + (l.ukuran || 0) + '">' + ic('file') + '<span class="grow trunc">' + esc(l.nama) + '</span><button type="button" class="btn icon sm ghost" data-act="tgLampHapus" aria-label="Hapus lampiran">' + ic('x', 'sm') + '</button></div>').join('') + '</div>' : '<div id="tg-lamp"></div>') + dropzone('lampiran', { title: 'Tambah lampiran (opsional)', hint: 'PDF, DOCX, ZIP, gambar · maks. 15 MB', max: 15 }) + '</div><button class="btn primary lg block" type="submit">' + ic('check') + ' ' + (t.id ? 'Simpan perubahan' : 'Buat & umumkan tugas') + '</button></form>';
  }
  on('tgBaru', () => { fileReset('lampiran'); drawer({ title: 'Buat tugas', body: tugasForm() }); });
  on('tgEdit', (el) => { fileReset('lampiran'); drawer({ title: 'Ubah tugas', body: tugasForm(Tn.tugas.find((t) => t.id === el.dataset.id)) }); });
  on('tgFormKelas', (el) => { const mapel = KM.pasangan.filter((p) => p.kelas_id === el.value); $('#tg-mapel').innerHTML = sel('mapel_id', mapel.map((m) => [m.mapel_id, m.mapel]), ''); });
  on('tgLampHapus', (el) => el.closest('.file-row').remove());
  onForm('tgSimpan', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f);
    if (v.judul.trim().length < 3) return fieldErr(f, 'judul', 'Judul minimal 3 karakter.');
    if (!v.tenggat) return fieldErr(f, 'tenggat', 'Isi batas pengumpulan.');
    await busy(btn, async () => {
      const lampiran = $$('#tg-lamp .file-row', f).map((e) => ({ id: e.dataset.lid, nama: e.dataset.lnama, ukuran: +e.dataset.lukuran }));
      const baru = fileOf('lampiran');
      if (baru) { const u = await post('berkas.unggah', { berkas: baru, kelas_id: v.kelas_id }, { timeout: 180000 }); if (!u.success) return toast(u.message, 'bad'); lampiran.push(u.data); }
      const r = await post('tugas.simpan', { id: f.dataset.id || undefined, kelas_id: v.kelas_id, mapel_id: v.mapel_id, judul: v.judul, deskripsi: v.deskripsi, tenggat: v.tenggat, bobot: v.bobot, format: v.format, kkm: v.kkm, status: v.status, lampiran: lampiran });
      if (!r.success) return toast(r.message, 'bad'); fileReset('lampiran'); App.closeTop(); toast(r.message, 'ok'); await muatTn(App.cur); App.refreshBoot(); App.cur.paint(tnHtml());
    });
  });
  on('tgHapus', async (el) => { const t = Tn.tugas.find((x) => x.id === el.dataset.id); if (!(await App.confirm({ title: 'Hapus tugas?', msg: '“' + t.judul + '” beserta ' + t.kumpul + ' pengumpulan siswa akan dihapus permanen.', ok: 'Hapus', danger: true }))) return; await busy(el, async () => { const r = await post('tugas.hapus', { id: t.id }); if (!r.success) return toast(r.message, 'bad'); toast(r.message, 'ok'); await muatTn(App.cur); App.refreshBoot(); App.cur.paint(tnHtml()); }); });
  // daftar pengumpulan & penilaian
  on('tgKumpul', async (el) => {
    const m = modal({ title: 'Daftar pengumpulan', cls: 'wide', body: skel(2) }); const r = await api('tugas.pengumpulan', { tugas_id: el.dataset.id }, { silent: false });
    if (!r.success) { m.close(); return toast(r.message, 'bad'); }
    const t = r.data.tugas; m.$('.modal-b').innerHTML = '<div class="row between wrap mb16"><div><b>' + esc(t.judul) + '</b><div class="small muted">Tenggat ' + esc(fmt.tenggat(t.tenggat)) + ' · KKM ' + fmt.n1(t.kkm) + '</div></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Siswa</th><th>Status</th><th>Berkas</th><th style="width:110px">Nilai</th><th>Catatan</th><th></th></tr></thead><tbody>' + r.data.rows.map((x) => '<tr data-pid="' + esc(x.pengumpulan_id) + '"><td><b>' + esc(x.nama) + '</b><div class="small muted">' + esc(x.nisn) + '</div></td><td>' + chip(x.status, x.status === 'Dinilai' ? 'ok' : x.status === 'Belum' ? 'bad' : x.status === 'Terlambat' ? 'warn' : 'info') + (x.waktu ? '<div class="small muted">' + esc(fmt.tglJam(x.waktu)) + '</div>' : '') + (x.versi > 1 ? '<div class="small muted">versi ' + x.versi + '</div>' : '') + '</td><td>' + (x.berkas_id ? '<button class="btn sm" data-act="lihatBerkas" data-id="' + esc(x.berkas_id) + '" data-nama="' + esc(x.berkas_nama || 'Berkas') + '">' + ic('eye', 'sm') + ' ' + esc((x.berkas_nama || 'Buka').slice(0, 18)) + '</button>' : x.link ? '<a class="btn sm" target="_blank" rel="noopener noreferrer" href="' + esc(x.link) + '">' + ic('link', 'sm') + ' Tautan</a>' : '<span class="muted">–</span>') + (x.catatan ? '<div class="small muted mt4">“' + esc(x.catatan) + '”</div>' : '') + '</td><td>' + (x.pengumpulan_id ? '<input type="number" min="0" max="100" step="0.1" value="' + (x.nilai === null ? '' : x.nilai) + '" data-nil style="min-height:38px">' : '–') + '</td><td>' + (x.pengumpulan_id ? '<input data-cat value="' + esc(x.catatan_guru) + '" placeholder="Catatan" style="min-height:38px">' : '') + '</td><td>' + (x.pengumpulan_id ? '<button class="btn sm primary" data-act="tgNilai">Simpan</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>';
  });
  on('tgNilai', async (el) => { const tr = el.closest('tr'), n = $('[data-nil]', tr).value; if (n === '') return toast('Isi nilai.', 'warn'); await busy(el, async () => { const r = await post('tugas.nilai', { pengumpulan_id: tr.dataset.pid, nilai: n, catatan: $('[data-cat]', tr).value }); if (!r.success) return toast(r.message, 'bad'); toast('Nilai tersimpan.', 'ok'); const c = tr.children[1].querySelector('.chip'); if (c) { c.className = 'chip ok'; c.textContent = 'Dinilai'; } App.refreshBoot(); }); });

  // ----- CRUD materi -----
  const Mt = { media: [], edit: null };
  function mediaBaris() { return Mt.media.map((x, i) => '<div class="card sunk col gap8" data-mi="' + i + '" style="padding:12px"><div class="row"><div style="width:120px">' + sel('tipe', [['file', 'Berkas'], ['link', 'Tautan'], ['video', 'Video']], x.tipe).replace('<select ', '<select data-change="mtTipe" ') + '</div><input name="judul" placeholder="Judul media" value="' + esc(x.judul || '') + '" class="grow"><button type="button" class="btn icon sm ghost" data-act="mtMediaHapus" aria-label="Hapus media">' + ic('x', 'sm') + '</button></div>' + (x.tipe === 'file' ? (x.berkas_id ? '<div class="file-row">' + ic('file') + '<span class="grow trunc">Tersimpan: ' + esc(x.judul) + '</span></div>' : dropzone('mf_' + i, { title: 'Pilih berkas materi', hint: 'maks. 15 MB', max: 15 })) : '<input name="url" type="url" placeholder="https://…" value="' + esc(x.url || '') + '">') + '</div>').join(''); }
  function mtForm(m) {
    m = m || {}; const pas = KM.pasangan, kelas = uniq(pas, 'kelas_id'), kid = m.kelas_id || (kelas[0] && kelas[0].kelas_id) || '', mapel = pas.filter((p) => p.kelas_id === kid);
    return '<form class="col" data-submit="mtSimpan" data-id="' + esc(m.id || '') + '" novalidate><div class="g2">' + field('Kelas', sel('kelas_id', kelas.map((k) => [k.kelas_id, k.kelas]), kid).replace('<select ', '<select data-change="mtKelas" '), { req: 1 }) + field('Mata pelajaran', '<span id="mt-mapel">' + sel('mapel_id', mapel.map((x) => [x.mapel_id, x.mapel]), m.mapel_id || '') + '</span>', { req: 1 }) + '</div><div class="g2">' + field('Bab', '<input name="bab" placeholder="Bab 1" value="' + esc(m.bab || '') + '">') + field('Urutan', '<input type="number" name="urut" min="1" value="' + esc(m.urut || Tn.materi.length + 1) + '">') + '</div>' + field('Judul materi', '<input name="judul" value="' + esc(m.judul || '') + '" maxlength="150">', { req: 1 }) + field('Deskripsi', '<textarea name="deskripsi">' + esc(m.deskripsi || '') + '</textarea>') + '<div class="field"><label>Media belajar</label><div class="col gap8" id="mt-media">' + mediaBaris() + '</div><button type="button" class="btn sm mt8" data-act="mtMediaTambah">' + ic('plus', 'sm') + ' Tambah media</button></div><button class="btn primary lg block" type="submit">' + ic('check') + ' Simpan materi</button></form>';
  }
  const bacaMedia = () => $$('#mt-media [data-mi]').map((e, i) => ({ tipe: $('[name=tipe]', e).value, judul: $('[name=judul]', e).value, url: $('[name=url]', e) ? $('[name=url]', e).value : '', berkas_id: (Mt.media[+e.dataset.mi] || {}).berkas_id, idx: +e.dataset.mi }));
  on('mtBaru', () => { Mt.media = []; Object.keys({}).forEach(fileReset); drawer({ title: 'Tambah materi', body: mtForm() }); });
  on('mtEdit', (el) => { const m = Tn.materi.find((x) => x.id === el.dataset.id); Mt.media = m.media.map((x) => Object.assign({}, x)); drawer({ title: 'Ubah materi', body: mtForm(m) }); });
  on('mtKelas', (el) => { const mapel = KM.pasangan.filter((p) => p.kelas_id === el.value); $('#mt-mapel').innerHTML = sel('mapel_id', mapel.map((m) => [m.mapel_id, m.mapel]), ''); });
  on('mtMediaTambah', () => { Mt.media = bacaMedia().map((x) => ({ tipe: x.tipe, judul: x.judul, url: x.url, berkas_id: x.berkas_id })).concat([{ tipe: 'link', judul: '', url: '' }]); $('#mt-media').innerHTML = mediaBaris(); });
  on('mtTipe', () => { Mt.media = bacaMedia().map((x) => ({ tipe: x.tipe, judul: x.judul, url: x.url, berkas_id: x.tipe === 'file' ? x.berkas_id : '' })); $('#mt-media').innerHTML = mediaBaris(); });
  on('mtMediaHapus', (el) => { const i = +el.closest('[data-mi]').dataset.mi; Mt.media = bacaMedia().map((x) => ({ tipe: x.tipe, judul: x.judul, url: x.url, berkas_id: x.berkas_id })); Mt.media.splice(i, 1); $('#mt-media').innerHTML = mediaBaris(); });
  onForm('mtSimpan', async (f) => {
    const v = formVal(f), btn = $('button[type=submit]', f);
    if (v.judul.trim().length < 3) return fieldErr(f, 'judul', 'Judul minimal 3 karakter.');
    await busy(btn, async () => {
      const media = [];
      for (const x of bacaMedia()) {
        if (x.tipe === 'file') { let id = x.berkas_id; if (!id) { const b = fileOf('mf_' + x.idx); if (!b) { toast('Pilih berkas untuk media “' + (x.judul || 'tanpa judul') + '” atau hapus barisnya.', 'warn'); return; } const u = await post('berkas.unggah', { berkas: b, kategori: 'Materi', kelas_id: v.kelas_id }, { timeout: 180000 }); if (!u.success) return toast(u.message, 'bad'); id = u.data.id; fileReset('mf_' + x.idx); } media.push({ tipe: 'file', judul: x.judul || 'Berkas', berkas_id: id }); }
        else { if (!/^https?:\/\/\S+$/i.test(x.url)) return toast('Tautan harus diawali http:// atau https://', 'warn'); media.push({ tipe: x.tipe, judul: x.judul || x.url, url: x.url }); }
      }
      const r = await post('materi.simpan', { id: f.dataset.id || undefined, kelas_id: v.kelas_id, mapel_id: v.mapel_id, bab: v.bab, urut: v.urut, judul: v.judul, deskripsi: v.deskripsi, media: media });
      if (!r.success) return toast(r.message, 'bad'); App.closeTop(); toast(r.message, 'ok'); await muatTn(App.cur); App.cur.paint(tnHtml());
    });
  });
  on('mtHapus', async (el) => { const m = Tn.materi.find((x) => x.id === el.dataset.id); if (!(await App.confirm({ title: 'Hapus materi?', msg: '“' + m.judul + '” akan dihapus dari daftar siswa.', ok: 'Hapus', danger: true }))) return; const r = await post('materi.hapus', { id: m.id }); if (!r.success) return toast(r.message, 'bad'); toast(r.message, 'ok'); await muatTn(App.cur); App.cur.paint(tnHtml()); });

  // ----- input nilai -----
  on('nlGanti', async (el) => {
    const n = Tn.nilai; if (n.dirty && !(await App.confirm({ title: 'Nilai belum disimpan', msg: 'Perubahan akan hilang jika Anda berganti pilihan. Lanjutkan?', ok: 'Buang', danger: true }))) return App.cur.paint(tnHtml());
    n[el.name] = el.value; if (el.name === 'kelas_id') n.mapel_id = ''; pilihKM(KM.pasangan, n, {}); await muatNilai(App.cur); App.cur.paint(tnHtml());
  });
  on('nlIsi', (el) => {
    const n = Tn.nilai, card = el.closest('[data-nid]'), r = n.rows.find((x) => x.siswa_id === card.dataset.nid); let v = el.value === '' ? null : Number(el.value);
    if (v !== null && (isNaN(v) || v < 0 || v > 100)) { el.classList.add('invalid'); return; } el.classList.remove('invalid'); r.nilai = v; n.dirty = true;
    card.classList.toggle('row-bad', v !== null && v < n.kkm); $('[data-nst]', card).textContent = v === null ? 'Belum' : (v >= n.kkm ? 'Tuntas' : 'Remedial'); $('#nl-info').textContent = 'Ada perubahan belum disimpan.';
  });
  on('nlSimpan', async (el) => {
    const n = Tn.nilai; if ($$('#nl-list input.invalid').length) return toast('Perbaiki nilai di luar rentang 0–100.', 'warn');
    await busy(el, async () => { const r = await post('nilai.simpan', { kelas_id: n.kelas_id, mapel_id: n.mapel_id, jenis: n.jenis, rows: n.rows.map((x) => ({ siswa_id: x.siswa_id, nilai: x.nilai })) }); if (!r.success) return toast(r.message, 'bad'); n.dirty = false; $('#nl-info').textContent = 'Nilai tersimpan.'; toast(r.message + ' (' + r.data.baru + ' baru, ' + r.data.diubah + ' diubah' + (r.data.dihapus ? ', ' + r.data.dihapus + ' dihapus' : '') + ')', 'ok'); App.refreshBoot(); });
  });
  on('nlTemplate', async (el) => { const n = Tn.nilai; if (!n.rows.length) return toast('Tidak ada siswa.', 'warn'); await busy(el, async () => { try { await App.xlsxSimpan(n.rows.map((r) => ({ NISN: r.nisn, Nama: r.nama, Nilai: r.nilai === null ? '' : r.nilai })), 'Nilai ' + n.jenis, 'template-nilai-' + n.jenis + '.xlsx'); } catch (e) { toast(e.message, 'bad'); } }); });
  on('nlImpor', async (el) => {
    const f = el.files[0]; if (!f) return; const n = Tn.nilai;
    try { const baris = await App.xlsxBaca(f); let cocok = 0, lewat = 0; baris.forEach((b) => { const r = n.rows.find((x) => x.nisn === String(b.nisn || '').replace(/^'/, '').trim()); const v = Number(String(b.nilai).replace(',', '.')); if (r && b.nilai !== '' && isFinite(v) && v >= 0 && v <= 100) { r.nilai = v; cocok++; } else lewat++; }); n.dirty = true; App.cur.paint(tnHtml()); toast(cocok + ' nilai diimpor' + (lewat ? ', ' + lewat + ' baris dilewati' : '') + '. Periksa lalu simpan.', cocok ? 'ok' : 'warn'); } catch (e) { toast(e.message, 'bad'); } el.value = '';
  });

  // ================= REKAP KEHADIRAN =================
  const Rk = { kelas_id: '', mapel_id: '', dari: '', sampai: '', data: null };
  function rekapHtml() {
    const d = Rk.data, di = d ? d.distribusi : null;
    return '<div class="col gap16"><div class="card"><div class="row wrap gap16" style="align-items:flex-end">' + pilihKM(KM.pasangan, Rk, { chg: 'rkGanti', semua: true }) + field('Dari', '<input type="date" name="dari" value="' + esc(Rk.dari) + '" data-change="rkGanti">', { style: 'min-width:150px' }) + field('Sampai', '<input type="date" name="sampai" value="' + esc(Rk.sampai) + '" data-change="rkGanti">', { style: 'min-width:150px' }) + '</div><div class="row wrap mt16"><button class="btn" data-act="rkExcel">' + ic('table') + ' Unduh Excel</button><button class="btn navy" data-act="rkPdf">' + ic('print') + ' Laporan PDF</button></div></div>' +
      (d ? '<div class="g4"><div class="card stat"><span class="l">Kehadiran (hadir + sakit/izin)</span><span class="v">' + fmt.pct(di.efektif) + '</span></div><div class="card stat"><span class="l">Pertemuan tercatat</span><span class="v">' + d.pertemuan + '</span></div><div class="card stat"><span class="l">Total Alfa</span><span class="v ' + (di.A ? 'bad-t' : '') + '">' + di.A + '</span></div><div class="card stat"><span class="l">Siswa peringatan</span><span class="v ' + (d.siswa.filter((s) => s.label === 'PERINGATAN').length ? 'bad-t' : '') + '">' + d.siswa.filter((s) => s.label === 'PERINGATAN').length + '</span></div></div>' +
      '<div class="split"><div class="card"><div class="card-h"><h3>Distribusi status</h3></div><div class="row gap16 wrap" style="justify-content:center">' + chart.donut([{ label: 'Hadir', value: di.H, color: '#1E3A5F' }, { label: 'Sakit', value: di.S, color: '#B45309' }, { label: 'Izin', value: di.I, color: '#2563EB' }, { label: 'Alfa', value: di.A, color: '#B91C1C' }], fmt.pct(di.persen), 'HADIR') + '<div class="legend grow" style="min-width:140px">' + [['Hadir', di.H, '#1E3A5F'], ['Sakit', di.S, '#B45309'], ['Izin', di.I, '#2563EB'], ['Alfa', di.A, '#B91C1C']].map((x) => '<div class="lg"><i style="background:' + x[2] + '"></i>' + x[0] + '<b>' + x[1] + '</b></div>').join('') + '</div></div></div><div class="card"><div class="card-h"><h3>Tren bulanan</h3></div>' + chart.line(d.tren.map((t) => ({ label: fmt.bulan(t.bulan), value: t.persen })), { min: 0, max: 100 }) + '</div></div>' +
      '<section class="col"><h3>Lembar audit per siswa</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Siswa</th><th class="num">H</th><th class="num">S</th><th class="num">I</th><th class="num">A</th><th style="min-width:150px">Kehadiran</th><th>Predikat</th></tr></thead><tbody>' + d.siswa.map((s) => '<tr class="' + (s.label === 'PERINGATAN' ? 'row-bad' : '') + '"><td><b>' + esc(s.nama) + '</b><div class="small muted">' + esc(s.nisn) + '</div></td><td class="num">' + s.H + '</td><td class="num">' + s.S + '</td><td class="num">' + s.I + '</td><td class="num ' + (s.A >= d.batasAlfa ? 'bad-t b' : '') + '">' + s.A + '</td><td>' + (s.total ? '<div class="row gap8"><div class="grow">' + bar(s.persen, s.persen < d.ambang ? 'bad' : '') + '</div><b class="small">' + fmt.pct(s.persen) + '</b></div>' : '<span class="muted">–</span>') + '</td><td>' + chip(s.label, s.label === 'PRIMA' ? 'ok' : s.label === 'PERINGATAN' ? 'bad' : '') + (s.butuhPanggilan ? '<div class="small bad-t mt4">Alfa ≥ ' + d.batasAlfa + ': panggil wali</div>' : '') + '</td></tr>').join('') + '</tbody></table></div></section>' : skel(2)) + '</div>';
  }
  async function muatRekap(ctx) {
    const r = await api('rekap.kehadiran', { kelas_id: Rk.kelas_id, mapel_id: Rk.mapel_id, dari: Rk.dari, sampai: Rk.sampai }); if (ctx && !ctx.alive()) return;
    if (!r.success) { Rk.data = null; return toast(r.message, 'bad'); } Rk.data = r.data; if (!Rk.dari) { Rk.dari = r.data.dari; Rk.sampai = r.data.sampai; }
  }
  R('guru/rekap', {
    title: 'Rekap kehadiran', sub: () => 'Audit kehadiran siswa',
    async view(ctx) {
      ctx.paint(skel(3)); const km = await muatKM(true); if (!ctx.alive()) return; if (!km || !km.pasangan.length) return ctx.paint(tanpaKelas());
      Rk.mapel_id = ''; Rk.dari = ''; Rk.sampai = ''; pilihKM(km.pasangan, Rk, { semua: true }); Rk.mapel_id = ''; Rk.data = null; ctx.paint(rekapHtml()); await muatRekap(ctx); if (ctx.alive()) ctx.paint(rekapHtml());
    }
  });
  on('rkGanti', async (el) => { Rk[el.name] = el.value; if (el.name === 'kelas_id') { Rk.mapel_id = ''; Rk.dari = ''; Rk.sampai = ''; } pilihKM(KM.pasangan, Rk, { semua: true }); if (el.name === 'kelas_id') Rk.mapel_id = ''; Rk.data = null; App.cur.paint(rekapHtml()); await muatRekap(App.cur); App.cur.paint(rekapHtml()); });
  on('rkExcel', async (el) => { const d = Rk.data; if (!d) return; await busy(el, async () => { try { await App.xlsxSimpan(d.siswa.map((s) => ({ NISN: s.nisn, Nama: s.nama, Hadir: s.H, Sakit: s.S, Izin: s.I, Alfa: s.A, 'Total sesi': s.total, 'Kehadiran (%)': s.persen, Predikat: s.label })), 'Rekap ' + d.kelas, 'rekap-kehadiran-' + d.kelas.replace(/\s+/g, '') + '.xlsx'); } catch (e) { toast(e.message, 'bad'); } }); });
  on('rkPdf', () => {
    const d = Rk.data; if (!d) return;
    App.cetak('<h1>Rekapitulasi Kehadiran Siswa</h1><p>' + esc(d.sekolah) + ' · T.A. ' + esc(d.ta) + ' ' + esc(d.semester) + '<br>Kelas <b>' + esc(d.kelas) + '</b> · ' + esc(d.mapel) + ' · Periode ' + esc(fmt.tgl(d.dari)) + ' s.d. ' + esc(fmt.tgl(d.sampai)) + '<br>Kehadiran keseluruhan: <b>' + fmt.pct(d.distribusi.efektif) + '</b> dari ' + d.pertemuan + ' pertemuan tercatat</p><table><thead><tr><th>No</th><th>NISN</th><th>Nama</th><th class="num">H</th><th class="num">S</th><th class="num">I</th><th class="num">A</th><th class="num">%</th><th>Predikat</th></tr></thead><tbody>' + d.siswa.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(s.nisn) + '</td><td>' + esc(s.nama) + '</td><td class="num">' + s.H + '</td><td class="num">' + s.S + '</td><td class="num">' + s.I + '</td><td class="num">' + s.A + '</td><td class="num">' + (s.total ? fmt.n1(s.persen) : '-') + '</td><td>' + esc(s.label) + '</td></tr>').join('') + '</tbody></table><p style="font-size:10px;margin-top:6px">Kehadiran efektif = (Hadir + Sakit + Izin) ÷ seluruh sesi tercatat. Ambang ' + d.ambang + '%; Alfa ≥ ' + d.batasAlfa + ' memerlukan pemanggilan wali.</p><div class="ttd"><div>Wakil Kepala Sekolah Bid. Kurikulum<div class="sp"></div><b>' + esc(d.pengesah.waka.nama || '(………………………)') + '</b><br>' + (d.pengesah.waka.nip ? 'NIP ' + esc(d.pengesah.waka.nip) : '') + '</div><div>Kepala Sekolah<div class="sp"></div><b>' + esc(d.pengesah.kepsek.nama || '(………………………)') + '</b><br>' + (d.pengesah.kepsek.nip ? 'NIP ' + esc(d.pengesah.kepsek.nip) : '') + '</div></div><p style="font-size:9px;color:#555;margin-top:18px">Dicetak dari sistem ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) + ' WITA.</p>');
  });

  // ================= BIODATA =================
  R('guru/biodata', {
    title: 'Biodata', sub: () => 'Data pendidik & pas foto',
    async view(ctx) {
      ctx.paint(skel(3)); const r = await api('biodata.guru', {}); if (!ctx.alive()) return;
      if (!r.success) return ctx.paint('<div class="card">' + empty('alert', 'Gagal memuat biodata', r.message, '<button class="btn primary" data-act="muatUlang">Coba lagi</button>') + '</div>');
      App.bioSet('guru', r.data);
      ctx.paint('<div class="col gap16" style="max-width:820px"><div class="card">' + App.bioGuruHtml(r.data) + '</div><div class="row wrap"><button class="btn primary" data-act="fotoGanti">' + ic('camera') + ' ' + (r.data.foto_id ? 'Ganti foto' : 'Unggah pas foto') + '</button><button class="btn" data-act="bioCetak">' + ic('print') + ' Cetak biodata</button></div><div class="callout">' + ic('lock') + '<span>Data pokok dikelola Tata Usaha. Hubungi admin untuk perubahan NIP, mata pelajaran, atau wali kelas.</span></div></div>');
    }
  });

  // ================= PROFIL =================
  R('guru/profil', {
    title: 'Profil', sub: () => 'Data pendidik',
    async view(ctx) {
      const b = (await App.refreshBoot()) || S.boot; if (!ctx.alive()) return; const m = b.me;
      ctx.paint('<div class="col gap16" style="max-width:720px"><div class="card row top">' + App.pasfoto(m.id, m.foto_id, m.nama, 'sm') + '<div class="grow"><h2>' + esc(m.nama) + '</h2><div class="row wrap mt8">' + chip('Guru', 'navy') + (m.wali_kelas ? chip('Wali kelas ' + m.wali_kelas, 'teal') : '') + chip(m.status, 'ok') + '</div></div></div><div class="card col"><h3>Data pendidik</h3>' + [['NIP / NUPTK', m.nip], ['Email', m.email || '–'], ['HP', m.hp || '–']].map((r) => '<div class="li"><span class="muted small" style="width:120px">' + r[0] + '</span><b class="grow">' + esc(r[1]) + '</b></div>').join('') + '<div class="li"><span class="muted small" style="width:120px">Mapel</span><div class="row wrap grow">' + (m.mapel.length ? m.mapel.map((x) => chip(x, 'teal')).join('') : '–') + '</div></div><div class="callout">' + ic('lock') + '<span>Data pokok dikelola Tata Usaha. Hubungi admin untuk perubahan.</span></div></div><div class="row wrap"><button class="btn" data-act="fotoGanti">' + ic('camera') + ' ' + (m.foto_id ? 'Ganti foto profil' : 'Unggah pas foto') + '</button><a class="btn" href="#/guru/biodata">' + ic('file') + ' Biodata</a><button class="btn" data-act="gantiSandi">' + ic('lock') + ' Ganti kata sandi</button><button class="btn danger" data-act="keluar">' + ic('logout') + ' Keluar</button></div></div>');
    }
  });
})();
