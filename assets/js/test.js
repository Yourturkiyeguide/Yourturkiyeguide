// Демонстраційні зображення
const verticalGalleryImages = [
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

let verticalCurrentIndex = 0;
let verticalIsFullscreen = false;

// Мобільні змінні
let verticalIsMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let verticalTouchStartX = 0;
let verticalTouchStartY = 0;
let verticalTouchEndX = 0;
let verticalTouchEndY = 0;
let verticalIsDragging = false;
let verticalMinSwipeDistance = 50;

function createVerticalImageElement(src, alt = '', onLoad = null, onError = null) {
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

function showVerticalError(message) {
  const errorElement = document.getElementById('verticalErrorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }
}

function createVerticalThumbnails() {
  const container = document.getElementById('verticalThumbnailsContainer');
  if (!container) return;

  container.innerHTML = '';

  verticalGalleryImages.forEach((image, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
    thumbnail.setAttribute('data-index', index);

    // Універсальний обробник для всіх пристроїв
    thumbnail.addEventListener('click', () => changeVerticalSlide(index, thumbnail));

    // Додатковий обробник для touch пристроїв
    if (verticalIsMobile) {
      thumbnail.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }

    const img = createVerticalImageElement(
      image.image,
      image.title || `Зображення ${index + 1}`,
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

function changeVerticalSlide(index, element) {
  if (index < 0 || index >= verticalGalleryImages.length) return;

  verticalCurrentIndex = index;
  const image = verticalGalleryImages[index];
  const mainImageContainer = document.getElementById('verticalMainImageContainer');

  if (!mainImageContainer) return;

  // Очищуємо попередній контент
  mainImageContainer.innerHTML = `
    <div class="image-placeholder">
      <span>📷</span>
      <span>Завантаження зображення...</span>
    </div>
  `;

  // Створюємо нове зображення
  const img = createVerticalImageElement(
    image.image,
    image.title || `Зображення ${index + 1}`,
    () => {
      // Зображення завантажилося успішно
      mainImageContainer.innerHTML = '';
      mainImageContainer.appendChild(img);

      // Додаємо обробник для відкриття повноекранного режиму
      img.addEventListener('click', openVerticalFullscreen);
    },
    () => {
      // Помилка завантаження
      mainImageContainer.innerHTML = `
        <div class="image-placeholder error">
          <span>❌</span>
          <span>Не вдалося завантажити зображення</span>
          <small style="margin-top: 10px; opacity: 0.7;">${image.image}</small>
        </div>
      `;
      showVerticalError(`Не вдалося завантажити зображення: ${image.title || 'Зображення ' + (index + 1)}`);
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
  const currentSlideElement = document.getElementById('verticalCurrentSlide');
  const progressBar = document.getElementById('verticalProgressBar');

  if (currentSlideElement) {
    currentSlideElement.textContent = index + 1;
  }
  if (progressBar) {
    progressBar.style.width = `${((index + 1) / verticalGalleryImages.length) * 100}%`;
  }

  // Оновлення повноекранного контенту, якщо відкрито
  if (verticalIsFullscreen) {
    updateVerticalFullscreenContent();
  }

  // Скрол до активної мініатюри
  if (element && verticalIsMobile) {
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }, 100);
  }
}

function nextVerticalSlide() {
  const nextIndex = (verticalCurrentIndex + 1) % verticalGalleryImages.length;
  const nextThumbnail = document.querySelectorAll('.thumbnail')[nextIndex];
  changeVerticalSlide(nextIndex, nextThumbnail);
}

function prevVerticalSlide() {
  const prevIndex = (verticalCurrentIndex - 1 + verticalGalleryImages.length) % verticalGalleryImages.length;
  const prevThumbnail = document.querySelectorAll('.thumbnail')[prevIndex];
  changeVerticalSlide(prevIndex, prevThumbnail);
}

function openVerticalFullscreen() {
  const overlay = document.getElementById('verticalFullscreenOverlay');
  if (!overlay) return;

  verticalIsFullscreen = true;
  document.body.style.overflow = 'hidden';

  // Додаткові стилі для мобільних
  if (verticalIsMobile) {
    document.documentElement.style.overflow = 'hidden';
    // Приховуємо адресну строку на мобільних
    window.scrollTo(0, 1);
  }

  updateVerticalFullscreenContent();
  overlay.classList.add('active');
}

function closeVerticalFullscreen() {
  const overlay = document.getElementById('verticalFullscreenOverlay');
  if (!overlay) return;

  verticalIsFullscreen = false;
  document.body.style.overflow = '';

  if (verticalIsMobile) {
    document.documentElement.style.overflow = '';
  }

  overlay.classList.remove('active');
}

function updateVerticalFullscreenContent() {
  const image = verticalGalleryImages[verticalCurrentIndex];
  const fullscreenMain = document.getElementById('verticalFullscreenMain');

  if (!fullscreenMain) return;

  // Очищуємо попередній контент
  fullscreenMain.innerHTML = `
    <div class="image-placeholder">
      <span>📷</span>
      <span>Завантаження зображення...</span>
    </div>
  `;

  // Створюємо нове зображення
  const img = createVerticalImageElement(
    image.image,
    image.title || `Зображення ${verticalCurrentIndex + 1}`,
    () => {
      // Зображення завантажилося успішно
      fullscreenMain.innerHTML = '';
      fullscreenMain.appendChild(img);
    },
    () => {
      // Помилка завантaження
      fullscreenMain.innerHTML = `
        <div class="image-placeholder error">
          <span>❌</span>
          <span>Не вдалося завантажити зображення</span>
        </div>
      `;
    }
  );

  // Оновлення лічільника
  const fullscreenCurrentSlide = document.getElementById('verticalFullscreenCurrentSlide');
  const fullscreenTotalSlides = document.getElementById('verticalFullscreenTotalSlides');

  if (fullscreenCurrentSlide) {
    fullscreenCurrentSlide.textContent = verticalCurrentIndex + 1;
  }
  if (fullscreenTotalSlides) {
    fullscreenTotalSlides.textContent = verticalGalleryImages.length;
  }
}

function navigateVerticalFullscreen(direction) {
  if (direction === 1) {
    nextVerticalSlide();
  } else {
    prevVerticalSlide();
  }
}

function resetVerticalGallery() {
  const firstThumbnail = document.querySelectorAll('.thumbnail')[0];
  changeVerticalSlide(0, firstThumbnail);

  if (verticalIsFullscreen) {
    closeVerticalFullscreen();
  }
}

// Обробка тач-подій для свайпів
function handleVerticalTouchStart(e) {
  // Перевіряємо чи це не елемент управління
  if (e.target.closest('button') || e.target.closest('.controls') || e.target.closest('.thumbnail')) {
    return;
  }

  const touch = e.touches[0];
  verticalTouchStartX = touch.clientX;
  verticalTouchStartY = touch.clientY;
  verticalIsDragging = false;
}

function handleVerticalTouchMove(e) {
  if (e.target.closest('button') || e.target.closest('.controls') || e.target.closest('.thumbnail')) {
    return;
  }

  const touch = e.touches[0];
  verticalTouchEndX = touch.clientX;
  verticalTouchEndY = touch.clientY;

  const deltaX = Math.abs(verticalTouchEndX - verticalTouchStartX);
  const deltaY = Math.abs(verticalTouchEndY - verticalTouchStartY);

  // Визначаємо, що почався свайп
  if (deltaX > 10 || deltaY > 10) {
    verticalIsDragging = true;
  }

  // Запобігаємо скролу тільки для горизонтальних свайпів або в повноекранному режимі
  if ((deltaX > deltaY && deltaX > 20) || verticalIsFullscreen) {
    e.preventDefault();
  }
}

function handleVerticalTouchEnd(e) {
  if (e.target.closest('button') || e.target.closest('.controls') || e.target.closest('.thumbnail')) {
    return;
  }

  if (!verticalIsDragging) {
    return;
  }

  const deltaX = verticalTouchEndX - verticalTouchStartX;
  const deltaY = verticalTouchEndY - verticalTouchStartY;

  // Визначаємо напрямок свайпу
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Горизонтальний свайп
    if (Math.abs(deltaX) > verticalMinSwipeDistance) {
      if (deltaX > 0) {
        prevVerticalSlide();
      } else {
        nextVerticalSlide();
      }
    }
  } else {
    // Вертикальний свайп (тільки якщо не в повноекранному режимі)
    if (!verticalIsFullscreen && Math.abs(deltaY) > verticalMinSwipeDistance) {
      if (deltaY > 0) {
        prevVerticalSlide();
      } else {
        nextVerticalSlide();
      }
    }
  }

  verticalIsDragging = false;
}

function showVerticalHelp() {
  const helpText = `
Клавіатурні скорочення:
• ↑/↓ - Навігація по слайдах
• ←/→ - Навігація в повноекранному режимі
• Enter - Повноекранний режим
• Escape - Вихід/Скидання
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
  if (verticalIsFullscreen) {
    switch(e.key) {
      case 'Escape':
        closeVerticalFullscreen();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevVerticalSlide();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextVerticalSlide();
        break;
    }
  } else {
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        prevVerticalSlide();
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextVerticalSlide();
        break;
      case 'Enter':
        e.preventDefault();
        openVerticalFullscreen();
        break;
      case 'Escape':
        e.preventDefault();
        resetVerticalGallery();
        break;
      case 'h':
      case 'H':
        e.preventDefault();
        showVerticalHelp();
        break;
    }
  }
});

// Автоматичне налаштування чутливості для різних пристроїв
function autoAdjustVerticalSensitivity() {
  if (verticalIsMobile) {
    // На мобільних пристроях більша чутливість
    verticalMinSwipeDistance = 30;
  } else {
    // На десктопі менша чутливість для тач-падів
    verticalMinSwipeDistance = 50;
  }
}

// Додаємо обробники тач-подій до документу з оптимізованими налаштуваннями
document.addEventListener('touchstart', handleVerticalTouchStart, { passive: true });
document.addEventListener('touchmove', handleVerticalTouchMove, { passive: false });
document.addEventListener('touchend', handleVerticalTouchEnd, { passive: true });

// Запобігання zoom на подвійний тап
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
});

let verticalLastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - verticalLastTouchEnd <= 300) {
    e.preventDefault();
  }
  verticalLastTouchEnd = now;
});

// Ініціалізація після завантаження DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('🖼️ Vertical Gallery initialization started');

  // Автоматичне налаштування чутливості
  autoAdjustVerticalSensitivity();

  // Створення мініатюр
  createVerticalThumbnails();

  // Ініціалізація першого слайду
  const firstThumbnail = document.querySelectorAll('.thumbnail')[0];
  changeVerticalSlide(0, firstThumbnail);

  // Оновлення загальної кількості слайдів
  const totalSlidesElement = document.getElementById('verticalTotalSlides');
  if (totalSlidesElement) {
    totalSlidesElement.textContent = verticalGalleryImages.length;
  }

  console.log('✅ Vertical Gallery initialized successfully');
  console.log(`📱 Device type: ${verticalIsMobile ? 'Mobile' : 'Desktop'}`);
  console.log(`📏 Swipe sensitivity: ${verticalMinSwipeDistance}px`);
  console.log(`🖼️ Total slides: ${verticalGalleryImages.length}`);
  console.log('💡 Press H for help');
});

// Обробка помилок
window.addEventListener('error', function(e) {
  console.error('Vertical Gallery error:', e.error);
  showVerticalError('Сталася помилка в галереї. Перевірте консоль для деталей.');
});

// Обробка зміни орієнтації на мобільних
window.addEventListener('orientationchange', function() {
  if (verticalIsMobile) {
    setTimeout(() => {
      // Повторна ініціалізація після зміни орієнтації
      if (verticalIsFullscreen) {
        updateVerticalFullscreenContent();
      }
    }, 500);
  }
});

// Cleanup функції для видалення обробників подій
function cleanupVerticalGallery() {
  document.removeEventListener('touchstart', handleVerticalTouchStart);
  document.removeEventListener('touchmove', handleVerticalTouchMove);
  document.removeEventListener('touchend', handleVerticalTouchEnd);

  console.log('🧹 Vertical Gallery cleanup completed');
}

// Експорт функцій для зовнішнього використання
window.VerticalGalleryAPI = {
  nextSlide: nextVerticalSlide,
  prevSlide: prevVerticalSlide,
  changeSlide: changeVerticalSlide,
  openFullscreen: openVerticalFullscreen,
  closeFullscreen: closeVerticalFullscreen,
  resetGallery: resetVerticalGallery,
  cleanup: cleanupVerticalGallery,
  getCurrentSlide: () => verticalCurrentIndex,
  getTotalSlides: () => verticalGalleryImages.length,
  isFullscreen: () => verticalIsFullscreen,
  isMobile: () => verticalIsMobile,
  getSwipeSensitivity: () => verticalMinSwipeDistance
};

console.log('🚀 Vertical Gallery script loaded successfully');
console.log('📘 Access gallery functions via window.VerticalGalleryAPI');
