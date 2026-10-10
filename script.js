// SARGAM v9 — add songs in LIB. Backgrounds: images/bollywood.jpg, punjabi.jpg, english.jpg
(() => {
const LIB = {
  Bollywood: [],
  Punjabi: [],
  English: []
};
const T = [];
Object.entries(LIB).forEach(([c, s]) => s.forEach((x, n) => T.push({ ...x, c, n })));
const $ = i => document.getElementById(i), a = $('audio'), B = document.body, seek = $('seek');
let cur = 0, seeking = false;
const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
const fill = p => seek.style.setProperty('--p', p + '%');

// song sheet: built from LIB below + every audio file found in music/<Category>/ on GitHub
const REPO = '';   // only if you use a custom domain, e.g. 'yourname/sargam'
const AUDIO = /\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i;
const CATS = Object.keys(LIB);
const rows = [];
function renderList() {
  const L = $('list'); L.innerHTML = ''; rows.length = 0;
  CATS.forEach(c => {
    const items = T.map((t, i) => [t, i]).filter(([t]) => t.c === c);
    if (!items.length) return;
    const h = document.createElement('h3'); h.textContent = c; L.append(h);
    let alb = null;
    items.forEach(([t, i], k) => {
      if (t.album && t.album !== alb) { const a = document.createElement('h4'); a.textContent = t.album; L.append(a); }
      alb = t.album || null;
      const r = document.createElement('div'); r.className = 'row' + (i === cur ? ' on' : '');
      r.innerHTML = '<i></i><div><b></b><span></span></div><u>playing</u>';
      r.querySelector('i').textContent = k + 1;
      r.querySelector('b').textContent = t.title; r.querySelector('span').textContent = t.artist;
      r.onclick = () => { load(i, true); setOpen(false); };
      L.append(r); rows[i] = r;
    });
  });
}
// "01 - Channa Mereya - Arijit Singh.mp3" -> title + artist (artist falls back to album folder)
function parse(file, album) {
  const n = decodeURIComponent(file).replace(AUDIO, '').replace(/_/g, ' ').replace(/^\s*\d+\s*[-.)]\s*/, '').trim();
  const [t, ...a] = n.split(' - ');
  return a.length ? { title: t.trim(), artist: a.join(' - ').trim() } : { title: n, artist: album || '' };
}
function add(paths) {
  const now = T[cur], have = new Set(T.map(t => t.url));
  paths.slice().sort().forEach(p => {
    const s = p.split('/'), c = CATS.find(x => x.toLowerCase() === (s[1] || '').toLowerCase());
    const url = s.map(encodeURIComponent).join('/');
    if (!c || s.length < 3 || have.has(url) || have.has(p)) return;
    const album = s.length > 3 ? s[2] : '';
    T.push({ ...parse(s[s.length - 1], album), url, c, album });
  });
  T.sort((x, y) => CATS.indexOf(x.c) - CATS.indexOf(y.c));
  if (now) cur = T.indexOf(now); else if (T.length) load(0, false);
  renderList();
}
async function scan() {
  try {
    const host = location.hostname, p = location.pathname.split('/').filter(Boolean);
    const [owner, repo] = REPO ? REPO.split('/') : [host.split('.')[0], p[0] && !/\.\w+$/.test(p[0]) ? p[0] : host];
    const gh = 'https://api.github.com/repos/' + owner + '/' + repo;
    const br = (await (await fetch(gh)).json()).default_branch;
    const tree = (await (await fetch(gh + '/git/trees/' + br + '?recursive=1')).json()).tree;
    const found = tree.filter(f => f.type === 'blob' && AUDIO.test(f.path) && f.path.startsWith('music/')).map(f => f.path);
    localStorage.setItem('sargam-lib', JSON.stringify(found)); add(found);
  } catch (e) { try { add(JSON.parse(localStorage.getItem('sargam-lib') || '[]')); } catch (_) {} }
}
const setOpen = o => B.classList.toggle('open', o);
$('meta').onclick = e => { if (!e.target.closest('.bar')) setOpen(true); };
$('meta').onkeydown = e => { if (e.key === 'Enter') setOpen(true); };
$('bd').onclick = $('grab').onclick = () => setOpen(false);

// player
function load(i, play) {
  cur = i; const t = T[i];
  a.src = t.url;
  $('title').textContent = t.title;
  $('sub').textContent = t.artist + ' \u2022 ' + t.c;
  const bgs = [...document.querySelectorAll('.bg')], k = bgs.some(b => b.dataset.c === t.c) ? t.c : 'Bollywood';
  B.dataset.cat = k;
  bgs.forEach(b => b.classList.toggle('on', b.dataset.c === k));
  rows.forEach((r, j) => r.classList.toggle('on', j === i));
  seek.value = 0; fill(0); $('cur').textContent = '0:00';
  $('art').style.background = t.img ? "center/cover url('" + t.img + "')" : '';
  if ('mediaSession' in navigator) try { navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: 'Sargam', artwork: t.img ? [{ src: t.img, sizes: '200x200' }] : [] }); } catch (e) {}
  if (play) a.play().catch(() => {});
}
const toggle = () => a.paused ? a.play().catch(() => {}) : a.pause();
const next = () => load((cur + 1) % T.length, true);
const prev = () => a.currentTime > 3 ? (a.currentTime = 0) : load((cur - 1 + T.length) % T.length, true);
a.onplay = () => B.classList.add('playing');
a.onpause = () => B.classList.remove('playing');
a.onended = next;
a.onerror = () => { $('sub').textContent = 'file not found - check music folder'; };
a.onloadedmetadata = () => $('dur').textContent = fmt(a.duration);
a.ontimeupdate = () => {
  if (seeking || !a.duration) return;
  const v = a.currentTime / a.duration * 1000;
  seek.value = v; fill(v / 10); $('cur').textContent = fmt(a.currentTime);
};
seek.oninput = () => { seeking = true; fill(seek.value / 10); if (a.duration) $('cur').textContent = fmt(a.duration * seek.value / 1000); };
seek.onchange = () => { if (a.duration) a.currentTime = a.duration * seek.value / 1000; seeking = false; };
$('play').onclick = toggle; $('next').onclick = next; $('prev').onclick = prev;
if ('mediaSession' in navigator) try {
  navigator.mediaSession.setActionHandler('play', toggle); navigator.mediaSession.setActionHandler('pause', toggle);
  navigator.mediaSession.setActionHandler('nexttrack', next); navigator.mediaSession.setActionHandler('previoustrack', prev);
} catch (e) {}
addEventListener('keydown', e => {
  if (e.key === 'Escape') setOpen(false);
  if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); toggle(); }
  if (e.code === 'ArrowRight') next();
  if (e.code === 'ArrowLeft') prev();
});

