// Wrapped and hardened script
(function () {
  'use strict';

  function safeQuery(selector) {
    return document.querySelector(selector);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const windowEl = safeQuery('.window');
    if (windowEl) setTimeout(() => windowEl.classList.add('show'), 200);

    const intro = document.getElementById('intro');
    const main = document.getElementById('main-content');

    if (!intro || !main) return console.warn('Expected DOM elements missing (intro/main)');

    intro.classList.add('show');

    if (typeof TypeIt !== 'function') {
      console.warn('TypeIt is not loaded - skipping typing animations');
      // reveal main content as fallback
      intro.style.display = 'none';
      main.classList.add('show');
      document.body.style.overflow = 'auto';
      const projects = document.getElementById('projects');
      if (projects) projects.classList.add('show');
      return;
    }

    new TypeIt('#intro', {
      speed: 200,
      waitUntilVisible: true,
      afterComplete: (instance) => {
        instance.destroy();
        setTimeout(() => {
          intro.classList.add('hide');
          setTimeout(() => {
            intro.style.display = 'none';
            main.classList.add('show');
            document.body.style.overflow = 'auto';
            startMainTyping();
          }, 800);
        }, 1000);
      }
    })
      .type('h')
      .pause(500)
      .type('i')
      .pause(700)
      .go();

    function startMainTyping() {
      new TypeIt('#animated-text', { speed: 25, waitUntilVisible: true })
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
            const projects = document.getElementById('projects');
            if (!projects) return;
            projects.classList.add('show');
            const cards = projects.querySelectorAll('.project-card');
            cards.forEach((card, i) => setTimeout(() => card.classList.add('show'), i * 500));
          }, 800);
        })
        .pause(1000)
        .type(">by the way, if you have criticism about this page")
        .break()
        .pause(500)
        .type(">please tell me, i'd love to improve it :)")
        .go();
    }
  });
})();
