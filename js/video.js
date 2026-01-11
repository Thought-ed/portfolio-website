// Video lazy-load module (ES module)

export function initVideoPlaceholders() {
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
    
    video.addEventListener('click', () => {
      if (!placeholder.classList.contains('hidden')) activate();
    });
  });
}
