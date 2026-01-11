// Плавна прокрутка до секції бронювання з offset
document.addEventListener('DOMContentLoaded', function() {
  const floatingBtn = document.querySelector('.floating-booking-btn');

  if (floatingBtn) {
    floatingBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));

      if (target) {
        // Отримуємо позицію елемента
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;

        // Offset від верху (120px для header)
        const offset = 100;

        // Прокручуємо до потрібної позиції
        window.scrollTo({
          top: targetPosition - offset,
          behavior: 'smooth'
        });
      }
    });
  }
});

// Приховування кнопки, коли користувач уже в секції бронювання
window.addEventListener('scroll', function() {
  const bookingSection = document.getElementById('booking-section');
  const floatingBtn = document.querySelector('.floating-booking-btn');

  if (bookingSection && floatingBtn) {
    const rect = bookingSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible) {
      floatingBtn.style.opacity = '0';
      floatingBtn.style.pointerEvents = 'none';
    } else {
      floatingBtn.style.opacity = '1';
      floatingBtn.style.pointerEvents = 'auto';
    }
  }
});
