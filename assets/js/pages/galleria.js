// Демонстраційні зображення (можете замінити на ваші реальні шляхи)
const slides = [
  {
    image: 'assets/img/hello/IMG_2132.jpg',
    title: 'Зображення 1',
    description: 'Красиве зображення природи'
  },
  {
    image: 'assets/img/hello/IMG_3639.jpg',
    title: 'Зображення 2',
    description: 'Архітектурна фотографія'
  },
  {
    image: 'assets/img/hello/IMG_6437.jpg',
    title: 'Зображення 3',
    description: 'Абстрактне мистецтво'
  }
  // Додайте ваші зображення тут, замінивши URL на реальні шляхи:
  // {
  //   image: 'assets/img/hello/IMG_3639.jpg',
  //   title: 'Моє фото 1',
  //   description: 'Опис фото'
  // }
];

let currentIndex = 0;
let isFullscreen = false;
let autoPlayInterval = null;
let isAutoPlaying = false;

function createImageElement(src, alt = '', onLoad = null, onError = null) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;

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
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
}

function createThumbnails() {
  const container = document.getElementById('thumbnailsContainer');
  container.innerHTML = '';

  slides.forEach((slide, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
    thumbnail.onclick = () => changeSlide(index, thumbnail);

    const img = createImageElement(
      slide.image,
      slide.title || `Зображення ${index + 1}`,
      () => {
        // Зображення завантажилося успішно
        thumbnail.querySelector('.thumbnail-placeholder')?.remove();
      },
      () => {
        // Помилка завантаження зображення
        const placeholder = document.createElement('div');
        placeholder.className = 'thumbnail-placeholder';
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
  const mainDisplay = document.getElementById('mainDisplay');
  const mainImageContainer = document.getElementById('mainImageContainer');

  // Очищуємо попередній контент
  mainImageContainer.innerHTML = `
    <span>📷</span>
    <span>Завантаження зображення...</span>
  `;

  // Створюємо нове зображення
  const img = createImageElement(
    slide.image,
    slide.title || `Зображення ${index + 1}`,
    () => {
      // Зображення завантажилося успішно
      mainImageContainer.innerHTML = '';
      mainImageContainer.appendChild(img);
    },
    () => {
      // Помилка завантаження
      mainImageContainer.innerHTML = `
        <span>❌</span>
        <span>Не вдалося завантажити зображення</span>
        <small style="margin-top: 10px; opacity: 0.7;">${slide.image}</small>
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

  // Оновлення лічильника та прогрес-бару
  document.getElementById('currentSlide').textContent = index + 1;
  document.getElementById('progressBar').style.width = `${((index + 1) / slides.length) * 100}%`;

  // Оновлення повноекранного контенту, якщо відкрито
  if (isFullscreen) {
    updateFullscreenContent();
  }

  // Скрол до активної мініатюри на мобільних
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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
    autoPlayInterval = setInterval(() => {
      nextSlide();
    }, 3000);
  }
}

function stopAutoPlay() {
  if (isAutoPlaying) {
    isAutoPlaying = false;
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }
}

function openFullscreen() {
  const overlay = document.getElementById('fullscreenOverlay');
  isFullscreen = true;

  document.body.style.overflow = 'hidden';
  updateFullscreenContent();
  overlay.classList.add('active');
  stopAutoPlay();
}

function closeFullscreen() {
  const overlay = document.getElementById('fullscreenOverlay');
  isFullscreen = false;
  document.body.style.overflow = '';
  overlay.classList.remove('active');
}

function updateFullscreenContent() {
  const slide = slides[currentIndex];
  const fullscreenMain = document.getElementById('fullscreenMain');

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
        <div class="image-placeholder">
          <span>❌</span>
          <span>Не вдалося завантажити зображення</span>
        </div>
      `;
    }
  );

  // Оновлення лічільника
  document.getElementById('fullscreenCurrentSlide').textContent = currentIndex + 1;
  document.getElementById('fullscreenTotalSlides').textContent = slides.length;
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

// Обробка тач-подій для мобільних пристроїв
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
  touchEndX = e.touches[0].clientX;
  touchEndY = e.touches[0].clientY;
}

function handleTouchEnd() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const minSwipeDistance = 50;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  } else {
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  }
}

function showHelp() {
  const helpText = `
Клавіатурні скорочення:
• ↑/↓ - Навігація по слайдах
• Enter - Повноекранний режим
• Escape - Вихід/Скидання
• Space - Автоплей
• R - Випадковий слайд
• H - Ця довідка

Миша/Дотик:
• Клік по мініатюрі - Перехід до слайду
• Клік по головному зображенню - Повноекранний режим
• Свайп вліво/вправо - Навігація
• Свайп вгору/вниз - Навігація
  `;

  alert(helpText);
}

// Клавіатурна навігація
document.addEventListener('keydown', (e) => {
  if (isFullscreen) {
    if (e.key === 'Escape') {
      closeFullscreen();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  } else {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleAutoPlay();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      openFullscreen();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      resetGallery();
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      shuffleSlides();
    } else if (e.key.toLowerCase() === 'h') {
      e.preventDefault();
      showHelp();
    }
  }
});

// Обробники тач-подій
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleTouchEnd);

// Ініціалізація галереї після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
  // Оновлення загальної кількості слайдів
  document.getElementById('totalSlides').textContent = slides.length;
  document.getElementById('fullscreenTotalSlides').textContent = slides.length;

  // Створення мініатюр
  createThumbnails();

  // Завантаження першого слайду
  const firstThumbnail = document.querySelectorAll('.thumbnail')[0];
  changeSlide(0, firstThumbnail);

  console.log('Галерея ініціалізована успішно!');
  console.log(`Завантажено ${slides.length} слайдів`);
  console.log('Натисніть H для довідки по клавіатурним скороченням');
});

// Обробка закриття повноекранного режиму при кліку поза контентом
document.getElementById('fullscreenOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('fullscreenOverlay')) {
    closeFullscreen();
  }
});

// Запобігання закриттю при кліку на контент
document.querySelector('.fullscreen-content').addEventListener('click', (e) => {
  e.stopPropagation();
});

// Експорт функцій для глобального доступу (опціонально)
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
  isFullscreenMode: () => isFullscreen
};
