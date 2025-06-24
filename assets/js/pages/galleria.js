// Демонстраційні зображення
const slides = [
  {
    image: 'assets/img/hello/1.jpg',
    title: 'Зображення 1'
  },
  {
    image: 'assets/img/hello/2.webp',
    title: 'Зображення 2'
  },
  {
    image: 'assets/img/hello/3.jpg',
    title: 'Зображення 3'
  },
  {
    image: 'assets/img/hello/4.jpg',
    title: 'Фото 4'
  },
  {
    image: 'assets/img/hello/5.jpg',
    title: 'Фото 5'
  },
  {
    image: 'assets/img/hello/6.jpg',
    title: 'Фото 6'
  },
  {
    image: 'assets/img/hello/7.jpg',
    title: 'Фото 7'
  },
  {
    image: 'assets/img/hello/8.jpg',
    title: 'Фото 8'
  },
  {
    image: 'assets/img/hello/9.jpg',
    title: 'Фото 9'
  }
];

let currentIndex = 0;
let isFullscreen = false;
let autoPlayInterval = null;
let isAutoPlaying = false;

// Мобільні змінні
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isDragging = false;
let minSwipeDistance = 50;

function createImageElement(src, alt = '', onLoad = null, onError = null) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.draggable = false; // Важливо для мобільних

  // Запобігання контекстному меню на мобільних
  img.addEventListener('contextmenu', (e) => e.preventDefault());

  if (onLoad) {
    img.onload = onLoad;
  }

  if (onError) {
    img.onerror = onError;
  }

  return img;
}

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
}

function createThumbnails() {
  const container = document.getElementById('thumbnailsContainer');
  if (!container) return;

  container.innerHTML = '';

  slides.forEach((slide, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
    thumbnail.setAttribute('data-index', index);

    // Оптимізація для мобільних - використовуємо touchend замість click
    if (isMobile) {
      thumbnail.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!isDragging) {
          changeSlide(index, thumbnail);
        }
      }, { passive: false });
    } else {
      thumbnail.addEventListener('click', () => changeSlide(index, thumbnail));
    }

    const img = createImageElement(
      slide.image,
      slide.title || `Зображення ${index + 1}`,
      () => {
        // Зображення завантажилося успішно
        const placeholder = thumbnail.querySelector('.thumbnail-placeholder');
        if (placeholder) {
          placeholder.remove();
        }
      },
      () => {
        // Помилка завантаження зображення
        const placeholder = document.createElement('div');
        placeholder.className = 'thumbnail-placeholder error';
        placeholder.innerHTML = `
          <span>❌</span>
          <span>Помилка</span>
        `;
        thumbnail.innerHTML = '';
        thumbnail.appendChild(placeholder);
      }
    );

    // Додаємо placeholder поки завантажується зображення
    const placeholder = document.createElement('div');
    placeholder.className = 'thumbnail-placeholder';
    placeholder.innerHTML = `
      <span>📷</span>
      <span>Завантаження...</span>
    `;

    thumbnail.appendChild(placeholder);
    thumbnail.appendChild(img);
    container.appendChild(thumbnail);
  });
}

