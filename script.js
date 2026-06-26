// ═══════════════════════════════════════════════
//   SARGAM — ENGINE v6.0 (APPLE MUSIC API EDITION)
// ═══════════════════════════════════════════════

// ── 1. PLAYLIST DATA (Now Dynamic!) ───────────
let playlistData = {
    Bollywood: [],
    Punjabi: [],
    English: []
};

let globalPlaylist = [];

// ── 2. MOOD CONFIG ────────────────────────────
const moodConfig = {
    Bollywood: { label: "ਬਾਲੀਵੁੱਡ", cls: "mood-Bollywood", rgb: "245,158,11",  washColor: "rgba(245,158,11,0.18)"  },
    Punjabi:   { label: "ਪੰਜਾਬੀ",   cls: "mood-Punjabi",   rgb: "244,114,182", washColor: "rgba(244,114,182,0.16)" },
    English:   { label: "ਅੰਗਰੇਜ਼ੀ",   cls: "mood-English",   rgb: "103,232,249", washColor: "rgba(103,232,249,0.14)" }
};

// ── 3. STATE & DOM REFS ───────────────────────
let currentIdx     = 0;
let isPlaying      = false;
let isShuffle      = false;
let repeatMode     = 0; 
let audioCtx       = null;
let analyser       = null;
let sourceNode     = null;
let currentMoodRgb = "201,168,76";

const audio      = document.getElementById('mainAudio');
const playBtn    = document.getElementById('playButton');
const playIcon   = document.getElementById('playIcon');
const pauseIcon  = document.getElementById('pauseIcon');
const vinyl      = document.getElementById('vinylDisk');
const stickerEl  = document.getElementById('stickerEmoji');
const trackTitle = document.getElementById('playerTitle');
const trackArtist= document.getElementById('playerArtist');
const trackInfo  = document.getElementById('trackInfo');
const timeCur    = document.getElementById('timeCurrent');
const timeTot    = document.getElementById('timeTotal');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn  = document.getElementById('repeatBtn');
const moodLabel  = document.getElementById('moodLabel');
const beatRing   = document.getElementById('beatRing');
const vizCanvas  = document.getElementById('vizCanvas');
const nebCanvas  = document.getElementById('nebulaCanvas');
const nebCtx     = nebCanvas.getContext('2d');
const moodWash   = document.getElementById('moodWash');
const playerCard = document.getElementById('playerCard');
const progressBar = document.getElementById('progressBar');
// ══════════════════════════════════════════════
//   DYNAMIC COLOR ENGINE (Chameleon Theme)
// ══════════════════════════════════════════════
const colorThief = new ColorThief();

function applyDynamicColor(imageUrl) {
    if (!imageUrl) return; // If there is no image, skip it!

    // 1. Create a hidden, temporary image tag in the background
    const img = new Image();
    
    // 2. This prevents Apple's security from blocking our color scan
    img.crossOrigin = 'Anonymous'; 
    img.src = imageUrl;

    // 3. Wait for the image to fully load, then steal the color!
    img.addEventListener('load', function() {
        // colorThief gives us an array of numbers like [255, 0, 150]
        const rgb = colorThief.getColor(img);
        
        // Format it so CSS can understand it: "255,0,150"
        const rgbString = `${rgb[0]},${rgb[1]},${rgb[2]}`;

        // 4. Update the global variable for your 3D sphere!
        currentMoodRgb = rgbString;

        // 5. Update the CSS variables so your glowing bar and shadows change!
        document.documentElement.style.setProperty('--mrgb', rgbString);

        // 6. Flash the background mood wash with the new color!
        triggerMoodWash(`rgba(${rgbString}, 0.18)`);
    });
}

