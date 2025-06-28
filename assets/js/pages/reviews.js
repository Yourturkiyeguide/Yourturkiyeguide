// Import Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASoIqknT0hMi7QTsKS_nBJbDvC9aWbcW0",
  authDomain: "reviews-project-travels-turkey.firebaseapp.com",
  projectId: "reviews-project-travels-turkey",
  storageBucket: "reviews-project-travels-turkey.firebasestorage.app",
  messagingSenderId: "695056378421",
  appId: "1:695056378421:web:863f7533509fdf791bdf7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

class ReviewsSystem {
  constructor() {
    this.reviews = [];
    this.selectedRating = 0;
    this.db = db;
    this.auth = auth;
    this.user = null;
    this.lastSubmissionTime = this.getLastSubmissionTime();
    this.captchaVerified = false;
    this.RATE_LIMIT_MINUTES = 15; // Обмеження: один відгук на 15 хвилин
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.authenticateUser();
    this.createCaptcha();
    await this.loadReviews();
    this.renderReviews();
    this.updateStats();
    this.checkRateLimit();
  }

  // Анонімна авторизація
  async authenticateUser() {
    try {
      // Завжди використовуємо анонімну автентифікацію
      const result = await signInAnonymously(this.auth);
      this.user = result.user;
      console.log('Анонімна автентифікація успішна:', this.user.uid);

      // Слухаємо зміни стану автентифікації
      onAuthStateChanged(this.auth, (user) => {
        if (user && user.isAnonymous) {
          this.user = user;
          console.log('Анонімний користувач підтверджений:', user.uid);
        } else if (!user) {
          // Якщо користувач вийшов, створюємо нового анонімного
          this.signInAnonymously();
        }
      });
    } catch (error) {
      console.error('Помилка автентифікації:', error);
      // Повторна спроба через 2 секунди
      setTimeout(() => this.authenticateUser(), 2000);
    }
  }

  async signInAnonymously() {
    try {
      const result = await signInAnonymously(this.auth);
      this.user = result.user;
      console.log('Нова анонімна автентифікація:', this.user.uid);
    } catch (error) {
      console.error('Помилка анонімної автентифікації:', error);
      // Повторна спроба через 3 секунди
      setTimeout(() => this.signInAnonymously(), 3000);
    }
  }

  // Система обмеження частоти
  getLastSubmissionTime() {
    const saved = localStorage.getItem('lastReviewSubmission');
    return saved ? parseInt(saved) : 0;
  }

  setLastSubmissionTime() {
    const now = Date.now();
    localStorage.setItem('lastReviewSubmission', now.toString());
    this.lastSubmissionTime = now;
  }

