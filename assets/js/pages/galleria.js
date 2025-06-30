// ============================================
// 🖼️ ОПТИМІЗОВАНА ВЕРТИКАЛЬНА ГАЛЕРЕЯ (galleria.js)
// ============================================

// 📱 Глобальні конфігурації та налаштування
const GALLERY_CONFIG = {
// Основні налаштування
  autoLoad: true,
  lazyLoadOffset: 2, // Скільки зображень завантажувати наперед

// Налаштування debounce/throttle
  debounce: {
    navigation: 250,
    swipe: 300,
    keyboard: 150,
    resize: 500,
    scroll: 100
  },

// Налаштування свайпів (синхронізовано з picture.js)
  swipe: {
    desktop: {
      minDistance: 50,
      minVelocity: 0.3,
      maxTime: 1000
    },
    mobile: {
      minDistance: 25,
      minVelocity: 0.2,
      maxTime: 800
    }
  },

// Налаштування UI
  ui: {
    animationDuration: 300,
    scrollBehavior: 'smooth',
    thumbnailScrollOffset: 'center'
  }
};

// Детекція мобільного пристрою (синхронізовано з picture.js)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ============================================
// 🛠️ УТИЛІТИ ТА ДОПОМІЖНІ ФУНКЦІЇ
// ============================================

/**
 * Універсальна debounce функція з конфігурацією
 */
function createDebounce(func, delay, immediate = false) {
  let timeout;
  let result;

  const debounced = function(...args) {
    const callNow = immediate && !timeout;

    const later = () => {
      timeout = null;
      if (!immediate) result = func.apply(this, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, delay);

    if (callNow) result = func.apply(this, args);
    return result;
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
    timeout = null;
  };

  return debounced;
}

/**
 * Throttle функція для часто викликаємих подій
 */
function createThrottle(func, limit) {
  let lastFunc;
  let lastRan;

  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Оптимізована функція обробки свайпу (уніфікована з picture.js)
 */
function createSwipeHandler(config) {
  return function handleSwipe(startX, startY, endX, endY, startTime, endTime) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;

// Обчислюємо дистанцію та швидкість
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

// Валідація свайпу
    if (distance < config.minDistance ||
      deltaTime > config.maxTime ||
      velocity < config.minVelocity) {
      return null;
    }

// Визначення напрямку
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
    const isVertical = Math.abs(deltaY) > Math.abs(deltaX) * 1.2;

    if (isHorizontal) {
      return deltaX > 0 ? 'right' : 'left';
    } else if (isVertical) {
      return deltaY > 0 ? 'down' : 'up';
    }

    return null;
  };
}

/**
 * Система запобігання подвійних дій (уніфікована з picture.js)
 */
function createActionLock(delay = 300) {
  let isLocked = false;
  let lockTimeout;

  return {
    execute(callback, ...args) {
      if (isLocked) return false;

      isLocked = true;
      const result = callback.apply(this, args);

      clearTimeout(lockTimeout);
      lockTimeout = setTimeout(() => {
        isLocked = false;
      }, delay);

      return result;
    },

    isLocked() {
      return isLocked;
    },

    unlock() {
      isLocked = false;
      clearTimeout(lockTimeout);
    }
  };
}

/**
 * Система lazy loading зображень
 */
class LazyImageLoader {
  constructor() {
    this.loadedImages = new Set();
    this.loadingImages = new Set();
    this.observers = new Map();
  }

  createImageElement(src, alt = '', onLoad = null, onError = null) {
    const img = document.createElement('img');
    img.draggable = false;
    img.alt = alt;

// Захист від контекстного меню
    img.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });

// Встановлюємо обробники
    if (onLoad) img.addEventListener('load', onLoad, { once: true, passive: true });
    if (onError) img.addEventListener('error', onError, { once: true, passive: true });

// Lazy loading логіка
    if (this.loadedImages.has(src)) {
      img.src = src;
    } else {
      this.scheduleLoad(img, src);
    }

    return img;
  }

  scheduleLoad(img, src) {
    if (this.loadingImages.has(src)) return;

    this.loadingImages.add(src);

// Використовуємо setTimeout для неблокуючого завантаження
    setTimeout(() => {
      img.src = src;
      this.loadedImages.add(src);
      this.loadingImages.delete(src);
    }, 0);
  }

  preloadImages(urls, maxConcurrent = 3) {
    const toLoad = urls.filter(url => !this.loadedImages.has(url) && !this.loadingImages.has(url));

    for (let i = 0; i < Math.min(toLoad.length, maxConcurrent); i++) {
      const url = toLoad[i];
      this.loadingImages.add(url);

      const img = new Image();
      img.onload = () => {
        this.loadedImages.add(url);
        this.loadingImages.delete(url);
      };
      img.onerror = () => {
        this.loadingImages.delete(url);
      };
      img.src = url;
    }
  }

  clear() {
    this.loadedImages.clear();
    this.loadingImages.clear();
    this.observers.clear();
  }
}

