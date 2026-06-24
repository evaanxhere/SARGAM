// ============================================
//   SUNO VIBES — COSMIC ENGINE v2.0
// ============================================

// --- 1. PLAYLIST DATA (update urls with your music/ paths) ---
const playlistData = {
    punjabi: [
        {
            title: "Oreo's Jam Track",
            artist: "Vibe Mix",
            url: "music/bgmusic.mp3",
            badge: "🌾"
        },
        {
            title: "Dil Nu Lofi Beats",
            artist: "Aesthetic Instrumental",
            url: "music/bgmusic2.mp3",
            badge: "🔥"
        },
        {
            title: "Late Night Geri",
            artist: "Punjabi Lo-fi Loop",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            badge: "🚗"
        }
    ],
    bollywood: [
        {
            title: "Chura Ke Dil Mera Lofi",
            artist: "Nostalgia Instrumental Reverb",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            badge: "🥀"
        },
        {
            title: "Tum Mile Chill Mix",
            artist: "Rainy Afternoon Lofi",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            badge: "☔"
        }
    ],
    english: [
        {
            title: "Late Night Coffee",
            artist: "English Lo-fi Beats",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
            badge: "☕"
        },
        {
            title: "Sunset Boulevard Drive",
            artist: "Chill Dreamy Indie Synth",
            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
            badge: "🌅"
        }
    ]
};

// --- 2. MOOD CONFIG ---
const moodConfig = {
    punjabi:   { label: "🌾 Golden Harvest — Punjabi Beats", class: "mood-punjabi",   color: "#f59e0b", glow: "rgba(245,158,11,0.35)" },
    bollywood: { label: "🎬 Rose Cinema — Bollywood 90s",    class: "mood-bollywood", color: "#f43f5e", glow: "rgba(244,63,94,0.35)"  },
    english:   { label: "🎧 Ocean Neon — Old / English",     class: "mood-english",   color: "#22d3ee", glow: "rgba(34,211,238,0.35)" }
};

// --- 3. BUILD GLOBAL PLAYLIST ---
const globalPlaylist = [];
const categoryKeys = Object.keys(playlistData);
categoryKeys.forEach(cat => {
    playlistData[cat].forEach((track, index) => {
        globalPlaylist.push({ ...track, category: cat, localIndex: index });
    });
});

// --- 4. STATE ---
let currentGlobalIndex = 0;
let isPlaying = false;
let audioCtx = null;
let analyser = null;
let sourceNode = null;
let vizAnimId = null;

// --- 5. DOM REFS ---
const audio             = document.getElementById('mainAudio');
const playButton        = document.getElementById('playButton');
const vinylDisk         = document.getElementById('vinylDisk');
const stickerEmoji      = document.getElementById('stickerEmoji');
const playerTitle       = document.getElementById('playerTitle');
const playerArtist      = document.getElementById('playerArtist');
const timelineFilled    = document.getElementById('timelineFilled');
const timelineContainer = document.getElementById('timelineContainer');
const timeCurrent       = document.getElementById('timeCurrent');
const timeTotal         = document.getElementById('timeTotal');
const prevBtn           = document.getElementById('prevBtn');
const nextBtn           = document.getElementById('nextBtn');
const moodLabel         = document.getElementById('moodLabel');
const moodBannerText    = document.getElementById('moodBannerText');
const moodOverlay       = document.getElementById('moodOverlay');
const vizCanvas         = document.getElementById('visualizerCanvas');
const vizCtx            = vizCanvas.getContext('2d');
const starCanvas        = document.getElementById('starCanvas');
const starCtx           = starCanvas.getContext('2d');

// ============================================
//   STARFIELD ENGINE
// ============================================
let stars = [];
let starColor = "#a78bfa";

function resizeStarCanvas() {
    starCanvas.width  = window.innerWidth;
    starCanvas.height = window.innerHeight;
}

function initStars(count = 180) {
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x:     Math.random() * starCanvas.width,
            y:     Math.random() * starCanvas.height,
            r:     Math.random() * 1.5 + 0.3,
            speed: Math.random() * 0.3 + 0.05,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}

function drawStars() {
    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    const now = Date.now() / 1000;
    stars.forEach(s => {
        s.twinkle += 0.015;
        const alpha = 0.3 + 0.5 * Math.abs(Math.sin(s.twinkle));
        starCtx.beginPath();
        starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        starCtx.fillStyle = `rgba(${hexToRgb(starColor)},${alpha.toFixed(2)})`;
        starCtx.fill();

        s.y += s.speed;
        if (s.y > starCanvas.height) {
            s.y = 0;
            s.x = Math.random() * starCanvas.width;
        }
    });
    requestAnimationFrame(drawStars);
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `${r},${g},${b}`;
}

// ============================================
//   VISUALIZER ENGINE
// ============================================
vizCanvas.width  = 160;
vizCanvas.height = 160;

function initAudioContext() {
    if (audioCtx) return;
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
}

