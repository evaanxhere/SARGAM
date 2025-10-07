document.addEventListener('DOMContentLoaded', () => {
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
});
// Play button ke liye code
const audio = document.getElementById('myAudio');
const playButton = document.getElementById('playButton');

playButton.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playButton.textContent = 'Pause Music';
    } else {
        audio.pause();
        playButton.textContent = 'Play Music';
    }
});

