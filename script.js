// ═══════════════════════════════════════════════
//   SARGAM v6 — Cassette Editorial Engine
// ═══════════════════════════════════════════════

const playlistData = {
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

const moodConfig = {
    Bollywood: { label: "ਬਾਲੀਵੁੱਡ", cls: "mood-Bollywood", accent: "#c49a2a" },
    Punjabi:   { label: "ਪੰਜਾਬੀ",   cls: "mood-Punjabi",   accent: "#c43a9a" },
    English:   { label: "ਅੰਗਰੇਜ਼ੀ",   cls: "mood-English",   accent: "#2a7ab0" }
};

const globalPlaylist = [];
const catKeys = Object.keys(playlistData);
catKeys.forEach(cat => {
    playlistData[cat].forEach((track, i) => {
        globalPlaylist.push({ ...track, category: cat, localIndex: i });
    });
});

let currentIdx  = 0, isPlaying = false, isShuffle = false, repeatMode = 0;
let audioCtx = null, analyser = null, waveData = null;
let currentAccent = "#c49a2a";

const audio      = document.getElementById('mainAudio');
const playBtn    = document.getElementById('playBtn');
const playIcon   = document.getElementById('playIcon');
const pauseIcon  = document.getElementById('pauseIcon');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn  = document.getElementById('repeatBtn');
const reelL      = document.getElementById('reelLeft');
const reelR      = document.getElementById('reelRight');
const ciNum      = document.getElementById('ciNum');
const ciTitle    = document.getElementById('ciTitle');
const ciArtist   = document.getElementById('ciArtist');
const mastCat    = document.getElementById('mastCat');
const mtLabel    = document.getElementById('mtLabel');
const mtDot      = document.getElementById('mtDot');
const timeCur    = document.getElementById('timeCur');
const timeTot    = document.getElementById('timeTot');
const vizCanvas  = document.getElementById('vizCanvas');
const vizCtx     = vizCanvas.getContext('2d');
const waveCanvas = document.getElementById('waveCanvas');
const waveCtx    = waveCanvas.getContext('2d');
const grainCanvas= document.getElementById('grainCanvas');
const grainCtx   = grainCanvas.getContext('2d');

// ── GRAIN ────────────────────────────────────
function setupGrain() {
    grainCanvas.width = window.innerWidth;
    grainCanvas.height = window.innerHeight;
}
setInterval(() => {
    const W = grainCanvas.width, H = grainCanvas.height;
    const d = grainCtx.createImageData(W, H);
    for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() * 255;
        d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255;
    }
    grainCtx.putImageData(d, 0, 0);
}, 80);

// ── WAVEFORM ─────────────────────────────────
function setupWaveCanvas() {
    const dpr = window.devicePixelRatio || 1, w = waveCanvas.offsetWidth || 240;
    waveCanvas.width = w * dpr; waveCanvas.height = 32 * dpr;
    waveCtx.scale(dpr, dpr);
    waveCanvas.style.width = w + 'px'; waveCanvas.style.height = '32px';
}

async function loadWaveform(url) {
    waveData = null; drawWave(0);
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = await (await fetch(url)).arrayBuffer();
        const dec = await ctx.decodeAudioData(buf); ctx.close();
        const raw = dec.getChannelData(0), peaks = 180, chunk = Math.floor(raw.length / peaks);
        waveData = new Float32Array(peaks);
        for (let i = 0; i < peaks; i++) {
            let mx = 0;
            for (let j = 0; j < chunk; j++) { const v = Math.abs(raw[i*chunk+j]); if (v > mx) mx = v; }
            waveData[i] = mx;
        }
        drawWave(audio.currentTime / (audio.duration || 1));
    } catch(e) { drawWave(0); }
}

function drawWave(progress) {
    const w = waveCanvas.offsetWidth || 240, h = 32, dpr = window.devicePixelRatio || 1;
    waveCtx.clearRect(0, 0, w * dpr, h * dpr);
    if (!waveData) {
        const mid = h / 2;
        waveCtx.fillStyle = 'rgba(255,255,255,0.08)';
        waveCtx.fillRect(0, mid-1, w, 2);
        if (progress > 0) {
            waveCtx.fillStyle = currentAccent;
            waveCtx.fillRect(0, mid-1, w*progress, 2);
            waveCtx.beginPath(); waveCtx.arc(w*progress, mid, 4, 0, Math.PI*2);
            waveCtx.fill();
        }
        return;
    }
    const bars = waveData.length, barW = w / bars, mid = h / 2, cut = Math.floor(progress * bars);
    for (let i = 0; i < bars; i++) {
        const bh = Math.max(1.5, waveData[i] * h * 0.85), x = i * barW;
        waveCtx.fillStyle = i < cut ? currentAccent : 'rgba(255,255,255,0.12)';
        waveCtx.shadowColor = i < cut ? currentAccent : 'transparent';
        waveCtx.shadowBlur  = i < cut ? 3 : 0;
        waveCtx.beginPath(); waveCtx.roundRect(x, mid-bh/2, Math.max(1,barW-0.8), bh, 0.5); waveCtx.fill();
    }
    waveCtx.shadowBlur = 0;
}

