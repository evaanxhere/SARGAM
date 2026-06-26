// ═══════════════════════════════════════════════
//   SARGAM — ENGINE v4.0
//   Ambient ink wash · Beat Detection
//   Drift-In Entrance · Track Slide Transition
// ═══════════════════════════════════════════════

// ── 1. PLAYLIST DATA ──────────────────────────
const playlistData = {
    Bollywood: [
        { title: "Fitoor",          artist: "Arijit Singh",     url: "music/bgmusic.mp3"  },
        { title: "Saat Samundar",   artist: "Sadhana Sargam",   url: "music/bgmusic2.mp3" },
        { title: "Tum Ho",          artist: "Mohit Chauhan",    url: "music/bgmusic3.mp3" }
    ],
    Punjabi: [
        { title: "Channa",          artist: "Gippy Grewal",     url: "music/bgmusic4.mp3" },
        { title: "Maar Sutiya",     artist: "Amrinder Gill",    url: "music/bgmusic5.mp3" }
    ],
    English: [
        { title: "Espresso",        artist: "Sabrina Carpenter",url: "music/bgmusic6.mp3" },
        { title: "Blinding Lights", artist: "The Weeknd",       url: "music/bgmusic7.mp3" }
    ]
};

// ── 2. MOOD CONFIG ────────────────────────────
// cls must match body.mood-* in CSS exactly
const moodConfig = {
    Bollywood: { label: "ਬਾਲੀਵੁੱਡ", cls: "mood-Bollywood", rgb: "245,158,11"   },
    Punjabi:   { label: "ਪੰਜਾਬੀ",   cls: "mood-Punjabi",   rgb: "244,114,182"  },
    English:   { label: "ਅੰਗਰੇਜ਼ੀ",   cls: "mood-English",   rgb: "103,232,249"  }
};

// ── 3. GLOBAL PLAYLIST ────────────────────────
const globalPlaylist = [];
const catKeys = Object.keys(playlistData);
catKeys.forEach(cat => {
    playlistData[cat].forEach((track, i) => {
        globalPlaylist.push({ ...track, category: cat, localIndex: i });
    });
});

// ── 4. STATE ──────────────────────────────────
let currentIdx     = 0;
let isPlaying      = false;
let audioCtx       = null;
let analyser       = null;
let sourceNode     = null;
let currentMoodRgb = "201,168,76";

// ── 5. DOM REFS ───────────────────────────────
const audio       = document.getElementById('mainAudio');
const playBtn     = document.getElementById('playButton');
const playIcon    = document.getElementById('playIcon');
const pauseIcon   = document.getElementById('pauseIcon');
const vinyl       = document.getElementById('vinylDisk');
const stickerEl   = document.getElementById('stickerEmoji');
const trackTitle  = document.getElementById('playerTitle');
const trackArtist = document.getElementById('playerArtist');
const trackInfo   = document.getElementById('trackInfo');
const timelineCt  = document.getElementById('timelineContainer');
const timelineFl  = document.getElementById('timelineFilled');
const timeThumb   = document.getElementById('timelineThumb');
const timeCur     = document.getElementById('timeCurrent');
const timeTot     = document.getElementById('timeTotal');
const prevBtn     = document.getElementById('prevBtn');
const nextBtn     = document.getElementById('nextBtn');
const moodLabel   = document.getElementById('moodLabel');
const beatRing    = document.getElementById('beatRing');
const vizCanvas   = document.getElementById('vizCanvas');
const vizCtx      = vizCanvas.getContext('2d');
const nebCanvas   = document.getElementById('nebulaCanvas');
const nebCtx      = nebCanvas.getContext('2d');

// ══════════════════════════════════════════════
//   AMBIENT INK-WASH BACKGROUND
// ══════════════════════════════════════════════
const inkBlobs = [];
const stars    = [];

function resizeNebula() {
    nebCanvas.width  = window.innerWidth;
    nebCanvas.height = window.innerHeight;
    buildScene();
}

