// ═══════════════════════════════════════════════
//   SARGAM — COSMIC ENGINE v3.0
//   Nebula · Beat Detection · Magnetic Hover
//   Drift-In Entrance · Track Slide Transition
// ═══════════════════════════════════════════════

// ── 1. PLAYLIST DATA ──────────────────────────
// UPDATE your song urls here. Keep music/ prefix for local files.
const playlistData = {
    Bollywood: [
        { title: "Fitoor",   artist: "Arijit Singh",                    url: "music/bgmusic.mp3",badge: "💫" },
        { title: "Saat samundar",  artist: "Sadhana Sargam",       url: "music/bgmusic2.mp3", badge: "🌊"   },
        { title: "Tum ho",    artist: "Mohit Chauhan",           url: "music/bgmusic3.mp3",  badge: "💞"  }
    ],
    Punjabi: [
        { title: "Channa", artist: "Gippy Grewal", url: "music/bgmusic4.mp3", badge: "🌙"  },
        { title: "Maar sutiya",artist: "Amrinder Gill",  url: "music/bgmusic5.mp3", badge: "🕺🏻" }
    ],
    English: [
        { title: "Espresso",     artist: "Sabrina Carpenter",       url: "music/bgmusic6.mp3", badge: "☕"  },
        { title: "Blinding Lights",artist: "The Weeknd",  url: "music/bgmusic7.mp3",   badge: "💡" }
    ]
};

// ── 2. MOOD CONFIG ────────────────────────────
const moodConfig = {
    Bollywood:   { label: "ਬਾਲੀਵੁੱਡ",  cls: "mood-Bollywood",   hex: "#f59e0b", rgb: "245,158,11"  },
    Punjabi: { label: "ਪੰਜਾਬੀ",     cls: "mood-Punjabi", hex: "#f43f5e", rgb: "244,63,94"   },
    English:   { label: "ਅੰਗਰੇਜ਼ੀ",      cls: "mood-English",   hex: "#22d3ee", rgb: "34,211,238"  }
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
let currentIdx  = 0;
let isPlaying   = false;
let audioCtx    = null;
let analyser    = null;
let sourceNode  = null;
let currentMoodRgb = "167,139,250";

// ── 5. DOM REFS ───────────────────────────────
const audio       = document.getElementById('mainAudio');
const playBtn     = document.getElementById('playButton');
const playIcon    = document.getElementById('playIcon');
const pauseIcon   = document.getElementById('pauseIcon');
const vinyl       = document.getElementById('vinylDisk');
const sticker     = document.getElementById('stickerEmoji');
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
const moodDot     = document.getElementById('moodDot');
const beatRing    = document.getElementById('beatRing');
const vizCanvas   = document.getElementById('vizCanvas');
const vizCtx      = vizCanvas.getContext('2d');
const nebCanvas   = document.getElementById('nebulaCanvas');
const nebCtx      = nebCanvas.getContext('2d');

// ══════════════════════════════════════════════
//   NEBULA BACKGROUND ENGINE
// ══════════════════════════════════════════════
const nebulaClouds = [];
let nebulaScale = 1.0; // beat pushes this up

function resizeNebula() {
    nebCanvas.width  = window.innerWidth;
    nebCanvas.height = window.innerHeight;
    buildNebulaClouds();
}

// Add this new stars array near top with other globals (after nebulaClouds = [])
const stars = [];

// Replace buildNebulaClouds
function buildNebulaClouds() {
    nebulaClouds.length = 0;
    stars.length = 0;  // reset stars
    const W = nebCanvas.width;
    const H = nebCanvas.height;
    
    // Nebula clouds
    const positions = [
        { x: 0.5, y: 0.15, r: 0.55 },
        { x: 0.15, y: 0.6,  r: 0.40 },
        { x: 0.85, y: 0.5,  r: 0.38 },
        { x: 0.5,  y: 0.85, r: 0.35 },
        { x: 0.3,  y: 0.25, r: 0.28 }
    ];
    positions.forEach(p => {
        nebulaClouds.push({
            x: p.x * W, y: p.y * H,
            baseR: p.r * Math.min(W, H),
            phase: Math.random() * Math.PI * 2,
            speed: 0.00025 + Math.random() * 0.0003
        });
    });

    // ✨ Twinkling stars for premium depth
    for (let i = 0; i < 220; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.6 + 0.5,
            alpha: Math.random() * 0.7 + 0.4,
            speed: Math.random() * 0.018 + 0.007
        });
    }
}

