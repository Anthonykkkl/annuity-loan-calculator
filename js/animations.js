/**
 * Wow effects and micro-interactions
 * Purposeful animations that enhance understanding
 */

/**
 * Animates a number counter from start to end
 * 
 * @param {HTMLElement} element - Element to animate
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration in ms
 * @param {Function} formatter - Optional formatter function
 */
export function animateNumber(element, start, end, duration = 1000, formatter = (v) => Math.round(v)) {
    if (!element) return;
    
    const startTime = performance.now();
    const difference = end - start;
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        element.textContent = formatter(end);
        return;
    }
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (difference * eased);
        
        element.textContent = formatter(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatter(end);
        }
    }
    
    requestAnimationFrame(update);
}

/**
 * Adds a highlight flash effect to an element
 * 
 * @param {HTMLElement} element - Element to highlight
 * @param {string} color - Highlight color
 */
export function flashHighlight(element, color = '#10b981') {
    if (!element) return;
    
    const originalBackground = element.style.backgroundColor;
    
    element.style.transition = 'background-color 0.3s ease-out';
    element.style.backgroundColor = color;
    
    setTimeout(() => {
        element.style.backgroundColor = originalBackground;
    }, 300);
}

/**
 * Adds a shake animation to an element (for errors)
 * 
 * @param {HTMLElement} element - Element to shake
 */
export function shakeElement(element) {
    if (!element) return;
    
    element.classList.add('error');
    
    setTimeout(() => {
        element.classList.remove('error');
    }, 300);
}

/**
 * Fades in an element
 * 
 * @param {HTMLElement} element - Element to fade in
 * @param {number} duration - Animation duration in ms
 */
export function fadeIn(element, duration = 300) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.display = 'block';
    element.style.transition = `opacity ${duration}ms ease-in`;
    
    requestAnimationFrame(() => {
        element.style.opacity = '1';
    });
}

/**
 * Fades out an element
 * 
 * @param {HTMLElement} element - Element to fade out
 * @param {number} duration - Animation duration in ms
 */
export function fadeOut(element, duration = 300) {
    if (!element) return;
    
    element.style.transition = `opacity ${duration}ms ease-out`;
    element.style.opacity = '0';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, duration);
}

/**
 * Slides in an element from the right
 * 
 * @param {HTMLElement} element - Element to slide in
 * @param {number} duration - Animation duration in ms
 */
export function slideInRight(element, duration = 300) {
    if (!element) return;
    
    element.style.transform = 'translateX(20px)';
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
        element.style.transform = 'translateX(0)';
        element.style.opacity = '1';
    });
}

/**
 * Adds a pulse animation to an element
 * 
 * @param {HTMLElement} element - Element to pulse
 * @param {number} duration - Pulse duration in ms
 */
export function pulseElement(element, duration = 1000) {
    if (!element) return;
    
    const keyframes = [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.05)', opacity: 0.8 },
        { transform: 'scale(1)', opacity: 1 }
    ];
    
    const options = {
        duration: duration,
        iterations: 1,
        easing: 'ease-in-out'
    };
    
    element.animate(keyframes, options);
}

/**
 * Adds a confetti animation for celebrations
 * 
 * @param {HTMLElement} container - Container element
 */
export function showConfetti(container) {
    if (!container) return;
    
    const colors = ['#10b981', '#2563eb', '#f59e0b', '#ef4444'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        
        document.body.appendChild(confetti);
        
        const duration = 2000 + Math.random() * 1000;
        const xMovement = (Math.random() - 0.5) * 200;
        
        const keyframes = [
            { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) translateX(${xMovement}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ];
        
        const animation = confetti.animate(keyframes, {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        animation.onfinish = () => {
            confetti.remove();
        };
    }
}

/**
 * Adds a staggered fade-in animation to a list of elements
 * 
 * @param {NodeList|Array} elements - Elements to animate
 * @param {number} delay - Delay between each element in ms
 */
export function staggeredFadeIn(elements, delay = 100) {
    if (!elements || elements.length === 0) return;
    
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * delay);
    });
}

/**
 * Adds a skeleton loading animation
 * 
 * @param {HTMLElement} element - Element to show skeleton
 */
export function showSkeleton(element) {
    if (!element) return;
    
    element.classList.add('skeleton-loading');
    element.style.background = 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)';
    element.style.backgroundSize = '200% 100%';
    element.style.animation = 'skeleton-loading 1.5s ease-in-out infinite';
    
    // Add keyframes if not already present
    if (!document.getElementById('skeleton-keyframes')) {
        const style = document.createElement('style');
        style.id = 'skeleton-keyframes';
        style.textContent = `
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Removes skeleton loading animation
 * 
 * @param {HTMLElement} element - Element to remove skeleton from
 */
export function hideSkeleton(element) {
    if (!element) return;
    
    element.classList.remove('skeleton-loading');
    element.style.background = '';
    element.style.animation = '';
}

/**
 * Adds a smooth scroll reveal effect
 * Observes elements and fades them in when they enter the viewport
 * 
 * @param {string} selector - CSS selector for elements to observe
 */
export function initScrollReveal(selector = '.results-panel > *') {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll(selector).forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        observer.observe(element);
    });
}

/**
 * Adds a ripple effect to a button click
 * 
 * @param {Event} event - Click event
 */
export function addRippleEffect(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    
    // Add ripple styles if not present
    if (!document.getElementById('ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            }
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Morphs between two numbers with a smooth transition
 * 
 * @param {HTMLElement} element - Element containing the number
 * @param {number} newValue - New value to morph to
 * @param {Function} formatter - Formatter function
 */
export function morphNumber(element, newValue, formatter) {
    if (!element) return;
    
    const currentText = element.textContent;
    const currentValue = parseFloat(currentText.replace(/[^0-9.-]/g, ''));
    
    if (isNaN(currentValue)) {
        element.textContent = formatter(newValue);
        return;
    }
    
    animateNumber(element, currentValue, newValue, 500, formatter);
}

/**
 * Creates a progress bar animation
 * 
 * @param {HTMLElement} element - Progress bar element
 * @param {number} percentage - Target percentage (0-100)
 * @param {number} duration - Animation duration in ms
 */
export function animateProgressBar(element, percentage, duration = 1000) {
    if (!element) return;
    
    element.style.width = '0%';
    element.style.transition = `width ${duration}ms ease-out`;
    
    requestAnimationFrame(() => {
        element.style.width = percentage + '%';
    });
}

/**
 * Adds a bounce effect to an element
 * 
 * @param {HTMLElement} element - Element to bounce
 */
export function bounceElement(element) {
    if (!element) return;
    
    const keyframes = [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' },
        { transform: 'translateY(-5px)' },
        { transform: 'translateY(0)' }
    ];
    
    const options = {
        duration: 500,
        easing: 'ease-out'
    };
    
    element.animate(keyframes, options);
}