// ══════════════════════════════════════════════
//   APPLE MUSIC LIVE API FETCHER
// ══════════════════════════════════════════════
async function loadLiveMusic() {
    moodLabel.textContent = "Connecting to Apple Music...";

    const queries = {
        Bollywood: "Arijit Singh",
        Punjabi: "Diljit Dosanjh",
        English: "The Weeknd"
    };

    let successCount = 0;

    for (const cat of Object.keys(queries)) {
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(queries[cat])}&entity=song&limit=5`);
            const json = await res.json();
            
            if (json && json.results && json.results.length > 0) {
                playlistData[cat] = json.results.map((song) => {
                    const highResImage = song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '500x500bb') : '';
                    return {
                        title: song.trackName || 'Unknown Title',
                        artist: song.artistName || 'Unknown Artist',
                        url: song.previewUrl,
                        image: highResImage,
                        duration: 30, 
                        category: cat
                    };
                }).filter(t => t.url);
                
                if (playlistData[cat].length > 0) {
                    successCount++;
                }
            }
        } catch (e) {
            console.log(`Failed to fetch ${cat}:`, e);
        }
    }

    if (successCount === 0) {
        alert("Network Error. Check your connection.");
        return;
    }

    globalPlaylist = [];
    Object.keys(playlistData).forEach(cat => {
        playlistData[cat].forEach((track, i) => {
            track.localIndex = i; 
            globalPlaylist.push(track);
        });
    });
}

// ══════════════════════════════════════════════
//   AMBIENT BACKGROUND
// ══════════════════════════════════════════════
const inkBlobs = [], stars = [];
let nebulaScale = 1.0;

function resizeNebula() {
    nebCanvas.width  = window.innerWidth;
    nebCanvas.height = window.innerHeight;
    buildScene();
}

function buildScene() {
    inkBlobs.length = stars.length = 0;
    const W = nebCanvas.width, H = nebCanvas.height;
    [{ x:.5,y:.18,r:.48 },{ x:.12,y:.65,r:.34 },{ x:.88,y:.55,r:.32 },
     { x:.5,y:.82,r:.30 },{ x:.28,y:.38,r:.22 }].forEach(p => inkBlobs.push({
        x: p.x*W, y: p.y*H, baseR: p.r*Math.min(W,H),
        phase: Math.random()*Math.PI*2, speed: .0002+Math.random()*.00025
    }));
    for (let i=0; i<180; i++) stars.push({
        x: Math.random()*W, y: Math.random()*H,
        size: Math.random()*1.4+.3, alpha: Math.random()*.5+.2,
        speed: Math.random()*.014+.006
    });
}

function drawNebula() {
    const W=nebCanvas.width, H=nebCanvas.height;
    nebCtx.clearRect(0,0,W,H);
    nebCtx.fillStyle='#08070f'; nebCtx.fillRect(0,0,W,H);
    stars.forEach((s,i)=>{
        const t=Math.sin(Date.now()*s.speed*.001+i)*.4+.6;
        nebCtx.fillStyle=`rgba(240,235,220,${(s.alpha*t).toFixed(3)})`;
        nebCtx.fillRect(s.x,s.y,s.size,s.size);
    });
    inkBlobs.forEach((c,i)=>{
        c.phase+=c.speed;
        const r=c.baseR*(1+.07*Math.sin(c.phase))*(i<2?nebulaScale*1.15:1+(nebulaScale-1)*.5);
        const g=nebCtx.createRadialGradient(c.x,c.y,r*.1,c.x,c.y,r);
        g.addColorStop(0,`rgba(${currentMoodRgb},.13)`);
        g.addColorStop(.35,`rgba(${currentMoodRgb},.055)`);
        g.addColorStop(.7,`rgba(${currentMoodRgb},.018)`);
        g.addColorStop(1,`rgba(${currentMoodRgb},0)`);
        nebCtx.fillStyle=g; nebCtx.fillRect(0,0,W,H);
    });
    const v=nebCtx.createRadialGradient(W/2,H*.3,0,W/2,H,Math.max(W,H)*.85);
    v.addColorStop(0,'rgba(8,7,15,0)');
    v.addColorStop(.6,'rgba(8,7,15,.35)');
    v.addColorStop(1,'rgba(8,7,15,.8)');
    nebCtx.fillStyle=v; nebCtx.fillRect(0,0,W,H);
    nebulaScale+=(1-nebulaScale)*.08;
    requestAnimationFrame(drawNebula);
}

function triggerMoodWash(washColor) {
    moodWash.style.background = washColor;
    moodWash.classList.remove('flash');
    void moodWash.offsetWidth;
    moodWash.classList.add('flash');
}

// ══════════════════════════════════════════════
//   3D VISUALIZER (THREE.JS)
// ══════════════════════════════════════════════
vizCanvas.width = vizCanvas.height = 156;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: vizCanvas, alpha: true, antialias: true });
renderer.setSize(156, 156);
renderer.setPixelRatio(window.devicePixelRatio);

const geometry = new THREE.IcosahedronGeometry(1.2, 1); 
const material = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    wireframe: true,
    transparent: true,
    opacity: 0.6
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
camera.position.z = 2.4;

let lastBassAvg = 0;
let beatRingTimeout = null;

function triggerBeatRing() {
    beatRing.classList.remove('pulse'); void beatRing.offsetWidth;
    beatRing.classList.add('pulse');
    clearTimeout(beatRingTimeout);
    beatRingTimeout = setTimeout(() => beatRing.classList.remove('pulse'), 400);
}

function drawViz() {
    requestAnimationFrame(drawViz);
    sphere.rotation.x += 0.003;
    sphere.rotation.y += 0.005;
    material.color.setStyle(`rgb(${currentMoodRgb})`);

    if (!analyser) {
        sphere.scale.set(1, 1, 1);
        material.opacity = 0.2;
    } else {
        const freq = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freq);
        let bs = 0; 
        for (let b = 0; b < 6; b++) bs += freq[b];
        const currentBass = bs / 6 / 255;
        
        lastBassAvg += (currentBass - lastBassAvg) * 0.22;
        const scale = 1 + (lastBassAvg * 0.5);
        sphere.scale.set(scale, scale, scale);
        material.opacity = 0.3 + (lastBassAvg * 0.7);

        if (lastBassAvg > 0.6) { 
            nebulaScale = 1 + lastBassAvg * 0.16; 
            triggerBeatRing(); 
        }
    }
    renderer.render(scene, camera);
}

// ══════════════════════════════════════════════
//   MOOD ENGINE
// ══════════════════════════════════════════════
let currentCategory = null;

function setMood(category) {
    const m = moodConfig[category];
    if (!m) return;
    const isChange = currentCategory && currentCategory !== category;
    currentCategory = category;
    Object.values(moodConfig).forEach(c => document.body.classList.remove(c.cls));
    document.body.classList.add(m.cls);
    moodLabel.textContent = m.label;
    currentMoodRgb = m.rgb;
    document.documentElement.style.setProperty('--mrgb', m.rgb);
    if (isChange) triggerMoodWash(m.washColor);
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
//   SHUFFLE / REPEAT
// ══════════════════════════════════════════════
function getNextIdx() {
    if (repeatMode===2) return currentIdx;
    if (isShuffle) {
        let n; do { n=Math.floor(Math.random()*globalPlaylist.length); }
        while(n===currentIdx && globalPlaylist.length>1); return n;
    }
    return (currentIdx+1) % globalPlaylist.length;
}
function getPrevIdx() {
    if (isShuffle) {
        let n; do { n=Math.floor(Math.random()*globalPlaylist.length); }
        while(n===currentIdx && globalPlaylist.length>1); return n;
    }
    return (currentIdx-1+globalPlaylist.length) % globalPlaylist.length;
}

// ══════════════════════════════════════════════
//   PLAYER ENGINE
// ══════════════════════════════════════════════
let prevTrackIdx = null;

function loadTrack(idx, autoplay=true) {
    const dir = (prevTrackIdx===null||idx>=prevTrackIdx) ? 'next' : 'prev';
    prevTrackIdx = idx; currentIdx = idx;
    const track = globalPlaylist[idx];
    
    audio.src = track.url;
    setMood(track.category);
   applyDynamicColor(track.image);
      animateTrackChange(track, dir);
    stickerEl.textContent = '◈';
    
    timeTot.textContent = fmt(track.duration);
    timeCur.textContent = '0:00';
    
    progressBar.value = 0;
    progressBar.style.setProperty('--progress', '0%');
    
    updateMediaSession(track);
    saveState();
    
    updateHighlight(); 
    
    if (autoplay) {
        initAudio();
        if (audioCtx.state==='suspended') audioCtx.resume();
        audio.play().then(() => { 
            isPlaying=true; 
            setPlayVisuals(true); 
            updateHighlight(); 
        }).catch(e => console.log('Playback:',e));
    }
}

function animateTrackChange(track, dir) {
    const ex = dir==='next'?'exit-left':'exit-right';
    const en = dir==='next'?'enter-left':'enter-right';
    trackInfo.classList.add(ex);
    setTimeout(()=>{
        trackTitle.textContent=track.title; trackArtist.textContent=track.artist;
        trackInfo.classList.remove(ex); trackInfo.classList.add(en);
        setTimeout(()=>trackInfo.classList.remove(en),480);
    },200);
}

function togglePlay() {
    initAudio();
    if (audioCtx.state==='suspended') audioCtx.resume();
    if (isPlaying) { audio.pause(); isPlaying=false; setPlayVisuals(false); }
    else { audio.play().then(()=>{ isPlaying=true; setPlayVisuals(true); }).catch(e=>console.log(e)); }
    updateHighlight();
}

function setPlayVisuals(p) {
    playIcon.style.display=p?'none':'block';
    pauseIcon.style.display=p?'block':'none';
    p ? vinyl.classList.add('spinning') : vinyl.classList.remove('spinning');
}

function playNext() { loadTrack(getNextIdx(), true); }
function playPrev() { loadTrack(getPrevIdx(), true); }
function fmt(s) { return isNaN(s)||!isFinite(s)?'0:00':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; }

function updateHighlight() {
    document.querySelectorAll('.song-item').forEach(el=>el.classList.remove('active'));
    const t=globalPlaylist[currentIdx];
    document.querySelector(`.song-item[data-cat="${t.category}"][data-idx="${t.localIndex}"]`)?.classList.add('active');
}

// ══════════════════════════════════════════════
//   RENDER PLAYLISTS
// ══════════════════════════════════════════════
function renderPlaylists() {
    const catKeys = Object.keys(playlistData);
    catKeys.forEach(cat=>{
        const container=document.getElementById(`playlist-${cat}`);
        const countEl=document.getElementById(`count-${cat}`);
        if (!container) return;
        const songs=playlistData[cat];
        if (countEl) countEl.textContent=`${songs.length} tracks`;
        container.innerHTML='';
        songs.forEach((song,i)=>{
            const gIdx=globalPlaylist.findIndex(t=>t.category===cat&&t.localIndex===i);
            const row=document.createElement('div');
            row.className='song-item'; row.dataset.cat=cat; row.dataset.idx=i;
            row.onclick=()=>loadTrack(gIdx,true);
            row.innerHTML=`
                <div class="song-left">
                    <span class="song-num">${i+1}</span>
                    <span class="song-name">${song.title}</span>
                </div>
                <div class="song-right">
                    <span class="song-artist">${song.artist}</span>
                    <span class="song-dur">${fmt(song.duration)}</span>
                    <span class="song-wave" aria-hidden="true">
                        <span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span>
                    </span>
                </div>`;
            container.appendChild(row);
        });
    });
}

// ══════════════════════════════════════════════
//   SHUFFLE / REPEAT UI
// ══════════════════════════════════════════════
function toggleShuffle() {
    isShuffle=!isShuffle;
    shuffleBtn.classList.toggle('active',isShuffle);
    saveState();
}
function toggleRepeat() {
    repeatMode=(repeatMode+1)%3;
    repeatBtn.classList.toggle('active',repeatMode>0);
    repeatBtn.title=['Repeat off','Repeat all','Repeat one'][repeatMode];
    repeatBtn.innerHTML = repeatMode===2
        ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zm-4-2V9h-1l-2 1v1h1.5v4z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"/></svg>`;
    saveState();
}

