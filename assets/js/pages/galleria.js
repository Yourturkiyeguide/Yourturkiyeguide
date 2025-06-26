// Демонстраційні зображення
const gallerySlides = [
  {
    image: '/assets/img/hello/1.jpg',
    title: 'Зображення 1'
  },
  {
    image: '/assets/img/hello/2.webp',
    title: 'Зображення 2'
  },
  {
    image: '/assets/img/hello/3.jpg',
    title: 'Зображення 3'
  },
  {
    image: '/assets/img/hello/4.jpg',
    title: 'Фото 4'
  },
  {
    image: '/assets/img/hello/5.jpg',
    title: 'Фото 5'
  },
  {
    image: '/assets/img/hello/6.jpg',
    title: 'Фото 6'
  },
  {
    image: '/assets/img/hello/7.jpg',
    title: 'Фото 7'
  },
  {
    image: '/assets/img/hello/8.jpg',
    title: 'Фото 8'
  },
  {
    image: '/assets/img/hello/9.jpg',
    title: 'Фото 9'
  }
];

let currentIndex = 0;
let isFullscreen = false;

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
  img.draggable = false;

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
  const errorElement = document.querySelector('.photo-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
}

function createThumbnails() {
  const container = document.querySelector('.photo-thumbnails');
  if (!container) return;

  container.innerHTML = '';

  gallerySlides.forEach((slide, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = `photo-thumbnail ${index === 0 ? 'active' : ''}`;
    thumbnail.setAttribute('data-index', index);

    thumbnail.addEventListener('click', () => changeSlide(index, thumbnail));

    if (isMobile) {
      thumbnail.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }

    const img = createImageElement(
        slide.image,
        slide.title || `Зображення ${index + 1}`,
        () => {
          const placeholder = thumbnail.querySelector('.photo-thumbnail-placeholder');
          if (placeholder) {
            placeholder.remove();
          }
        },
        () => {
          const placeholder = document.createElement('div');
          placeholder.className = 'photo-thumbnail-placeholder';
          placeholder.innerHTML = `
         <span>❌</span>
         <span>Помилка</span>
       `;
          thumbnail.innerHTML = '';
          thumbnail.appendChild(placeholder);
        }
    );

    const placeholder = document.createElement('div');
    placeholder.className = 'photo-thumbnail-placeholder';
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
  if (index < 0 || index >= gallerySlides.length) return;

  currentIndex = index;
  const slide = gallerySlides[index];
  const mainDisplay = document.querySelector('.main-photo-display');

  if (!mainDisplay) return;

  mainDisplay.innerHTML = `
   <div class="photo-placeholder">
     <span>📷</span>
     <span>Завантаження зображення...</span>
   </div>
 `;

  const img = createImageElement(
      slide.image,
      slide.title || `Зображення ${index + 1}`,
      () => {
        mainDisplay.innerHTML = '';
        mainDisplay.appendChild(img);

        img.addEventListener('click', openFullscreen);
      },
      () => {
        mainDisplay.innerHTML = `
       <div class="photo-placeholder">
         <span>❌</span>
         <span>Не вдалося завантажити зображення</span>
         <small style="margin-top: 10px; opacity: 0.7;">${slide.image}</small>
       </div>
     `;
        showError(`Не вдалося завантажити зображення: ${slide.title || 'Зображення ' + (index + 1)}`);
      }
  );

  document.querySelectorAll('.photo-thumbnail').forEach(thumb => {
    thumb.classList.remove('active');
  });
  if (element) {
    element.classList.add('active');
  }

  const counter = document.querySelector('.photo-counter');
  const progressBar = document.querySelector('.photo-progress');

  if (counter) {
    counter.textContent = `${index + 1} / ${gallerySlides.length}`;
  }
  if (progressBar) {
    progressBar.style.width = `${((index + 1) / gallerySlides.length) * 100}%`;
  }

  if (isFullscreen) {
    updateFullscreenContent();
  }

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
  const nextIndex = (currentIndex + 1) % gallerySlides.length;
  const nextThumbnail = document.querySelectorAll('.photo-thumbnail')[nextIndex];
  changeSlide(nextIndex, nextThumbnail);
}

function prevSlide() {
  const prevIndex = (currentIndex - 1 + gallerySlides.length) % gallerySlides.length;
  const prevThumbnail = document.querySelectorAll('.photo-thumbnail')[prevIndex];
  changeSlide(prevIndex, prevThumbnail);
}

function openFullscreen() {
  const overlay = document.querySelector('.photo-fullscreen-overlay');
  if (!overlay) return;

  isFullscreen = true;
  document.body.style.overflow = 'hidden';

  if (isMobile) {
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 1);
  }

  updateFullscreenContent();
  overlay.classList.add('active');
}

function closeFullscreen() {
  const overlay = document.querySelector('.photo-fullscreen-overlay');
  if (!overlay) return;

  isFullscreen = false;
  document.body.style.overflow = '';

  if (isMobile) {
    document.documentElement.style.overflow = '';
  }

  overlay.classList.remove('active');
}

function updateFullscreenContent() {
  const slide = gallerySlides[currentIndex];
  const fullscreenMain = document.querySelector('.photo-fullscreen-main');

  if (!fullscreenMain) return;

  fullscreenMain.innerHTML = `
   <div class="photo-placeholder">
     <span>📷</span>
     <span>Завантаження зображення...</span>
   </div>
 `;

  const img = createImageElement(
      slide.image,
      slide.title || `Зображення ${currentIndex + 1}`,
      () => {
        fullscreenMain.innerHTML = '';
        fullscreenMain.appendChild(img);
      },
      () => {
        fullscreenMain.innerHTML = `
       <div class="photo-placeholder">
         <span>❌</span>
         <span>Не вдалося завантажити зображення</span>
       </div>
     `;
      }
  );

  const fullscreenCounter = document.querySelector('.photo-fullscreen-counter');
  if (fullscreenCounter) {
    fullscreenCounter.textContent = `${currentIndex + 1} / ${gallerySlides.length}`;
  }
}

function navigateFullscreen(direction) {
  if (direction === 1) {
    nextSlide();
  } else {
    prevSlide();
  }
}

function resetGallery() {
  const firstThumbnail = document.querySelectorAll('.photo-thumbnail')[0];
  changeSlide(0, firstThumbnail);

  if (isFullscreen) {
    closeFullscreen();
  }
}

// Обробка тач-подій для свайпів
function handleTouchStart(e) {
  if (e.target.closest('button') || e.target.closest('.photo-close-button') || e.target.closest('.photo-fullscreen-nav') || e.target.closest('.photo-thumbnail')) {
    return;
  }

  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isDragging = false;
}

function handleTouchMove(e) {
  if (e.target.closest('button') || e.target.closest('.photo-close-button') || e.target.closest('.photo-fullscreen-nav') || e.target.closest('.photo-thumbnail')) {
    return;
  }

  const touch = e.touches[0];
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;

  const deltaX = Math.abs(touchEndX - touchStartX);
  const deltaY = Math.abs(touchEndY - touchStartY);

  if (deltaX > 10 || deltaY > 10) {
    isDragging = true;
  }

  if ((deltaX > deltaY && deltaX > 20) || isFullscreen) {
    e.preventDefault();
  }
}

function handleTouchEnd(e) {
  if (e.target.closest('button') || e.target.closest('.photo-close-button') || e.target.closest('.photo-fullscreen-nav') || e.target.closest('.photo-thumbnail')) {
    return;
  }

  if (!isDragging) {
    return;
  }

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  } else {
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
- ↑/↓ - Навігація по слайдах
- ←/→ - Навігація в повноекранному режимі
- Enter - Повноекранний режим
- Escape - Вихід/Скидання
- H - Ця довідка

Мобільне управління:
- Тап по мініатюрі - Перехід до слайду
- Тап по головному зображенню - Повноекранний режим
- Свайп вліво/вправо - Навігація
- Свайп вгору/вниз - Навігація (крім повноекранного режиму)
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
      case 'Enter':
        e.preventDefault();
        openFullscreen();
        break;
      case 'Escape':
        e.preventDefault();
        resetGallery();
        break;
      case 'h':
      case 'H':
        e.preventDefault();
        showHelp();
        break;
    }
  }
});

