// Функція для визначення шляху до кореня сайту
function getBasePath() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(segment => segment !== '');

  // Видаляємо останній сегмент (ім'я файлу)
  if (segments.length > 0 && segments[segments.length - 1].includes('.html')) {
    segments.pop();
  }

  // Повертаємо потрібну кількість "../"
  return segments.length > 0 ? '../'.repeat(segments.length) : './';
}

// Функція для встановлення правильних шляхів CSS
function setupCSS() {
  const basePath = getBasePath();

  // Видаляємо старі CSS посилання, якщо вони є
  const existingCSS = document.querySelectorAll('link[rel="stylesheet"]');
  existingCSS.forEach(link => {
    if (link.href.includes('main_style.css') || link.href.includes('style.css')) {
      link.remove();
    }
  });

  // Додаємо нові CSS посилання з правильними шляхами
  const head = document.head;

  // Основні стилі
  const mainStyleLink = document.createElement('link');
  mainStyleLink.rel = 'stylesheet';
  mainStyleLink.href = `${basePath}assets/css/pages/main_style.css`;
  head.appendChild(mainStyleLink);

  // Стилі макету
  const layoutStyleLink = document.createElement('link');
  layoutStyleLink.rel = 'stylesheet';
  layoutStyleLink.href = `${basePath}assets/css/layout/style.css`;
  head.appendChild(layoutStyleLink);

  // Встановлюємо правильний шлях для favicon
  let favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href = `${basePath}icon.png`;
  } else {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = `${basePath}icon.png`;
    favicon.type = 'image/png';
    head.appendChild(favicon);
  }
}

// Функція завантаження хедера
function loadHeader() {
  const basePath = getBasePath();

  const headerHTML = `
        <header>
            <div class="container-header">
                <div class="logo">
                    <a href="${basePath}index.html">
                        <img src="${basePath}icon.png" alt="Іконка сайту" width="64" height="64">
                        <span class="logo-text">TravelsTurkey</span>
                    </a>
                </div>
                <div class="menu">
                    <nav>
                        <ul>
                            <li><a href="${basePath}index.html">Главная</a></li>
                            <li><a href="${basePath}about.html">Обо мне</a></li>
                            <li><a href="${basePath}excursions/excursions.html">Экскурсии</a>
                                <ul class="sub-menu">
                                    <li><a href="${basePath}excursions/personalised.html">Индивидуальные экскурсии</a></li>
                                    <li><a href="${basePath}excursions/group.html">Групповые экскурсии</a></li>
                                    <li><a href="${basePath}excursions/copyright.html">Авторские туры</a></li>
                                </ul>
                            </li>
                            <li><a href="${basePath}service/service.html">Другие услуги</a>
                                <ul class="sub-menu">
                                    <li><a href="${basePath}service/yachts.html">Яхты</a></li>
                                    <li><a href="${basePath}service/transfer.html">Трансфер</a></li>
                                    <li><a href="${basePath}service/medical.html">Медицинский туризм</a></li>
                                    <li><a href="${basePath}service/shopping.html">Шопинг</a></li>
                                </ul>
                            </li>
                            <li><a href="${basePath}reviews.html">Отзывы</a></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    `;

  document.getElementById('header-container').innerHTML = headerHTML;
}

// Функція завантаження футера
function loadFooter() {
  const basePath = getBasePath();

  const footerHTML = `
        <footer>
            <div class="footer-contact">
                <p>📞 Телефон:<a href="tel:+905443266871">+90 544 326 6871</a></p>
                <p>📧 Email: <a href="mailto:firatdicle_47@hotmail.com"> firatdicle_47@hotmail.com</a></p>
            </div>
            <div class="footer-social">
                <a href="https://www.facebook.com/share/1BtNQc47ZZ/?mibextid=wwXIfr" target="_blank">
                    <img src="${basePath}assets/img/icon/facebook-icon.png" alt="Facebook" width="24">
                </a>
                <a href="https://www.instagram.com/tourkey.travels/" target="_blank">
                    <img src="${basePath}assets/img/icon/instagram-icon.png" alt="Instagram" width="24">
                </a>
                <a href="https://t.me/+905443266871" target="_blank">
                    <img src="${basePath}assets/img/icon/telegram-icon.png" alt="Telegram" width="24">
                </a>
                <a href="https://wa.me/+905443266871" target="_blank">
                    <img src="${basePath}assets/img/icon/free-icon-whatsapp-4494494.png" alt="WhatsApp" width="24">
                </a>
                <a href="viber://chat?number=+905443266871" target="_blank">
                    <img src="${basePath}assets/img/icon/free-icon-viber-3670059.png" alt="Viber" width="24">
                </a>
            </div>
            <div class="footer-copy">
                <p>&copy; 2025 Türkiye Travellings. Усі права захищені.</p>
            </div>
        </footer>
    `;

  document.getElementById('footer-container').innerHTML = footerHTML;
}

// Функція завантаження мобільного меню
function loadMobileMenu() {
  const basePath = getBasePath();

  const mobileMenuHTML = `
        <nav class="mobile-menu">
            <a href="${basePath}index.html">
                <img src="${basePath}assets/img/icon/home.png" alt="Главная" width="24" height="24">
            </a>
            <a href="${basePath}about.html">
                <img src="${basePath}assets/img/icon/man.png" alt="Обо мне" width="24" height="24">
            </a>
            <a href="${basePath}excursions/excursions.html">
                <img src="${basePath}assets/img/icon/destination.png" alt="Экскурсии" width="24" height="24">
            </a>
            <a href="${basePath}service/service.html">
                <img src="${basePath}assets/img/icon/yatch.png" alt="Яхты" width="24" height="24">
            </a>
            <a href="${basePath}reviews.html">
                <img src="${basePath}assets/img/icon/customer-feedback.png" alt="Отзывы" width="24" height="24">
            </a>
        </nav>
    `;

  document.getElementById('mobile-menu-container').innerHTML = mobileMenuHTML;
}

// Автоматичне завантаження всіх компонентів
document.addEventListener('DOMContentLoaded', function() {
  setupCSS();
  loadHeader();
  loadFooter();
  loadMobileMenu();
});
