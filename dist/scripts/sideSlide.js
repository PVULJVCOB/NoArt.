// SideSlide mit echter physikalischer Spring Animation (echte iOS Physik)

function initSideSlider() {
  const sliderCard = document.querySelector('.card-second');
  const sliderContent = document.querySelector('.main-content');
  const sliderIndicator = document.querySelector('.scroll-indicator-right');

  if (!sliderCard) return;

  const maxSlide = 900 - 300;

  let currentSlide = 0;
  let targetSlide = 0;
  let velocity = 0;
  let isAnimating = false;
  let lastTimestamp = 0;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  // Echte physikalische Spring Animation (Hooke's Law + Viscous Damping)
  // F = -k*x - c*v (Spring Force + Damping Force)
  const slideAnimate = (timestamp) => {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const diff = targetSlide - currentSlide;

    if (Math.abs(diff) > 0.1 || Math.abs(velocity) > 0.5) {
      // Für sichtbares Wackeln: Höhere Stiffness, Niedrigere Damping
      const stiffness = 0.35;  // Stärkere Rückstellkraft
      const damping = 0.45;    // Weniger Reibung = mehr Oszillation

      // Hooke's Law: F = -k*x - c*v
      const springForce = diff * stiffness;
      const dampingForce = -velocity * damping;
      velocity += springForce + dampingForce;

      currentSlide += velocity;

      // Subtilere Material-Deformation basierend auf Geschwindigkeit
      const speedFactor = Math.min(Math.abs(velocity) / 20, 0.8);
      const squashScale = 1 - speedFactor * 0.08;
      const stretchScale = 1 + speedFactor * 0.04;

      // Elastischer Bounce
      if (currentSlide < 0) {
        currentSlide = 0;
        velocity *= -0.7;
      } else if (currentSlide > maxSlide) {
        currentSlide = maxSlide;
        velocity *= -0.7;
      }

      // Transform mit Deformation nur basierend auf Geschwindigkeit
      const scaleX = squashScale;
      const scaleY = stretchScale;
      sliderCard.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`;
      sliderCard.style.left = currentSlide + 'px';

      // Text wird erst ab Mitte (50%) sichtbar
      const progress = Math.min(currentSlide / maxSlide, 1);

      let opacity = 0;
      if (progress < 0.5) {
        // Von 0% bis 50%: Text bleibt unsichtbar
        opacity = 0;
      } else {
        // Von 50% bis 100%: Text faded sanft ein
        opacity = easeOutCubic((progress - 0.5) / 0.5);
      }

      if (sliderContent) sliderContent.style.opacity = Math.max(0, Math.min(opacity, 1));
      if (sliderIndicator) sliderIndicator.style.opacity = Math.max(0, Math.min(opacity, 1));

      requestAnimationFrame(slideAnimate);
    } else {
      currentSlide = targetSlide;
      velocity = 0;
      sliderCard.style.left = currentSlide + 'px';
      sliderCard.style.transform = 'scaleX(1) scaleY(1)'; // Zurück zur Normalform

      // Final opacity - Text wird erst ab Mitte (50%) sichtbar
      const progress = Math.min(currentSlide / maxSlide, 1);

      let opacity = 0;
      if (progress < 0.5) {
        opacity = 0;
      } else {
        opacity = easeOutCubic((progress - 0.5) / 0.5);
      }

      if (sliderIndicator) sliderIndicator.style.opacity = Math.max(0, Math.min(opacity, 1));
      if (sliderContent) sliderContent.style.opacity = Math.max(0, Math.min(opacity, 1));

      isAnimating = false;
      lastTimestamp = 0;
    }
  };

  // Scroll-Event mit echter physikalischer Berechnung
  window.addEventListener('wheel', (e) => {
    const scrollDirection = e.deltaY > 0 ? 1 : -1;
    const scrollStrength = Math.min(Math.abs(e.deltaY) / 5, 100);

    targetSlide += scrollDirection * scrollStrength;
    targetSlide = Math.max(0, Math.min(targetSlide, maxSlide));

    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(slideAnimate);
    }

    e.preventDefault();
  }, { passive: false });
}

// Auto-Initialisierung beim Laden
document.addEventListener('DOMContentLoaded', initSideSlider);