function drawNebula(ts) {
    const W = nebCanvas.width;
    const H = nebCanvas.height;
    nebCtx.clearRect(0, 0, W, H);

    // Deeper space gradient
    const bg = nebCtx.createRadialGradient(W/2, H*0.35, 0, W/2, H*0.9, Math.max(W,H)*1.15);
    bg.addColorStop(0, `rgba(${currentMoodRgb},0.11)`);
    bg.addColorStop(0.45, `rgba(12,9,28,0.75)`);
    bg.addColorStop(1, '#020106');
    nebCtx.fillStyle = bg;
    nebCtx.fillRect(0, 0, W, H);

    // Twinkling stars
    stars.forEach((s, i) => {
        const twinkle = Math.sin(Date.now() * s.speed * 0.001 + i) * 0.5 + 0.5;
        nebCtx.fillStyle = `rgba(245,245,255,${s.alpha * twinkle})`;
        nebCtx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Enhanced nebula clouds
    nebulaClouds.forEach((c, i) => {
        c.phase += c.speed;
        const breathe = 1 + 0.085 * Math.sin(c.phase * 1.15);
        const beat = i < 2 ? nebulaScale * 1.2 : 1 + (nebulaScale - 1) * 0.55;
        const r = c.baseR * breathe * beat;

        const grad = nebCtx.createRadialGradient(c.x, c.y, r*0.18, c.x, c.y, r * 1.1);
        grad.addColorStop(0, `rgba(${currentMoodRgb},0.09)`);
        grad.addColorStop(0.4, `rgba(${currentMoodRgb},0.038)`);
        grad.addColorStop(1, 'rgba(6,4,22,0)');
        nebCtx.fillStyle = grad;
        nebCtx.fillRect(0, 0, W, H);
    });

    nebulaScale += (1 - nebulaScale) * 0.09;
    requestAnimationFrame(drawNebula);
}

// ══════════════════════════════════════════════
//   CIRCULAR VISUALIZER ENGINE
// ══════════════════════════════════════════════
vizCanvas.width  = 170;
vizCanvas.height = 170;

let lastBassAvg = 0;

function drawViz() {
    requestAnimationFrame(drawViz);
    const W = 170, H = 170, cx = W/2, cy = H/2;
    vizCtx.clearRect(0, 0, W, H);

    if (!analyser) {
        // Idle ghost ring
        vizCtx.beginPath();
        vizCtx.arc(cx, cy, 58, 0, Math.PI*2);
        vizCtx.strokeStyle = `rgba(${currentMoodRgb},0.08)`;
        vizCtx.lineWidth = 1;
        vizCtx.stroke();
        return;
    }

    const bufLen = analyser.frequencyBinCount;
    const freq   = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(freq);

    // Bass detection (bins 0–6)
    let bassSum = 0;
    for (let b = 0; b < 6; b++) bassSum += freq[b];
    const bassAvg = bassSum / 6 / 255;

    // Smooth bass
    lastBassAvg += (bassAvg - lastBassAvg) * 0.25;

    // Trigger beat pulse when bass spikes
    if (lastBassAvg > 0.55) {
        nebulaScale = 1 + lastBassAvg * 0.18;
        triggerBeatRing();
    }

    // Draw radial bars
    const bars   = 60;
    const step   = Math.floor(bufLen / bars);
    const baseR  = 57;
    const maxExt = 24;

    for (let i = 0; i < bars; i++) {
        const v     = freq[i * step] / 255;
        const ext   = v * maxExt + 1.5;
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;

        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + ext);
        const y2 = cy + Math.sin(angle) * (baseR + ext);

        vizCtx.beginPath();
        vizCtx.moveTo(x1, y1);
        vizCtx.lineTo(x2, y2);
        vizCtx.strokeStyle = `rgba(${currentMoodRgb},${(0.4 + v * 0.6).toFixed(2)})`;
        vizCtx.lineWidth   = 2;
        vizCtx.lineCap     = 'round';
        vizCtx.shadowColor = `rgba(${currentMoodRgb},0.8)`;
        vizCtx.shadowBlur  = 4 + v * 10;
        vizCtx.stroke();
    }
    vizCtx.shadowBlur = 0;
}

let beatRingTimeout = null;
function triggerBeatRing() {
    beatRing.classList.remove('pulse');
    void beatRing.offsetWidth; // reflow to restart animation
    beatRing.classList.add('pulse');
    clearTimeout(beatRingTimeout);
    beatRingTimeout = setTimeout(() => beatRing.classList.remove('pulse'), 350);
}

// ══════════════════════════════════════════════
//   MOOD ENGINE
// ══════════════════════════════════════════════
function setMood(category) {
    const m = moodConfig[category];
    if (!m) return;
    document.body.classList.remove('mood-Bollywood', 'mood-Punjabi', 'mood-English');
    document.body.classList.add(m.cls);
    moodLabel.textContent  = m.label;
    currentMoodRgb = m.rgb;
}

// ══════════════════════════════════════════════
//   WEB AUDIO INIT
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
    const direction = (prevTrackIdx === null || idx > prevTrackIdx) ? 'next' : 'prev';
    prevTrackIdx = idx;
    currentIdx   = idx;

    const track = globalPlaylist[currentIdx];
    audio.src   = track.url;

    setMood(track.category);
    animateTrackChange(track, direction);
    sticker.textContent = track.badge;

    timelineFl.style.width = '0%';
    timeCur.textContent    = '0:00';
    timeTot.textContent    = '0:00';

    updateHighlight();

    if (autoplay) {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        audio.play()
            .then(() => { isPlaying = true; setPlayVisuals(true); })
            .catch(e => console.log('Playback:', e));
    }
}