function buildScene() {
    inkBlobs.length = 0;
    stars.length = 0;
    const W = nebCanvas.width;
    const H = nebCanvas.height;

    // Ink wash blobs — visible, slow-breathing
    const positions = [
        { x: 0.5,  y: 0.18, r: 0.48 },
        { x: 0.12, y: 0.65, r: 0.34 },
        { x: 0.88, y: 0.55, r: 0.32 },
        { x: 0.5,  y: 0.82, r: 0.30 },
        { x: 0.28, y: 0.38, r: 0.22 }
    ];
    positions.forEach(p => {
        inkBlobs.push({
            x: p.x * W,
            y: p.y * H,
            baseR: p.r * Math.min(W, H),
            phase: Math.random() * Math.PI * 2,
            speed: 0.0002 + Math.random() * 0.00025
        });
    });

    // Fine stars
    for (let i = 0; i < 180; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.4 + 0.3,
            alpha: Math.random() * 0.5 + 0.2,
            speed: Math.random() * 0.014 + 0.006
        });
    }
}

let nebulaScale = 1.0;

function drawNebula() {
    const W = nebCanvas.width;
    const H = nebCanvas.height;
    nebCtx.clearRect(0, 0, W, H);

    // Deep ground
    nebCtx.fillStyle = '#08070f';
    nebCtx.fillRect(0, 0, W, H);

    // Stars
    stars.forEach((s, i) => {
        const twinkle = Math.sin(Date.now() * s.speed * 0.001 + i) * 0.4 + 0.6;
        nebCtx.fillStyle = `rgba(240,235,220,${(s.alpha * twinkle).toFixed(3)})`;
        nebCtx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Ink-wash blobs — richer opacity so they're actually visible
    inkBlobs.forEach((c, i) => {
        c.phase += c.speed;
        const breathe = 1 + 0.07 * Math.sin(c.phase);
        const beat    = i < 2 ? nebulaScale * 1.15 : 1 + (nebulaScale - 1) * 0.5;
        const r = c.baseR * breathe * beat;

        const grad = nebCtx.createRadialGradient(c.x, c.y, r * 0.1, c.x, c.y, r);
        grad.addColorStop(0,   `rgba(${currentMoodRgb},0.13)`);
        grad.addColorStop(0.35,`rgba(${currentMoodRgb},0.055)`);
        grad.addColorStop(0.7, `rgba(${currentMoodRgb},0.018)`);
        grad.addColorStop(1,   `rgba(${currentMoodRgb},0)`);
        nebCtx.fillStyle = grad;
        nebCtx.fillRect(0, 0, W, H);
    });

    // Central soft radial vignette (darkens edges, keeps center alive)
    const vignette = nebCtx.createRadialGradient(W/2, H*0.3, 0, W/2, H, Math.max(W,H)*0.85);
    vignette.addColorStop(0,   'rgba(8,7,15,0)');
    vignette.addColorStop(0.6, 'rgba(8,7,15,0.35)');
    vignette.addColorStop(1,   'rgba(8,7,15,0.8)');
    nebCtx.fillStyle = vignette;
    nebCtx.fillRect(0, 0, W, H);

    nebulaScale += (1 - nebulaScale) * 0.08;
    requestAnimationFrame(drawNebula);
}

// ══════════════════════════════════════════════
//   CIRCULAR VISUALIZER
// ══════════════════════════════════════════════
vizCanvas.width  = 156;
vizCanvas.height = 156;

let lastBassAvg = 0;

function drawViz() {
    requestAnimationFrame(drawViz);
    const W = 156, H = 156, cx = W/2, cy = H/2;
    vizCtx.clearRect(0, 0, W, H);

    if (!analyser) {
        // Idle ghost ring
        vizCtx.beginPath();
        vizCtx.arc(cx, cy, 52, 0, Math.PI*2);
        vizCtx.strokeStyle = `rgba(${currentMoodRgb},0.07)`;
        vizCtx.lineWidth = 1;
        vizCtx.stroke();
        return;
    }

    const bufLen = analyser.frequencyBinCount;
    const freq   = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(freq);

    let bassSum = 0;
    for (let b = 0; b < 6; b++) bassSum += freq[b];
    const bassAvg = bassSum / 6 / 255;
    lastBassAvg += (bassAvg - lastBassAvg) * 0.22;

    if (lastBassAvg > 0.5) {
        nebulaScale = 1 + lastBassAvg * 0.16;
        triggerBeatRing();
    }

    const bars  = 56;
    const step  = Math.floor(bufLen / bars);
    const baseR = 52;
    const maxExt = 20;

    for (let i = 0; i < bars; i++) {
        const v     = freq[i * step] / 255;
        const ext   = v * maxExt + 1.2;
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + ext);
        const y2 = cy + Math.sin(angle) * (baseR + ext);

        vizCtx.beginPath();
        vizCtx.moveTo(x1, y1);
        vizCtx.lineTo(x2, y2);
        vizCtx.strokeStyle = `rgba(${currentMoodRgb},${(0.35 + v * 0.65).toFixed(2)})`;
        vizCtx.lineWidth = 1.8;
        vizCtx.lineCap   = 'round';
        vizCtx.shadowColor = `rgba(${currentMoodRgb},0.7)`;
        vizCtx.shadowBlur  = 3 + v * 8;
        vizCtx.stroke();
    }
    vizCtx.shadowBlur = 0;
}

let beatRingTimeout = null;
function triggerBeatRing() {
    beatRing.classList.remove('pulse');
    void beatRing.offsetWidth;
    beatRing.classList.add('pulse');
    clearTimeout(beatRingTimeout);
    beatRingTimeout = setTimeout(() => beatRing.classList.remove('pulse'), 400);
}

// ══════════════════════════════════════════════
//   MOOD ENGINE
// ══════════════════════════════════════════════
function setMood(category) {
    const m = moodConfig[category];
    if (!m) return;
    // Remove all mood classes then add the right one
    Object.values(moodConfig).forEach(cfg => document.body.classList.remove(cfg.cls));
    document.body.classList.add(m.cls);
    moodLabel.textContent = m.label;
    currentMoodRgb = m.rgb;

    // Also update the CSS custom property so canvas colors update instantly
    document.documentElement.style.setProperty('--mrgb', m.rgb);
}

// ══════════════════════════════════════════════
//   WEB AUDIO
// ══════════════════════════════════════════════
function initAudio() {
    if (audioCtx) return;
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    analyser   = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
}

// ══════════════════════════════════════════════
//   PLAYER ENGINE
// ══════════════════════════════════════════════
let prevTrackIdx = null;

function loadTrack(idx, autoplay = true) {
    const direction  = (prevTrackIdx === null || idx > prevTrackIdx) ? 'next' : 'prev';
    prevTrackIdx     = idx;
    currentIdx       = idx;

    const track  = globalPlaylist[currentIdx];
    audio.src    = track.url;
    setMood(track.category);
    animateTrackChange(track, direction);

    // Update vinyl center — clean symbol instead of emoji
    stickerEl.textContent = '◈';

    timelineFl.style.width = '0%';
    timeCur.textContent    = '0:00';
    timeTot.textContent    = '0:00';
    updateHighlight();

    if (autoplay) {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        audio.play()
            .then(() => { isPlaying = true; setPlayVisuals(true); updateHighlight(); })
            .catch(e => console.log('Playback:', e));
    }
}

function animateTrackChange(track, direction) {
    const exitClass  = direction === 'next' ? 'exit-left'  : 'exit-right';
    const enterClass = direction === 'next' ? 'enter-left' : 'enter-right';
    trackInfo.classList.add(exitClass);
    setTimeout(() => {
        trackTitle.textContent  = track.title;
        trackArtist.textContent = track.artist;
        trackInfo.classList.remove(exitClass);
        trackInfo.classList.add(enterClass);
        setTimeout(() => trackInfo.classList.remove(enterClass), 480);
    }, 200);
}

function togglePlay() {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        setPlayVisuals(false);
    } else {
        audio.play()
            .then(() => { isPlaying = true; setPlayVisuals(true); })
            .catch(e => console.log('Play:', e));
    }
    updateHighlight();
}

