import { initializeNavigation } from './navigation.js';
import { initializeScrollEffects } from './scroll.js';
import { initializeLegalModals } from './legal.js';
import { initializeContactForm } from './contact.js';
import { initializeAnimations } from './animations.js';
import { initializeThemeToggle } from './theme.js';
import { enablePerformanceOptimizations } from './performance.js';

// Entry point - initializes all modules when DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  initializeScrollEffects();
  initializeLegalModals();
  initializeContactForm();
  initializeAnimations();
  initializeThemeToggle();
  enablePerformanceOptimizations();
});
