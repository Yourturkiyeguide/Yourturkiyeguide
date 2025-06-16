class ExcursionFilter {
  constructor() {
    this.initElements();
    this.bindEvents();
    this.filterState = {
      category: '',
      duration: '',
      priceFrom: '',
      priceTo: '',
      search: ''
    };
    this.allCards = document.querySelectorAll('.clickable-link');
    console.log('ExcursionFilter initialized with', this.allCards.length, 'cards');
  }

  initElements() {
    this.searchInput = document.getElementById('searchInput');
    this.filterToggle = document.getElementById('filterToggle');
    this.filterPanel = document.getElementById('filterPanel');
    this.chevron = document.getElementById('chevron');
    this.searchBtn = document.getElementById('searchBtn');
    this.categorySelect = document.getElementById('categorySelect');
    this.durationSelect = document.getElementById('durationSelect');
    this.priceFromInput = document.getElementById('priceFromInput');
    this.priceToInput = document.getElementById('priceToInput');
    this.clearFilters = document.getElementById('clearFilters');
    this.applyFilters = document.getElementById('applyFilters');
    this.activeFilters = document.getElementById('activeFilters');
    this.filterTags = document.getElementById('filterTags');
    this.cardContainer = document.getElementById('cardContainer');
    this.noResults = document.getElementById('noResults');
  }

  bindEvents() {
    // Основні кнопки
    this.filterToggle.addEventListener('click', () => this.toggleFilters());
    this.searchBtn.addEventListener('click', () => this.performFilter());
    this.clearFilters.addEventListener('click', () => this.clearAllFilters());
    this.applyFilters.addEventListener('click', () => this.applyFilterChanges());

    // Зміна фільтрів
    this.categorySelect.addEventListener('change', () => this.updateFilters());
    this.durationSelect.addEventListener('change', () => this.updateFilters());
    this.priceFromInput.addEventListener('input', () => this.updateFilters());
    this.priceToInput.addEventListener('input', () => this.updateFilters());

    // Пошук у реальному часі
    this.searchInput.addEventListener('input', () => {
      this.filterState.search = this.searchInput.value;
      this.performFilter();
    });

    // Enter для пошуку
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performFilter();
      }
    });

    // Валідація полів ціни
    this.priceFromInput.addEventListener('input', (e) => {
      this.validatePriceInput(e.target);
    });

    this.priceToInput.addEventListener('input', (e) => {
      this.validatePriceInput(e.target);
    });

    // Перевірка логіки цін (від < до)
    this.priceFromInput.addEventListener('blur', () => this.validatePriceRange());
    this.priceToInput.addEventListener('blur', () => this.validatePriceRange());
  }

  validatePriceInput(input) {
    // Видаляємо всі нецифрові символи
    let value = input.value.replace(/[^0-9]/g, '');

    // Обмежуємо максимальну довжину
    if (value.length > 6) {
      value = value.substring(0, 6);
    }

    input.value = value;
  }

  validatePriceRange() {
    const fromValue = parseInt(this.priceFromInput.value) || 0;
    const toValue = parseInt(this.priceToInput.value) || 0;

    // Якщо обидва поля заповнені і "від" більше "до"
    if (this.priceFromInput.value && this.priceToInput.value && fromValue > toValue) {
      // Показуємо попередження
      this.showPriceWarning();

      // Автоматично міняємо місцями
      setTimeout(() => {
        this.priceFromInput.value = toValue;
        this.priceToInput.value = fromValue;
        this.updateFilters();
        this.hidePriceWarning();
      }, 1500);
    }
  }

  showPriceWarning() {
    // Додаємо червону рамку
    this.priceFromInput.style.borderColor = '#ef4444';
    this.priceToInput.style.borderColor = '#ef4444';

    // Показуємо повідомлення
    if (!document.querySelector('.price-warning')) {
      const warning = document.createElement('div');
      warning.className = 'price-warning';
      warning.style.cssText = `
        color: #ef4444;
        font-size: 12px;
        margin-top: 5px;
        font-weight: 500;
      `;
      warning.textContent = 'Мінімальна ціна не може бути більшою за максимальну';
      this.priceFromInput.parentNode.appendChild(warning);
    }
  }

  hidePriceWarning() {
    this.priceFromInput.style.borderColor = '';
    this.priceToInput.style.borderColor = '';
    const warning = document.querySelector('.price-warning');
    if (warning) {
      warning.remove();
    }
  }

  toggleFilters() {
    this.filterPanel.classList.toggle('active');
    this.chevron.classList.toggle('rotated');
  }

  updateFilters() {
    this.filterState = {
      category: this.categorySelect.value,
      duration: this.durationSelect.value,
      priceFrom: this.priceFromInput.value,
      priceTo: this.priceToInput.value,
      search: this.searchInput.value
    };
    this.updateActiveFiltersDisplay();
  }

  updateActiveFiltersDisplay() {
    this.filterTags.innerHTML = '';
    const hasActiveFilters = this.filterState.category ||
      this.filterState.duration ||
      this.filterState.priceFrom ||
      this.filterState.priceTo;

    if (hasActiveFilters) {
      this.activeFilters.style.display = 'flex';

      if (this.filterState.category) {
        const categoryText = this.categorySelect.options[this.categorySelect.selectedIndex].text;
        this.addFilterTag(categoryText, 'category');
      }

      if (this.filterState.duration) {
        const durationText = this.durationSelect.options[this.durationSelect.selectedIndex].text;
        this.addFilterTag(durationText, 'duration');
      }

      if (this.filterState.priceFrom || this.filterState.priceTo) {
        let priceText = 'Ціна: ';
        if (this.filterState.priceFrom && this.filterState.priceTo) {
          priceText += `$${this.filterState.priceFrom} - $${this.filterState.priceTo}`;
        } else if (this.filterState.priceFrom) {
          priceText += `від $${this.filterState.priceFrom}`;
        } else if (this.filterState.priceTo) {
          priceText += `до $${this.filterState.priceTo}`;
        }
        this.addFilterTag(priceText, 'price');
      }
    } else {
      this.activeFilters.style.display = 'none';
    }
  }

  addFilterTag(text, type) {
    const tag = document.createElement('span');
    tag.className = `filter-tag ${type}`;

    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-tag';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Удалить фильтр';
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeFilter(type);
    });

    tag.appendChild(textSpan);
    tag.appendChild(removeBtn);
    this.filterTags.appendChild(tag);
  }

  removeFilter(type) {
    switch(type) {
      case 'category':
        this.categorySelect.value = '';
        break;
      case 'duration':
        this.durationSelect.value = '';
        break;
      case 'price':
        this.priceFromInput.value = '';
        this.priceToInput.value = '';
        this.hidePriceWarning();
        break;
    }

    this.updateFilters();
    this.performFilter();
  }

  clearAllFilters() {
    this.categorySelect.value = '';
    this.durationSelect.value = '';
    this.priceFromInput.value = '';
    this.priceToInput.value = '';
    this.searchInput.value = '';
    this.hidePriceWarning();
    this.updateFilters();
    this.performFilter();
  }

  applyFilterChanges() {
    this.toggleFilters();
    this.performFilter();
  }

  performFilter() {
    let visibleCount = 0;

    console.log('Performing filter with state:', this.filterState);

    this.allCards.forEach((cardLink) => {
      const card = cardLink.querySelector('.card');

      if (!card) {
        console.warn('Card not found in link:', cardLink);
        return;
      }

      const cardData = {
        title: (card.dataset.title || '').toLowerCase(),
        description: (card.dataset.description || '').toLowerCase(),
        duration: parseInt(card.dataset.duration) || 0,
        price: parseInt(card.dataset.price) || 0,
        category: card.dataset.category || ''
      };

      let isVisible = true;

      // Текстовий пошук
      if (this.filterState.search) {
        const searchTerm = this.filterState.search.toLowerCase();
        if (!cardData.title.includes(searchTerm) && !cardData.description.includes(searchTerm)) {
          isVisible = false;
        }
      }

      // Фільтр за категорією
      if (this.filterState.category && cardData.category !== this.filterState.category) {
        isVisible = false;
      }

      // Фільтр за тривалістю
      if (this.filterState.duration) {
        const durationFilter = this.filterState.duration;
        if (durationFilter === '6+' && cardData.duration <= 6) {
          isVisible = false;
        } else if (durationFilter !== '6+' && cardData.duration > parseInt(durationFilter)) {
          isVisible = false;
        }
      }

      // Фільтр за ціною
      if (this.filterState.priceFrom || this.filterState.priceTo) {
        const priceFrom = this.filterState.priceFrom ? parseInt(this.filterState.priceFrom) : 0;
        const priceTo = this.filterState.priceTo ? parseInt(this.filterState.priceTo) : Infinity;

        if (cardData.price < priceFrom || cardData.price > priceTo) {
          isVisible = false;
        }
      }

      // Показуємо/приховуємо картку
      if (isVisible) {
        cardLink.classList.remove('hidden');
        cardLink.style.display = '';
        visibleCount++;
      } else {
        cardLink.classList.add('hidden');
        cardLink.style.display = 'none';
      }
    });

    console.log(`Filter result: ${visibleCount} cards visible`);

    // Показуємо повідомлення якщо немає результатів
    this.toggleNoResults(visibleCount === 0);
  }

  toggleNoResults(show) {
    if (show) {
      this.noResults.style.display = 'block';
    } else {
      this.noResults.style.display = 'none';
    }
  }

  // Метод для ручного оновлення списку карток (якщо вони динамічно додаються)
  refreshCards() {
    this.allCards = document.querySelectorAll('.clickable-link');
    console.log('Cards refreshed, found:', this.allCards.length);
  }
}

// Функція для debounce (затримка виконання)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Ініціалізація після завантаження сторінки
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing ExcursionFilter...');

  // Створюємо глобальний екземпляр для можливості доступу ззовні
  window.excursionFilter = new ExcursionFilter();

  console.log('ExcursionFilter ready!');
});

// Додаткові утиліти
const FilterUtils = {
  // Функція для додавання нової картки динамічно
  addCard: function(cardData) {
    if (window.excursionFilter) {
      // Код для додавання картки...
      window.excursionFilter.refreshCards();
    }
  },

  // Функція для програмного встановлення фільтрів
  setFilters: function(filters) {
    if (window.excursionFilter) {
      const filter = window.excursionFilter;

      if (filters.category) filter.categorySelect.value = filters.category;
      if (filters.duration) filter.durationSelect.value = filters.duration;
      if (filters.priceFrom) filter.priceFromInput.value = filters.priceFrom;
      if (filters.priceTo) filter.priceToInput.value = filters.priceTo;
      if (filters.search) filter.searchInput.value = filters.search;

      filter.updateFilters();
      filter.performFilter();
    }
  },

  // Функція для отримання поточного стану фільтрів
  getFilterState: function() {
    return window.excursionFilter ? window.excursionFilter.filterState : null;
  }
};
