// Wrapped and hardened script
(function () {
  'use strict';

  const CURSOR_PATH_URL = 'cursor-path.json';
  const CURSOR_INTRO_ENABLED = true;
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

  function safeQuery(selector) { return document.querySelector(selector); }

  // Hold references to active TypeIt instances so we can cancel them
  const typingInstances = [];
  let skipped = false;
  let cursorPlaybackPoints = null;
  let cursorPathPromise = null;
  let windowRevealTimeout = null;

  document.addEventListener('DOMContentLoaded', () => {
    const windowEl = safeQuery('.window');
    const loader = safeQuery('.loader');
    const desktop = safeQuery('.win11-desktop');
    const demoCursor = document.getElementById('demo-cursor');
    const demoCursorLabel = document.getElementById('demo-cursor-label');
    const portfolioShortcut = document.querySelector('[data-shortcut="portfolio"]');
    const cursorPreviewBtn = document.getElementById('cursor-preview');
    const cursorPreviewEnabled = new URLSearchParams(window.location.search).has('cursorPreview') || window.location.hostname === 'localhost' || RECORD_CURSOR_PATH;

    cursorPathPromise = loadCursorPathData();
    if (cursorPreviewBtn) {
      cursorPreviewBtn.hidden = !cursorPreviewEnabled;
      if (cursorPreviewEnabled) {
        cursorPreviewBtn.addEventListener('click', () => previewCursorIntro());
      }
    }

    let loaderSequenceActive = false;
    let portfolioWindowShown = false;
    let cancelCursorIntro = null;

    function revealPortfolioWindow() {
      if (portfolioWindowShown) return;
      portfolioWindowShown = true;
      if (windowRevealTimeout) {
        clearTimeout(windowRevealTimeout);
        windowRevealTimeout = null;
      }
      if (windowEl) {
        windowEl.classList.add('show');
        scheduleWindowHeightUpdate(true);
      }
    }

    function queueWindowReveal(delay = CURSOR_PLAYBACK.revealDelayAfterOpen || 600) {
      if (portfolioWindowShown) return;
      if (windowRevealTimeout) clearTimeout(windowRevealTimeout);
      windowRevealTimeout = setTimeout(() => {
        windowRevealTimeout = null;
        revealPortfolioWindow();
      }, delay);
    }

    function launchDesktopIntroSequence() {
      const startPlayback = () => {
        if (!CURSOR_INTRO_ENABLED) {
          revealPortfolioWindow();
          startIntroTyping();
          return;
        }
        playCursorIntroSequence()
          .catch(err => console.warn('Cursor intro sequence failed', err))
          .finally(() => {
            revealPortfolioWindow();
            startIntroTyping();
          });
      };

      if (cursorPathPromise && typeof cursorPathPromise.finally === 'function') {
        cursorPathPromise.catch(err => console.warn('Cursor path load failed', err)).finally(startPlayback);
      } else {
        startPlayback();
      }
    }

    function hideLoaderSequence() {
      if (loaderSequenceActive) return;
      loaderSequenceActive = true;
      const kickOff = () => launchDesktopIntroSequence();
      if (loader) {
        document.body.classList.add('wallpaper');
        loader.classList.add('hidden');
        if (windowEl) setTimeout(kickOff, 1500); else kickOff();
      } else {
        kickOff();
      }
    }

    const intro = document.getElementById('intro');
    const main = document.getElementById('main-content');
    const skipBtn = document.getElementById('skip-intro');
    const animatedText = document.getElementById('animated-text');
    const projects = document.getElementById('projects');
    const clockTimeEl = document.getElementById('taskbar-time');
    const clockDateEl = document.getElementById('taskbar-date');

    let previousWindowHeight = null;
    let heightUpdateScheduled = false;
    let dynamicHeightActive = true;
    let resizeObserver = null;

    const handleWindowResize = () => scheduleWindowHeightUpdate(true);

    function applyWindowHeightUpdate(forceImmediate = false) {
      if (!windowEl) return;
      const prevHeight = previousWindowHeight ?? windowEl.getBoundingClientRect().height;
      const storedPrev = Number.isFinite(prevHeight) ? prevHeight : null;
      windowEl.style.height = 'auto';
      const newHeight = windowEl.getBoundingClientRect().height;
      if (forceImmediate || storedPrev === null) {
        windowEl.style.height = `${newHeight}px`;
      } else if (Math.abs(newHeight - storedPrev) > 0.5) {
        windowEl.style.height = `${storedPrev}px`;
        // force reflow so transition can occur
        void windowEl.offsetHeight;
        windowEl.style.height = `${newHeight}px`;
      } else {
        windowEl.style.height = `${newHeight}px`;
      }
      previousWindowHeight = newHeight;
    }

    function scheduleWindowHeightUpdate(forceImmediate = false) {
      if (!dynamicHeightActive) return;
      if (!windowEl) return;
      if (forceImmediate) {
        applyWindowHeightUpdate(true);
        return;
      }
      if (heightUpdateScheduled) return;
      heightUpdateScheduled = true;
      requestAnimationFrame(() => {
        applyWindowHeightUpdate();
        heightUpdateScheduled = false;
      });
    }

    function playCursorIntroSequence(options = {}) {
      const { preview = false } = options;
      return new Promise(resolve => {
        const activePoints = getCursorPlaybackPoints();
        if (!desktop || !demoCursor || !activePoints.length) {
          if (!preview) revealPortfolioWindow();
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
          cancelCursorIntro = null;
          resolve();
        }

        cancelCursorIntro = () => finalize();
        rafId = requestAnimationFrame(step);
      });
    }

    function positionDemoCursor(point) {
      if (!desktop || !demoCursor || !point) return null;
      const rect = desktop.getBoundingClientRect();
      const posX = rect.left + point.x * rect.width;
      const posY = rect.top + point.y * rect.height;
      demoCursor.style.transform = `translate(${posX}px, ${posY}px)`;
      return { x: posX, y: posY };
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

    function getCursorPlaybackPoints() {
      if (Array.isArray(cursorPlaybackPoints) && cursorPlaybackPoints.length) return cursorPlaybackPoints;
      return FALLBACK_CURSOR_POINTS;
    }

    function createClickProcessor(context = {}) {
      const { preview = false } = context;
      if (Array.isArray(CURSOR_PLAYBACK.clicks) && CURSOR_PLAYBACK.clicks.length) {
        const clicks = [...CURSOR_PLAYBACK.clicks];
        return (elapsed) => {
          while (clicks.length && elapsed >= clicks[0].time) {
            handlePortfolioShortcutClick(clicks.shift(), { preview });
          }
        };
      }

      let state = 0;
      let firstClickAt = 0;
      return (elapsed, coords) => {
        if (!portfolioShortcut || !coords) return;
        const rect = portfolioShortcut.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(coords.x - centerX, coords.y - centerY);
        const threshold = Math.max(rect.width, rect.height) * 0.9;
        if (state === 0 && dist <= threshold) {
          handlePortfolioShortcutClick({ target: 'portfolio', type: 'select' }, { preview });
          state = 1;
          firstClickAt = elapsed;
        } else if (state === 1 && elapsed - firstClickAt >= 300) {
          handlePortfolioShortcutClick({ target: 'portfolio', type: 'open' }, { preview });
          state = 2;
        }
      };
    }

    function handlePortfolioShortcutClick(click, context = {}) {
      if (!click || click.target !== 'portfolio' || !portfolioShortcut) return;
      if (click.type === 'select') {
        portfolioShortcut.classList.add('is-selected');
      } else if (click.type === 'open') {
        portfolioShortcut.classList.add('is-opening');
        setTimeout(() => portfolioShortcut.classList.remove('is-opening'), 800);
        if (!context.preview) queueWindowReveal();
      }
    }

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

    function loadCursorPathData() {
      if (!window.fetch) {
        cursorPlaybackPoints = FALLBACK_CURSOR_POINTS;
        return Promise.resolve();
      }
      return fetch(CURSOR_PATH_URL, { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data?.points)) {
            cursorPlaybackPoints = normalizeCursorPoints(data.points);
          } else {
            cursorPlaybackPoints = FALLBACK_CURSOR_POINTS;
          }
        })
        .catch(err => {
          console.warn('Falling back to default cursor path', err);
          cursorPlaybackPoints = FALLBACK_CURSOR_POINTS;
        });
    }

    function previewCursorIntro() {
      playCursorIntroSequence({ preview: true }).catch(err => console.warn('Cursor preview failed', err));
    }

    function setupCursorPathRecorder() {
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

    if (!intro || !main) return console.warn('Expected DOM elements missing (intro/main)');

    intro.classList.add('show');
    // We'll kick off typing later via startIntroTyping()

    setupCursorPathRecorder();

    if (window.ResizeObserver && windowEl) {
      resizeObserver = new ResizeObserver(() => scheduleWindowHeightUpdate());
      [intro, main].forEach(el => { if (el) resizeObserver.observe(el); });
    }

    scheduleWindowHeightUpdate(true);
    window.addEventListener('resize', handleWindowResize);

    function disableHeightAutomation() {
      if (!dynamicHeightActive) return;
      dynamicHeightActive = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      window.removeEventListener('resize', handleWindowResize);
      if (windowEl) {
        windowEl.style.height = '';
      }
    }

    function showSkip() { if (skipBtn && !skipped) skipBtn.hidden = false; }
    function hideSkip() { if (skipBtn) skipBtn.hidden = true; }

    // Reveal projects with staggered animation
    function revealProjectsInstant() {
      if (!projects) return;
      projects.classList.add('show');
      const cards = projects.querySelectorAll('.project-card');
      cards.forEach(card => card.classList.add('show'));
      scheduleWindowHeightUpdate(true);
    }

    // Final text that should appear if user skips early
    const finalLines = [
      ">i'm thought_ed",
      ">i know how to code some things in roblox",
      ">if you're here, it's probably cause i sent you my portfolio",
      ">so uhh",
      ">welcome to my portfolio :D",
      ">by the way, if you have criticism about this page",
      ">please tell me, i'd love to improve it :)"
    ];

    function writeFinalTextInstant() {
      if (!animatedText) return;
      animatedText.textContent = finalLines.join('\n');
    }

    function cleanupTyping() {
      typingInstances.forEach(inst => {
        try { inst.destroy(true); } catch (_) { /* noop */ }
      });
      typingInstances.length = 0;
      document.querySelectorAll('.ti-cursor').forEach(c => c.remove());
    }

    function skipIntroFlow() {
      if (skipped) return; // idempotent
      skipped = true;
      if (cancelCursorIntro) {
        cancelCursorIntro();
      }
      revealPortfolioWindow();
      cleanupTyping();
      hideSkip();
      // Hide intro immediately
      intro.classList.add('hide');
      intro.style.display = 'none';
      // Show main content and body scroll
      main.classList.add('show');
      document.body.style.overflow = 'auto';
      // Write final text and reveal projects
      writeFinalTextInstant();
      revealProjectsInstant();
      scheduleWindowHeightUpdate(true);
      disableHeightAutomation();
      // Scroll to projects for convenience
      if (projects) projects.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', skipIntroFlow);
    }

    // Decorative taskbar clock
    function pad(n) { return n.toString().padStart(2, '0'); }
    function updateClock() {
      if (!clockTimeEl || !clockDateEl) return;
      const now = new Date();
      // Use user's locale; 12h/24h will auto follow system
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
      clockTimeEl.textContent = time;
      clockDateEl.textContent = date;
    }
    updateClock();
    setInterval(updateClock, 30000);

    // If TypeIt missing, fallback immediately
    if (typeof TypeIt !== 'function') {
      console.warn('TypeIt is not loaded - skipping typing animations');
      intro.style.display = 'none';
      main.classList.add('show');
      document.body.style.overflow = 'auto';
      writeFinalTextInstant();
      revealProjectsInstant();
      if (loader) {
        document.body.classList.add('wallpaper');
        loader.classList.add('hidden');
      }
      revealPortfolioWindow();
      disableHeightAutomation();
      return;
    }

    function startIntroTyping() {
      // Ensure skip hidden during "hi"
      hideSkip();
      const introInstance = new TypeIt('#intro', {
        speed: 200,
        waitUntilVisible: true,
        afterComplete: (instance) => {
          // Remove instance and transition to main typing
          instance.destroy();
          hideSkip(); // keep hidden while switching views
          setTimeout(() => {
            intro.classList.add('hide');
            setTimeout(() => {
              intro.style.display = 'none';
              main.classList.add('show');
              document.body.style.overflow = 'auto';
              startMainTyping();
              scheduleWindowHeightUpdate(true);
            }, 800);
          }, 600);
        }
      })

        .pause(700)
        .type('h')
        .pause(500)
        .type('i')
        .pause(700);

      typingInstances.push(introInstance);
      introInstance.go();
      scheduleWindowHeightUpdate();
      setTimeout(() => showSkip(), 150);
    }

    // Wait for all assets to finish loading (or a failsafe timeout) before hiding the loader
    const LOADER_FAILSAFE_MS = 12000;
    let loaderHideQueued = false;
    function queueLoaderHide() {
      if (loaderHideQueued) return;
      loaderHideQueued = true;
      hideLoaderSequence();
    }

    if (document.readyState === 'complete') {
      queueLoaderHide();
    } else {
      window.addEventListener('load', () => queueLoaderHide(), { once: true });
    }
    setTimeout(() => queueLoaderHide(), LOADER_FAILSAFE_MS);

    function startMainTyping() {
      if (skipped) return; // If already skipped, avoid starting animation
      showSkip(); // Allow skipping during main typing
      scheduleWindowHeightUpdate();
      const mainInstance = new TypeIt('#animated-text', { speed: 25, waitUntilVisible: true })
        .type(">i'm thought_ed")
        .pause(1000)
        .break()
        .type(">i know how to code some things in roblox")
        .pause(1000)
        .break()
        .type(">if you're here, it's probably cause i sent you my portfolio")
        .pause(1000)
        .break()
        .type(">so uhh")
        .pause(1000)
        .break()
        .type(">welcome to my portfolio :D")
        .pause(400)
        .break()
        .pause(500)
        .exec(() => {
          setTimeout(() => {
            if (skipped) return;
            if (!projects) return;
            projects.classList.add('show');
            const cards = projects.querySelectorAll('.project-card');
            cards.forEach((card, i) => setTimeout(() => {
              card.classList.add('show');
              scheduleWindowHeightUpdate();
            }, i * 500));
          }, 800);
        })
        .pause(1000)
        .type(">by the way, if you have criticism about this page")
        .break()
        .pause(500)
        .type(">please tell me, i'd love to improve it :)")
        .pause(400)
        .exec(() => {
          // Completed main typing
          hideSkip();
          scheduleWindowHeightUpdate(true);
          disableHeightAutomation();
        });

      typingInstances.push(mainInstance);
      mainInstance.go();
    }

    // Video placeholders: click to load and play (lazy load behavior)
    document.querySelectorAll('.video-container').forEach(container => {
      const video = container.querySelector('video');
      const placeholder = container.querySelector('.video-placeholder');
      if (!video || !placeholder) return;

      const activate = () => {
        if (placeholder.classList.contains('loading') || placeholder.classList.contains('hidden')) return;
        placeholder.classList.add('loading');
        video.setAttribute('controls', 'controls');
        const hideOverlay = () => {
          placeholder.classList.add('hidden');
          placeholder.classList.remove('loading');
        };
        video.addEventListener('playing', hideOverlay, { once: true });
        video.addEventListener('canplay', hideOverlay, { once: true });
        try { video.load(); } catch (_) { }
        video.play().catch(() => hideOverlay());
      };

      placeholder.addEventListener('click', activate);
      placeholder.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
      video.addEventListener('click', () => { if (!placeholder.classList.contains('hidden')) activate(); });
    });
  });
})();