  checkRateLimit() {
    const now = Date.now();
    const timeDiff = now - this.lastSubmissionTime;
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < this.RATE_LIMIT_MINUTES) {
      const remainingMinutes = this.RATE_LIMIT_MINUTES - minutesDiff;
      this.disableForm(`Ви зможете залишити наступний відгук через ${remainingMinutes} хвилин`);

      // Встановлюємо таймер для відновлення форми
      setTimeout(() => {
        this.enableForm();
        this.checkRateLimit();
      }, (remainingMinutes * 60 * 1000));
    }
  }

  disableForm(message) {
    const form = document.getElementById('reviewForm');
    const submitBtn = document.querySelector('.reviews-submit-btn');
    const inputs = form.querySelectorAll('input, textarea, button');

    inputs.forEach(input => input.disabled = true);
    submitBtn.textContent = message;
    submitBtn.style.opacity = '0.6';
  }

  enableForm() {
    const form = document.getElementById('reviewForm');
    const submitBtn = document.querySelector('.reviews-submit-btn');
    const inputs = form.querySelectorAll('input, textarea, button');

    inputs.forEach(input => input.disabled = false);
    submitBtn.textContent = 'Опублікувати відгук';
    submitBtn.style.opacity = '1';
    this.createCaptcha(); // Створюємо нову капчу
  }

  // Система CAPTCHA
  createCaptcha() {
    const captchaContainer = this.getCaptchaContainer();
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let result;
    let question;

    switch(operator) {
      case '+':
        result = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        if (num1 < num2) {
          result = num2 - num1;
          question = `${num2} - ${num1}`;
        } else {
          result = num1 - num2;
          question = `${num1} - ${num2}`;
        }
        break;
      case '*':
        const smallNum1 = Math.floor(Math.random() * 5) + 1;
        const smallNum2 = Math.floor(Math.random() * 5) + 1;
        result = smallNum1 * smallNum2;
        question = `${smallNum1} × ${smallNum2}`;
        break;
    }

    this.captchaAnswer = result;
    this.captchaVerified = false;

    captchaContainer.innerHTML = `
      <div class="reviews-captcha">
        <label class="reviews-form-label">Підтвердження: Скільки буде ${question}? *</label>
        <input type="number" id="captchaInput" class="reviews-form-input" required style="width: 100px;">
        <span id="captchaStatus" class="reviews-captcha-status"></span>
        <button type="button" id="refreshCaptcha" class="reviews-captcha-refresh" title="Оновити питання">🔄</button>
      </div>
    `;

    // Додаємо обробники подій для капчі
    document.getElementById('captchaInput').addEventListener('input', (e) => {
      this.verifyCaptcha(parseInt(e.target.value));
    });

    document.getElementById('refreshCaptcha').addEventListener('click', () => {
      this.createCaptcha();
    });
  }

  getCaptchaContainer() {
    let container = document.getElementById('captchaContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'captchaContainer';

      // Вставляємо капчу перед кнопкою відправки
      const submitBtn = document.querySelector('.reviews-submit-btn');
      submitBtn.parentNode.insertBefore(container, submitBtn);
    }
    return container;
  }

  verifyCaptcha(userAnswer) {
    const statusElement = document.getElementById('captchaStatus');

    if (userAnswer === this.captchaAnswer) {
      this.captchaVerified = true;
      statusElement.textContent = '✓';
      statusElement.style.color = 'green';
    } else {
      this.captchaVerified = false;
      statusElement.textContent = userAnswer ? '✗' : '';
      statusElement.style.color = 'red';
    }
  }

  setupEventListeners() {
    // Рейтинг зірочки
    const stars = document.querySelectorAll('.reviews-rating-input .reviews-star');
    stars.forEach(star => {
      star.addEventListener('click', (e) => {
        this.selectedRating = parseInt(e.target.dataset.rating);
        this.updateStarDisplay();
      });

      star.addEventListener('mouseenter', (e) => {
        const rating = parseInt(e.target.dataset.rating);
        this.highlightStars(rating);
      });
    });

    document.getElementById('ratingInput').addEventListener('mouseleave', () => {
      this.updateStarDisplay();
    });

    // Форма
    document.getElementById('reviewForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addReview();
    });
  }

  highlightStars(rating) {
    const stars = document.querySelectorAll('.reviews-rating-input .reviews-star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  updateStarDisplay() {
    this.highlightStars(this.selectedRating);
  }

  // Валідація та фільтрація контенту
  validateContent(text) {
    // Список заборонених слів (можна розширити)
    const bannedWords = ['спам', 'реклама', 'купити', 'продаж', 'дешево'];
    const lowerText = text.toLowerCase();

    for (const word of bannedWords) {
      if (lowerText.includes(word)) {
        return false;
      }
    }

    // Перевірка на надмірну кількість великих літер
    const upperCaseCount = (text.match(/[A-ZА-ЯЄІЇҐ]/g) || []).length;
    if (upperCaseCount > text.length * 0.7) {
      return false;
    }

    // Перевірка на повторювані символи
    if (/(.)\1{4,}/.test(text)) {
      return false;
    }

    return true;
  }

  async addReview() {
    const name = document.getElementById('reviewerName').value.trim();
    const email = document.getElementById('reviewerEmail').value.trim();
    const text = document.getElementById('reviewText').value.trim();

    // Базова валідація
    if (!name || !text || this.selectedRating === 0) {
      alert('Будь ласка, заповніть всі обов\'язкові поля та поставте рейтинг');
      return;
    }

    // Перевірка капчі
    if (!this.captchaVerified) {
      alert('Будь ласка, правильно відповідайте на питання для підтвердження');
      document.getElementById('captchaInput').focus();
      return;
    }

    // Перевірка автентифікації (тільки анонімна)
    if (!this.user || !this.user.isAnonymous) {
      alert('Помилка автентифікації. Перезавантажте сторінку');
      return;
    }

    // Перевірка обмеження частоти
    const now = Date.now();
    const timeDiff = now - this.lastSubmissionTime;
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < this.RATE_LIMIT_MINUTES) {
      const remaining = this.RATE_LIMIT_MINUTES - minutesDiff;
      alert(`Ви зможете залишити наступний відгук через ${remaining} хвилин`);
      return;
    }

    // Валідація контенту
    if (!this.validateContent(text) || !this.validateContent(name)) {
      alert('Відгук містить неприйнятний контент. Будь ласка, перепишіть повідомлення');
      return;
    }

    const review = {
      name: this.sanitizeInput(name),
      email: email ? this.sanitizeInput(email) : '',
      rating: this.selectedRating,
      text: this.sanitizeInput(text),
      date: new Date().toLocaleDateString('uk-UA'),
      timestamp: serverTimestamp(),
      userId: this.user.uid, // Додаємо UID користувача для безпеки
      verified: true
    };

    try {
      // Показуємо індикатор завантаження
      const btn = document.querySelector('.reviews-submit-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Збереження...';
      btn.disabled = true;

      // Додаємо в Firebase
      await addDoc(collection(this.db, 'reviews'), review);

      // Оновлюємо час останньої відправки
      this.setLastSubmissionTime();

      // Оновлюємо локальні дані
      await this.loadReviews();
      this.renderReviews();
      this.updateStats();
      this.resetForm();

      // Показуємо повідомлення про успіх
      btn.textContent = 'Відгук додано! ✓';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        this.checkRateLimit(); // Перевіряємо обмеження після успішної відправки
      }, 2000);

    } catch (error) {
      console.error('Помилка при додаванні відгуку:', error);
      alert('Помилка при збереженні відгуку. Спробуйте ще раз.');

      const btn = document.querySelector('.reviews-submit-btn');
      btn.textContent = 'Опублікувати відгук';
      btn.disabled = false;
    }
  }

  // Санітизація введених даних
  sanitizeInput(input) {
    return input
      .replace(/[<>]/g, '') // Видаляємо < та >
      .replace(/javascript:/gi, '') // Видаляємо javascript:
      .replace(/on\w+=/gi, '') // Видаляємо обробники подій
      .trim();
  }

  resetForm() {
    document.getElementById('reviewForm').reset();
    this.selectedRating = 0;
    this.updateStarDisplay();
    this.createCaptcha(); // Створюємо нову капчу
  }

  async loadReviews() {
    try {
      const q = query(collection(this.db, 'reviews'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      this.reviews = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Фільтруємо тільки верифіковані відгуки
        if (data.verified) {
          // Конвертуємо timestamp в дату якщо потрібно
          if (data.timestamp && data.timestamp.toDate) {
            data.date = data.timestamp.toDate().toLocaleDateString('uk-UA');
          }
          this.reviews.push({
            id: doc.id,
            ...data
          });
        }
      });
    } catch (error) {
      console.error('Помилка при завантаженні відгуків:', error);
      this.reviews = [];
    }
  }

  renderReviews() {
    const container = document.getElementById('reviewsContainer');

    if (this.reviews.length === 0) {
      container.innerHTML = `
        <div class="reviews-empty-state">
          <div class="reviews-empty-state-icon">💬</div>
          <h3>Поки що немає відгуків</h3>
          <p>Будьте першим, хто залишить відгук!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.reviews.map(review => `
      <div class="reviews-card">
        <div class="reviews-header">
          <div class="reviews-reviewer-info">
            <div class="reviews-reviewer-avatar">
              ${review.name.charAt(0).toUpperCase()}
            </div>
            <div class="reviews-reviewer-details">
              <h4>${this.escapeHtml(review.name)}</h4>
              <div class="reviews-date">${review.date}</div>
            </div>
          </div>
          <div class="reviews-rating">
            ${this.renderStars(review.rating)}
          </div>
        </div>
        <div class="reviews-text">
          ${this.escapeHtml(review.text)}
        </div>
      </div>
    `).join('');
  }

  renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="reviews-star ${i <= rating ? 'active' : ''}" style="cursor: default;">★</span>`;
    }
    return stars;
  }

  updateStats() {
    const totalReviews = this.reviews.length;
    const averageRating = totalReviews > 0
      ? (this.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
      : '0.0';
    const fiveStarCount = this.reviews.filter(review => review.rating === 5).length;

    document.getElementById('totalReviews').textContent = totalReviews;
    document.getElementById('averageRating').textContent = averageRating;
    document.getElementById('fiveStarCount').textContent = fiveStarCount;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Додаємо стилі для капчі
const captchaStyles = `
  .reviews-captcha {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .reviews-captcha-status {
    margin-left: 10px;
    font-weight: bold;
    font-size: 18px;
  }

  .reviews-captcha-refresh {
    margin-left: 10px;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
  }

  .reviews-captcha-refresh:hover {
    background-color: #e0e0e0;
  }
`;

// Додаємо стилі до документа
const styleSheet = document.createElement('style');
styleSheet.textContent = captchaStyles;
document.head.appendChild(styleSheet);

// Ініціалізація системи відгуків
document.addEventListener('DOMContentLoaded', () => {
  new ReviewsSystem();
});
