// ═══════════════════════════════════════════════
//   SARGAM v7 — simple, reliable player engine
//   To add a song: add one line in LIBRARY below.
// ═══════════════════════════════════════════════
(() => {
    'use strict';

    // ── 1. YOUR MUSIC ─────────────────────────────
    const LIBRARY = {
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

    const SCRIPT_NAMES = {
        Bollywood: 'ਬਾਲੀਵੁੱਡ',
        Punjabi:   'ਪੰਜਾਬੀ',
        English:   'ਅੰਗਰੇਜ਼ੀ'
    };

    // ── 2. FLAT TRACK LIST ────────────────────────
    const tracks = [];
    Object.entries(LIBRARY).forEach(([cat, songs]) => {
        songs.forEach((song, n) => tracks.push({ ...song, cat, n }));
    });

    // ── 3. DOM ────────────────────────────────────
    const $ = id => document.getElementById(id);
    const audio     = $('audio');
    const titleEl   = $('title');
    const artistEl  = $('artist');
    const curEl     = $('cur');
    const durEl     = $('dur');
    const seek      = $('seek');
    const playBtn   = $('playBtn');
    const prevBtn   = $('prevBtn');
    const nextBtn   = $('nextBtn');
    const shuffleBtn= $('shuffleBtn');
    const repeatBtn = $('repeatBtn');

    // ── 4. STATE ──────────────────────────────────
    let current = 0;
    let shuffle = false;
    let repeat  = 0;          // 0 off · 1 all · 2 one
    let seeking = false;
    const history = [];       // for "previous" while shuffling
    const rows = [];          // DOM row for each track index

    // ── 5. HELPERS ────────────────────────────────
    const fmt = s => {
        if (!isFinite(s) || isNaN(s)) return '0:00';
        return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    };
    const setFill = pct => seek.style.setProperty('--p', pct + '%');

    // ── 6. BUILD THE TRACKLIST ────────────────────
    function buildLibrary() {
        const lib = $('library');
        let rowCount = 0;

        Object.entries(LIBRARY).forEach(([cat, songs]) => {
            const section = document.createElement('section');
            section.className = 'shelf';
            section.dataset.cat = cat;
            section.innerHTML = `
                <header class="shelf-head">
                    <h2>${cat}</h2>
                    <span class="script">${SCRIPT_NAMES[cat] || ''}</span>
                    <span class="leader"></span>
                    <span class="count">${songs.length} ${songs.length === 1 ? 'track' : 'tracks'}</span>
                </header>
                <ol class="tracks"></ol>`;
            const list = section.querySelector('.tracks');

            songs.forEach((song, n) => {
                const idx = tracks.findIndex(t => t.cat === cat && t.n === n);
                const li = document.createElement('li');
                li.className = 'track';
                li.style.setProperty('--i', rowCount++);
                li.tabIndex = 0;
                li.setAttribute('role', 'button');
                li.setAttribute('aria-label', `Play ${song.title} by ${song.artist}`);
                li.innerHTML = `
                    <span class="t-num">${String(n + 1).padStart(2, '0')}</span>
                    <span class="t-main">
                        <span class="t-title">${song.title}</span>
                        <span class="t-artist">${song.artist}</span>
                    </span>
                    <span class="t-side">
                        <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
                        <span class="t-dur">–:––</span>
                    </span>`;
                li.addEventListener('click', () => pick(idx));
                li.addEventListener('keydown', e => {
                    if (e.key === 'Enter') { e.preventDefault(); pick(idx); }
                });
                list.appendChild(li);
                rows[idx] = li;
            });

            lib.appendChild(section);
        });
    }

    // fetch each file's length quietly in the background
    function loadDurations() {
        tracks.forEach((t, i) => {
            const probe = new Audio();
            probe.preload = 'metadata';
            probe.src = t.url;
            probe.addEventListener('loadedmetadata', () => {
                t.dur = probe.duration;
                const el = rows[i] && rows[i].querySelector('.t-dur');
                if (el) el.textContent = fmt(probe.duration);
                probe.removeAttribute('src');
                probe.load();
            });
        });
    }

    // ── 7. PLAYER ─────────────────────────────────
    function loadTrack(idx, autoplay) {
        current = idx;
        const t = tracks[idx];

        audio.src = t.url;
        titleEl.textContent  = t.title;
        artistEl.textContent = t.artist;

        seek.value = 0;
        setFill(0);
        curEl.textContent = '0:00';
        durEl.textContent = t.dur ? fmt(t.dur) : '0:00';

        rows.forEach((r, i) => r.classList.toggle('active', i === idx));
        updateMediaSession(t);

        if (autoplay) audio.play().catch(() => {});
    }

    // clicking a row: toggle if it's already loaded, otherwise load + play
    function pick(idx) {
        if (idx === current) { togglePlay(); return; }
        history.push(current);
        loadTrack(idx, true);
    }

    function togglePlay() {
        if (audio.paused) audio.play().catch(() => {});
        else audio.pause();
    }

    function randomOther() {
        if (tracks.length < 2) return current;
        let n;
        do { n = Math.floor(Math.random() * tracks.length); } while (n === current);
        return n;
    }

    function goNext(auto) {
        let n;
        if (shuffle) {
            n = randomOther();
        } else {
            n = current + 1;
            if (n >= tracks.length) {
                // reached the end of the list
                if (auto && repeat === 0) {
                    audio.pause();
                    audio.currentTime = 0;
                    return;
                }
                n = 0;
            }
        }
        history.push(current);
        loadTrack(n, true);
    }

    function goPrev() {
        // restart the song if we're past 3 seconds, like a real player
        if (audio.currentTime > 3) { audio.currentTime = 0; return; }
        let n;
        if (history.length) n = history.pop();
        else n = (current - 1 + tracks.length) % tracks.length;
        loadTrack(n, true);
    }

    function toggleShuffle() {
        shuffle = !shuffle;
        shuffleBtn.classList.toggle('on', shuffle);
        shuffleBtn.setAttribute('aria-label', shuffle ? 'Shuffle on' : 'Shuffle off');
    }

    function toggleRepeat() {
        repeat = (repeat + 1) % 3;
        audio.loop = repeat === 2;
        repeatBtn.dataset.mode = repeat;
        repeatBtn.classList.toggle('on', repeat > 0);
        repeatBtn.setAttribute('aria-label', ['Repeat off', 'Repeat all', 'Repeat one'][repeat]);
    }

    // ── 8. LOCK-SCREEN / HEADPHONE CONTROLS ───────
    function updateMediaSession(t) {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: t.title, artist: t.artist, album: 'Sargam'
            });
        } catch (e) { /* ignore */ }
    }
    function setupMediaSession() {
        if (!('mediaSession' in navigator)) return;
        try {
            navigator.mediaSession.setActionHandler('play',          () => audio.play());
            navigator.mediaSession.setActionHandler('pause',         () => audio.pause());
            navigator.mediaSession.setActionHandler('previoustrack', goPrev);
            navigator.mediaSession.setActionHandler('nexttrack',     () => goNext(false));
        } catch (e) { /* ignore */ }
    }

    // ── 9. EVENTS ─────────────────────────────────
    function setupEvents() {
        playBtn.addEventListener('click', togglePlay);
        prevBtn.addEventListener('click', goPrev);
        nextBtn.addEventListener('click', () => goNext(false));
        shuffleBtn.addEventListener('click', toggleShuffle);
        repeatBtn.addEventListener('click', toggleRepeat);

        // keep UI in sync with the real audio element
        audio.addEventListener('play', () => {
            document.body.classList.add('is-playing');
            document.title = `${tracks[current].title} · Sargam`;
        });
        audio.addEventListener('pause', () => {
            document.body.classList.remove('is-playing');
            document.title = 'Sargam';
        });
        audio.addEventListener('ended', () => goNext(true));

        audio.addEventListener('loadedmetadata', () => {
            tracks[current].dur = audio.duration;
            durEl.textContent = fmt(audio.duration);
        });
        audio.addEventListener('timeupdate', () => {
            if (seeking || !audio.duration) return;
            const v = (audio.currentTime / audio.duration) * 1000;
            seek.value = v;
            setFill(v / 10);
            curEl.textContent = fmt(audio.currentTime);
        });
        audio.addEventListener('error', () => {
            document.body.classList.remove('is-playing');
            artistEl.textContent = 'File not found · check music folder';
        });

        // simple slider
        seek.addEventListener('input', () => {
            seeking = true;
            setFill(seek.value / 10);
            if (audio.duration) curEl.textContent = fmt(audio.duration * seek.value / 1000);
        });
        seek.addEventListener('change', () => {
            if (audio.duration) audio.currentTime = audio.duration * seek.value / 1000;
            seeking = false;
        });

        // keyboard
        document.addEventListener('keydown', e => {
            const tag = e.target.tagName;
            if (tag === 'TEXTAREA') return;
            switch (e.code) {
                case 'Space':
                    if (tag === 'BUTTON') return;      // let the button handle it
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    if (tag === 'INPUT') return;       // slider keeps native arrows
                    e.preventDefault();
                    if (e.shiftKey) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
                    else goNext(false);
                    break;
                case 'ArrowLeft':
                    if (tag === 'INPUT') return;
                    e.preventDefault();
                    if (e.shiftKey) audio.currentTime = Math.max(0, audio.currentTime - 10);
                    else goPrev();
                    break;
                case 'KeyS': toggleShuffle(); break;
                case 'KeyR': toggleRepeat();  break;
            }
        });
    }

    // ── 10. BOOT ──────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        buildLibrary();
        setupEvents();
        setupMediaSession();
        loadTrack(0, false);
        loadDurations();
    });
})();