// Автоматичне налаштування чутливості для різних пристроїв
function autoAdjustSensitivity() {
  if (isMobile) {
    minSwipeDistance = 30;
  } else {
    minSwipeDistance = 50;
  }
}

// Додаємо обробники тач-подій до документу
document.addEventListener('touchstart', handleTouchStart, { passive: true });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: true });

// Запобігання zoom на подвійний тап
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
});

// Ініціалізація після завантаження DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('🖼️ Gallery initialization started');

  autoAdjustSensitivity();
  createThumbnails();

  const firstThumbnail = document.querySelectorAll('.photo-thumbnail')[0];
  changeSlide(0, firstThumbnail);

  // Додаємо обробники для кнопок закриття та навігації в повноекранному режимі
  const closeButton = document.querySelector('.photo-close-button');
  if (closeButton) {
    closeButton.addEventListener('click', closeFullscreen);
  }

  const prevButton = document.querySelector('.photo-nav-prev');
  if (prevButton) {
    prevButton.addEventListener('click', prevSlide);
  }

  const nextButton = document.querySelector('.photo-nav-next');
  if (nextButton) {
    nextButton.addEventListener('click', nextSlide);
  }

  // Обробник кліку по overlay для закриття
  const overlay = document.querySelector('.photo-fullscreen-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeFullscreen();
      }
    });
  }

  console.log('✅ Gallery initialized successfully');
  console.log(`📱 Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);
  console.log(`📏 Swipe sensitivity: ${minSwipeDistance}px`);
  console.log(`🖼️ Total gallerySlides: ${gallerySlides.length}`);
  console.log('💡 Press H for help');
});

// Обробка помилок
window.addEventListener('error', function(e) {
  console.error('Gallery error:', e.error);
  showError('Сталася помилка в галереї. Перевірте консоль для деталей.');
});

// Обробка зміни орієнтації на мобільних
window.addEventListener('orientationchange', function() {
  if (isMobile) {
    setTimeout(() => {
      if (isFullscreen) {
        updateFullscreenContent();
      }
    }, 500);
  }
});

// Cleanup функції для видалення обробників подій
function cleanup() {
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', handleTouchEnd);

  console.log('🧹 Gallery cleanup completed');
}

// Експорт функцій для зовнішнього використання
window.GalleryAPI = {
  nextSlide,
  prevSlide,
  changeSlide,
  openFullscreen,
  closeFullscreen,
  resetGallery,
  cleanup,
  getCurrentSlide: () => currentIndex,
  getTotalgallerySlides: () => gallerySlides.length,
  isFullscreen: () => isFullscreen,
  isMobile: () => isMobile,
  getSwipeSensitivity: () => minSwipeDistance
};

console.log('🚀 Gallery script loaded successfully');
console.log('📘 Access gallery functions via window.GalleryAPI');
