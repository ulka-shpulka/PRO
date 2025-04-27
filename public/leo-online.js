console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

// Константы
const API_BASE_URL = "https://pro-1-qldl.onrender.com/api";
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot";

// Навигация
window.goTo = function(section) {
  switch (section) {
    case 'services':
    case 'staff':
    case 'datetime':
    case 'leo-online':
      window.location.href = `${section}.html`;
      break;
    default:
      console.error(`❌ Неизвестный раздел: ${section}`);
  }
};

// Форматирование даты
function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (isNaN(date)) return "Неверный формат даты";
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Очистить данные
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
}

// Сохранение записи
async function savePendingBooking(bookingData) {
  try {
    const response = await fetch(`${API_BASE_URL}/pending-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return (await response.json()).success === true;
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
  const [date, time] = datetime.split('T');
  return { service, staff, date, time, userId, timestamp: new Date().toISOString() };
}

// Модальное окно подтверждения
function showTelegramModal() {
  let modal = document.getElementById("telegram-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "telegram-modal";
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;
    `;
    modal.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 400px;">
        <h2>Подтверждение записи</h2>
        <p style="margin: 20px 0;">
          После подписки на бота отправьте ему команду <b>/start</b>, чтобы получить подтверждение вашей записи.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
          <button id="go-to-bot" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px;">Перейти к боту</button>
          <button id="cancel-modal" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px;">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("go-to-bot").onclick = () => {
      window.open(TELEGRAM_BOT_URL, "_blank");
      modal.style.display = "none";
    };
    document.getElementById("cancel-modal").onclick = () => {
      modal.style.display = "none";
    };
  } else {
    modal.style.display = "flex";
  }
}

// Отправка записи
window.submitVisit = async function() {
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Выберите услугу, сотрудника и время!");
    return;
  }
  if (await savePendingBooking(bookingData)) {
    showTelegramModal();
  } else {
    alert("Ошибка сохранения записи. Попробуйте снова.");
  }
};

// При загрузке
document.addEventListener('DOMContentLoaded', () => {
  renderSavedData();
  if (performance.getEntriesByType("navigation")[0].type === "reload" &&
      (location.pathname.includes("index") || location.pathname.includes("leo-online"))) {
    clearStoredBookingData();
  }
});
