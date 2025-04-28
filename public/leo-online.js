console.log("=== Загрузка leo-online.js ===");
console.log("document.readyState:", document.readyState);

const API_BASE_URL = "https://pro-1-qldl.onrender.com/api";
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot";

let isPageReload = performance?.getEntriesByType("navigation")[0]?.type === "reload";

// Переход на другие страницы
function goTo(section) {
  localStorage.setItem("returnUrl", window.location.href);
  const allowed = ['services', 'staff', 'datetime', 'leo-online'];
  if (allowed.includes(section)) {
    window.location.href = `${section}.html`;
  } else {
    console.error(`❌ Неизвестный раздел: ${section}`);
  }
}

// Назад на предыдущую страницу
function goBack() {
  window.location.href = localStorage.getItem('returnUrl') || 'leo-online.html';
}

// Форматирование даты и времени
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return isNaN(date) ? "Неверный формат даты" : date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Очистка данных записи
function clearStoredBookingData() {
  const userId = localStorage.getItem("userId");
  localStorage.clear();
  if (userId) localStorage.setItem("userId", userId);
}

// Отображение сохраненных данных
function renderSavedData() {
  const getOrNone = (key) => localStorage.getItem(key) || "Не выбрано";
  const service = getOrNone("selectedService");
  const staff = getOrNone("selectedEmployee");
  const datetime = getOrNone("selectedDatetime");

  document.getElementById("chosen-service")?.textContent = service;
  document.getElementById("chosen-staff")?.textContent = staff;
  
  // Исправление: правильно обрабатываем элемент chosen-time внутри chosen-datetime
  const chosenTimeElement = document.getElementById("chosen-time");
  if (chosenTimeElement) {
    chosenTimeElement.textContent = datetime !== "Не выбрано" ? formatDateTime(datetime) : "Не выбрано";
  }

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    const disabled = [service, staff, datetime].includes("Не выбрано");
    submitBtn.disabled = disabled;
    submitBtn.style.opacity = disabled ? "0.6" : "1";
    submitBtn.style.cursor = disabled ? "not-allowed" : "pointer";
  }
}

// Сохранение данных на сервер
async function savePendingBooking(bookingData) {
  try {
    console.log("Отправка данных на сервер:", bookingData);
    const res = await fetch(`${API_BASE_URL}/pending-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    const result = await res.json();
    console.log("Ответ сервера:", result);
    return result.success === true;
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    return false;
  }
}

// Обеспечение наличия уникального userId
function ensureUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

// Подготовка данных для записи
function prepareBookingData() {
  const [service, staff, datetime] = ["selectedService", "selectedEmployee", "selectedDatetime"].map(key => localStorage.getItem(key));
  const userId = ensureUserId();
  
  if (!service || !staff || !datetime) return null;
  
  let date = "", time = "";
  if (datetime.includes('T')) {
    [date, time] = datetime.split('T');
  } else {
    const dateObj = new Date(datetime);
    if (!isNaN(dateObj)) {
      date = dateObj.toISOString().split('T')[0];
      time = dateObj.toTimeString().slice(0,5);
    }
  }
  
  return { service, staff, date, time, userId, timestamp: new Date().toISOString() };
}

// Показ модалки для Telegram
function showTelegramModal() {
  const userId = localStorage.getItem("userId") || "";
  const botUrl = `${TELEGRAM_BOT_URL}?start=${userId}`;
  
  let modal = document.getElementById("telegram-modal");
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="telegram-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:9999;">
        <div style="background:white;padding:30px;border-radius:10px;text-align:center;max-width:400px;">
          <h2 style="margin-top:0;color:#333;">Подтверждение записи</h2>
          <p style="margin:20px 0;line-height:1.5;">Подпишитесь на нашего телеграм-бота и напишите ему <b>/start</b></p>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;">
            <button id="go-to-bot" style="padding:12px 25px;background:#4CAF50;color:white;border:none;border-radius:5px;">Перейти к боту</button>
            <button id="cancel-modal" style="padding:12px 25px;background:#f44336;color:white;border:none;border-radius:5px;">Отмена</button>
          </div>
        </div>
      </div>
    `);
    modal = document.getElementById("telegram-modal");
    document.getElementById("go-to-bot").onclick = () => {
      window.open(botUrl, "_blank");
      modal.style.display = "none";
    };
    document.getElementById("cancel-modal").onclick = () => {
      modal.style.display = "none";
    };
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  } else {
    modal.style.display = "flex";
  }
}

