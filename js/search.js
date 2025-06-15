// Функциональность фильтра и поиска
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const durationFilter = document.getElementById('durationFilter');
  const minPriceInput = document.getElementById('minPrice');
  const maxPriceInput = document.getElementById('maxPrice');
  const categoryFilter = document.getElementById('categoryFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const resultsInfo = document.getElementById('resultsInfo');
  const resultsCount = document.getElementById('resultsCount');
  const cardContainer = document.getElementById('cardContainer');

  // Данные экскурсий
  const excursions = [
    {
      title: 'Привет, Стамбул!',
      description: 'Главные достопримечательности города на легкой экскурсии',
      duration: 4,
      price: 50,
      category: 'Історична',
      element: null
    },
    {
      title: 'Колоритный Стамбул',
      description: 'Увидеть разные грани прекрасного города',
      duration: 6,
      price: 75,
      category: 'Мистецька',
      element: null
    },
    {
      title: 'Транзитный Стамбул',
      description: 'Не скучать в аэропорту и увидеть самое главное',
      duration: 3,
      price: 40,
      category: 'Експрес',
      element: null
    }
  ];

  // Инициализация ссылок на DOM элементы
  function initializeExcursionElements() {
    const cardLinks = document.querySelectorAll('.clickable-link');
    cardLinks.forEach((link, index) => {
      if (excursions[index]) {
        excursions[index].element = link;
      }
    });
  }

  // Функция фильтрации
  function filterExcursions() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDuration = durationFilter.value;
    const minPrice = parseFloat(minPriceInput.value) || 0;
    const maxPrice = parseFloat(maxPriceInput.value) || Infinity;
    const selectedCategory = categoryFilter.value;

    let visibleCount = 0;

    excursions.forEach(excursion => {
      if (!excursion.element) return;

      const matchesSearch = excursion.title.toLowerCase().includes(searchTerm) ||
        excursion.description.toLowerCase().includes(searchTerm);
      const matchesDuration = !selectedDuration || excursion.duration.toString() === selectedDuration;
      const matchesPrice = excursion.price >= minPrice && excursion.price <= maxPrice;
      const matchesCategory = !selectedCategory || excursion.category === selectedCategory;

      const isVisible = matchesSearch && matchesDuration && matchesPrice && matchesCategory;

      if (isVisible) {
        excursion.element.classList.remove('card-hidden');
        visibleCount++;
      } else {
        excursion.element.classList.add('card-hidden');
      }
    });

    // Обновление информации о результатах
    resultsCount.textContent = visibleCount;
    if (visibleCount === 0) {
      showNoResults();
    } else {
      hideNoResults();
    }
  }

  // Показать сообщение "Нет результатов"
  function showNoResults() {
    let noResultsDiv = document.getElementById('noResults');
    if (!noResultsDiv) {
      noResultsDiv = document.createElement('div');
      noResultsDiv.id = 'noResults';
      noResultsDiv.className = 'no-results';
      noResultsDiv.innerHTML = `
        <h3>Экскурсии не найдены</h3>
        <p>Попробуйте изменить параметры поиска или фильтров</p>
      `;
      cardContainer.appendChild(noResultsDiv);
    }
    noResultsDiv.style.display = 'block';
  }

  // Скрыть сообщение "Нет результатов"
  function hideNoResults() {
    const noResultsDiv = document.getElementById('noResults');
    if (noResultsDiv) {
      noResultsDiv.style.display = 'none';
    }
  }

  // Очистка всех фильтров
  function clearAllFilters() {
    searchInput.value = '';
    durationFilter.value = '';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    categoryFilter.value = '';
    filterExcursions();
  }

  // Обработчики событий
  searchInput.addEventListener('input', filterExcursions);
  durationFilter.addEventListener('change', filterExcursions);
  minPriceInput.addEventListener('input', filterExcursions);
  maxPriceInput.addEventListener('input', filterExcursions);
  categoryFilter.addEventListener('change', filterExcursions);
  clearFiltersBtn.addEventListener('click', clearAllFilters);

  // Инициализация
  initializeExcursionElements();
  filterExcursions();
});

