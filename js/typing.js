// Typing animation module (ES module)
import { state, elements } from './state.js';
import { scheduleWindowHeightUpdate, disableHeightAutomation } from './window-height.js';
import { showCategorySelector, revealProjectsInstant } from './category.js';
import { revealPortfolioWindow } from './cursor-intro.js';

const finalLines = [
  ">i'm thought_ed",
  ">i know how to code some things in roblox",
  ">if you're here, it's probably cause i sent you my portfolio",
  ">and you're looking to hire someone for making things",
  ">so uhh, choose a category you're looking for first",
  ">here it is :D",
  ">by the way, if you have criticism about this page",
  ">please tell me, i'd love to improve it :)"
];

export function writeFinalTextInstant() {
  const { animatedText } = elements;
  if (!animatedText) return;
  animatedText.textContent = finalLines.join('\n');
}

// Write text up to "choose a category" for skip flow
export function writeFinalTextForSkip() {
  const { animatedText } = elements;
  if (!animatedText) return;
  const skipLines = finalLines.slice(0, 5); // Up to "choose a category"
  animatedText.textContent = skipLines.join('\n');
}

function cleanupTyping() {
  state.typingInstances.forEach(inst => {
    try { inst.destroy(true); } catch (_) { /* noop */ }
  });
  state.typingInstances.length = 0;
  document.querySelectorAll('.ti-cursor').forEach(c => c.remove());
}

function showSkip() {
  const { skipBtn } = elements;
  if (skipBtn && !state.skipped) skipBtn.hidden = false;
}

function hideSkip() {
  const { skipBtn } = elements;
  if (skipBtn) skipBtn.hidden = true;
}

export function skipIntroFlow() {
  if (state.skipped) return;
  state.skipped = true;
  
  const { intro, main } = elements;
  
  if (state.cancelCursorIntro) {
    state.cancelCursorIntro();
  }
  
  revealPortfolioWindow(scheduleWindowHeightUpdate);
  cleanupTyping();
  hideSkip();
  
  intro.classList.add('hide');
  intro.style.display = 'none';
  
  main.classList.add('show');
  document.body.style.overflow = 'auto';
  
  // Write text up to "choose a category" only
  writeFinalTextForSkip();
  
  // Show category selector so user can pick
  revealProjectsInstant();
  scheduleWindowHeightUpdate(true);
}

export function startMainTyping(onCategoryShown) {
  if (state.skipped) return;
  
  showSkip();
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
    .type(">and you're looking to hire someone for making things")
    .pause(1000)
    .break()
    .type(">so uhh, choose a category you're looking for first")
    .pause(400)
    .exec(() => {
      if (state.skipped) return;
      
      setTimeout(() => {
        showCategorySelector();
        scheduleWindowHeightUpdate();
      }, 600);
    })
    .pause(500);
  
  // Store callback for after category selection
  state.typingInstances.push(mainInstance);
  mainInstance.go();
  
  // Return a function that can be called to continue typing after category selection
  // Instead of creating a new TypeIt instance (which clears content), we manually append
  return function continueTypingAfterCategory() {
    if (state.skipped) return;
    
    const { animatedText } = elements;
    if (!animatedText) return;
    
    // Remove the cursor from previous TypeIt instance
    const oldCursor = animatedText.querySelector('.ti-cursor');
    
    // Lines to type after category selection
    const linesToType = [
      ">here it is :D",
      ">by the way, if you have criticism about this page",
      ">please tell me, i'd love to improve it :)"
    ];
    
    let lineIndex = 0;
    
    function typeNextLine() {
      if (state.skipped || lineIndex >= linesToType.length) {
        // Done typing
        if (oldCursor) oldCursor.remove();
        hideSkip();
        scheduleWindowHeightUpdate(true);
        disableHeightAutomation();
        return;
      }
      
      const line = linesToType[lineIndex];
      lineIndex++;
      
      // Add a line break first
      animatedText.appendChild(document.createElement('br'));
      
      // Create a span for this line
      const lineSpan = document.createElement('span');
      animatedText.appendChild(lineSpan);
      
      // Move cursor after the span
      if (oldCursor) animatedText.appendChild(oldCursor);
      
      let charIndex = 0;
      
      function typeChar() {
        if (state.skipped) {
          // Finish instantly
          lineSpan.textContent = line;
          typeNextLine();
          return;
        }
        
        if (charIndex < line.length) {
          lineSpan.textContent += line[charIndex];
          charIndex++;
          scheduleWindowHeightUpdate();
          setTimeout(typeChar, 25);
        } else {
          // Line done, pause then next line
          setTimeout(typeNextLine, lineIndex === 1 ? 800 : 500);
        }
      }
      
      setTimeout(typeChar, 300);
    }
    
    typeNextLine();
  };
}

export function startIntroTyping(onComplete) {
  hideSkip();
  
  const { intro, main } = elements;
  
  const introInstance = new TypeIt('#intro', {
    speed: 200,
    waitUntilVisible: true,
    afterComplete: (instance) => {
      instance.destroy();
      hideSkip();
      
      setTimeout(() => {
        intro.classList.add('hide');
        setTimeout(() => {
          intro.style.display = 'none';
          main.classList.add('show');
          document.body.style.overflow = 'auto';
          onComplete?.();
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
  
  state.typingInstances.push(introInstance);
  introInstance.go();
  scheduleWindowHeightUpdate();
  setTimeout(() => showSkip(), 150);
}

export function initSkipButton() {
  const { skipBtn } = elements;
  if (skipBtn) {
    skipBtn.addEventListener('click', skipIntroFlow);
  }
}

export function handleNoTypeIt() {
  const { intro, main, loader } = elements;
  
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
  
  revealPortfolioWindow(scheduleWindowHeightUpdate);
  disableHeightAutomation();
}
