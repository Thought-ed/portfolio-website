// Loader module (ES module)
import { state, elements } from './state.js';

const LOADER_FAILSAFE_MS = 12000;

export function hideLoaderSequence(onComplete) {
  if (state.loaderSequenceActive) return;
  state.loaderSequenceActive = true;
  
  const { loader, windowEl } = elements;
  
  if (loader) {
    document.body.classList.add('wallpaper');
    loader.classList.add('hidden');
    if (windowEl) {
      setTimeout(() => onComplete?.(), 1500);
    } else {
      onComplete?.();
    }
  } else {
    onComplete?.();
  }
}

export function queueLoaderHide(onComplete) {
  if (state.loaderHideQueued) return;
  state.loaderHideQueued = true;
  hideLoaderSequence(onComplete);
}

export function initLoader(onComplete) {
  // Failsafe timeout
  setTimeout(() => queueLoaderHide(onComplete), LOADER_FAILSAFE_MS);
  
  if (document.readyState === 'complete') {
    queueLoaderHide(onComplete);
  } else {
    window.addEventListener('load', () => queueLoaderHide(onComplete), { once: true });
  }
}
