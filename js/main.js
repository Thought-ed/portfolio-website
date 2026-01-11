// Main orchestrator module (ES module)
import { state, elements, initElements } from './state.js';
import { initClock } from './clock.js';
import { initLoader } from './loader.js';
import { initWindowHeight, scheduleWindowHeightUpdate } from './window-height.js';
import { 
  loadCursorPathData, 
  playCursorIntroSequence, 
  setupCursorPathRecorder, 
  initCursorPreview,
  revealPortfolioWindow,
  CURSOR_INTRO_ENABLED
} from './cursor-intro.js';
import { initCategorySelector } from './category.js';
import { 
  startIntroTyping, 
  startMainTyping, 
  initSkipButton, 
  handleNoTypeIt 
} from './typing.js';
import { initVideoPlaceholders } from './video.js';
import { init3DViewers } from './viewer-3d.js';

function launchDesktopIntroSequence() {
  const startPlayback = () => {
    if (!CURSOR_INTRO_ENABLED) {
      revealPortfolioWindow(scheduleWindowHeightUpdate);
      startIntroTyping(() => {
        const continueTyping = startMainTyping();
        initCategorySelector(continueTyping);
      });
      return;
    }
    
    playCursorIntroSequence({ 
      onReveal: () => revealPortfolioWindow(scheduleWindowHeightUpdate) 
    })
      .catch(err => console.warn('Cursor intro sequence failed', err))
      .finally(() => {
        revealPortfolioWindow(scheduleWindowHeightUpdate);
        startIntroTyping(() => {
          const continueTyping = startMainTyping();
          initCategorySelector(continueTyping);
        });
      });
  };
  
  const cursorPathPromise = state.cursorPathPromise;
  if (cursorPathPromise && typeof cursorPathPromise.finally === 'function') {
    cursorPathPromise
      .catch(err => console.warn('Cursor path load failed', err))
      .finally(startPlayback);
  } else {
    startPlayback();
  }
}

function init() {
  // Initialize DOM references
  initElements();
  
  const { intro, main } = elements;
  
  if (!intro || !main) {
    console.warn('Expected DOM elements missing (intro/main)');
    return;
  }
  
  // Show intro element
  intro.classList.add('show');
  
  // Load cursor path data
  state.cursorPathPromise = loadCursorPathData();
  
  // Initialize modules
  initClock();
  initCursorPreview();
  setupCursorPathRecorder();
  initWindowHeight();
  initSkipButton();
  initVideoPlaceholders();
  init3DViewers();
  
  // Check for TypeIt
  if (typeof TypeIt !== 'function') {
    handleNoTypeIt();
    return;
  }
  
  // Start loader sequence
  initLoader(() => launchDesktopIntroSequence());
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