// ============================================
// 🖼️ ОСНОВНИЙ КЛАС ГАЛЕРЕЇ
// ============================================

class OptimizedGallery {
  constructor(slides) {
// Основний стан
    this.slides = slides || this.getDefaultSlides();
    this.currentIndex = 0;
    this.isFullscreen = false;
    this.userHasInteracted = false;
    this.isInitialized = false;

// DOM елементи (кешуємо)
    this.elements = {};

// Конфігурація свайпів
    this.swipeConfig = isMobile ?
      GALLERY_CONFIG.swipe.mobile :
      GALLERY_CONFIG.swipe.desktop;

// Системи оптимізації
    this.swipeHandler = createSwipeHandler(this.swipeConfig);
    this.actionLock = createActionLock(GALLERY_CONFIG.debounce.navigation);
    this.imageLoader = new LazyImageLoader();

// Дані для свайпів
    this.swipeData = {
      startX: 0,
      startY: 0,
      startTime: 0,
      isSwiping: false,
      isDragging: false,
      lastActionTime: 0
    };

// Створюємо debounced методи
    this.createDebouncedMethods();

// Зв'язуємо контекст методів
    this.bindMethods();
  }

  /**
   * Отримання демонстраційних слайдів
   */
  getDefaultSlides() {
    return [
      { image: '../../assets/img/hello/1.jpg', title: 'Зображення 1' },
      { image: '../../assets/img/hello/2.webp', title: 'Зображення 2' },
      { image: '../../assets/img/hello/3.jpg', title: 'Зображення 3' },
      { image: '../../assets/img/hello/4.jpg', title: 'Фото 4' },
      { image: '../../assets/img/hello/5.jpg', title: 'Фото 5' },
      { image: '../../assets/img/hello/6.jpg', title: 'Фото 6' },
      { image: '../../assets/img/hello/7.jpg', title: 'Фото 7' },
      { image: '../../assets/img/hello/8.jpg', title: 'Фото 8' },
      { image: '../../assets/img/hello/9.jpg', title: 'Фото 9' }
    ];
  }

  /**
   * Створення debounced методів
   */
  createDebouncedMethods() {
    this.debouncedNext = createDebounce(
      this.nextSlide.bind(this),
      GALLERY_CONFIG.debounce.navigation
    );

    this.debouncedPrev = createDebounce(
      this.prevSlide.bind(this),
      GALLERY_CONFIG.debounce.navigation
    );

    this.debouncedGoTo = createDebounce(
      this.goToSlide.bind(this),
      GALLERY_CONFIG.debounce.navigation
    );

    this.throttledUpdate = createThrottle(
      this.updateDisplay.bind(this),
      50
    );

    this.debouncedResize = createDebounce(
      this.handleResize.bind(this),
      GALLERY_CONFIG.debounce.resize
    );
  }

  /**
   * Зв'язування контексту методів
   */
  bindMethods() {
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOrientationChange = this.handleOrientationChange.bind(this);
  }

  /**
   * Ініціалізація галереї
   */
  init() {
    if (this.isInitialized) {
      console.warn('⚠️ Галерея вже ініціалізована');
      return false;
    }

// Кешуємо DOM елементи
    if (!this.cacheElements()) {
      console.error('❌ Не вдалося знайти елементи галереї');
      return false;
    }

// Створюємо структуру
    this.createThumbnails();
    this.attachEventListeners();

// Початкове оновлення
    this.updateDisplay();
    this.preloadAdjacentImages();

// Додаємо обробник взаємодії користувача
    this.setupUserInteractionDetection();

    this.isInitialized = true;

    console.log('🖼️ Галерея ініціалізована');
    console.log(`📱 Пристрій: ${isMobile ? 'Мобільний' : 'Десктоп'}`);
    console.log(`📏 Чутливість свайпу: ${this.swipeConfig.minDistance}px`);
    console.log(`🖼️ Всього слайдів: ${this.slides.length}`);

    return true;
  }

