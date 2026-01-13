// Category selection module (ES module)
import { state, elements } from './state.js';
import { scheduleWindowHeightUpdate } from './window-height.js';

let onCategorySelectedCallback = null;
let continueTypingCalled = false;

export function showCategorySelector() {
  const { categorySelector } = elements;
  if (!categorySelector) return;
  
  categorySelector.classList.remove('hidden');
  categorySelector.classList.add('show');
  scheduleWindowHeightUpdate();
}

export function hideCategorySelector() {
  const { categorySelector } = elements;
  if (!categorySelector) return;
  
  categorySelector.classList.remove('show');
  categorySelector.classList.add('hidden');
}

function hideAllProjects(callback) {
  const { scriptingProjects, buildingProjects } = elements;
  let hasVisibleContent = false;
  
  // Add hiding class for fade-out animation
  if (scriptingProjects && scriptingProjects.classList.contains('show')) {
    hasVisibleContent = true;
    scriptingProjects.classList.add('hiding');
    scriptingProjects.classList.remove('show');
  }
  
  if (buildingProjects && buildingProjects.classList.contains('show')) {
    hasVisibleContent = true;
    buildingProjects.classList.add('hiding');
    buildingProjects.classList.remove('show');
  }
  
  // Wait for animation then fully hide
  const animDuration = hasVisibleContent ? 300 : 0;
  setTimeout(() => {
    if (scriptingProjects) {
      scriptingProjects.classList.remove('visible', 'hiding');
      const groups = scriptingProjects.querySelectorAll('.scripting-group');
      groups.forEach(group => group.classList.remove('show'));
    }
    
    if (buildingProjects) {
      buildingProjects.classList.remove('visible', 'hiding');
      const games = buildingProjects.querySelectorAll('.building-game');
      games.forEach(game => game.classList.remove('show'));
    }
    
    if (callback) callback();
  }, animDuration);
}

export function revealScriptingProjects() {
  const { scriptingProjects } = elements;
  if (!scriptingProjects) return;
  
  // First make visible, then trigger animation on next frame
  scriptingProjects.classList.add('visible');
  
  // Force reflow before adding show class for animation
  void scriptingProjects.offsetHeight;
  
  scriptingProjects.classList.add('show');
  
  const groups = scriptingProjects.querySelectorAll('.scripting-group');
  groups.forEach((group, i) => {
    setTimeout(() => {
      group.classList.add('show');
      scheduleWindowHeightUpdate();
    }, 100 + i * 120); // Staggered with initial delay
  });
  
  scheduleWindowHeightUpdate();
}

export function revealBuildingProjects() {
  const { buildingProjects } = elements;
  if (!buildingProjects) return;
  
  // First make visible, then trigger animation on next frame
  buildingProjects.classList.add('visible');
  
  // Force reflow before adding show class for animation
  void buildingProjects.offsetHeight;
  
  buildingProjects.classList.add('show');
  
  const games = buildingProjects.querySelectorAll('.building-game');
  games.forEach((game, i) => {
    setTimeout(() => {
      game.classList.add('show');
      scheduleWindowHeightUpdate();
    }, 100 + i * 150); // Staggered with initial delay
  });
  
  scheduleWindowHeightUpdate();
}

export function selectCategory(category) {
  const { categorySelector } = elements;
  const prevCategory = state.selectedCategory;
  
  // If clicking the same category, do nothing
  if (prevCategory === category) return;
  
  // Update active button state
  if (categorySelector) {
    const buttons = categorySelector.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  state.selectedCategory = category;
  
  // Hide previous category's projects with animation, then show new
  hideAllProjects(() => {
    if (category === 'scripting') {
      revealScriptingProjects();
    } else if (category === 'building') {
      revealBuildingProjects();
    }
    
    // Only trigger continue typing callback on first selection
    if (!continueTypingCalled && onCategorySelectedCallback) {
      continueTypingCalled = true;
      setTimeout(() => {
        onCategorySelectedCallback?.();
      }, 600);
    }
  });
}

export function initCategorySelector(onCategorySelected) {
  onCategorySelectedCallback = onCategorySelected;
  
  const { categorySelector } = elements;
  if (!categorySelector) return;
  
  const scriptingBtn = categorySelector.querySelector('[data-category="scripting"]');
  const buildingBtn = categorySelector.querySelector('[data-category="building"]');
  
  scriptingBtn?.addEventListener('click', () => selectCategory('scripting'));
  buildingBtn?.addEventListener('click', () => selectCategory('building'));
}

// For skip flow - show category selector ready to pick
export function revealProjectsInstant() {
  const { categorySelector } = elements;
  
  // Set up button click handlers if not already done
  if (categorySelector) {
    const scriptingBtn = categorySelector.querySelector('[data-category="scripting"]');
    const buildingBtn = categorySelector.querySelector('[data-category="building"]');
    
    scriptingBtn?.addEventListener('click', () => selectCategory('scripting'));
    buildingBtn?.addEventListener('click', () => selectCategory('building'));
    
    // Show category selector so user can pick
    categorySelector.classList.remove('hidden');
    categorySelector.classList.add('show');
  }
  
  // Mark continue typing as called since we're skipping
  continueTypingCalled = true;
  
  scheduleWindowHeightUpdate(true);
}
