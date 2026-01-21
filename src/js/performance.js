/**
 * Performance-Hinweise und Background-Animation-Handling.
 */

export function enablePerformanceOptimizations() {
  const elementsToOptimize = document.querySelectorAll('.content-section');
  elementsToOptimize.forEach((el) => {
    el.style.willChange = 'transform';
  });

  document.addEventListener('visibilitychange', () => {
    document.body.style.animationPlayState = document.hidden ? 'paused' : 'running';
  });
}
