import {
  getFirestore,
  collection,
  getDocs,
  where,
  query
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

const firebaseConfig = {
  apiKey: "AIzaSyASoIqknT0hMi7QTsKS_nBJbDvC9aWbcW0",
  authDomain: "reviews-project-travels-turkey.firebaseapp.com",
  projectId: "reviews-project-travels-turkey",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadCardRatings() {
  const cards = document.querySelectorAll('.card-rating');

  for (const card of cards) {
    const category = card.dataset.category;

    const q = query(
      collection(db, 'reviews'),
      where('verified', '==', true),
      where('category', '==', category)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Додаємо клас для новинки
      card.classList.add('is-new');
      card.textContent = 'Новинка';
      continue;
    }

    let total = 0;
    snapshot.forEach(doc => {
      total += doc.data().rating;
    });

    const avg = (total / snapshot.size).toFixed(1);
    const starsCount = Math.round(avg);

    card.innerHTML = `
      <span class="stars">${'★'.repeat(starsCount)}${'☆'.repeat(5 - starsCount)}</span>
      <span class="rating-text">${avg}</span>
    `;
  }
}

document.addEventListener('DOMContentLoaded', loadCardRatings);