waveCanvas.addEventListener('click', e => {
    if (!audio.duration) return;
    const r = waveCanvas.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
});

// ── MINI VIZ ─────────────────────────────────
function drawViz() {
    requestAnimationFrame(drawViz);
    vizCtx.clearRect(0, 0, 60, 18);
    if (!analyser) {
        vizCtx.fillStyle = 'rgba(255,255,255,0.06)';
        vizCtx.fillRect(0, 8, 60, 2); return;
    }
    const freq = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freq);
    for (let i = 0; i < 20; i++) {
        const v = freq[Math.floor(i * freq.length / 20)] / 255;
        const bh = Math.max(1, v * 14);
        vizCtx.fillStyle = currentAccent;
        vizCtx.globalAlpha = 0.5 + v * 0.5;
        vizCtx.fillRect(i * 3, 9 - bh/2, 2, bh);
    }
    vizCtx.globalAlpha = 1;
}

// ── MOOD ─────────────────────────────────────
function setMood(category) {
    const m = moodConfig[category]; if (!m) return;
    currentAccent = m.accent;
    Object.values(moodConfig).forEach(c => document.body.classList.remove(c.cls));
    document.body.classList.add(m.cls);
    mtLabel.textContent = m.label; mastCat.textContent = category;
    mtDot.style.background = m.accent; mastCat.style.color = m.accent;
}

// ── WEB AUDIO ────────────────────────────────
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 128;
    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser); analyser.connect(audioCtx.destination);
}

// ── SHUFFLE / REPEAT ─────────────────────────
function getNext() {
    if (repeatMode === 2) return currentIdx;
    if (isShuffle) { let n; do { n = Math.floor(Math.random()*globalPlaylist.length); } while(n===currentIdx&&globalPlaylist.length>1); return n; }
    return (currentIdx + 1) % globalPlaylist.length;
}
function getPrev() {
    if (isShuffle) { let n; do { n = Math.floor(Math.random()*globalPlaylist.length); } while(n===currentIdx&&globalPlaylist.length>1); return n; }
    return (currentIdx - 1 + globalPlaylist.length) % globalPlaylist.length;
}

// ── PLAYER ───────────────────────────────────
function loadTrack(idx, autoplay = true) {
    currentIdx = idx;
    const t = globalPlaylist[idx];
    audio.src = t.url; setMood(t.category);
    animateInfo(t, idx);
    timeCur.textContent = timeTot.textContent = '0:00';
    waveData = null; drawWave(0); loadWaveform(t.url);
    updateHighlight(); scrollToActive();
    if (autoplay) {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        audio.play().then(() => { isPlaying = true; setPlayUI(true); updateHighlight(); }).catch(e => console.log(e));
    }
}

function animateInfo(track, idx) {
    ciTitle.style.opacity = ciArtist.style.opacity = ciNum.style.opacity = '0';
    setTimeout(() => {
        ciTitle.textContent = track.title;
        ciArtist.textContent = track.artist.toUpperCase();
        ciNum.textContent = String(idx + 1).padStart(2, '0');
        ciTitle.style.transition = ciArtist.style.transition = ciNum.style.transition = 'opacity 0.4s ease';
        ciTitle.style.opacity = ciArtist.style.opacity = ciNum.style.opacity = '1';
    }, 140);
}

function togglePlay() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isPlaying) { audio.pause(); isPlaying = false; setPlayUI(false); }
    else { audio.play().then(() => { isPlaying = true; setPlayUI(true); }).catch(e => console.log(e)); }
    updateHighlight();
}

function setPlayUI(p) {
    playIcon.style.display = p ? 'none' : 'block';
    pauseIcon.style.display = p ? 'block' : 'none';
    p ? (reelL.classList.add('spinning'), reelR.classList.add('spinning'))
      : (reelL.classList.remove('spinning'), reelR.classList.remove('spinning'));
}

function fmt(s) { return !isFinite(s)||isNaN(s)?'0:00':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; }

