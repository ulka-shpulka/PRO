console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

// Константы
const API_BASE_URL = "https://pro-1-qldl.onrender.com/api";
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot";

// Проверка перезагрузки страницы
const navEntries = performance?.getEntriesByType?.("navigation") || [];
const isPageReload = navEntries.length > 0 && navEntries[0].type === "reload";
if (isPageReload) console.log("Обнаружена перезагрузка страницы!");

// Навигация
window.goTo = function(section) {
  localStorage.setItem("returnUrl", window.location.href);
  
  const allowedSections = ['services', 'staff', 'datetime', 'leo-online'];
  if (allowedSections.includes(section)) {
    window.location.href = `${section}.html`;
  } else {
    console.error(`❌ Неизвестный раздел: ${section}`);
  }
};

// Форматирование даты
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return isNaN(date) ? "Неверный формат даты" : date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Очистить данные кроме userId
function clearStoredBookingData() {
  const userId = localStorage.getItem("userId");
  localStorage.clear();
  if (userId) localStorage.setItem("userId", userId);
}

// Отобразить выбранные данные
function renderSavedData() {
  const service = localStorage.getItem("selectedService") || "Не выбрано";
  const staff = localStorage.getItem("selectedEmployee") || "Не выбрано";
  const datetime = localStorage.getItem("selectedDatetime") || "Не выбрано";

  document.getElementById("chosen-service")?.textContent = service;
  document.getElementById("chosen-staff")?.textContent = staff;
  document.getElementById("chosen-time")?.textContent = datetime !== "Не выбрано" ? formatDateTime(datetime) : "Не выбрано";
  
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    const isDisabled = [service, staff, datetime].includes("Не выбрано");
    submitBtn.disabled = isDisabled;
    submitBtn.style.opacity = isDisabled ? "0.6" : "1";
    submitBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
  }
}

// Сохранение записи
async function savePendingBooking(bookingData) {
  try {
    console.log("Отправка данных на сервер:", bookingData);
    const response = await fetch(`${API_BASE_URL}/pending-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    const result = await response.json();
    console.log("Ответ сервера:", result);
    return result.success === true;
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    return false;
  }
}

// Создание userId
function ensureUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

// Подготовить данные брони
function prepareBookingData() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = ensureUserId();
  if (!service || !staff || !datetime) return null;

  let date = "", time = "";
  if (datetime.includes('T')) {
    [date, time] = datetime.split('T');
  } else {
    const dateObj = new Date(datetime);
    if (!isNaN(dateObj)) {
      date = dateObj.toISOString().split('T')[0];
      time = dateObj.toTimeString().slice(0, 5);
    }
  }
  return { service, staff, date, time, userId, timestamp: new Date().toISOString() };
}

// Модальное окно подтверждения
function showTelegramModal() {
  const userId = localStorage.getItem("userId") || "";
  const botUrl = userId ? `${TELEGRAM_BOT_URL}?start=${userId}` : TELEGRAM_BOT_URL;

  let modal = document.getElementById("telegram-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "telegram-modal";
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;
    `;
    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 400px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
        <h2 style="margin-top: 0; color: #333;">Подтверждение записи</h2>
        <p style="margin: 20px 0; line-height: 1.5; font-size: 16px;">
          <strong>Чтобы подтвердить запись, подпишитесь на телеграм-бота и отправьте /start</strong>
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
          <button id="go-to-bot" style="padding: 12px 25px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Перейти к боту</button>
          <button id="cancel-modal" style="padding: 12px 25px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = "flex";

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
}

// Отправка записи
window.submitVisit = async function() {
  console.log("Функция submitVisit вызвана");
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Пожалуйста, выберите услугу, сотрудника и время!");
    return;
  }

  console.log("Данные для отправки:", bookingData);
  const success = await savePendingBooking(bookingData);
  if (success) {
    showTelegramModal();
  } else {
    alert("Ошибка сохранения записи. Пожалуйста, попробуйте снова.");
  }
};

// Инициализация страниц
function initServicesPage() {
  const serviceItems = document.querySelectorAll('.service-item');
  serviceItems.forEach(item => {
    item.addEventListener('click', function() {
      const serviceName = this.querySelector('.service-name')?.textContent;
      if (serviceName) {
        localStorage.setItem('selectedService', serviceName);
        const returnUrl = localStorage.getItem('returnUrl') || 'leo-online.html';
        window.location.href = returnUrl;
      }
    });
  });
}

function initStaffPage() {
  const staffItems = document.querySelectorAll('.staff-item');
  staffItems.forEach(item => {
    item.addEventListener('click', function() {
      const staffName = this.querySelector('.staff-name')?.textContent;
      if (staffName) {
        localStorage.setItem('selectedEmployee', staffName);
        const returnUrl = localStorage.getItem('returnUrl') || 'leo-online.html';
        window.location.href = returnUrl;
      }
    });
  });
}

function initDatetimePage() {
  const dateInput = document.getElementById('date-picker');
  const timeInput = document.getElementById('time-picker');
  const dateTimeConfirmBtn = document.getElementById('confirm-datetime');

  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  if (dateTimeConfirmBtn) {
    dateTimeConfirmBtn.addEventListener('click', () => {
      if (dateInput?.value && timeInput?.value) {
        localStorage.setItem('selectedDatetime', `${dateInput.value}T${timeInput.value}`);
        const returnUrl = localStorage.getItem('returnUrl') || 'leo-online.html';
        window.location.href = returnUrl;
      } else {
        alert('Пожалуйста, выберите дату и время');
      }
    });
  }
}

// Последний визит
function setLastVisit() {
  localStorage.setItem('lastVisitTime', Date.now());
}

function shouldClearData() {
  const lastVisitTime = parseInt(localStorage.getItem('lastVisitTime') || '0', 10);
  return Date.now() - lastVisitTime > 30 * 60 * 1000;
}

// При загрузке
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded событие сработало");

  const currentPage = window.location.pathname.split('/').pop();
  console.log("Текущая страница:", currentPage);

  if ((isPageReload || shouldClearData()) && (currentPage.includes('leo-online') || currentPage === 'index.html' || !currentPage)) {
    console.log("Сбрасываем данные из-за перезагрузки или долгого бездействия");
    clearStoredBookingData();
  }

  setLastVisit();

  if (currentPage.includes('services')) initServicesPage();
  else if (currentPage.includes('staff')) initStaffPage();
  else if (currentPage.includes('datetime')) initDatetimePage();
  else if (currentPage.includes('leo-online') || currentPage === 'index.html' || !currentPage) renderSavedData();

  document.querySelectorAll('.selection').forEach(element => {
    element.addEventListener('click', () => {
      const section = element.dataset.section;
      if (section) goTo(section);
    });
  });
});

// Выводим данные для отладки
console.log("Сохраненные данные:");
console.log("- Услуга:", localStorage.getItem("selectedService"));
console.log("- Сотрудник:", localStorage.getItem("selectedEmployee"));
console.log("- Дата/время:", localStorage.getItem("selectedDatetime"));
console.log("- ID пользователя:", localStorage.getItem("userId"));
