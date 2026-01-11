// Cursor intro playback module (ES module)
import { state, elements } from './state.js';

const CURSOR_PATH_URL = 'cursor-path.json';
export const CURSOR_INTRO_ENABLED = true;
const RECORD_CURSOR_PATH = false;

const FALLBACK_CURSOR_POINTS = [
  { t: 0, x: 0.26, y: 0.36 },
  { t: 380, x: 0.21, y: 0.32 },
  { t: 760, x: 0.17, y: 0.35 },
  { t: 1120, x: 0.14, y: 0.41 },
  { t: 1500, x: 0.12, y: 0.47 },
  { t: 1880, x: 0.11, y: 0.54 },
  { t: 2150, x: 0.11, y: 0.56 },
  { t: 2700, x: 0.30, y: 0.50 },
  { t: 3200, x: 0.42, y: 0.42 },
  { t: 3600, x: 0.48, y: 0.36 }
];

const CURSOR_PLAYBACK = {
  labelText: 'thought_ed',
  startIntroDelay: 500,
  clicks: null,
  revealDelayAfterOpen: 600
};

function normalizeCursorPoints(points) {
  if (!Array.isArray(points) || !points.length) return [];
  const first = points[0].t || 0;
  return points.map(pt => {
    const xVal = Number(pt.x);
    const yVal = Number(pt.y);
    return {
      t: Math.max(0, (pt.t || 0) - first),
      x: Number.isFinite(xVal) ? Number(xVal.toFixed(4)) : 0,
      y: Number.isFinite(yVal) ? Number(yVal.toFixed(4)) : 0
    };
  });
}

export function loadCursorPathData() {
  if (!window.fetch) {
    state.cursorPlaybackPoints = FALLBACK_CURSOR_POINTS;
    return Promise.resolve();
  }
  
  return fetch(CURSOR_PATH_URL, { cache: 'no-store' })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data?.points)) {
        state.cursorPlaybackPoints = normalizeCursorPoints(data.points);
      } else {
        state.cursorPlaybackPoints = FALLBACK_CURSOR_POINTS;
      }
    })
    .catch(err => {
      console.warn('Falling back to default cursor path', err);
      state.cursorPlaybackPoints = FALLBACK_CURSOR_POINTS;
    });
}

function getCursorPlaybackPoints() {
  if (Array.isArray(state.cursorPlaybackPoints) && state.cursorPlaybackPoints.length) {
    return state.cursorPlaybackPoints;
  }
  return FALLBACK_CURSOR_POINTS;
}

function interpolateCursorPoint(points, time) {
  if (!Array.isArray(points) || !points.length) return null;
  if (time <= points[0].t) return points[0];
  
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    if (time <= next.t) {
      const delta = Math.max(next.t - current.t, 1);
      const ratio = (time - current.t) / delta;
      return {
        t: time,
        x: current.x + (next.x - current.x) * ratio,
        y: current.y + (next.y - current.y) * ratio
      };
    }
  }
  return points[points.length - 1];
}

function positionDemoCursor(point) {
  const { desktop, demoCursor } = elements;
  if (!desktop || !demoCursor || !point) return null;
  
  const rect = desktop.getBoundingClientRect();
  const posX = rect.left + point.x * rect.width;
  const posY = rect.top + point.y * rect.height;
  demoCursor.style.transform = `translate(${posX}px, ${posY}px)`;
  
  return { x: posX, y: posY };
}

function handlePortfolioShortcutClick(click, context = {}) {
  const { portfolioShortcut } = elements;
  if (!click || click.target !== 'portfolio' || !portfolioShortcut) return;
  
  if (click.type === 'select') {
    portfolioShortcut.classList.add('is-selected');
  } else if (click.type === 'open') {
    portfolioShortcut.classList.add('is-opening');
    setTimeout(() => portfolioShortcut.classList.remove('is-opening'), 800);
    if (!context.preview) {
      queueWindowReveal();
    }
  }
}

function createClickProcessor(context = {}) {
  const { preview = false } = context;
  const { portfolioShortcut } = elements;
  
  if (Array.isArray(CURSOR_PLAYBACK.clicks) && CURSOR_PLAYBACK.clicks.length) {
    const clicks = [...CURSOR_PLAYBACK.clicks];
    return (elapsed) => {
      while (clicks.length && elapsed >= clicks[0].time) {
        handlePortfolioShortcutClick(clicks.shift(), { preview });
      }
    };
  }
  
  let clickState = 0;
  let firstClickAt = 0;
  
  return (elapsed, coords) => {
    if (!portfolioShortcut || !coords) return;
    
    const rect = portfolioShortcut.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.hypot(coords.x - centerX, coords.y - centerY);
    const threshold = Math.max(rect.width, rect.height) * 0.9;
    
    if (clickState === 0 && dist <= threshold) {
      handlePortfolioShortcutClick({ target: 'portfolio', type: 'select' }, { preview });
      clickState = 1;
      firstClickAt = elapsed;
    } else if (clickState === 1 && elapsed - firstClickAt >= 300) {
      handlePortfolioShortcutClick({ target: 'portfolio', type: 'open' }, { preview });
      clickState = 2;
    }
  };
}

