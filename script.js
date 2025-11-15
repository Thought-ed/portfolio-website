// Wrapped and hardened script
(function () {
  'use strict';

  function safeQuery(selector) { return document.querySelector(selector); }

  // Hold references to active TypeIt instances so we can cancel them
  const typingInstances = [];
  let skipped = false;

  document.addEventListener('DOMContentLoaded', () => {
    const windowEl = safeQuery('.window');
    const loader = safeQuery('.loader');

    // Wallpaper transition then window pop-up after loader
    let loaderSequenceActive = false;
    function hideLoaderSequence() {
      if (loaderSequenceActive) return;
      loaderSequenceActive = true;
      if (loader) {
        // Add a class to body to trigger potential background transition
        document.body.classList.add('wallpaper');
        // Fade out loader
        loader.classList.add('hidden');
        // Show window after 1.5s per requirement
        if (windowEl) setTimeout(() => {
          windowEl.classList.add('show');
          // Start intro typing ONLY after window pops up
          startIntroTyping();
          scheduleWindowHeightUpdate(true);
        }, 1500);
      } else if (windowEl) {
        windowEl.classList.add('show');
        startIntroTyping();
        scheduleWindowHeightUpdate(true);
      } else {
        startIntroTyping();
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

    if (!intro || !main) return console.warn('Expected DOM elements missing (intro/main)');

    intro.classList.add('show');
    // We'll kick off typing later via startIntroTyping()

    if (window.ResizeObserver && windowEl) {
      const resizeObserver = new ResizeObserver(() => scheduleWindowHeightUpdate());
      [intro, main, animatedText, projects].forEach(el => { if (el) resizeObserver.observe(el); });
    }

    scheduleWindowHeightUpdate(true);
    window.addEventListener('resize', () => scheduleWindowHeightUpdate(true));

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
      // Scroll to projects for convenience
      if (projects) projects.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', skipIntroFlow);
    }

    // Decorative taskbar clock
    function pad(n){ return n.toString().padStart(2,'0'); }
    function updateClock(){
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
      if (windowEl) {
        windowEl.classList.add('show');
        scheduleWindowHeightUpdate(true);
      }
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
        .type('h')
        .pause(500)
        .type('i')
        .pause(700);

      typingInstances.push(introInstance);
      introInstance.go();
      scheduleWindowHeightUpdate();
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

    showSkip(); // Show skip while intro typing is active

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
          scheduleWindowHeightUpdate();
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
        try { video.load(); } catch (_) {}
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