function changeSlide(index, element) {
  if (index < 0 || index >= slides.length) return;

  currentIndex = index;
  const slide = slides[index];
  const mainImageContainer = document.getElementById('mainImageContainer');

  if (!mainImageContainer) return;

  // Очищуємо попередній контент
  mainImageContainer.innerHTML = `
    <div class="image-placeholder">
      <span>📷</span>
      <span>Завантаження зображення...</span>
    </div>
  `;

  // Створюємо нове зображення
  const img = createImageElement(
    slide.image,
    slide.title || `Зображення ${index + 1}`,
    () => {
      // Зображення завантажилося успішно
      mainImageContainer.innerHTML = '';
      mainImageContainer.appendChild(img);

      // Додаємо обробник для відкриття повноекранного режиму
      if (isMobile) {
        img.addEventListener('touchend', (e) => {
          e.preventDefault();
          if (!isDragging) {
            openFullscreen();
          }
        }, { passive: false });
      } else {
        img.addEventListener('click', openFullscreen);
      }
    },
    () => {
      // Помилка завантаження
      mainImageContainer.innerHTML = `
        <div class="image-placeholder error">
          <span>❌</span>
          <span>Не вдалося завантажити зображення</span>
          <small style="margin-top: 10px; opacity: 0.7;">${slide.image}</small>
        </div>
      `;
      showError(`Не вдалося завантажити зображення: ${slide.title || 'Зображення ' + (index + 1)}`);
    }
  );

  // Оновлення активної мініатюри
  document.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.classList.remove('active');
  });
  if (element) {
    element.classList.add('active');
  }

  // Оновлення лічільника та прогрес-бару
  const currentSlideElement = document.getElementById('currentSlide');
  const progressBar = document.getElementById('progressBar');

  if (currentSlideElement) {
    currentSlideElement.textContent = index + 1;
  }
  if (progressBar) {
    progressBar.style.width = `${((index + 1) / slides.length) * 100}%`;
  }

  // Оновлення повноекранного контенту, якщо відкрито
  if (isFullscreen) {
    updateFullscreenContent();
  }

  // Скрол до активної мініатюри
  if (element && isMobile) {
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }, 100);
  }
}

function nextSlide() {
  const nextIndex = (currentIndex + 1) % slides.length;
  const nextThumbnail = document.querySelectorAll('.thumbnail')[nextIndex];
  changeSlide(nextIndex, nextThumbnail);
}

function prevSlide() {
  const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
  const prevThumbnail = document.querySelectorAll('.thumbnail')[prevIndex];
  changeSlide(prevIndex, prevThumbnail);
}