// Отправка данных о визите
function submitVisit() {
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Пожалуйста, выберите услугу, сотрудника и время!");
    return;
  }
  
  savePendingBooking(bookingData)
    .then(success => {
      if (success) {
        showTelegramModal();
      } else {
        alert("Ошибка сохранения записи. Попробуйте снова.");
      }
    })
    .catch(err => {
      console.error("Ошибка при отправке данных:", err);
      alert("Произошла ошибка. Попробуйте снова позже.");
    });
}

// Функция для проверки необходимости очистки данных
function shouldClearData() {
  // Проверяем, прошло ли больше 24 часов с последнего визита
  const lastVisit = localStorage.getItem("lastVisit");
  if (!lastVisit) return true;
  
  const lastDate = new Date(lastVisit);
  const now = new Date();
  const hoursPassed = (now - lastDate) / (1000 * 60 * 60);
  return hoursPassed > 24;
}

// Функция для установки времени последнего посещения
function setLastVisit() {
  localStorage.setItem("lastVisit", new Date().toISOString());
}

// Инициализация страницы выбора услуги
function initServicesPage() {
  document.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.querySelector('.service-name')?.textContent;
      if (name) {
        localStorage.setItem('selectedService', name);
        goBack();
      }
    });
  });
}

// Инициализация страницы выбора сотрудника
function initStaffPage() {
  document.querySelectorAll('.staff-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.querySelector('.staff-name')?.textContent;
      if (name) {
        localStorage.setItem('selectedEmployee', name);
        goBack();
      }
    });
  });
}

// Инициализация страницы выбора даты и времени
function initDatetimePage() {
  const confirmBtn = document.getElementById('confirm-datetime');
  confirmBtn?.addEventListener('click', () => {
    const date = document.getElementById('date-picker')?.value;
    const time = document.getElementById('time-picker')?.value;
    if (date && time) {
      localStorage.setItem('selectedDatetime', `${date}T${time}`);
      goBack();
    } else {
      alert('Выберите дату и время');
    }
  });

  const dateInput = document.getElementById('date-picker');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }
}

// Добавляем обработчики событий при загрузке страницы
function addEventListeners() {
  // Добавляем обработчики для кнопок выбора
  document.getElementById("services-btn")?.addEventListener("click", () => goTo("services"));
  document.getElementById("staff-btn")?.addEventListener("click", () => goTo("staff"));
  document.getElementById("datetime-btn")?.addEventListener("click", () => goTo("datetime"));
  
  // Добавляем обработчик для кнопки оформления визита
  document.getElementById("submitBtn")?.addEventListener("click", submitVisit);
}

// Обработчик события DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("=== DOM полностью загружен ===");
  const page = window.location.pathname.split('/').pop();
  console.log("Страница:", page);
  
  if ((isPageReload || shouldClearData()) && (page.includes('leo-online') || page === 'index.html' || !page)) {
    console.log("Очистка данных из-за перезагрузки или времени");
    clearStoredBookingData();
  }

  setLastVisit();
  addEventListeners();

  if (page.includes('services')) initServicesPage();
  else if (page.includes('staff')) initStaffPage();
  else if (page.includes('datetime')) initDatetimePage();
  else if (page.includes('leo-online') || page === 'index.html' || !page) renderSavedData();
});

console.log("Текущие данные:");
["selectedService", "selectedEmployee", "selectedDatetime", "userId"].forEach(key => {
  console.log(`- ${key}:`, localStorage.getItem(key));
});