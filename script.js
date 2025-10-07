document.addEventListener('DOMContentLoaded', () => {
    // IntersectionObserver for revealing sections
    const sections = document.querySelectorAll('.story-section');
    
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Audio playback logic
    const audio = document.getElementById('backgroundMusic');
    const playButton = document.getElementById('playButton');

    if (!audio) {
        console.error('Audio element with ID "backgroundMusic" not found.');
        return;
    }

    if (!playButton) {
        console.error('Play button with ID "playButton" not found.');
        return;
    }

    playButton.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                playButton.textContent = 'Pause Music';
            }).catch(error => {
                console.error('Error playing audio:', error);
                playButton.textContent = 'Play Music';
            });
        } else {
            audio.pause();
            playButton.textContent = 'Play Music';
        }
    });
});