  /**
   * Кешування DOM елементів
   */
  cacheElements() {
    const elements = {
      verticalDisplay: document.querySelector('.vertical-display'),
      thumbnailsContainer: document.querySelector('.photo-thumbnails'),
      mainDisplay: document.querySelector('.main-photo-display'),
      fullscreenOverlay: document.querySelector('.photo-fullscreen-overlay'),
      fullscreenMain: document.querySelector('.photo-fullscreen-main'),
      fullscreenCounter: document.querySelector('.photo-fullscreen-counter'),
      counter: document.querySelector('.photo-counter'),
      progressBar: document.querySelector('.photo-progress'),
      errorElement: document.querySelector('.photo-error'),
      closeButton: document.querySelector('.photo-close-button'),
      prevButton: document.querySelector('.photo-nav-prev'),
      nextButton: document.querySelector('.photo-nav-next')
    };

// Перевіряємо обов'язкові елементи
    if (!elements.verticalDisplay || !elements.mainDisplay) {
      return false;
    }

    this.elements = elements;
    return true;
  }

  /**
   * Створення мініатюр
   */
  createThumbnails() {
    const { thumbnailsContainer } = this.elements;
    if (!thumbnailsContainer) return;

// Очищуємо контейнер
    thumbnailsContainer.innerHTML = '';

    this.slides.forEach((slide, index) => {
      const thumbnail = this.createThumbnailElement(slide, index);
      thumbnailsContainer.appendChild(thumbnail);
    });
  }

  /**
   * Створення елемента мініатюри
   */
  createThumbnailElement(slide, index) {
    const thumbnail = document.createElement('div');
    thumbnail.className = `photo-thumbnail ${index === 0 ? 'active' : ''}`;
    thumbnail.setAttribute('data-index', index);

// Створюємо захищену функцію зміни слайду
    const safeChangeSlide = (idx, elem) => {
      if (!this.swipeData.isDragging && !this.swipeData.isSwiping) {
        this.actionLock.execute(() => this.debouncedGoTo(idx, elem));
      }
    };

// Унікальні обробники для мобільних та десктопних
    if (isMobile) {
      this.attachMobileThumbnailEvents(thumbnail, index, safeChangeSlide);
    } else {
      this.attachDesktopThumbnailEvents(thumbnail, index, safeChangeSlide);
    }

// Додаємо placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'photo-thumbnail-placeholder';
    placeholder.innerHTML = '<span>📷</span><span>Завантаження...</span>';
    thumbnail.appendChild(placeholder);

// Створюємо зображення з lazy loading
    const img = this.imageLoader.createImageElement(
      slide.image,
      slide.title || `Зображення ${index + 1}`,
      () => {
        const placeholderEl = thumbnail.querySelector('.photo-thumbnail-placeholder');
        if (placeholderEl) placeholderEl.remove();
      },
      () => {
        placeholder.innerHTML = '<span>❌</span><span>Помилка</span>';
      }
    );

    thumbnail.appendChild(img);
    return thumbnail;
  }

