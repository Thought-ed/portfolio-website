// Taskbar clock module (ES module)
import { elements } from './state.js';

let clockInterval = null;

export function updateClock() {
  const { clockTimeEl, clockDateEl } = elements;
  if (!clockTimeEl || !clockDateEl) return;
  
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' });
  
  clockTimeEl.textContent = time;
  clockDateEl.textContent = date;
}

export function initClock() {
  updateClock();
  clockInterval = setInterval(updateClock, 30000);
}

export function destroyClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}
