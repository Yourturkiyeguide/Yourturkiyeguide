// Import Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, orderBy, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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
  constructor(options = {}) {
    this.reviews = [];
    this.selectedRating = 0;
    this.db = db;
    this.auth = auth;
    this.user = null;
    this.lastSubmissionTime = this.getLastSubmissionTime();
    this.captchaVerified = false;
    this.RATE_LIMIT_MINUTES = 15;

    // Настройки категорий
    this.category = options.category || 'general';
    this.categoryDisplayName = options.categoryDisplayName || 'Общие отзывы';

    // Настройки UI
    this.showCategorySelector = options.showCategorySelector || false;
    this.availableCategories = options.availableCategories || {
      'general': 'Общие',
      'istanbul': 'Стамбул',
      'colourful': 'Колорит',
      'tranzit': 'Транзит',
      'sophisticated': 'Изысканный',
      'stambul': 'Стамбул мост',
      'bosphorus': 'По волнам Босфора',
      'cappadocia': 'дикая Каппадокия'
    };

    this.init();
  }

  async debugReviews() {
    console.log('🔍 Диагностика отзывов...');
    console.log('Текущая категория:', this.category);

    try {
      const allQuery = query(collection(this.db, 'reviews'));
      const allSnapshot = await getDocs(allQuery);

      console.log('📊 Всего отзывов в БД:', allSnapshot.size);

      const allReviews = [];
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        allReviews.push({
          id: doc.id,
          category: data.category || 'не указано',
          verified: data.verified,
          name: data.name,
          text: data.text?.substring(0, 50) + '...'
        });
      });

      console.table(allReviews);

      const categoryCount = allReviews.filter(r => r.category === this.category).length;
      console.log(`📈 Отзывов для категории "${this.category}":`, categoryCount);

    } catch (error) {
      console.error('Ошибка диагностики:', error);
    }
  }

  async init() {
    this.setupEventListeners();
    this.setupCategoryUI();
    await this.authenticateUser();
    this.createCaptcha();
    await this.loadReviews();
    this.renderReviews();
    this.updateStats();
    this.checkRateLimit();

    // Диагностика
    setTimeout(() => this.debugReviews(), 1000);
  }

  setupCategoryUI() {
    if (this.showCategorySelector) {
      this.createCategorySelector();
    }
  }

  createCategorySelector() {
    const form = document.getElementById('reviewForm');
    const firstInput = form.querySelector('input');

    const selectorHTML = `
      <div class="reviews-category-selector">
        <label class="reviews-form-label">Категория отзыва *</label>
        <select id="categorySelect" class="reviews-form-input" required>
          ${Object.entries(this.availableCategories).map(([key, name]) =>
      `<option value="${key}" ${key === this.category ? 'selected' : ''}>${name}</option>`
    ).join('')}
        </select>
      </div>
    `;

    firstInput.insertAdjacentHTML('beforebegin', selectorHTML);

    document.getElementById('categorySelect').addEventListener('change', (e) => {
      this.category = e.target.value;
      this.categoryDisplayName = this.availableCategories[this.category];
      this.loadReviews().then(() => {
        this.renderReviews();
        this.updateStats();
      });
    });
  }


  async authenticateUser() {
    try {
      const result = await signInAnonymously(this.auth);
      this.user = result.user;
      console.log('Анонимная аутентификация успешна:', this.user.uid);

      onAuthStateChanged(this.auth, (user) => {
        if (user && user.isAnonymous) {
          this.user = user;
          console.log('Анонимный пользователь подтвержден:', user.uid);
        } else if (!user) {
          this.signInAnonymously();
        }
      });
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
      setTimeout(() => this.authenticateUser(), 2000);
    }
  }

  async signInAnonymously() {
    try {
      const result = await signInAnonymously(this.auth);
      this.user = result.user;
      console.log('Новая анонимная аутентификация:', this.user.uid);
    } catch (error) {
      console.error('Ошибка анонимной аутентификации:', error);
      setTimeout(() => this.signInAnonymously(), 3000);
    }
  }

  getLastSubmissionTime() {
    const saved = localStorage.getItem(`lastReviewSubmission_${this.category}`);
    return saved ? parseInt(saved) : 0;
  }

  setLastSubmissionTime() {
    const now = Date.now();
    localStorage.setItem(`lastReviewSubmission_${this.category}`, now.toString());
    this.lastSubmissionTime = now;
  }

  checkRateLimit() {
    const now = Date.now();
    const timeDiff = now - this.lastSubmissionTime;
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < this.RATE_LIMIT_MINUTES) {
      const remainingMinutes = this.RATE_LIMIT_MINUTES - minutesDiff;
      this.disableForm(`Вы сможете оставить следующий отзыв через ${remainingMinutes} минут`);

      setTimeout(() => {
        this.enableForm();
        this.checkRateLimit();
      }, (remainingMinutes * 60 * 1000));
    }
  }

  disableForm(message) {
    const form = document.getElementById('reviewForm');
    const submitBtn = document.querySelector('.reviews-submit-btn');
    const inputs = form.querySelectorAll('input, textarea, button, select');

    inputs.forEach(input => input.disabled = true);
    submitBtn.textContent = message;
    submitBtn.style.opacity = '0.6';
  }

  enableForm() {
    const form = document.getElementById('reviewForm');
    const submitBtn = document.querySelector('.reviews-submit-btn');
    const inputs = form.querySelectorAll('input, textarea, button, select');

    inputs.forEach(input => input.disabled = false);
    submitBtn.textContent = 'Опубликовать отзыв';
    submitBtn.style.opacity = '1';
    this.createCaptcha();
  }

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
        <label class="reviews-form-label">Подтверждение: Сколько будет ${question}? *</label>
        <input type="number" id="captchaInput" class="reviews-form-input" required style="width: 100px;">
        <span id="captchaStatus" class="reviews-captcha-status"></span>
        <button type="button" id="refreshCaptcha" class="reviews-captcha-refresh" title="Обновить вопрос">🔄</button>
      </div>
    `;

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

  validateContent(text) {
    const bannedWords = ['спам', 'реклама', 'купить', 'продажа', 'дешево'];
    const lowerText = text.toLowerCase();

    for (const word of bannedWords) {
      if (lowerText.includes(word)) {
        return false;
      }
    }

    const upperCaseCount = (text.match(/[A-ZА-ЯЁЄІЇҐ]/g) || []).length;
    if (upperCaseCount > text.length * 0.7) {
      return false;
    }

    if (/(.)\1{4,}/.test(text)) {
      return false;
    }

    return true;
  }

  async addReview() {
    const name = document.getElementById('reviewerName').value.trim();
    const email = document.getElementById('reviewerEmail').value.trim();
    const text = document.getElementById('reviewText').value.trim();

    const selectedCategory = document.getElementById('categorySelect')
      ? document.getElementById('categorySelect').value
      : this.category;

    if (!name || !text || this.selectedRating === 0) {
      alert('Пожалуйста, заполните все обязательные поля и поставьте рейтинг');
      return;
    }

    if (!this.captchaVerified) {
      alert('Пожалуйста, правильно отвечайте на вопросы для подтверждения');
      document.getElementById('captchaInput').focus();
      return;
    }

    if (!this.user || !this.user.isAnonymous) {
      alert('Ошибка аутентификации. Перезагрузите страницу');
      return;
    }

    const now = Date.now();
    const timeDiff = now - this.lastSubmissionTime;
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff < this.RATE_LIMIT_MINUTES) {
      const remaining = this.RATE_LIMIT_MINUTES - minutesDiff;
      alert(`Вы сможете оставить следующий отзыв через ${remaining} минут`);
      return;
    }

    if (!this.validateContent(text) || !this.validateContent(name)) {
      alert('Отзыв содержит неприемлемый контент. Пожалуйста, перепишите сообщение');
      return;
    }

    const review = {
      name: this.sanitizeInput(name),
      email: email ? this.sanitizeInput(email) : '',
      rating: this.selectedRating,
      text: this.sanitizeInput(text),
      date: new Date().toLocaleDateString('ru-RU'),
      timestamp: serverTimestamp(),
      userId: this.user.uid,
      verified: true,
      category: selectedCategory
    };

    try {
      const btn = document.querySelector('.reviews-submit-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Сохранение...';
      btn.disabled = true;

      await addDoc(collection(this.db, 'reviews'), review);

      this.setLastSubmissionTime();

      await this.loadReviews();
      this.renderReviews();
      this.updateStats();
      this.resetForm();

      btn.textContent = 'Отзыв добавлен! ✓';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        this.checkRateLimit();
      }, 2000);

    } catch (error) {
      console.error('Ошибка при добавлении отзыва:', error);
      alert('Ошибка при сохранении отзыва. Попробуйте еще раз.');

      const btn = document.querySelector('.reviews-submit-btn');
      btn.textContent = 'Опубликовать отзыв';
      btn.disabled = false;
    }
  }

  sanitizeInput(input) {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  resetForm() {
    document.getElementById('reviewForm').reset();
    this.selectedRating = 0;
    this.updateStarDisplay();
    this.createCaptcha();

    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
      categorySelect.value = this.category;
    }
  }

  // 🔧 ИСПРАВЛЕННЫЙ метод загрузки отзывов
  async loadReviews() {
    console.log('🔄 Загрузка отзывов для категории:', this.category);

    try {
      // Попробуем простой запрос только по verified
      const q = query(
        collection(this.db, 'reviews'),
        where('verified', '==', true)
      );

      const querySnapshot = await getDocs(q);
      console.log('📥 Загружено отзывов из БД:', querySnapshot.size);

      this.reviews = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Фильтруем по категории в коде
        const reviewCategory = data.category || 'general'; // fallback для старых отзывов

        if (this.category === 'general' || reviewCategory === this.category) {
          if (data.timestamp && data.timestamp.toDate) {
            data.date = data.timestamp.toDate().toLocaleDateString('ru-RU');
            data.timestampValue = data.timestamp.toDate().getTime();
          } else {
            // Fallback для отзывов без timestamp
            data.timestampValue = Date.now();
          }

          this.reviews.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Сортируем по времени (новые сначала)
      this.reviews.sort((a, b) => {
        const timeA = a.timestampValue || 0;
        const timeB = b.timestampValue || 0;
        return timeB - timeA;
      });

      console.log(`✅ Отзывов для категории "${this.category}":`, this.reviews.length);

    } catch (error) {
      console.error('❌ Ошибка при загрузке отзывов:', error);

      // Если и это не работает, попробуем загрузить все отзывы
      try {
        console.log('🔄 Пробую загрузить все отзывы...');
        const allQuery = query(collection(this.db, 'reviews'));
        const allSnapshot = await getDocs(allQuery);

        this.reviews = [];
        allSnapshot.forEach((doc) => {
          const data = doc.data();
          const reviewCategory = data.category || 'general';

          if (reviewCategory === this.category && (data.verified === true || data.verified === undefined)) {
            if (data.timestamp && data.timestamp.toDate) {
              data.date = data.timestamp.toDate().toLocaleDateString('ru-RU');
              data.timestampValue = data.timestamp.toDate().getTime();
            } else {
              data.timestampValue = Date.now();
            }

            this.reviews.push({
              id: doc.id,
              ...data
            });
          }
        });

        this.reviews.sort((a, b) => {
          const timeA = a.timestampValue || 0;
          const timeB = b.timestampValue || 0;
          return timeB - timeA;
        });

        console.log(`✅ Найдено отзывов (fallback):`, this.reviews.length);

      } catch (fallbackError) {
        console.error('❌ Критическая ошибка загрузки:', fallbackError);
        this.reviews = [];
      }
    }
  }

  renderReviews() {
    const container = document.getElementById('reviewsContainer');

    if (this.reviews.length === 0) {
      container.innerHTML = `
        <div class="reviews-empty-state">
          <div class="reviews-empty-state-icon">💬</div>
          <h3>Пока нет отзывов</h3>
          <p>Будьте первым, кто оставит отзыв о ${this.categoryDisplayName.toLowerCase()}!</p>
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

// Стили
const categoryStyles = `
  .reviews-category-selector {
    margin-bottom: 20px;
  }

  .reviews-category-selector select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    background-color: white;
  }

  .reviews-category-selector select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .reviews-empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }

  .reviews-empty-state-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  .reviews-empty-state h3 {
    margin-bottom: 10px;
    color: #333;
  }
`;

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

// Добавляем стили
const styleSheet = document.createElement('style');
styleSheet.textContent = categoryStyles + captchaStyles;
document.head.appendChild(styleSheet);

// Экспортируем класс
window.ReviewsSystem = ReviewsSystem;

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
  if (window.reviewsConfig) {
    new ReviewsSystem(window.reviewsConfig);
  }
});
