document.addEventListener("DOMContentLoaded", function() {
  // Отримуємо поточний шлях сторінки
  const currentLocation = window.location.pathname;
  let filename = currentLocation.substring(currentLocation.lastIndexOf('/') + 1);
  const fullPath = currentLocation;

  // Якщо файл не вказано (головна сторінка), встановлюємо значення за замовчуванням
  if (filename === '' || filename === '/') {
    filename = 'index.html';
  }

  // Мапа відповідності підсторінок до батьківських розділів
  const pageMapping = {
    // Підрозділи екскурсій
    'personalised.html': 'excursions.html',
    'group.html': 'excursions.html',
    'copyright.html': 'excursions.html',

    // Підрозділи послуг
    'yachts.html': 'service.html',
    'transfer.html': 'service.html',
    'medical.html': 'service.html',
    'shopping.html': 'service.html'
  };

  // Функція для перевірки активності посилання
  function isActiveLink(linkHref, linkElement) {
    // Очищуємо href від відносних шляхів для порівняння
    let cleanHref = linkHref.replace('../', '').replace('./', '');

    // Перевіряємо точний збіг
    if (cleanHref === filename || linkHref.endsWith('/' + filename)) {
      return true;
    }

    // Перевіряємо для головної сторінки
    if ((filename === 'index.html' || filename === 'index.php') &&
      (linkHref === '/' || linkHref === '' || linkHref === '#' || cleanHref === filename)) {
      return true;
    }

    // Перевіряємо якщо посилання вказує на кореневу директорію, а ми на головній
    if (linkHref === '/' && (filename === 'index.html' || filename === 'index.php' || filename === '')) {
      return true;
    }

    // Перевіряємо чи поточна сторінка є підсторінкою цього розділу
    const parentPage = pageMapping[filename];
    if (parentPage && cleanHref === parentPage) {
      return true;
    }

    // Додаткова перевірка за шляхом директорії
    if (fullPath.includes('/excursions/') && cleanHref === 'excursions.html') {
      return true;
    }

    if (fullPath.includes('/service/') && cleanHref === 'service.html') {
      return true;
    }

    return false;
  }

  // Функція для додавання класу active
  function setActiveClass(links) {
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (isActiveLink(href, link)) {
        link.classList.add('active');

        // Додаємо клас active для батьківського li елемента
        const parentLi = link.closest('li');
        if (parentLi) {
          parentLi.classList.add('active-parent');
        }
      }
    });
  }

  // Функція для обробки мобільного меню
  function processMobileMenu() {
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (mobileLinks.length > 0) {
      mobileLinks.forEach((link) => {
        const href = link.getAttribute('href');

        // Стандартна перевірка для точного збігу
        if (isActiveLink(href, link)) {
          link.classList.add('active');
          return;
        }

        // Спеціальна логіка для мобільного меню
        // Перевіряємо чи це посилання на excursions і чи ми в папці excursions
        if (href.includes('excursions')) {
          if (fullPath.includes('/excursions/') ||
            filename === 'personalised.html' ||
            filename === 'group.html' ||
            filename === 'copyright.html') {
            link.classList.add('active');
          }
        }

        // Перевіряємо чи це посилання на service і чи ми в папці service
        if (href.includes('service')) {
          if (fullPath.includes('/service/') ||
            filename === 'yachts.html' ||
            filename === 'transfer.html' ||
            filename === 'medical.html' ||
            filename === 'shopping.html') {
            link.classList.add('active');
          }
        }
      });
    }
  }

  // Встановлюємо клас active для посилань в основному меню
  const menuLinks = document.querySelectorAll('nav ul li a');
  setActiveClass(menuLinks);

  // Обробляємо мобільне меню одразу (якщо воно вже завантажене)
  processMobileMenu();

  // Створюємо MutationObserver для відстеження появи мобільного меню
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            // Перевіряємо чи додався елемент з мобільним меню
            if (node.classList && node.classList.contains('mobile-menu')) {
              processMobileMenu();
            }
            // Або перевіряємо чи всередині доданого елемента є мобільне меню
            else if (node.querySelector && node.querySelector('.mobile-menu')) {
              processMobileMenu();
            }
          }
        });
      }
    });
  });

  // Спостерігаємо за змінами в DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Додаткова обробка для випадаючих меню
  const subMenuLinks = document.querySelectorAll('.sub-menu a');
  subMenuLinks.forEach(link => {
    const href = link.getAttribute('href');
    let cleanHref = href.replace('../', '').replace('./', '');

    if (cleanHref === filename || href.endsWith('/' + filename)) {
      link.classList.add('active');

      // Знаходимо батьківський елемент меню і також позначаємо його як активний
      const parentMenu = link.closest('li').parentElement.closest('li');
      if (parentMenu) {
        const parentLink = parentMenu.querySelector('a');
        if (parentLink) {
          parentLink.classList.add('active');
          parentMenu.classList.add('active-parent');
        }
      }
    }
  });

  // Резервна перевірка через таймер
  setTimeout(() => {
    processMobileMenu();
  }, 1000);
});
