document.addEventListener("DOMContentLoaded", function() {
  // Отримуємо поточний шлях сторінки
  const currentLocation = window.location.pathname;
  let filename = currentLocation.substring(currentLocation.lastIndexOf('/') + 1);

  // Отримуємо повний шлях для визначення розділу
  const fullPath = currentLocation;

  // Якщо файл не вказано (головна сторінка), встановлюємо значення за замовчуванням
  if (filename === '' || filename === '/') {
    filename = 'index.html';
  }

  // Мапа відповідності підсторінок до батьківських розділів
  const pageMapping = {
    // Підрозділи екскурсій
    'excursions.html': 'excursions.html',
    'Personalised excursions.html': 'excursions.html',
    'personalised.html': 'excursions.html',
    'hello.html': 'personalised.html',
    'colourful.html': 'personalised.html',
    'transit.html': 'personalised.html',
    'sophisticated.html': 'personalised.html',
    'copyright.html': 'excursions.html',
    'group.html': 'excursions.html',

    // Підрозділи послуг
    'yachts.html': 'services.html',
    'Transfer.html': 'services.html',
    'medical.html': 'services.html',
    'shopping.html': 'services.html'
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

    if (fullPath.includes('/servis/') && cleanHref === 'servis.html') {
      return true;
    }

    // Спеціальна перевірка для сторінок в папці excursions
    if (fullPath.includes('/excursions/') && linkHref.includes('excursions')) {
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

        // Додаємо клас active для батьківського li елемента (для випадків з випадаючими меню)
        const parentLi = link.closest('li');
        if (parentLi) {
          parentLi.classList.add('active-parent');
        }
      }
    });
  }

  // Встановлюємо клас active для посилань в основному меню
  const menuLinks = document.querySelectorAll('nav ul li a');
  setActiveClass(menuLinks);

  // Встановлюємо клас active для посилань в мобільному меню (якщо є)
  const mobileLinks = document.querySelectorAll('.mobile-menu a');
  if (mobileLinks.length > 0) {
    setActiveClass(mobileLinks);
  }

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
});
