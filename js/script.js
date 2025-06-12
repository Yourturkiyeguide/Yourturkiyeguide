document.addEventListener("DOMContentLoaded", function() {
  // Отримуємо поточний шлях сторінки
  const currentLocation = window.location.pathname;
  let filename = currentLocation.substring(currentLocation.lastIndexOf('/') + 1);

  // Якщо файл не вказано (головна сторінка), встановлюємо значення за замовчуванням
  if (filename === '' || filename === '/') {
    filename = 'index.html'; // Або інша назва вашої головної сторінки
  }

  // Функція для перевірки активності посилання
  function isActiveLink(linkHref) {
    // Перевіряємо точний збіг
    if (linkHref === filename) {
      return true;
    }

    // Перевіряємо для головної сторінки
    if ((filename === 'index.html' || filename === 'index.php') &&
      (linkHref === '/' || linkHref === '' || linkHref === '#' || linkHref === filename)) {
      return true;
    }

    // Перевіряємо якщо посилання вказує на кореневу директорію, а ми на головній
    if (linkHref === '/' && (filename === 'index.html' || filename === 'index.php' || filename === '')) {
      return true;
    }

    return false;
  }

  // Встановлюємо клас active для посилань в основному меню
  const menuLinks = document.querySelectorAll('.menu nav ul li a');
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (isActiveLink(href)) {
      link.classList.add('active');
    }
  });

  // Встановлюємо клас active для посилань в мобільному меню
  const mobileLinks = document.querySelectorAll('.mobile-menu a');
  mobileLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (isActiveLink(href)) {
      link.classList.add('active');
    }
  });
});