// rain mood
const cv = $('rain'), g = cv.getContext('2d'); let drops = [], raining = false;
function size() { cv.width = innerWidth; cv.height = innerHeight; drops = Array.from({ length: 150 }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, l: 10 + Math.random() * 18, v: 9 + Math.random() * 9 })); }
function rain() {
  if (!raining) return;
  g.clearRect(0, 0, cv.width, cv.height);
  g.strokeStyle = 'rgba(200,220,255,.45)'; g.lineWidth = 1.2; g.beginPath();
  drops.forEach(d => { g.moveTo(d.x, d.y); g.lineTo(d.x - 2, d.y + d.l); d.y += d.v; d.x -= .6; if (d.y > cv.height) { d.y = -20; d.x = Math.random() * cv.width; } });
  g.stroke(); requestAnimationFrame(rain);
}
$('rainBtn').onclick = () => {
  raining = !raining; B.classList.toggle('rainy', raining);
  $('rainState').textContent = raining ? 'ON' : 'OFF';
  $('rainBtn').setAttribute('aria-pressed', raining);
  if (raining) rain();
};
addEventListener('resize', size); size();

// living scene: leaves + birds
const lc = $('leaves'), lg = lc.getContext('2d'); let leaves = [];
const PAL = { Bollywood: ['#e2552b', '#ffb347', '#6bbf59'], Punjabi: ['#ffc93d', '#e8a317', '#7cb342'], English: ['#2ad4c4', '#9be15d', '#5aa469'] };
const mk = first => ({ x: Math.random() * innerWidth, y: first ? Math.random() * innerHeight : -20, s: 5 + Math.random() * 7, v: .5 + Math.random() * .9,
  ph: Math.random() * 6.28, sw: .01 + Math.random() * .02, a: Math.random() * 6.28, ra: (Math.random() - .5) * .04, ci: Math.floor(Math.random() * 3) });
function lsize() { lc.width = innerWidth; lc.height = innerHeight; leaves = Array.from({ length: 16 }, () => mk(true)); }
function lloop() {
  requestAnimationFrame(lloop); lg.clearRect(0, 0, lc.width, lc.height);
  const pal = PAL[B.dataset.cat] || PAL.Bollywood;
  leaves.forEach(l => {
    l.ph += l.sw; l.y += l.v; l.x += Math.sin(l.ph * 8) * .6 + .25; l.a += l.ra;
    if (l.y > lc.height + 20 || l.x > lc.width + 20) Object.assign(l, mk(false));
    lg.save(); lg.translate(l.x, l.y); lg.rotate(l.a); lg.globalAlpha = .85; lg.fillStyle = pal[l.ci];
    lg.beginPath(); lg.ellipse(0, 0, l.s, l.s * .45, 0, 0, 6.283); lg.fill();
    lg.strokeStyle = 'rgba(0,0,0,.25)'; lg.beginPath(); lg.moveTo(-l.s, 0); lg.lineTo(l.s, 0); lg.stroke(); lg.restore();
  });
}
addEventListener('resize', lsize); lsize();
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lloop();
  (function flock() {
    if (!raining && !document.hidden) {
      const y = 8 + Math.random() * 28, d = 14 + Math.random() * 8;
      for (let i = 0; i < 3; i++) {
        const b = document.createElement('div'); b.className = 'bird';
        b.style.cssText = `top:${y + i * 2.5}vh;--d:${d}s;animation-delay:${i * .5}s;scale:${1 - i * .2}`;
        b.innerHTML = '<svg viewBox="0 0 24 10"><path d="M1 8Q6 0 12 7Q18 0 23 8" fill="none" stroke="#14141c" stroke-width="1.6" stroke-linecap="round"/></svg>';
        $('sky').append(b); setTimeout(() => b.remove(), (d + 3) * 1000);
      }
    }
    setTimeout(flock, 9000 + Math.random() * 9000);
  })();
}

// install as app (works offline)
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

if (T.length) load(0, false); else $('title').textContent = 'Loading\u2026';
renderList();
scan();
})();