function toggleAutoPlay() {
  if (isAutoPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

function startAutoPlay() {
  if (!isAutoPlaying) {
    isAutoPlaying = true;
    const button = document.querySelector('[onclick="toggleAutoPlay()"]');
    if (button) {
      button.textContent = '⏸️ Пауза';
    }
    autoPlayInterval = setInterval(() => {
      nextSlide();
    }, 3000);
  }
}

function stopAutoPlay() {
  if (isAutoPlaying) {
    isAutoPlaying = false;
    const button = document.querySelector('[onclick="toggleAutoPlay()"]');
    if (button) {
      button.textContent = '▶️ Автоплей';
    }
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }
}

function openFullscreen() {
  const overlay = document.getElementById('fullscreenOverlay');
  if (!overlay) return;

  isFullscreen = true;
  document.body.style.overflow = 'hidden';

  // Додаткові стилі для мобільних
  if (isMobile) {
    document.documentElement.style.overflow = 'hidden';
    // Приховуємо адресну строку на мобільних
    window.scrollTo(0, 1);
  }

  updateFullscreenContent();
  overlay.classList.add('active');
  stopAutoPlay();
}

function closeFullscreen() {
  const overlay = document.getElementById('fullscreenOverlay');
  if (!overlay) return;

  isFullscreen = false;
  document.body.style.overflow = '';

  if (isMobile) {
    document.documentElement.style.overflow = '';
  }

  overlay.classList.remove('active');
}

function updateFullscreenContent() {
  const slide = slides[currentIndex];
  const fullscreenMain = document.getElementById('fullscreenMain');

  if (!fullscreenMain) return;

  // Очищуємо попередній контент
  fullscreenMain.innerHTML = `
    <div class="image-placeholder">
      <span>📷</span>
      <span>Завантаження зображення...</span>
    </div>
  `;

  // Створюємо нове зображення
  const img = createImageElement(
    slide.image,
    slide.title || `Зображення ${currentIndex + 1}`,
    () => {
      // Зображення завантажилося успішно
      fullscreenMain.innerHTML = '';
      fullscreenMain.appendChild(img);
    },
    () => {
      // Помилка завантаження
      fullscreenMain.innerHTML = `
        <div class="image-placeholder error">
          <span>❌</span>
          <span>Не вдалося завантажити зображення</span>
        </div>
      `;
    }
  );

  // Оновлення лічільника
  const fullscreenCurrentSlide = document.getElementById('fullscreenCurrentSlide');
  const fullscreenTotalSlides = document.getElementById('fullscreenTotalSlides');

  if (fullscreenCurrentSlide) {
    fullscreenCurrentSlide.textContent = currentIndex + 1;
  }
  if (fullscreenTotalSlides) {
    fullscreenTotalSlides.textContent = slides.length;
  }
}

function navigateFullscreen(direction) {
  if (direction === 1) {
    nextSlide();
  } else {
    prevSlide();
  }
}

function shuffleSlides() {
  const randomIndex = Math.floor(Math.random() * slides.length);
  const randomThumbnail = document.querySelectorAll('.thumbnail')[randomIndex];
  changeSlide(randomIndex, randomThumbnail);
}

function resetGallery() {
  stopAutoPlay();
  const firstThumbnail = document.querySelectorAll('.thumbnail')[0];
  changeSlide(0, firstThumbnail);

  if (isFullscreen) {
    closeFullscreen();
  }
}

// Покращена обробка тач-подій для мобільних пристроїв
function handleTouchStart(e) {
  // Перевіряємо чи це не кнопка управління
  if (e.target.closest('button') || e.target.closest('[onclick]') || e.target.closest('.controls') || e.target.closest('.thumbnail')) {
    return;
  }

  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  isDragging = false;

  // Запобігаємо скролу сторінки під час свайпу в повноекранному режимі
  if (isFullscreen) {
    e.preventDefault();
  }
}

function handleTouchMove(e) {
  if (e.target.closest('button') || e.target.closest('[onclick]') || e.target.closest('.controls') || e.target.closest('.thumbnail')) {
    return;
  }

  touchEndX = e.touches[0].clientX;
  touchEndY = e.touches[0].clientY;

  const deltaX = Math.abs(touchEndX - touchStartX);
  const deltaY = Math.abs(touchEndY - touchStartY);

  // Визначаємо, що користувач почав перетягувати
  if (deltaX > 10 || deltaY > 10) {
    isDragging = true;
  }

  // Запобігаємо скролу сторінки під час свайпу
  if (isFullscreen || deltaX > deltaY) {
    e.preventDefault();
  }
}

function handleTouchEnd(e) {
  if (e.target.closest('button') || e.target.closest('[onclick]') || e.target.closest('.controls') || e.target.closest('.thumbnail')) {
    return;
  }

  if (!isDragging) return;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  // Визначаємо напрямок свайпу
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Горизонтальний свайп
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  } else {
    // Вертикальний свайп (тільки якщо не в повноекранному режимі)
    if (!isFullscreen && Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  }

  isDragging = false;
}

function showHelp() {
  const helpText = `
Клавіатурні скорочення:
• ↑/↓ - Навігація по слайдах
• ←/→ - Навігація в повноекранному режимі
• Enter - Повноекранний режим
• Escape - Вихід/Скидання
• Space - Автоплей
• R - Випадковий слайд
• H - Ця довідка

Мобільне управління:
• Тап по мініатюрі - Перехід до слайду
• Тап по головному зображенню - Повноекранний режим
• Свайп вліво/вправо - Навігація
• Свайп вгору/вниз - Навігація (крім повноекранного режиму)
  `;

  alert(helpText);
}

// Клавіатурна навігація
document.addEventListener('keydown', (e) => {
  if (isFullscreen) {
    switch(e.key) {
      case 'Escape':
        closeFullscreen();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextSlide();
        break;
    }
  } else {
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextSlide();
        break;
      case ' ':
        e.preventDefault();
        toggleAutoPlay();
        break;
      case 'Enter':
        e.preventDefault();
        openFullscreen();
        break;
      case 'Escape':
        e.preventDefault();
        resetGallery();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        shuffleSlides();
        break;
      case 'h':
      case 'H':
        e.preventDefault();
        showHelp();
        break;
    }
  }
});

// Оптимізовані обробники тач-подій з passive опцією
document.addEventListener('touchstart', handleTouchStart, { passive: false });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: true });

