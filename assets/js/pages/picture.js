let currentSlide = 0;
let isAutoPlay = true; // Повертаємо true для автозапуску
let autoPlayInterval;
const totalSlides = 5;
const slides = document.querySelectorAll('.carousel-item');
const indicators = document.querySelectorAll('.indicator');

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
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateCarousel();
}

function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
}

function startAutoPlay() {
  if (isAutoPlay) {
    autoPlayInterval = setInterval(nextSlide, 10000);
  }
}

function stopAutoPlay() {
  clearInterval(autoPlayInterval);
}

function toggleAutoPlay() {
  isAutoPlay = !isAutoPlay;
  const autoPlayIcon = document.getElementById('autoPlayIcon');
  const autoPlayText = document.getElementById('autoPlayText');

  if (isAutoPlay) {
    // Показуємо іконку паузи (дві вертикальні лінії)
    autoPlayIcon.innerHTML = `
      <div class="pause-bars">
        <div class="pause-bar"></div>
        <div class="pause-bar"></div>
      </div>
    `;
    autoPlayText.textContent = 'Пауза';
    startAutoPlay();
  } else {
    // Показуємо іконку відтворення (трикутник)
    autoPlayIcon.innerHTML = '<div class="play-triangle"></div>';
    autoPlayText.textContent = 'Авто';
    stopAutoPlay();
  }
}

// Встановлюємо початковий стан кнопки при завантаженні
function initializeButton() {
  const autoPlayIcon = document.getElementById('autoPlayIcon');
  const autoPlayText = document.getElementById('autoPlayText');

  if (isAutoPlay) {
    // Показуємо іконку паузи, оскільки авто вже працює
    autoPlayIcon.innerHTML = `
      <div class="pause-bars">
        <div class="pause-bar"></div>
        <div class="pause-bar"></div>
      </div>
    `;
    autoPlayText.textContent = 'Пауза';
  } else {
    autoPlayIcon.innerHTML = '<div class="play-triangle"></div>';
    autoPlayText.textContent = 'Авто';
  }
}

// Обработчики событий для паузы при наведении
const carouselWrapper = document.querySelector('.carousel-wrapper');
carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
carouselWrapper.addEventListener('mouseleave', () => {
  if (isAutoPlay) startAutoPlay();
});

// Поддержка свайпов для мобильных устройств
let startX = 0;
let endX = 0;

carouselWrapper.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  stopAutoPlay();
});

carouselWrapper.addEventListener('touchend', (e) => {
  endX = e.changedTouches[0].clientX;
  const diffX = startX - endX;

  if (Math.abs(diffX) > 50) {
    if (diffX > 0) {
      nextSlide();
    } else {
      prevSlide();
    }
  }

  if (isAutoPlay) startAutoPlay();
});

// Поддержка клавиатуры
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    prevSlide();
  } else if (e.key === 'ArrowRight') {
    nextSlide();
  } else if (e.key === ' ') {
    e.preventDefault();
    toggleAutoPlay();
  }
});

// Клик по слайду для перехода
slides.forEach(slide => {
  slide.addEventListener('click', () => {
    if (!slide.classList.contains('active')) {
      const index = Array.from(slides).indexOf(slide);
      goToSlide(index);
    }
  });
});

// Ініціалізація при завантаженні
initializeButton();
startAutoPlay();
