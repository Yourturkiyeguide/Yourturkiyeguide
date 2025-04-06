document.addEventListener("DOMContentLoaded", function() {
  // Отримуємо поточний шлях сторінки
  const currentLocation = window.location.pathname;
  const filename = currentLocation.substring(currentLocation.lastIndexOf('/') + 1);

  // Встановлюємо клас active для посилань в основному меню
  const menuLinks = document.querySelectorAll('.menu nav ul li a');
  menuLinks.forEach(link => {
    if (link.getAttribute('href') === filename) {
      link.classList.add('active');
    }
  });

  // Встановлюємо клас active для посилань в мобільному меню
  const mobileLinks = document.querySelectorAll('.mobile-menu a');
  mobileLinks.forEach(link => {
    if (link.getAttribute('href') === filename) {
      link.classList.add('active');
    }
  });
});
