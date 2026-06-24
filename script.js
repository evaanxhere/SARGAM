// --- 1. PLAYLIST DATA INTERFACE ---
const playlistData = {
    punjabi: [
        {
            title: "Oreo's Jam Track",
            artist: "Vibe Mix",
            url: "music/bgmusic.mp3",       // ✅ Your uploaded MP3
            badge: "🌾"
        },
        {
            title: "Dil Nu Lofi Beats",
            artist: "Aesthetic Instrumental",
            url: "music/dil-nu-lofi.mp3",   // 🎵 Add this file to music/ folder
            badge: "🔥"
        },
        {
            title: "Late Night Geri",
            artist: "Punjabi Lo-fi Loop",
            url: "music/late-night-geri.mp3", // 🎵 Add this file to music/ folder
            badge: "🚗"
        }
    ],
    bollywood: [
        {
            title: "Chura Ke Dil Mera Lofi",
            artist: "Nostalgia Instrumental Reverb",
            url: "music/chura-ke-dil.mp3",  // 🎵 Add this file to music/ folder
            badge: "🥀"
        },
        {
            title: "Tum Mile Chill Mix",
            artist: "Rainy Afternoon Lofi",
            url: "music/tum-mile-chill.mp3", // 🎵 Add this file to music/ folder
            badge: "☔"
        }
    ],
    english: [
        {
            title: "Late Night Coffee",
            artist: "English Lo-fi Beats",
            url: "music/late-night-coffee.mp3", // 🎵 Add this file to music/ folder
            badge: "☕"
        },
        {
            title: "Sunset Boulevard Drive",
            artist: "Chill Dreamy Indie Synth",
            url: "music/sunset-boulevard.mp3",  // 🎵 Add this file to music/ folder
            badge: "🌅"
        }
    ]
};
// Flatten data for seamless Next/Prev global playback skipping
const globalPlaylist = [];
const categoryKeys = Object.keys(playlistData);

categoryKeys.forEach(cat => {
    playlistData[cat].forEach((track, index) => {
        globalPlaylist.push({
            ...track,
            category: cat,
            localIndex: index
        });
    });
});

// App Engine Trackers
let currentGlobalIndex = 0;
let isPlaying = false;

// DOM Elements
const audio = document.getElementById('mainAudio');
const playButton = document.getElementById('playButton');
const vinylDisk = document.getElementById('vinylDisk');
const stickerEmoji = document.getElementById('stickerEmoji');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const timelineFilled = document.getElementById('timelineFilled');
const timelineContainer = document.getElementById('timelineContainer');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Initial Launch Execution
document.addEventListener('DOMContentLoaded', () => {
    renderPlaylists();
    loadTrack(0, false);
    setupEventListeners();
});

// Render Playlists Dom Content
function renderPlaylists() {
    categoryKeys.forEach(cat => {
        const container = document.getElementById(`playlist-${cat}`);
        container.innerHTML = "";

        playlistData[cat].forEach((song, index) => {
            const row = document.createElement('div');
            row.className = `song-item cat-${cat} idx-${index}`;
            
            // Map item click back to its location in the global playlist array
            const gIndex = globalPlaylist.findIndex(t => t.category === cat && t.localIndex === index);
            row.onclick = () => loadTrack(gIndex, true);

            row.innerHTML = `
                <div class="song-title-row">
                    <span class="song-badge">${song.badge}</span>
                    <div>${song.title}</div>
                </div>
                <div class="song-meta">Track ${index + 1}</div>
            `;
            container.appendChild(row);
        });
    });
}

// Track Loading Method
function loadTrack(globalIndex, autoplay = true) {
    currentGlobalIndex = globalIndex;
    const track = globalPlaylist[currentGlobalIndex];

    audio.src = track.url;
    playerTitle.textContent = track.title;
    playerArtist.textContent = track.artist;
    stickerEmoji.textContent = track.badge;

    // Reset seeker updates
    timelineFilled.style.width = '0%';
    timeCurrent.textContent = "0:00";
    timeTotal.textContent = "0:00";

    updateUIState();

    if (autoplay) {
        audio.play().then(() => {
            isPlaying = true;
            toggleVisuals(true);
        }).catch(err => console.log("Playback Engine Block:", err));
    }
}

// Toggle Playback Actions
function togglePlay() {
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        toggleVisuals(false);
    } else {
        audio.play().then(() => {
            isPlaying = true;
            toggleVisuals(true);
        }).catch(err => console.log("Interactivity Play Block:", err));
    }
    updateUIState();
}

function toggleVisuals(shouldPlay) {
    if (shouldPlay) {
        playButton.textContent = "⏸";
        vinylDisk.classList.add('spinning');
    } else {
        playButton.textContent = "▶";
        vinylDisk.classList.remove('spinning');
    }
}

// Global Array Next/Prev Index Shifters
function playNext() {
    let nextIndex = currentGlobalIndex + 1;
    if (nextIndex >= globalPlaylist.length) nextIndex = 0;
    loadTrack(nextIndex, true);
}

function playPrev() {
    let prevIndex = currentGlobalIndex - 1;
    if (prevIndex < 0) prevIndex = globalPlaylist.length - 1;
    loadTrack(prevIndex, true);
}

// Synchronize Highlight State Row Indicators
function updateUIState() {
    document.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('active');
        const metaEl = el.querySelector('.song-meta');
        if (metaEl) {
            // Restore default text pattern 
            const matches = el.className.match(/idx-(\d+)/);
            if(matches) metaEl.textContent = `Track ${parseInt(matches[1]) + 1}`;
        }
    });

    const activeTrack = globalPlaylist[currentGlobalIndex];
    const targetRow = document.querySelector(`.song-item.cat-${activeTrack.category}.idx-${activeTrack.localIndex}`);
    if (targetRow) {
        targetRow.classList.add('active');
        const metaEl = targetRow.querySelector('.song-meta');
        if (metaEl && isPlaying) {
            metaEl.innerHTML = `<span style="color: var(--primary-color); font-weight: bold;">Playing ⚡</span>`;
        }
    }
}

// Standard Audio Time Utilities Format
function formatTime(secs) {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Bind Audio Event Streams
function setupEventListeners() {
    playButton.onclick = togglePlay;
    nextBtn.onclick = playNext;
    prevBtn.onclick = playPrev;

    // Time update sync tracking
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            timelineFilled.style.width = `${pct}%`;
            timeCurrent.textContent = formatTime(audio.currentTime);
            timeTotal.textContent = formatTime(audio.duration);
        }
    });

    // Auto-advance loop tracking on end sequence
    audio.addEventListener('ended', () => {
        playNext();
    });

    // Scrub Seeker Timeline Actions
    timelineContainer.addEventListener('click', (e) => {
        const coordX = e.offsetX;
        const totalWidth = timelineContainer.clientWidth;
        const scrubPct = coordX / totalWidth;
        if (audio.duration) {
            audio.currentTime = scrubPct * audio.duration;
        }
    });
}

