// 3D Viewer module (ES module) - Three.js placeholder
// This will be expanded later with actual Three.js implementation

const viewers = new Map();

export function init3DViewers() {
  const viewerPlaceholders = document.querySelectorAll('.viewer-placeholder');
  
  viewerPlaceholders.forEach((placeholder, index) => {
    const viewerId = placeholder.dataset.viewerId || `viewer-${index}`;
    
    // For now, just set up click handler to show "coming soon"
    placeholder.addEventListener('click', () => {
      if (!placeholder.classList.contains('active')) {
        placeholder.classList.add('active');
        placeholder.innerHTML = `
          <div class="viewer-loading">
            <i class="fa-solid fa-cube"></i>
            <span>3D Viewer coming soon</span>
            <small>Three.js integration in progress</small>
          </div>
        `;
      }
    });
    
    viewers.set(viewerId, {
      element: placeholder,
      initialized: false,
      scene: null,
      camera: null,
      renderer: null
    });
  });
}

// Future: Initialize actual Three.js scene
export function initThreeJsViewer(viewerId, modelUrl) {
  const viewer = viewers.get(viewerId);
  if (!viewer || viewer.initialized) return;
  
  // TODO: Implement Three.js scene setup
  // - Create scene, camera, renderer
  // - Load GLTF/GLB model
  // - Add OrbitControls
  // - Add lights
  // - Start render loop
  
  console.log(`[3D Viewer] Would load model: ${modelUrl} into viewer: ${viewerId}`);
  viewer.initialized = true;
}

export function destroyViewers() {
  viewers.forEach(viewer => {
    if (viewer.renderer) {
      viewer.renderer.dispose();
    }
  });
  viewers.clear();
}
