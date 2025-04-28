const API_BASE_URL = "https://pro-1-qldl.onrender.com/api";
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot";

// ===== ФУНКЦИИ ПЕРЕХОДА ПО СЕКЦИЯМ =====
window.goTo = function(section) {
  localStorage.setItem("returnUrl", window.location.href);
  window.location.href = `${section}.html`;
};

// ===== ПОКАЗ ВЫБРАННЫХ ДАННЫХ НА ГЛАВНОЙ СТРАНИЦЕ =====
function renderSavedData() {
  const service = localStorage.getItem("selectedService") || "Не выбрано";
  const staff = localStorage.getItem("selectedStaff") || "Не выбрано";
  const datetime = localStorage.getItem("selectedDatetime") || "Не выбрано";

  document.getElementById("chosen-service").textContent = service;

  // Преобразование данных сотрудника
  if (staff !== "Не выбрано") {
    const staffData = JSON.parse(staff); // предполагаем, что данные сотрудника в JSON формате
    const staffName = staffData.name || "Не указано";
    const staffExperience = staffData.experience || "Не указан стаж"; // новый параметр для стажа
    document.getElementById("chosen-staff").textContent = `${staffName} (${staffExperience})`; // выводим имя и стаж
  } else {
    document.getElementById("chosen-staff").textContent = staff;
  }

  const datetimeElement = document.getElementById("chosen-time");
  if (datetime !== "Не выбрано") {
    const date = new Date(datetime);  // Преобразуем строку в объект Date
    // Форматируем дату и время в нужный вид
    datetimeElement.textContent = date.toLocaleString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    datetimeElement.textContent = "Не выбрано";
  }

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    const disabled = (service === "Не выбрано" || staff === "Не выбрано" || datetime === "Не выбрано");
    submitBtn.disabled = disabled;
    submitBtn.style.opacity = disabled ? "0.5" : "1";
    submitBtn.style.cursor = disabled ? "not-allowed" : "pointer";
  }
}

// ===== СОХРАНЕНИЕ ДАННЫХ =====
function ensureUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

function prepareBookingData() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedStaff");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = ensureUserId();

  if (!service || !staff || !datetime) return null;

  const dateObj = new Date(datetime);
  const date = dateObj.toISOString().split('T')[0];
  const time = dateObj.toTimeString().slice(0, 5);

  return { service, staff, date, time, userId };
}

async function savePendingBooking(bookingData) {
  try {
    const response = await fetch(`${API_BASE_URL}/pending-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Ошибка сохранения брони:', error);
    return false;
  }
}

// ===== СОХРАНЕНИЕ ДАТЫ И ВРЕМЕНИ В LOCALSTORAGE =====
function saveSelectedDatetime(datetime) {
  // Преобразуем дату в строку ISO
  localStorage.setItem("selectedDatetime", datetime.toISOString());
}

// Пример вызова функции для сохранения:
saveSelectedDatetime(new Date()); // Например, сохраняем текущую дату и время

// ===== ПОКАЗ МОДАЛКИ С TELEGRAM БОТОМ =====
function showTelegramModal() {
  let modal = document.getElementById("telegram-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "telegram-modal";
    modal.style = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;
    `;
    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; max-width: 400px;">
        <h2 style="color: black;">Подтверждение записи</h2>
        <p style="color: black;">Подпишитесь на нашего Telegram-бота и отправьте ему команду <b>/start</b> для подтверждения записи.</p>
        <div style="margin-top: 20px;">
          <button id="go-to-bot" style="padding: 10px 20px; margin-right: 10px;">Перейти к боту</button>
          <button id="close-modal" style="padding: 10px 20px;">Закрыть</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("go-to-bot").onclick = () => {
      const userId = localStorage.getItem("userId");
      const deepLink = `${TELEGRAM_BOT_URL}?start=${userId}`;
      window.open(deepLink, "_blank");

      modal.style.display = "none";
      showCompletionNotification();
    };
    document.getElementById("close-modal").onclick = () => {
      modal.style.display = "none";
    };
  } else {
    modal.style.display = "flex";
  }
}

// ===== УВЕДОМЛЕНИЕ О ЗАВЕРШЕНИИ ЗАПИСИ В TELEGRAM =====
function showCompletionNotification() {
  const notification = document.createElement("div");
  notification.style = `
    position: fixed; bottom: 20px; right: 20px; 
    background: #4CAF50; color: white; 
    padding: 15px; border-radius: 5px; 
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  notification.innerHTML = `
    <p style="margin: 0; font-weight: bold;">Завершите запись в Telegram</p>
    <p style="margin: 5px 0 0 0;">Нажмите на кнопку "Подтвердить запись" в боте</p>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 1s";
    setTimeout(() => notification.remove(), 1000);
  }, 10000);
}

// ===== ОБРАБОТКА КНОПКИ "ОФОРМИТЬ ВИЗИТ" =====
window.submitVisit = async function() {
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Пожалуйста, выберите услугу, сотрудника и дату/время!");
    return;
  }

  const success = await savePendingBooking(bookingData);
  if (success) {
    showTelegramModal();
  } else {
    alert("Ошибка сохранения записи. Попробуйте позже.");
  }
};

// ===== ПРОВЕРКА TELEGRAM DEEP LINK =====
function checkTelegramDeepLink() {
  const urlParams = new URLSearchParams(window.location.search);
  const telegramId = urlParams.get('telegram_id');
  
  if (telegramId) {
    const userId = localStorage.getItem("userId");

    fetch(`${API_BASE_URL}/link-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, telegramId })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem("telegramId", telegramId);
        const notification = document.createElement("div");
        notification.style = `
          position: fixed; bottom: 20px; right: 20px; 
          background: #4CAF50; color: white; 
          padding: 15px; border-radius: 5px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 1000;
        `;
        notification.innerHTML = `
          <p style="margin: 0; font-weight: bold;">Аккаунт связан с Telegram</p>
          <p style="margin: 5px 0 0 0;">Теперь вы можете управлять записями через бот</p>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = "0";
          notification.style.transition = "opacity 1s";
          setTimeout(() => notification.remove(), 1000);
        }, 5000);

        history.replaceState({}, document.title, location.pathname);
      }
    })
    .catch(error => {
      console.error('Ошибка связывания с Telegram:', error);
    });
  }
}

// ===== ОБРАБОТКА НАЖАТИЙ ПО ПУНКТАМ "УСЛУГА", "СОТРУДНИК", "ДАТА" =====
document.addEventListener("DOMContentLoaded", () => {
  renderSavedData();
  checkTelegramDeepLink();

  const selectionElements = document.querySelectorAll('.selection');
  selectionElements.forEach(el => {
    el.addEventListener('click', () => {
      const onclickAttr = el.getAttribute('onclick');
      const match = onclickAttr && onclickAttr.match(/goTo\('(.+?)'\)/);
      if (match && match[1]) {
        goTo(match[1]);
      }
    });
  });
});