// Додаткові обробники для кнопок управління
function setupControlButtons() {
  // Кнопки навігації в звичайному режимі
  const prevBtn = document.querySelector('[onclick="prevSlide()"]');
  const nextBtn = document.querySelector('[onclick="nextSlide()"]');
  const autoPlayBtn = document.querySelector('[onclick="toggleAutoPlay()"]');
  const fullscreenBtn = document.querySelector('[onclick="openFullscreen()"]');
  const shuffleBtn = document.querySelector('[onclick="shuffleSlides()"]');
  const resetBtn = document.querySelector('[onclick="resetGallery()"]');
  const helpBtn = document.querySelector('[onclick="showHelp()"]');

  // Кнопки в повноекранному режимі
  const fullscreenPrevBtn = document.querySelector('[onclick="navigateFullscreen(-1)"]');
  const fullscreenNextBtn = document.querySelector('[onclick="navigateFullscreen(1)"]');
  const closeBtn = document.querySelector('[onclick="closeFullscreen()"]');

  // Функція для додавання мобільних обробників
  function addMobileHandler(button, handler) {
    if (button && isMobile) {
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handler();
      }, { passive: false });

      // Додаємо візуальний feedback
      button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        button.style.opacity = '0.7';
      }, { passive: false });

      button.addEventListener('touchend', (e) => {
        setTimeout(() => {
          button.style.opacity = '';
        }, 100);
      }, { passive: true });
    }
  }

  // Додаємо обробники для всіх кнопок
  addMobileHandler(prevBtn, prevSlide);
  addMobileHandler(nextBtn, nextSlide);
  addMobileHandler(autoPlayBtn, toggleAutoPlay);
  addMobileHandler(fullscreenBtn, openFullscreen);
  addMobileHandler(shuffleBtn, shuffleSlides);
  addMobileHandler(resetBtn, resetGallery);
  addMobileHandler(helpBtn, showHelp);
  addMobileHandler(fullscreenPrevBtn, () => navigateFullscreen(-1));
  addMobileHandler(fullscreenNextBtn, () => navigateFullscreen(1));
  addMobileHandler(closeBtn, closeFullscreen);
}

// Ініціалізація галереї після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
  // Оновлення загальної кількості слайдів
  const totalSlidesElement = document.getElementById('totalSlides');
  const fullscreenTotalSlidesElement = document.getElementById('fullscreenTotalSlides');

  if (totalSlidesElement) {
    totalSlidesElement.textContent = slides.length;
  }
  if (fullscreenTotalSlidesElement) {
    fullscreenTotalSlidesElement.textContent = slides.length;
  }

  // Створення мініатюр
  createThumbnails();

  // Завантаження першого слайду
  const firstThumbnail = document.querySelectorAll('.thumbnail')[0];
  changeSlide(0, firstThumbnail);

  // Налаштування кнопок управління для мобільних
  setupControlButtons();

  console.log('Галерея ініціалізована успішно!');
  console.log(`Завантажено ${slides.length} слайдів`);
  console.log(`Мобільний пристрій: ${isMobile}`);
  console.log('Натисніть H для довідки по управлінню');
});

// Обробка закриття повноекранного режиму
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
if (fullscreenOverlay) {
  fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === fullscreenOverlay) {
      closeFullscreen();
    }
  });

  // Мобільна версія закриття
  fullscreenOverlay.addEventListener('touchend', (e) => {
    if (e.target === fullscreenOverlay && !isDragging) {
      closeFullscreen();
    }
  }, { passive: true });
}

// Запобігання закриттю при кліку на контент
const fullscreenContent = document.querySelector('.fullscreen-content');
if (fullscreenContent) {
  fullscreenContent.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  fullscreenContent.addEventListener('touchend', (e) => {
    e.stopPropagation();
  });
}

// Оптимізація для мобільних: запобігання зуму при подвійному тапі
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
  e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
  e.preventDefault();
});

// Експорт функцій для глобального доступу
window.galleryAPI = {
  nextSlide,
  prevSlide,
  changeSlide,
  toggleAutoPlay,
  startAutoPlay,
  stopAutoPlay,
  openFullscreen,
  closeFullscreen,
  shuffleSlides,
  resetGallery,
  showHelp,
  getCurrentIndex: () => currentIndex,
  getSlidesCount: () => slides.length,
  isAutoPlaying: () => isAutoPlaying,
  isFullscreenMode: () => isFullscreen,
  isMobileDevice: () => isMobile
};
