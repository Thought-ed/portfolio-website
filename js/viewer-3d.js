// Image Carousel module (ES module)

export function init3DViewers() {
  // Now handles image carousels instead of 3D viewers
  initCarousels();
}

function initCarousels() {
  const carousels = document.querySelectorAll('.image-carousel');
  
  carousels.forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    // Get all slides: images and video containers
    const slides = track.querySelectorAll('img, .carousel-video');
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    
    if (slides.length === 0) return;
    
    let currentIndex = 0;
    
    // Set first slide as active
    slides[0].classList.add('active');
    
    // Create dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });
    carousel.appendChild(dotsContainer);
    
    function goToSlide(index) {
      // Pause video if leaving a video slide
      const currentSlide = slides[currentIndex];
      if (currentSlide.classList.contains('carousel-video')) {
        const video = currentSlide.querySelector('video');
        if (video) video.pause();
      }
      
      slides[currentIndex].classList.remove('active');
      dotsContainer.children[currentIndex].classList.remove('active');
      
      currentIndex = index;
      if (currentIndex >= slides.length) currentIndex = 0;
      if (currentIndex < 0) currentIndex = slides.length - 1;
      
      slides[currentIndex].classList.add('active');
      dotsContainer.children[currentIndex].classList.add('active');
    }
    
    prevBtn?.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextBtn?.addEventListener('click', () => goToSlide(currentIndex + 1));
    
    // Optional: auto-advance (uncomment if wanted)
    // setInterval(() => goToSlide(currentIndex + 1), 5000);
  });
}

export function destroyViewers() {
  // Cleanup if needed
}