export function queueWindowReveal(delay = CURSOR_PLAYBACK.revealDelayAfterOpen || 600) {
  if (state.portfolioWindowShown) return;
  
  if (state.windowRevealTimeout) clearTimeout(state.windowRevealTimeout);
  
  state.windowRevealTimeout = setTimeout(() => {
    state.windowRevealTimeout = null;
    revealPortfolioWindow();
  }, delay);
}

export function revealPortfolioWindow(scheduleHeightUpdate) {
  if (state.portfolioWindowShown) return;
  state.portfolioWindowShown = true;
  
  if (state.windowRevealTimeout) {
    clearTimeout(state.windowRevealTimeout);
    state.windowRevealTimeout = null;
  }
  
  const { windowEl } = elements;
  if (windowEl) {
    windowEl.classList.add('show');
    scheduleHeightUpdate?.(true);
  }
}

export function playCursorIntroSequence(options = {}) {
  const { preview = false, onReveal } = options;
  const { desktop, demoCursor, demoCursorLabel, portfolioShortcut } = elements;
  
  return new Promise(resolve => {
    const activePoints = getCursorPlaybackPoints();
    
    if (!desktop || !demoCursor || !activePoints.length) {
      if (!preview) onReveal?.();
      resolve();
      return;
    }
    
    const totalDuration = (activePoints[activePoints.length - 1]?.t || 0) + (CURSOR_PLAYBACK.startIntroDelay || 0);
    const processClicks = createClickProcessor({ preview });
    let rafId = null;
    let finished = false;
    
    if (demoCursorLabel && CURSOR_PLAYBACK.labelText) {
      demoCursorLabel.textContent = CURSOR_PLAYBACK.labelText;
    }
    demoCursor.classList.add('is-visible');
    
    const startedAt = performance.now();
    
    function step(now) {
      const elapsed = now - startedAt;
      const point = interpolateCursorPoint(activePoints, elapsed) || activePoints[activePoints.length - 1];
      const coords = positionDemoCursor(point);
      processClicks(elapsed, coords);
      
      if (elapsed >= totalDuration) {
        finalize();
        return;
      }
      rafId = requestAnimationFrame(step);
    }
    
    function finalize() {
      if (finished) return;
      finished = true;
      
      if (rafId) cancelAnimationFrame(rafId);
      demoCursor.classList.remove('is-visible');
      
      if (portfolioShortcut) {
        portfolioShortcut.classList.remove('is-selected');
        portfolioShortcut.classList.remove('is-opening');
      }
      
      state.cancelCursorIntro = null;
      resolve();
    }
    
    state.cancelCursorIntro = () => finalize();
    rafId = requestAnimationFrame(step);
  });
}

export function previewCursorIntro() {
  playCursorIntroSequence({ preview: true }).catch(err => console.warn('Cursor preview failed', err));
}

export function setupCursorPathRecorder() {
  const { desktop } = elements;
  if (!RECORD_CURSOR_PATH || !desktop) return;
  
  const recorded = [];
  const startedAt = performance.now();
  
  function logPoint(event) {
    const rect = desktop.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;
    recorded.push({
      t: Math.round(performance.now() - startedAt),
      x: Number(xRatio.toFixed(4)),
      y: Number(yRatio.toFixed(4))
    });
  }
  
  document.addEventListener('mousemove', logPoint, { passive: true });
  
  window.downloadCursorPath = () => {
    const blob = new Blob([JSON.stringify({ points: recorded }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cursor-path.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  
  console.info('Cursor path recorder active – call downloadCursorPath() to export the data.');
}

export function initCursorPreview() {
  const { cursorPreviewBtn } = elements;
  const cursorPreviewEnabled = new URLSearchParams(window.location.search).has('cursorPreview') 
    || window.location.hostname === 'localhost' 
    || RECORD_CURSOR_PATH;
  
  if (cursorPreviewBtn) {
    cursorPreviewBtn.hidden = !cursorPreviewEnabled;
    if (cursorPreviewEnabled) {
      cursorPreviewBtn.addEventListener('click', () => previewCursorIntro());
    }
  }
}
