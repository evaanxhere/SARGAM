// SARGAM v8 — 90s wall. Add songs in LIB below.
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
let cur = 0, shuf = false, seeking = false, ctx, an, data;
const fmt = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';

// string lights
for (let i = 0; i < 22; i++) {
  const b = document.createElement('i');
  b.style.setProperty('--c', ['#ff3d9a', '#25e8d6', '#ffd23f', '#9b6bff'][i % 4]);
  b.style.animationDelay = i * 0.13 + 's';
  $('lights').append(b);
}

// poster wall
const posters = []; let k = 0;
Object.keys(LIB).forEach(c => {
  const g = document.createElement('section');
  g.innerHTML = `<h2>${c}</h2><div class="row"></div>`;
  T.forEach((t, i) => {
    if (t.c !== c) return;
    const p = document.createElement('div');
    p.className = 'poster p-' + c;
    p.style.setProperty('--r', ((k++ * 37) % 9 - 4) + 'deg');
    p.innerHTML = `<i class="art"></i><b>${t.title}</b><span>${t.artist}</span><em>0${t.n + 1}</em>`;
    p.onclick = () => i === cur ? toggle() : load(i, true);
    p.onpointermove = e => {
      const r = p.getBoundingClientRect();
      p.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 24 + 'deg');
      p.style.setProperty('--rx', -((e.clientY - r.top) / r.height - .5) * 24 + 'deg');
    };
    p.onpointerleave = () => { p.style.setProperty('--rx', '0deg'); p.style.setProperty('--ry', '0deg'); };
    g.lastChild.append(p); posters[i] = p;
  });
  $('wall').append(g);
});

// player
function load(i, play) {
  cur = i; const t = T[i];
  a.src = t.url; $('title').textContent = t.title; $('artist').textContent = t.artist;
  seek.value = 0; $('cur').textContent = '0:00';
  posters.forEach((p, j) => p.classList.toggle('on', j === i));
  if ('mediaSession' in navigator) try { navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist }); } catch (e) {}
  if (play) a.play().catch(() => {});
}
const toggle = () => a.paused ? a.play().catch(() => {}) : a.pause();
const next = () => load(shuf ? Math.floor(Math.random() * T.length) : (cur + 1) % T.length, true);
const prev = () => a.currentTime > 3 ? (a.currentTime = 0) : load((cur - 1 + T.length) % T.length, true);

function loop() {
  requestAnimationFrame(loop);
  an.getByteFrequencyData(data);
  document.documentElement.style.setProperty('--beat', ((data[1] + data[2] + data[3]) / 765).toFixed(2));
}
a.onplay = () => {
  B.classList.add('playing'); $('play').innerHTML = '&#10074;&#10074;';
  if (!ctx) try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    an = ctx.createAnalyser(); an.fftSize = 64;
    ctx.createMediaElementSource(a).connect(an); an.connect(ctx.destination);
    data = new Uint8Array(an.frequencyBinCount); loop();
  } catch (e) {}
  if (ctx) ctx.resume();
};
a.onpause = () => { B.classList.remove('playing'); $('play').innerHTML = '&#9654;'; };
a.onended = next;
a.onerror = () => { $('artist').textContent = 'file not found - check music folder'; };
a.onloadedmetadata = () => $('dur').textContent = fmt(a.duration);
a.ontimeupdate = () => {
  if (seeking || !a.duration) return;
  seek.value = a.currentTime / a.duration * 1000; $('cur').textContent = fmt(a.currentTime);
};
seek.oninput = () => { seeking = true; if (a.duration) $('cur').textContent = fmt(a.duration * seek.value / 1000); };
seek.onchange = () => { if (a.duration) a.currentTime = a.duration * seek.value / 1000; seeking = false; };

$('play').onclick = toggle; $('next').onclick = next; $('prev').onclick = prev;
$('shuf').onclick = e => { shuf = !shuf; e.currentTarget.classList.toggle('lit', shuf); };
$('lamp').onclick = e => { B.classList.toggle('dark'); e.currentTarget.classList.toggle('lit'); };
addEventListener('pointermove', e => { B.style.setProperty('--mx', e.clientX + 'px'); B.style.setProperty('--my', e.clientY + 'px'); });
addEventListener('keydown', e => {
  if (e.target.tagName === 'BUTTON') return;
  if (e.code === 'Space') { e.preventDefault(); toggle(); }
  if (e.code === 'ArrowRight' && e.target !== seek) next();
  if (e.code === 'ArrowLeft' && e.target !== seek) prev();
});
load(0, false);
})();