  /**
   * Мобільні обробники для мініатюр
   */
  attachMobileThumbnailEvents(thumbnail, index, callback) {
    let touchStartTime = 0;
    let hasMoved = false;

    thumbnail.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      touchStartTime = Date.now();
      hasMoved = false;
    }, { passive: true });

    thumbnail.addEventListener('touchmove', () => {
      hasMoved = true;
    }, { passive: true });

    thumbnail.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const touchDuration = Date.now() - touchStartTime;
      if (!hasMoved && touchDuration < 500) {
        callback(index, thumbnail);
      }
    });
  }

  /**
   * Десктопні обробники для мініатюр
   */
  attachDesktopThumbnailEvents(thumbnail, index, callback) {
    thumbnail.addEventListener('click', (e) => {
      e.stopPropagation();
      callback(index, thumbnail);
    });
  }

  /**
   * Додавання обробників подій
   */
  attachEventListeners() {
    const { verticalDisplay, fullscreenOverlay, closeButton, prevButton, nextButton } = this.elements;

// Touch події для свайпів
    if (verticalDisplay) {
      verticalDisplay.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      verticalDisplay.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      verticalDisplay.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }

    if (fullscreenOverlay) {
      fullscreenOverlay.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      fullscreenOverlay.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      fullscreenOverlay.addEventListener('touchend', this.handleTouchEnd, { passive: true });

// Закриття по кліку на overlay
      fullscreenOverlay.addEventListener('click', (e) => {
        if (e.target === fullscreenOverlay) {
          this.closeFullscreen();
        }
      });
    }

// Клавіатурна навігація
    document.addEventListener('keydown', this.handleKeyDown, { passive: false });

// Системні події
    document.addEventListener('visibilitychange', this.handleVisibilityChange, { passive: true });

    if (isMobile) {
      window.addEventListener('orientationchange', this.handleOrientationChange, { passive: true });
      window.addEventListener('resize', this.debouncedResize, { passive: true });
    }

// Кнопки управління
    if (closeButton) {
      closeButton.addEventListener('click', () => this.closeFullscreen());
    }

    if (prevButton) {
      prevButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.actionLock.execute(() => this.debouncedPrev());
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.actionLock.execute(() => this.debouncedNext());
      });
    }

// Кліки по головному зображенню
    if (this.elements.mainDisplay) {
      this.elements.mainDisplay.addEventListener('click', () => {
        if (!this.swipeData.isDragging && !this.swipeData.isSwiping) {
          this.actionLock.execute(() => this.openFullscreen());
        }
      });
    }

