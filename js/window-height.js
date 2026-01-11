// Window height management module (ES module)
import { state, elements } from './state.js';

function applyWindowHeightUpdate(forceImmediate = false) {
  const { windowEl } = elements;
  if (!windowEl) return;
  
  const prevHeight = state.previousWindowHeight ?? windowEl.getBoundingClientRect().height;
  const storedPrev = Number.isFinite(prevHeight) ? prevHeight : null;
  
  windowEl.style.height = 'auto';
  const newHeight = windowEl.getBoundingClientRect().height;
  
  if (forceImmediate || storedPrev === null) {
    windowEl.style.height = `${newHeight}px`;
  } else if (Math.abs(newHeight - storedPrev) > 0.5) {
    windowEl.style.height = `${storedPrev}px`;
    void windowEl.offsetHeight; // force reflow
    windowEl.style.height = `${newHeight}px`;
  } else {
    windowEl.style.height = `${newHeight}px`;
  }
  
  state.previousWindowHeight = newHeight;
}

export function scheduleWindowHeightUpdate(forceImmediate = false) {
  if (!state.dynamicHeightActive) return;
  if (!elements.windowEl) return;
  
  if (forceImmediate) {
    applyWindowHeightUpdate(true);
    return;
  }
  
  if (state.heightUpdateScheduled) return;
  state.heightUpdateScheduled = true;
  
  requestAnimationFrame(() => {
    applyWindowHeightUpdate();
    state.heightUpdateScheduled = false;
  });
}

const handleWindowResize = () => scheduleWindowHeightUpdate(true);

export function initWindowHeight() {
  const { windowEl, intro, main } = elements;
  
  if (window.ResizeObserver && windowEl) {
    state.resizeObserver = new ResizeObserver(() => scheduleWindowHeightUpdate());
    [intro, main].forEach(el => {
      if (el) state.resizeObserver.observe(el);
    });
  }
  
  scheduleWindowHeightUpdate(true);
  window.addEventListener('resize', handleWindowResize);
}

export function disableHeightAutomation() {
  if (!state.dynamicHeightActive) return;
  state.dynamicHeightActive = false;
  
  if (state.resizeObserver) {
    state.resizeObserver.disconnect();
    state.resizeObserver = null;
  }
  
  window.removeEventListener('resize', handleWindowResize);
  
  if (elements.windowEl) {
    elements.windowEl.style.height = '';
  }
}