function drawVisualizer() {
    vizAnimId = requestAnimationFrame(drawVisualizer);

    const W = vizCanvas.width;
    const H = vizCanvas.height;
    const cx = W / 2;
    const cy = H / 2;
    vizCtx.clearRect(0, 0, W, H);

    if (!analyser) {
        // idle: subtle ghost ring
        vizCtx.beginPath();
        vizCtx.arc(cx, cy, 54, 0, Math.PI * 2);
        vizCtx.strokeStyle = "rgba(255,255,255,0.04)";
        vizCtx.lineWidth = 1;
        vizCtx.stroke();
        return;
    }

    const bufLen = analyser.frequencyBinCount;
    const data   = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(data);

    const bars  = 48;
    const step  = Math.floor(bufLen / bars);
    const baseR = 56;
    const maxH  = 22;
    const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--mood-primary').trim() || "#a78bfa";

    for (let i = 0; i < bars; i++) {
        const value  = data[i * step] / 255;
        const barH   = value * maxH + 2;
        const angle  = (i / bars) * Math.PI * 2 - Math.PI / 2;

        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + barH);
        const y2 = cy + Math.sin(angle) * (baseR + barH);

        vizCtx.beginPath();
        vizCtx.moveTo(x1, y1);
        vizCtx.lineTo(x2, y2);
        vizCtx.strokeStyle = color;
        vizCtx.lineWidth   = 2.5;
        vizCtx.lineCap     = "round";
        vizCtx.globalAlpha = 0.5 + value * 0.5;
        vizCtx.shadowColor = color;
        vizCtx.shadowBlur  = 4 + value * 8;
        vizCtx.stroke();
    }
    vizCtx.globalAlpha = 1;
    vizCtx.shadowBlur  = 0;
}

// ============================================
//   MOOD ENGINE
// ============================================
function setMood(category) {
    const mood = moodConfig[category];
    if (!mood) return;

    // Remove old mood classes
    document.body.classList.remove('mood-punjabi', 'mood-bollywood', 'mood-english');
    document.body.classList.add(mood.class);

    moodLabel.textContent      = mood.label;
    moodBannerText.textContent = mood.label;
    starColor                  = mood.color;

    // Update overlay glow
    moodOverlay.style.background =
        `radial-gradient(ellipse at 50% 0%, ${mood.glow} 0%, transparent 70%)`;
}

// ============================================
//   PLAYER ENGINE
// ============================================
function renderPlaylists() {
    categoryKeys.forEach(cat => {
        const container = document.getElementById(`playlist-${cat}`);
        container.innerHTML = "";

        playlistData[cat].forEach((song, index) => {
            const gIndex = globalPlaylist.findIndex(t => t.category === cat && t.localIndex === index);
            const row = document.createElement('div');
            row.className = `song-item cat-${cat} idx-${index}`;
            row.onclick = () => loadTrack(gIndex, true);
            row.innerHTML = `
                <div class="song-title-row">
                    <span class="song-badge">${song.badge}</span>
                    <div class="song-title-text">${song.title}</div>
                </div>
                <div class="song-meta" id="meta-${cat}-${index}">T${index + 1}</div>
            `;
            container.appendChild(row);
        });
    });
}

function loadTrack(globalIndex, autoplay = true) {
    currentGlobalIndex = globalIndex;
    const track = globalPlaylist[currentGlobalIndex];

    audio.src = track.url;
    playerTitle.textContent  = track.title;
    playerArtist.textContent = track.artist;
    stickerEmoji.textContent = track.badge;

    timelineFilled.style.width = '0%';
    timeCurrent.textContent    = "0:00";
    timeTotal.textContent      = "0:00";

    setMood(track.category);
    updateUIState();

    if (autoplay) {
        // Init Web Audio on first real user interaction
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        audio.play()
            .then(() => { isPlaying = true; toggleVisuals(true); })
            .catch(err => console.log("Playback block:", err));
    }
}

function togglePlay() {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        toggleVisuals(false);
    } else {
        audio.play()
            .then(() => { isPlaying = true; toggleVisuals(true); })
            .catch(err => console.log("Play block:", err));
    }
    updateUIState();
}

function toggleVisuals(shouldPlay) {
    if (shouldPlay) {
        playButton.innerHTML = "&#9646;&#9646;";
        vinylDisk.classList.add('spinning');
    } else {
        playButton.innerHTML = "&#9654;";
        vinylDisk.classList.remove('spinning');
    }
}

function playNext() {
    let next = currentGlobalIndex + 1;
    if (next >= globalPlaylist.length) next = 0;
    loadTrack(next, true);
}

function playPrev() {
    let prev = currentGlobalIndex - 1;
    if (prev < 0) prev = globalPlaylist.length - 1;
    loadTrack(prev, true);
}

function updateUIState() {
    document.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('active');
        const matches = el.className.match(/cat-(\w+)\s.*idx-(\d+)/);
        if (matches) {
            const metaEl = document.getElementById(`meta-${matches[1]}-${matches[2]}`);
            if (metaEl) metaEl.textContent = `T${parseInt(matches[2]) + 1}`;
        }
    });

    const active = globalPlaylist[currentGlobalIndex];
    const targetRow = document.querySelector(`.song-item.cat-${active.category}.idx-${active.localIndex}`);
    if (targetRow) {
        targetRow.classList.add('active');
        const metaEl = document.getElementById(`meta-${active.category}-${active.localIndex}`);
        if (metaEl && isPlaying) {
            metaEl.innerHTML = `<span style="color:var(--mood-primary)">⚡</span>`;
        }
    }
}

function formatTime(secs) {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function setupEventListeners() {
    playButton.onclick = togglePlay;
    nextBtn.onclick    = playNext;
    prevBtn.onclick    = playPrev;

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            timelineFilled.style.width   = `${pct}%`;
            timeCurrent.textContent      = formatTime(audio.currentTime);
            timeTotal.textContent        = formatTime(audio.duration);
        }
    });

    audio.addEventListener('ended', playNext);

    timelineContainer.addEventListener('click', e => {
        if (audio.duration) {
            audio.currentTime = (e.offsetX / timelineContainer.clientWidth) * audio.duration;
        }
    });

    window.addEventListener('resize', () => {
        resizeStarCanvas();
        initStars();
    });
}

// ============================================
//   BOOT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    resizeStarCanvas();
    initStars();
    drawStars();
    drawVisualizer();
    renderPlaylists();
    loadTrack(0, false);
    setupEventListeners();
});