// ══════════════════════════════════════════════
//   MAGNETIC HOVER
// ══════════════════════════════════════════════
function setupMagneticHover() {
    document.addEventListener('mousemove',e=>{
        document.querySelectorAll('.song-item').forEach(el=>{
            const r=el.getBoundingClientRect();
            const dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
            const d=Math.sqrt(dx*dx+dy*dy);
            el.style.transform = d<80 ? `translate(${dx/d*(1-d/80)*4}px,${dy/d*(1-d/80)*4}px)` : '';
        });
    });
}

// ══════════════════════════════════════════════
//   SWIPE
// ══════════════════════════════════════════════
function setupSwipe() {
    let sx=null;
    playerCard.addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; },{passive:true});
    playerCard.addEventListener('touchend',e=>{
        if(sx===null) return;
        const dx=e.changedTouches[0].clientX-sx;
        if(Math.abs(dx)>50) dx<0?playNext():playPrev();
        sx=null;
    },{passive:true});
}

// ══════════════════════════════════════════════
//   KEYBOARD
// ══════════════════════════════════════════════
function setupKeyboard() {
    document.addEventListener('keydown',e=>{
        if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
        switch(e.code){
            case 'Space': e.preventDefault(); togglePlay(); break;
            case 'ArrowRight': e.preventDefault();
                e.shiftKey ? (audio.currentTime=Math.min(audio.duration||0,audio.currentTime+10)) : playNext(); break;
            case 'ArrowLeft': e.preventDefault();
                e.shiftKey ? (audio.currentTime=Math.max(0,audio.currentTime-10)) : playPrev(); break;
            case 'KeyS': toggleShuffle(); break;
            case 'KeyR': toggleRepeat(); break;
        }
    });
}

