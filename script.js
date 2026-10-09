// SARGAM v9 — add songs in LIB. Backgrounds: images/bollywood.jpg, punjabi.jpg, english.jpg
(() => {
const LIB = {
  Bollywood: [
    { title: "Fitoor",          artist: "Arijit Singh",      url: "music/bgmusic.mp3"  },
    { title: "Saat Samundar",   artist: "Sadhana Sargam",    url: "music/bgmusic2.mp3" },
    { title: "Tum Ho",          artist: "Mohit Chauhan",     url: "music/bgmusic3.mp3" }
  ],
  Punjabi: [
    { title: "Channa",          artist: "Gippy Grewal",      url: "music/bgmusic4.mp3" },
    { title: "Maar Sutiya",     artist: "Amrinder Gill",     url: "music/bgmusic5.mp3" }
  ],
  English: [
    { title: "Espresso",        artist: "Sabrina Carpenter", url: "music/bgmusic6.mp3" },
    { title: "Blinding Lights", artist: "The Weeknd",        url: "music/bgmusic7.mp3" }
  ]
};
const T = [];
Object.entries(LIB).forEach(([c, s]) => s.forEach((x, n) => T.push({ ...x, c, n })));
const $ = i => document.getElementById(i), a = $('audio'), B = document.body, seek = $('seek');
let cur = 0, seeking = false;
const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';
const fill = p => seek.style.setProperty('--p', p + '%');

// song sheet
const rows = [];
Object.keys(LIB).forEach(c => {
  const h = document.createElement('h3'); h.textContent = c; $('list').append(h);
  T.forEach((t, i) => {
    if (t.c !== c) return;
    const r = document.createElement('div');
    r.className = 'row';
    r.innerHTML = `<i>${t.n + 1}</i><div><b>${t.title}</b><span>${t.artist}</span></div><u>playing</u>`;
    r.onclick = () => { load(i, true); setOpen(false); };
    $('list').append(r); rows[i] = r;
  });
});
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
  B.dataset.cat = t.c;
  document.querySelectorAll('.bg').forEach(b => b.classList.toggle('on', b.dataset.c === t.c));
  rows.forEach((r, j) => r.classList.toggle('on', j === i));
  seek.value = 0; fill(0); $('cur').textContent = '0:00';
  if ('mediaSession' in navigator) try { navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: 'Sargam' }); } catch (e) {}
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
  if (e.target.tagName === 'BUTTON' || e.target === seek) return;
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

load(0, false);
})();