function updateHighlight() {
    document.querySelectorAll('.song-row').forEach(el => el.classList.remove('active'));
    const t = globalPlaylist[currentIdx];
    document.querySelector(`.song-row[data-cat="${t.category}"][data-idx="${t.localIndex}"]`)?.classList.add('active');
}

function scrollToActive() {
    const t = globalPlaylist[currentIdx];
    setTimeout(() => {
        document.querySelector(`.song-row[data-cat="${t.category}"][data-idx="${t.localIndex}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

// ── RENDER ───────────────────────────────────
function renderPlaylists() {
    catKeys.forEach(cat => {
        const grid = document.getElementById(`playlist-${cat}`);
        const count = document.getElementById(`cnt-${cat}`);
        if (!grid) return;
        const songs = playlistData[cat];
        if (count) count.textContent = songs.length + ' tracks';
        grid.innerHTML = '';
        songs.forEach((song, i) => {
            const gIdx = globalPlaylist.findIndex(t => t.category === cat && t.localIndex === i);
            const row = document.createElement('div');
            row.className = 'song-row'; row.dataset.cat = cat; row.dataset.idx = i;
            row.onclick = () => loadTrack(gIdx, true);
            row.innerHTML = `
                <span class="sr-num">${String(i+1).padStart(2,'0')}</span>
                <div class="sr-main">
                    <div class="sr-title">${song.title}</div>
                    <div class="sr-artist">${song.artist}</div>
                </div>
                <div class="sr-right">
                    <span class="sr-dur" data-src="${song.url}">—:——</span>
                    <span class="sr-wave"><span class="wb"></span><span class="wb"></span><span class="wb"></span></span>
                </div>`;
            grid.appendChild(row);
        });
    });
    document.querySelectorAll('.sr-dur[data-src]').forEach(el => {
        const tmp = new Audio(); tmp.preload = 'metadata'; tmp.src = el.dataset.src;
        tmp.addEventListener('loadedmetadata', () => { el.textContent = fmt(tmp.duration); tmp.src = ''; });
    });
}

// ── SHUFFLE / REPEAT UI ──────────────────────
function toggleShuffle() { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); }
function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    repeatBtn.classList.toggle('active', repeatMode > 0);
    repeatBtn.title = ['Repeat off','Repeat all','Repeat one'][repeatMode];
    document.getElementById('repeatIcon').innerHTML = repeatMode === 2
        ? '<path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zm-4-2V9h-1l-2 1v1h1.5v4z"/>'
        : '<path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"/>';
}

// ── SWIPE ────────────────────────────────────
function setupSwipe() {
    const card = document.querySelector('.cassette'); let sx = null;
    card.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    card.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) dx < 0 ? loadTrack(getNext()) : loadTrack(getPrev());
        sx = null;
    }, { passive: true });
}

// ── KEYBOARD ─────────────────────────────────
function setupKeyboard() {
    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        switch(e.code) {
            case 'Space': e.preventDefault(); togglePlay(); break;
            case 'ArrowRight': e.preventDefault();
                e.shiftKey ? (audio.currentTime = Math.min(audio.duration||0, audio.currentTime+10)) : loadTrack(getNext()); break;
            case 'ArrowLeft': e.preventDefault();
                e.shiftKey ? (audio.currentTime = Math.max(0, audio.currentTime-10)) : loadTrack(getPrev()); break;
            case 'KeyS': toggleShuffle(); break;
            case 'KeyR': toggleRepeat(); break;
        }
    });
}

// ── BOOT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setupGrain(); setupWaveCanvas(); drawViz();
    renderPlaylists(); setupSwipe(); setupKeyboard();

    playBtn.onclick = togglePlay;
    prevBtn.onclick = () => loadTrack(getPrev());
    nextBtn.onclick = () => loadTrack(getNext());
    shuffleBtn.onclick = toggleShuffle;
    repeatBtn.onclick  = toggleRepeat;

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        timeCur.textContent = fmt(audio.currentTime);
        timeTot.textContent = fmt(audio.duration);
        drawWave(audio.currentTime / audio.duration);
    });
    audio.addEventListener('ended', () => {
        repeatMode === 2 ? (audio.currentTime = 0, audio.play()) : loadTrack(getNext());
    });
    window.addEventListener('resize', () => {
        grainCanvas.width = window.innerWidth; grainCanvas.height = window.innerHeight;
        setupWaveCanvas();
    });

    loadTrack(0, false);
    ciTitle.textContent = globalPlaylist[0].title;
    ciArtist.textContent = globalPlaylist[0].artist.toUpperCase();
    ciNum.textContent = '01';
});