// Slide track info out → update → slide in
function animateTrackChange(track, direction) {
    const exitClass  = direction === 'next' ? 'exit-left'  : 'exit-right';
    const enterClass = direction === 'next' ? 'enter-left' : 'enter-right';

    trackInfo.classList.add(exitClass);

    setTimeout(() => {
        trackTitle.textContent  = track.title;
        trackArtist.textContent = track.artist;
        trackInfo.classList.remove(exitClass);
        trackInfo.classList.add(enterClass);
        setTimeout(() => trackInfo.classList.remove(enterClass), 500);
    }, 220);
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
    if (playing) {
        playIcon.style.display  = 'none';
        pauseIcon.style.display = 'block';
        vinyl.classList.add('spinning');
    } else {
        playIcon.style.display  = 'block';
        pauseIcon.style.display = 'none';
        vinyl.classList.remove('spinning');
    }
}

function playNext() {
    let n = currentIdx + 1;
    if (n >= globalPlaylist.length) n = 0;
    loadTrack(n, true);
}

function playPrev() {
    let p = currentIdx - 1;
    if (p < 0) p = globalPlaylist.length - 1;
    loadTrack(p, true);
}

function updateHighlight() {
    document.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('active');
        const meta = el.querySelector('.song-meta');
        if (meta) {
            const m = el.className.match(/cat-(\w+)\s+idx-(\d+)/);
            if (m) meta.textContent = `T${parseInt(m[2]) + 1}`;
            meta.classList.remove('playing');
        }
    });

    const active = globalPlaylist[currentIdx];
    const row = document.querySelector(`.song-item.cat-${active.category}.idx-${active.localIndex}`);
    if (row) {
        row.classList.add('active');
        const meta = row.querySelector('.song-meta');
        if (meta && isPlaying) {
            meta.textContent = '⚡';
            meta.classList.add('playing');
        }
    }
}

function fmt(s) {
    if (isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}

// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//   RENDER PLAYLISTS & SCROLL REVEAL
// ══════════════════════════════════════════════
function renderPlaylists() {
    catKeys.forEach(cat => {
        const container = document.getElementById(`playlist-${cat}`);
        if (!container) return;
        container.innerHTML = '';
        playlistData[cat].forEach((song, i) => {
            const gIdx = globalPlaylist.findIndex(t => t.category === cat && t.localIndex === i);
            const row  = document.createElement('div');
            row.className = `song-item cat-${cat} idx-${i}`;
            row.onclick   = () => loadTrack(gIdx, true);
            
            // Add a slight delay based on the index so they cascade in nicely
            row.style.transitionDelay = `${i * 0.08}s, ${i * 0.08}s, 0s, 0s, 0s`;

            row.innerHTML = `
                <div class="song-left">
                    <span class="song-badge">${song.badge}</span>
                    <span class="song-name">${song.title}</span>
                </div>
                <span class="song-meta">T${i+1}</span>
            `;
            container.appendChild(row);
        });
    });

    // Premium Interactive Scroll Reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { 
        threshold: 0.1, // Trigger when 10% of the item is visible
        rootMargin: "0px 0px -20px 0px" // Trigger slightly before it hits the bottom
    });

    document.querySelectorAll('.song-item').forEach(el => observer.observe(el));
}


// ══════════════════════════════════════════════
//   MAGNETIC HOVER (song rows lean toward cursor)
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
            const reach = 90;

            if (dist < reach) {
                const strength = (1 - dist / reach) * 5;
                el.style.transform = `translate(${(dx/dist)*strength}px, ${(dy/dist)*strength}px)`;
            } else {
                el.style.transform = '';
            }
        });
    });
}

// ══════════════════════════════════════════════
//   DRIFT-IN ENTRANCE (elements fly from edges)
// ══════════════════════════════════════════════
function triggerEntrance() {
    const delays = {
        brand:       100,
        moodPill:    280,
        playerCard:  460,
        mainContent: 600
    };
    Object.entries(delays).forEach(([id, delay]) => {
        const el = document.getElementById(id);
        if (!el) return;
        setTimeout(() => el.classList.add('arrived'), delay);
    });
    // Footer
    setTimeout(() => {
        document.querySelector('.footer')?.classList.add('arrived');
    }, 700);
}

// ══════════════════════════════════════════════
//   EVENT LISTENERS
// ══════════════════════════════════════════════
function setupEvents() {
    playBtn.onclick  = togglePlay;
    nextBtn.onclick  = playNext;
    prevBtn.onclick  = playPrev;

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

    // Load first track silently (no autoplay)
    loadTrack(0, false);
    // Set initial title text without slide animation
    trackTitle.textContent  = globalPlaylist[0].title;
    trackArtist.textContent = globalPlaylist[0].artist;
});
