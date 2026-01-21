/**
 * Hero-Animationen und Video-Steuerung.
 */

export function initializeAnimations() {
  const heroLines = document.querySelectorAll('.hero-line');

  heroLines.forEach((line, index) => {
    const delay = line.getAttribute('data-delay') || index * 200;
    setTimeout(() => {
      line.style.opacity = '1';
      line.style.transform = 'translateY(0)';
    }, delay);
  });

  initializeHeroVideo();
}

function initializeHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    video.pause();
    return;
  }

  video.playbackRate = 0.5;
  video.play().catch(() => {});

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
  });

  const setupPingPong = () => {
    if (video.readyState < 2) {
      video.addEventListener('loadeddata', setupPingPong, { once: true });
      return;
    }

    const duration = video.duration || 5;
    const loopSegment = Math.min(6, duration);
    const start = Math.max(0, (duration - loopSegment) / 2);
    const end = Math.min(duration, start + loopSegment);
    const stepSeconds = 0.02;
    let direction = 1;

    function animate() {
      if (!running) {
        requestAnimationFrame(animate);
        return;
      }

      if (direction === 1 && !video.paused && video.currentTime < end - 0.05) {
        requestAnimationFrame(animate);
        return;
      }

      if (direction === 1 && video.currentTime >= end - 0.03) {
        direction = -1;
        video.pause();
      } else if (direction === -1 && video.currentTime <= start + 0.03) {
        direction = 1;
        video.play().catch(() => {});
      }

      if (direction === -1) {
        video.currentTime = Math.max(start, video.currentTime - stepSeconds);
      }

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  };

  setupPingPong();
}
