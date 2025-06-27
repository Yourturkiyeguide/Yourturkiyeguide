document.addEventListener('DOMContentLoaded', () => {
  let currentSlide = 0;
  let isAutoPlay = true;
  let autoPlayInterval;
  const totalSlides = 5;

  const slides = document.querySelectorAll('.carousel-item');
  const indicators = document.querySelectorAll('.indicator');
  const carouselWrapper = document.querySelector('.carousel-wrapper');
  const autoPlayIcon = document.getElementById('autoPlayIcon');
  const autoPlayText = document.getElementById('autoPlayText');
  window.toggleAutoPlay = toggleAutoPlay;


  let startX = 0;
  let isSwiping = false;

  if (!carouselWrapper || slides.length === 0 || indicators.length === 0) {
    console.warn('⚠️ Не знайдено елементи для каруселі');
    return;
  }

  // 🔄 Оновлення стану слайдів
  function updateCarousel() {
    slides.forEach((slide, index) => {
      slide.className = 'carousel-item';
      if (index === currentSlide) {
        slide.classList.add('active');
      } else if (index === (currentSlide - 1 + totalSlides) % totalSlides) {
        slide.classList.add('prev');
      } else if (index === (currentSlide + 1) % totalSlides) {
        slide.classList.add('next');
      } else {
        slide.classList.add('hidden');
      }
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === currentSlide);
    });
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateCarousel();
    resetAutoPlay();
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateCarousel();
    resetAutoPlay();
  }

  function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
    resetAutoPlay();
  }

  function startAutoPlay() {
    stopAutoPlay();
    if (isAutoPlay) {
      autoPlayInterval = setInterval(nextSlide, 5000);
    }
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  function resetAutoPlay() {
    if (isAutoPlay) startAutoPlay();
  }

  function toggleAutoPlay() {
    isAutoPlay = !isAutoPlay;
    updateAutoPlayButton();
    if (isAutoPlay) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }
  }

  function updateAutoPlayButton() {
    if (!autoPlayIcon || !autoPlayText) return;
    if (isAutoPlay) {
      autoPlayIcon.innerHTML = `
        <div class="pause-bars">
          <div class="pause-bar"></div>
          <div class="pause-bar"></div>
        </div>`;
      autoPlayText.textContent = 'Пауза';
    } else {
      autoPlayIcon.innerHTML = '<div class="play-triangle"></div>';
      autoPlayText.textContent = 'Авто';
    }
  }

  // 🎯 Події миші
  carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
  carouselWrapper.addEventListener('mouseleave', () => {
    if (isAutoPlay) startAutoPlay();
  });

  // 📱 Свайпи
  carouselWrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isSwiping = true;
    stopAutoPlay();
  }, { passive: true });

  carouselWrapper.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    if (Math.abs(deltaX) > 10) {
      e.preventDefault(); // блокуємо скрол сторінки
    }
  }, { passive: false });

  carouselWrapper.addEventListener('touchend', (e) => {
    isSwiping = false;
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    resetAutoPlay();
  }, { passive: true });

  // ⌨️ Клавіатура
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        prevSlide();
        break;
      case 'ArrowRight':
        nextSlide();
        break;
      case ' ':
        e.preventDefault();
        toggleAutoPlay();
        break;
    }
  });

  // 🖱 Клік на слайд — перейти до нього
  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => {
      if (!slide.classList.contains('active')) {
        goToSlide(index);
      }
    });
  });

  // 🟢 Ініціалізація
  updateAutoPlayButton();
  updateCarousel();
  startAutoPlay();
});
