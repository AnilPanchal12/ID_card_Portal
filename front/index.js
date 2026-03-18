// index.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Select all elements with the 'fade-in' class
    const faders = document.querySelectorAll('.fade-in');

    // Options for the Intersection Observer
    const appearOptions = {
        threshold: 0.2, // Triggers when 20% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    // Create the observer
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                // Add the 'visible' class to trigger the CSS transition
                entry.target.classList.add('visible');
                // Stop observing once it has appeared
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    // Apply the observer to each fader element
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });
});