function setPlayVisuals(playing) {
    playIcon.style.display  = playing ? 'none'  : 'block';
    pauseIcon.style.display = playing ? 'block' : 'none';
    playing ? vinyl.classList.add('spinning') : vinyl.classList.remove('spinning');
}

function playNext() {
    loadTrack((currentIdx + 1) % globalPlaylist.length, true);
}
function playPrev() {
    loadTrack((currentIdx - 1 + globalPlaylist.length) % globalPlaylist.length, true);
}

function updateHighlight() {
    document.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('active');
        const meta = el.querySelector('.song-meta');
        if (meta) meta.classList.remove('playing');
    });

    const active = globalPlaylist[currentIdx];
    const row = document.querySelector(`.song-item[data-cat="${active.category}"][data-idx="${active.localIndex}"]`);
    if (row) {
        row.classList.add('active');
        if (isPlaying) {
            const meta = row.querySelector('.song-meta');
            if (meta) meta.classList.add('playing');
        }
    }
}

function fmt(s) {
    if (isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}

// ══════════════════════════════════════════════
//   RENDER PLAYLISTS
// ══════════════════════════════════════════════
function renderPlaylists() {
    catKeys.forEach(cat => {
        const container = document.getElementById(`playlist-${cat}`);
        const countEl   = document.getElementById(`count-${cat}`);
        if (!container) return;

        const songs = playlistData[cat];
        if (countEl) countEl.textContent = `${songs.length} tracks`;

        container.innerHTML = '';
        songs.forEach((song, i) => {
            const gIdx = globalPlaylist.findIndex(t => t.category === cat && t.localIndex === i);
            const row  = document.createElement('div');
            row.className = 'song-item';
            row.dataset.cat = cat;
            row.dataset.idx = i;
            row.onclick = () => loadTrack(gIdx, true);
            row.innerHTML = `
                <div class="song-left">
                    <span class="song-num">${i + 1}</span>
                    <span class="song-name">${song.title}</span>
                </div>
                <div class="song-right">
                    <span class="song-artist">${song.artist}</span>
                    <span class="song-meta">T${i+1}</span>
                    <span class="song-wave" aria-hidden="true">
                        <span class="wave-bar"></span>
                        <span class="wave-bar"></span>
                        <span class="wave-bar"></span>
                    </span>
                </div>
            `;
            container.appendChild(row);
        });
    });
}

// ══════════════════════════════════════════════
//   MAGNETIC HOVER
// ══════════════════════════════════════════════
function setupMagneticHover() {
    document.addEventListener('mousemove', e => {
        document.querySelectorAll('.song-item').forEach(el => {
            const rect = el.getBoundingClientRect();
            const cx   = rect.left + rect.width  / 2;
            const cy   = rect.top  + rect.height / 2;
            const dx   = e.clientX - cx;
            const dy   = e.clientY - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const reach = 80;
            if (dist < reach) {
                const strength = (1 - dist / reach) * 4;
                el.style.transform = `translate(${(dx/dist)*strength}px, ${(dy/dist)*strength}px)`;
            } else {
                el.style.transform = '';
            }
        });
    });
}

// ══════════════════════════════════════════════
//   DRIFT-IN ENTRANCE
// ══════════════════════════════════════════════
function triggerEntrance() {
    const items = [
        { id: 'brand',       delay: 80  },
        { id: 'moodPill',    delay: 260 },
        { id: 'playerCard',  delay: 420 },
        { id: 'mainContent', delay: 560 },
    ];
    items.forEach(({ id, delay }) => {
        const el = document.getElementById(id);
        if (el) setTimeout(() => el.classList.add('arrived'), delay);
    });
    setTimeout(() => document.querySelector('.footer')?.classList.add('arrived'), 640);
}

// ══════════════════════════════════════════════
//   EVENTS
// ══════════════════════════════════════════════
function setupEvents() {
    playBtn.onclick = togglePlay;
    nextBtn.onclick = playNext;
    prevBtn.onclick = playPrev;

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        timelineFl.style.width = `${pct}%`;
        timeThumb.style.left   = `${pct}%`;
        timeCur.textContent    = fmt(audio.currentTime);
        timeTot.textContent    = fmt(audio.duration);
    });

    audio.addEventListener('ended', playNext);

    timelineCt.addEventListener('click', e => {
        if (audio.duration)
            audio.currentTime = (e.offsetX / timelineCt.clientWidth) * audio.duration;
    });

    window.addEventListener('resize', resizeNebula);
}

// ══════════════════════════════════════════════
//   BOOT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    resizeNebula();
    requestAnimationFrame(drawNebula);
    drawViz();
    renderPlaylists();
    setupMagneticHover();
    setupEvents();
    triggerEntrance();

    loadTrack(0, false);
    trackTitle.textContent  = globalPlaylist[0].title;
    trackArtist.textContent = globalPlaylist[0].artist;
});