// ══════════════════════════════════════════════
//   AUDIO EVENT LISTENERS
// ══════════════════════════════════════════════
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    timeCur.textContent = fmt(audio.currentTime);
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progressPercent;
    progressBar.style.setProperty('--progress', `${progressPercent}%`);
});

progressBar.addEventListener('input', (e) => {
    if (audio.duration) {
        audio.currentTime = (e.target.value / 100) * audio.duration;
    }
});

audio.addEventListener('ended', () => {
    if (repeatMode === 2) { 
        audio.currentTime = 0;
        audio.play();
    } else {
        playNext();
    }
});

// ══════════════════════════════════════════════
//   LOCAL STORAGE
// ══════════════════════════════════════════════
function saveState() {
    const state = {
        currentIdx: currentIdx,
        isShuffle: isShuffle,
        repeatMode: repeatMode
    };
    localStorage.setItem('sargamState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('sargamState');
    if (saved) {
        const state = JSON.parse(saved);
        currentIdx = state.currentIdx || 0;
        
        isShuffle = state.isShuffle || false;
        shuffleBtn.classList.toggle('active', isShuffle);
        
        repeatMode = state.repeatMode || 0;
        repeatBtn.classList.toggle('active', repeatMode > 0);
        repeatBtn.title = ['Repeat off','Repeat all','Repeat one'][repeatMode];
        repeatBtn.innerHTML = repeatMode === 2
            ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zm-4-2V9h-1l-2 1v1h1.5v4z"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"/></svg>`;
    }
}

// ══════════════════════════════════════════════
//   MEDIA SESSION API
// ══════════════════════════════════════════════
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
}

function updateMediaSession(track) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: `SARGAM - ${track.category}`,
            artwork: [
                { src: track.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=512&auto=format&fit=crop', sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }
}



// ══════════════════════════════════════════════
//   APP INITIALIZATION
// ══════════════════════════════════════════════
async function initApp() {
    await loadLiveMusic();
    
    loadState();
    renderPlaylists();
    resizeNebula();
    drawNebula();
    drawViz();

    setupKeyboard();
    setupSwipe();
    setupMagneticHover();
    setupMediaSession();

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    window.addEventListener('resize', resizeNebula);

    if (globalPlaylist.length > 0) {
        if (currentIdx >= globalPlaylist.length) currentIdx = 0; 
        loadTrack(currentIdx, false); 
    }

    setTimeout(() => {
        document.querySelectorAll('.drift-top, .drift-left, .drift-right, .drift-bottom').forEach(el => {
            el.classList.add('arrived');
        });
    }, 100);
}

document.addEventListener('DOMContentLoaded', initApp);
