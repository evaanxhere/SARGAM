document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.story-section');
    
    const observerOptions = {
        root: null, // viewport ko observe karega
        threshold: 0.1, // jab 10% element visible ho
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
