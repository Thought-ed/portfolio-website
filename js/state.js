// Shared application state (ES module)
export const state = {
  skipped: false,
  typingInstances: [],
  cursorPlaybackPoints: null,
  cursorPathPromise: null,
  windowRevealTimeout: null,
  loaderSequenceActive: false,
  portfolioWindowShown: false,
  cancelCursorIntro: null,
  previousWindowHeight: null,
  heightUpdateScheduled: false,
  dynamicHeightActive: true,
  resizeObserver: null,
  loaderHideQueued: false,
  selectedCategory: null // 'scripting' | 'building' | 'modelling' | null
};

// DOM element cache (populated on init)
export const elements = {
  windowEl: null,
  loader: null,
  desktop: null,
  demoCursor: null,
  demoCursorLabel: null,
  portfolioShortcut: null,
  cursorPreviewBtn: null,
  intro: null,
  main: null,
  skipBtn: null,
  animatedText: null,
  scriptingProjects: null,
  buildingProjects: null,
  modellingProjects: null,
  categorySelector: null,
  clockTimeEl: null,
  clockDateEl: null
};

// Initialize element references
export function initElements() {
  elements.windowEl = document.querySelector('.window');
  elements.loader = document.querySelector('.loader');
  elements.desktop = document.querySelector('.win11-desktop');
  elements.demoCursor = document.getElementById('demo-cursor');
  elements.demoCursorLabel = document.getElementById('demo-cursor-label');
  elements.portfolioShortcut = document.querySelector('[data-shortcut="portfolio"]');
  elements.cursorPreviewBtn = document.getElementById('cursor-preview');
  elements.intro = document.getElementById('intro');
  elements.main = document.getElementById('main-content');
  elements.skipBtn = document.getElementById('skip-intro');
  elements.animatedText = document.getElementById('animated-text');
  elements.scriptingProjects = document.getElementById('scripting-projects');
  elements.buildingProjects = document.getElementById('building-projects');
  elements.modellingProjects = document.getElementById('modelling-projects');
  elements.categorySelector = document.getElementById('category-selector');
  elements.clockTimeEl = document.getElementById('taskbar-time');
  elements.clockDateEl = document.getElementById('taskbar-date');
}