// Запобігання zoom на подвійний тап
    this.preventDoubleTouch();
  }

  /**
   * Запобігання подвійного тапу
   */
  preventDoubleTouch() {
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  /**
   * Обробка Touch подій для свайпів
   */
  handleTouchStart(e) {
// Ігноруємо свайпи по кнопках та мініатюрах
    if (this.isIgnoredTarget(e.target)) return;

    const touch = e.touches[0];
    this.swipeData = {
      ...this.swipeData,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isSwiping: true,
      isDragging: false
    };
  }

  handleTouchMove(e) {
    if (!this.swipeData.isSwiping) return;
    if (this.isIgnoredTarget(e.target)) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - this.swipeData.startX);
    const deltaY = Math.abs(touch.clientY - this.swipeData.startY);

    if (deltaX > 10 || deltaY > 10) {
      this.swipeData.isDragging = true;
    }

// Блокуємо скрол для активних жестів
    if ((deltaX > deltaY && deltaX > 20) || this.isFullscreen) {
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (!this.swipeData.isSwiping) {
      this.resetSwipeData();
      return;
    }

    if (this.isIgnoredTarget(e.target) || !this.swipeData.isDragging) {
      this.resetSwipeData();
      return;
    }

    const touch = e.changedTouches[0];
    const endTime = Date.now();

// Додаткова перевірка на мінімальний час свайпу
    const swipeDuration = endTime - this.swipeData.startTime;
    if (swipeDuration < 50) {
      this.resetSwipeData();
      return;
    }

    const direction = this.swipeHandler(
      this.swipeData.startX,
      this.swipeData.startY,
      touch.clientX,
      touch.clientY,
      this.swipeData.startTime,
      endTime
    );

    if (direction && this.actionLock.execute(() => this.processSwipe(direction))) {
      this.addSwipeFeedback(direction);
    }

    this.resetSwipeData();
  }

  /**
   * Перевірка на ігноровані цілі для свайпів
   */
  isIgnoredTarget(target) {
    return target.closest('button') ||
      target.closest('.photo-close-button') ||
      target.closest('.photo-fullscreen-nav') ||
      target.closest('.photo-thumbnail');
  }

  /**
   * Скидання даних свайпу
   */
  resetSwipeData() {
    this.swipeData.isSwiping = false;
    this.swipeData.isDragging = false;
  }

  /**
   * Обробка напрямку свайпу
   */
  processSwipe(direction) {
    console.log(`🔄 Swipe detected: ${direction}`);

    switch (direction) {
      case 'left':
        this.debouncedNext();
        return true;
      case 'right':
        this.debouncedPrev();
        return true;
      case 'up':
        if (!this.isFullscreen) {
          this.debouncedNext();
          return true;
        }
        break;
      case 'down':
        if (!this.isFullscreen) {
          this.debouncedPrev();
          return true;
        }
        break;
    }
    return false;
  }

  /**
   * Візуальний фідбек для свайпу
   */
  addSwipeFeedback(direction) {
    const { verticalDisplay } = this.elements;
    if (!verticalDisplay) return;

    verticalDisplay.classList.add(`swipe-${direction}`);
    setTimeout(() => {
      verticalDisplay.classList.remove(`swipe-${direction}`);
    }, GALLERY_CONFIG.ui.animationDuration);
  }

  /**
   * Клавіатурна навігація
   */
  handleKeyDown(e) {
// Ігноруємо, якщо фокус на інпуті
    if (e.target.matches('input, textarea, select')) return;

    const keyActions = this.isFullscreen ?
      this.getFullscreenKeyActions() :
      this.getNormalKeyActions();

    const action = keyActions[e.key] || keyActions[e.code];
    if (action && this.actionLock.execute(action)) {
      e.preventDefault();
    }
  }

  /**
   * Клавіші для звичайного режиму
   */
  getNormalKeyActions() {
    return {
      'ArrowUp': () => this.debouncedPrev(),
      'ArrowDown': () => this.debouncedNext(),
      'Enter': () => this.openFullscreen(),
      'Escape': () => this.resetGallery(),
      'KeyH': () => this.showHelp(),
      'h': () => this.showHelp()
    };
  }

  /**
   * Клавіші для повноекранного режиму
   */
  getFullscreenKeyActions() {
    return {
      'Escape': () => this.closeFullscreen(),
      'ArrowLeft': () => this.debouncedPrev(),
      'ArrowRight': () => this.debouncedNext()
    };
  }

  /**
   * Системні обробники
   */
  handleVisibilityChange() {
    if (document.hidden) {
// Можна додати логіку паузи анімацій
      this.actionLock.unlock();
    }
  }

  handleOrientationChange() {
    if (!isMobile) return;

    setTimeout(() => {
      if (this.isFullscreen) {
        this.updateFullscreenDisplay();
      }
      this.throttledUpdate();
    }, 500);
  }

  handleResize() {
    this.throttledUpdate();
    if (this.isFullscreen) {
      this.updateFullscreenDisplay();
    }
  }

  /**
   * Детекція взаємодії користувача
   */
  setupUserInteractionDetection() {
    const events = ['click', 'keydown', 'touchstart', 'wheel'];

    const detectInteraction = () => {
      this.userHasInteracted = true;
      events.forEach(event => {
        window.removeEventListener(event, detectInteraction);
      });
    };

    events.forEach(event => {
      window.addEventListener(event, detectInteraction, {
        once: true,
        passive: true
      });
    });
  }

// ============================================
// 🖼️ ОСНОВНІ МЕТОДИ НАВІГАЦІЇ
// ============================================

  /**
   * Перехід до наступного слайду
   */
  nextSlide() {
    const nextIndex = (this.currentIndex + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  /**
   * Перехід до попереднього слайду
   */
  prevSlide() {
    const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  /**
   * Перехід до конкретного слайду
   */
  goToSlide(index, thumbnail = null) {
    if (index < 0 || index >= this.slides.length) return false;
    if (index === this.currentIndex) return false;

    const now = Date.now();
    if (now - this.swipeData.lastActionTime < GALLERY_CONFIG.debounce.swipe) {
      return false;
    }

    this.currentIndex = index;
    this.swipeData.lastActionTime = now;

// Пакетне оновлення DOM
    requestAnimationFrame(() => {
      this.updateMainDisplay();
      this.updateThumbnails(thumbnail);
      this.updateCounters();
      this.updateFullscreenDisplay();
      this.preloadAdjacentImages();
      this.scrollToActiveThumbnail();
    });

    return true;
  }

  /**
   * Оновлення основного дисплею
   */
  updateMainDisplay() {
    const { mainDisplay } = this.elements;
    if (!mainDisplay) return;

    const slide = this.slides[this.currentIndex];

// Показуємо placeholder
    mainDisplay.innerHTML = `
<div class="photo-placeholder">
  <span>📷</span>
  <span>Завантаження зображення...</span>
</div>
`;

// Створюємо зображення з lazy loading
    const img = this.imageLoader.createImageElement(
      slide.image,
      slide.title || `Зображення ${this.currentIndex + 1}`,
      () => {
        mainDisplay.innerHTML = '';
        mainDisplay.appendChild(img);

// Додаємо обробник кліку з захистом
        img.addEventListener('click', () => {
          if (!this.swipeData.isDragging && !this.swipeData.isSwiping) {
            this.actionLock.execute(() => this.openFullscreen());
          }
        }, { once: false, passive: true });
      },
      () => {
        mainDisplay.innerHTML = `
<div class="photo-placeholder">
  <span>❌</span>
  <span>Не вдалося завантажити зображення</span>
  <small style="margin-top: 10px; opacity: 0.7;">${slide.image}</small>
</div>
`;
        this.showError(`Не вдалося завантажити зображення: ${slide.title || 'Зображення ' + (this.currentIndex + 1)}`);
      }
    );
  }

  /**
   * Оновлення мініатюр
   */
  updateThumbnails(activeThumbnail = null) {
    const thumbnails = document.querySelectorAll('.photo-thumbnail');

    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === this.currentIndex);
    });

// Якщо передана конкретна мініатюра
    if (activeThumbnail) {
      activeThumbnail.classList.add('active');
    }
  }

  /**
   * Оновлення лічильників та прогресу
   */
  updateCounters() {
    const { counter, progressBar } = this.elements;

    if (counter) {
      counter.textContent = `${this.currentIndex + 1} / ${this.slides.length}`;
    }

    if (progressBar) {
      const progress = ((this.currentIndex + 1) / this.slides.length) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  /**
   * Прокрутка до активної мініатюри
   */
  scrollToActiveThumbnail() {
    if (!isMobile || !this.userHasInteracted) return;

    const activeThumbnail = document.querySelector('.photo-thumbnail.active');
    if (activeThumbnail) {
      setTimeout(() => {
        activeThumbnail.scrollIntoView({
          behavior: GALLERY_CONFIG.ui.scrollBehavior,
          block: 'nearest',
          inline: GALLERY_CONFIG.ui.thumbnailScrollOffset
        });
      }, 100);
    }
  }

  /**
   * Завантаження сусідніх зображень
   */
  preloadAdjacentImages() {
    const toPreload = [];
    const offset = GALLERY_CONFIG.lazyLoadOffset;

    for (let i = 1; i <= offset; i++) {
// Наступні зображення
      const nextIndex = (this.currentIndex + i) % this.slides.length;
      toPreload.push(this.slides[nextIndex].image);

// Попередні зображення
      const prevIndex = (this.currentIndex - i + this.slides.length) % this.slides.length;
      toPreload.push(this.slides[prevIndex].image);
    }

    this.imageLoader.preloadImages(toPreload);
  }

  /**
   * Пакетне оновлення дисплею
   */
  updateDisplay() {
    if (!this.isInitialized) return;

    requestAnimationFrame(() => {
      this.updateMainDisplay();
      this.updateThumbnails();
      this.updateCounters();
      this.updateFullscreenDisplay();
    });
  }

// ============================================
// 🖼️ ПОВНОЕКРАННИЙ РЕЖИМ
// ============================================

  /**
   * Відкриття повноекранного режиму
   */
  openFullscreen() {
    const { fullscreenOverlay } = this.elements;
    if (!fullscreenOverlay || this.isFullscreen) return;

    this.isFullscreen = true;
    document.body.style.overflow = 'hidden';

    if (isMobile) {
      document.documentElement.style.overflow = 'hidden';
// Приховуємо адресну строку
      setTimeout(() => window.scrollTo(0, 1), 100);
    }

    this.updateFullscreenDisplay();
    fullscreenOverlay.classList.add('active');

    console.log('🔍 Повноекранний режим активовано');
  }

  /**
   * Закриття повноекранного режиму
   */
  closeFullscreen() {
    const { fullscreenOverlay } = this.elements;
    if (!fullscreenOverlay || !this.isFullscreen) return;

    this.isFullscreen = false;
    document.body.style.overflow = '';

    if (isMobile) {
      document.documentElement.style.overflow = '';
    }

    fullscreenOverlay.classList.remove('active');

    console.log('❌ Повноекранний режим закрито');
  }

  /**
   * Оновлення повноекранного контенту
   */
  updateFullscreenDisplay() {
    if (!this.isFullscreen) return;

    const { fullscreenMain, fullscreenCounter } = this.elements;
    if (!fullscreenMain) return;

    const slide = this.slides[this.currentIndex];

// Показуємо placeholder
    fullscreenMain.innerHTML = `
<div class="photo-placeholder">
  <span>📷</span>
  <span>Завантаження зображення...</span>
</div>
`;

// Створюємо зображення
    const img = this.imageLoader.createImageElement(
      slide.image,
      slide.title || `Зображення ${this.currentIndex + 1}`,
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

// Оновлюємо лічильник
    if (fullscreenCounter) {
      fullscreenCounter.textContent = `${this.currentIndex + 1} / ${this.slides.length}`;
    }
  }

// ============================================
// 🛠️ ДОПОМІЖНІ МЕТОДИ
// ============================================

  /**
   * Скидання галереї
   */
  resetGallery() {
    this.goToSlide(0);
    if (this.isFullscreen) {
      this.closeFullscreen();
    }
    console.log('🔄 Галерея скинута');
  }

  /**
   * Показ помилки
   */
  showError(message) {
    const { errorElement } = this.elements;
    if (!errorElement) return;

    errorElement.textContent = message;
    errorElement.style.display = 'block';

    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);

    console.error('❌ Помилка галереї:', message);
  }

  /**
   * Показ довідки
   */
  showHelp() {
    const helpText = `
📖 ДОВІДКА ГАЛЕРЕЇ

🎹 Клавіатурні скорочення:
- ↑/↓ - Навігація по слайдах
- ←/→ - Навігація в повноекранному режимі
- Enter - Повноекранний режим
- Escape - Вихід/Скидання
- H - Ця довідка

📱 Мобільне управління:
- Тап по мініатюрі - Перехід до слайду
- Тап по головному зображенню - Повноекранний режим
- Свайп вліво/вправо - Навігація
- Свайп вгору/вниз - Навігація (крім повноекранного режиму)

⚙️ Налаштування:
- Чутливість свайпу: ${this.swipeConfig.minDistance}px
- Тип пристрою: ${isMobile ? 'Мобільний' : 'Десктопний'}
- Всього слайдів: ${this.slides.length}
`;

    alert(helpText);
  }

// ============================================
// 🗑️ ОЧИЩЕННЯ ТА ДЕСТРУКТОР
// ============================================

  /**
   * Повне очищення галереї
   */
  destroy() {
    console.log('🗑️ Початок очищення галереї...');

// Скасовуємо всі debounced функції
    this.debouncedNext?.cancel?.();
    this.debouncedPrev?.cancel?.();
    this.debouncedGoTo?.cancel?.();
    this.debouncedResize?.cancel?.();

// Відновлюємо стилі документа
    if (this.isFullscreen) {
      document.body.style.overflow = '';
      if (isMobile) {
        document.documentElement.style.overflow = '';
      }
    }

// Видаляємо обробники подій
    this.removeEventListeners();

// Очищуємо системи
    this.imageLoader?.clear?.();
    this.actionLock?.unlock?.();

// Скидаємо стан
    this.isInitialized = false;
    this.isFullscreen = false;
    this.elements = {};
    this.slides = [];

    console.log('✅ Очищення завершено');
  }

  /**
   * Видалення всіх обробників подій
   */
  removeEventListeners() {
    const { verticalDisplay, fullscreenOverlay } = this.elements;

// Touch події
    if (verticalDisplay) {
      verticalDisplay.removeEventListener('touchstart', this.handleTouchStart);
      verticalDisplay.removeEventListener('touchmove', this.handleTouchMove);
      verticalDisplay.removeEventListener('touchend', this.handleTouchEnd);
    }

    if (fullscreenOverlay) {
      fullscreenOverlay.removeEventListener('touchstart', this.handleTouchStart);
      fullscreenOverlay.removeEventListener('touchmove', this.handleTouchMove);
      fullscreenOverlay.removeEventListener('touchend', this.handleTouchEnd);
    }

// Системні події
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (isMobile) {
      window.removeEventListener('orientationchange', this.handleOrientationChange);
      window.removeEventListener('resize', this.debouncedResize);
    }
  }

// ============================================
// 🌐 ПУБЛІЧНИЙ API
// ============================================

  /**
   * Отримання поточного індексу
   */
  getCurrentSlide() {
    return this.currentIndex;
  }

  /**
   * Отримання загальної кількості слайдів
   */
  getTotalSlides() {
    return this.slides.length;
  }

  /**
   * Перевірка повноекранного режиму
   */
  isInFullscreen() {
    return this.isFullscreen;
  }

  /**
   * Отримання чутливості свайпу
   */
  getSwipeSensitivity() {
    return this.swipeConfig.minDistance;
  }

  /**
   * Додавання нових слайдів
   */
  addSlides(newSlides) {
    if (!Array.isArray(newSlides)) return false;

    this.slides.push(...newSlides);
    this.createThumbnails();

    console.log(`➕ Додано ${newSlides.length} слайдів`);
    return true;
  }

  /**
   * Видалення слайду
   */
  removeSlide(index) {
    if (index < 0 || index >= this.slides.length) return false;

    this.slides.splice(index, 1);

// Коригуємо поточний індекс
    if (this.currentIndex >= this.slides.length) {
      this.currentIndex = this.slides.length - 1;
    }

    this.createThumbnails();
    this.updateDisplay();

    console.log(`➖ Видалено слайд ${index}`);
    return true;
  }
}

// ============================================
// 🚀 ГЛОБАЛЬНА ІНІЦІАЛІЗАЦІЯ
// ============================================

// Глобальний екземпляр галереї
let galleryInstance = null;

/**
 * Ініціалізація галереї після завантаження DOM
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('🖼️ Початок ініціалізації галереї...');

  try {
// Створюємо екземпляр галереї
    galleryInstance = new OptimizedGallery();

// Ініціалізуємо
    if (galleryInstance.init()) {
      console.log('✅ Галерея успішно ініціалізована');

// Експортуємо API
      window.GalleryAPI = {
// Навігація
        nextSlide: () => galleryInstance.actionLock.execute(() => galleryInstance.debouncedNext()),
        prevSlide: () => galleryInstance.actionLock.execute(() => galleryInstance.debouncedPrev()),
        goToSlide: (index) => galleryInstance.actionLock.execute(() => galleryInstance.goToSlide(index)),

// Повноекранний режим
        openFullscreen: () => galleryInstance.openFullscreen(),
        closeFullscreen: () => galleryInstance.closeFullscreen(),

// Утиліти
        resetGallery: () => galleryInstance.resetGallery(),
        showHelp: () => galleryInstance.showHelp(),

// Інформація
        getCurrentSlide: () => galleryInstance.getCurrentSlide(),
        getTotalSlides: () => galleryInstance.getTotalSlides(),
        isFullscreen: () => galleryInstance.isInFullscreen(),
        isMobile: () => isMobile,
        getSwipeSensitivity: () => galleryInstance.getSwipeSensitivity(),

// Управління контентом
        addSlides: (slides) => galleryInstance.addSlides(slides),
        removeSlide: (index) => galleryInstance.removeSlide(index),

// Системні
        destroy: () => galleryInstance.destroy(),
        getInstance: () => galleryInstance
      };

      console.log('🌐 API галереї доступне через window.GalleryAPI');
      console.log('💡 Натисніть H для довідки');

    } else {
      console.error('❌ Не вдалося ініціалізувати галерею');
    }

  } catch (error) {
    console.error('💥 Критична помилка ініціалізації:', error);
  }
});

// Глобальна обробка помилок
window.addEventListener('error', function(e) {
  console.error('🚨 Глобальна помилка галереї:', e.error);
  if (galleryInstance) {
    galleryInstance.showError('Сталася помилка в галереї. Перевірте консоль для деталей.');
  }
});

// Очищення при виході
window.addEventListener('beforeunload', function() {
  if (galleryInstance) {
    galleryInstance.destroy();
    galleryInstance = null;
  }
});

console.log('🚀 Скрипт галереї завантажено успішно');
console.log('📘 Доступ до API: window.GalleryAPI');
