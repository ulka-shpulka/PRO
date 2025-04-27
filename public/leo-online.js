console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

// API URL configuration
const API_BASE_URL = "https://pro-1-qldl.onrender.com/api";
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot";

// Navigation function
window.goTo = function(section) {
  console.log(`🔀 Переход на страницу: ${section}`);
  switch (section) {
    case 'services':
      window.location.href = "services.html";
      break;
    case 'staff':
      window.location.href = "staff.html";
      break;
    case 'datetime':
      window.location.href = "datetime.html";
      break;
    case 'leo-online':
      window.location.href = "leo-online.html";
      break;
    default:
      console.error(`❌ Неизвестный раздел: ${section}`);
  }
};

// Format date and time for display
function formatDateTime(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    console.error("❌ Неверный формат ISO строки:", isoString);
    return "Неверный формат даты";
  }

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleString('ru-RU', options);
}

// Очистка данных записи
function clearStoredBookingData() {
  const userId = localStorage.getItem("userId");
  localStorage.removeItem("selectedService");
  localStorage.removeItem("selectedEmployee");
  localStorage.removeItem("selectedDatetime");
  console.log("🧹 Данные о записи очищены");
  
  if (userId) {
    localStorage.setItem("userId", userId);
  }
}

// Render saved data from localStorage to page
function renderSavedData() {
  const service = localStorage.getItem("selectedService") || "Не выбрано";
  const staff = localStorage.getItem("selectedEmployee") || "Не выбрано";
  const datetime = localStorage.getItem("selectedDatetime") || "Не выбрано";

  const serviceElement = document.getElementById("chosen-service");
  const staffElement = document.getElementById("chosen-staff");
  const timeElement = document.getElementById("chosen-time");

  if (serviceElement) serviceElement.textContent = service;
  if (staffElement) staffElement.textContent = staff;
  if (timeElement) {
    timeElement.textContent = (datetime !== "Не выбрано") ? formatDateTime(datetime) : "Не выбрано";
  }
}

// Save pending booking to the server
async function savePendingBooking(bookingData) {
  try {
    console.log("Отправляем данные на сервер:", bookingData);

    const response = await fetch(`${API_BASE_URL}/pending-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      console.error(`Сервер вернул ошибку ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log('Ответ сервера:', data);
    return data.success === true;
  } catch (error) {
    console.error('Ошибка при сохранении записи:', error);
    return false;
  }
}

// Load saved data from localStorage
function loadSavedData() {
  console.log("📥 Загружаем сохранённые данные из localStorage");
  return {
    service: localStorage.getItem("selectedService") || null,
    staff: localStorage.getItem("selectedEmployee") || null,
    datetime: localStorage.getItem("selectedDatetime") || null,
    userId: localStorage.getItem("userId") || null
  };
}

// Выборы услуги, сотрудника, даты/времени
function selectService(serviceName) {
  console.log("Выбрана услуга:", serviceName);
  localStorage.setItem("selectedService", serviceName);
  goTo('staff');
}

function selectStaff(staffName) {
  console.log("Выбран сотрудник:", staffName);
  localStorage.setItem("selectedEmployee", staffName);
  goTo('datetime');
}

function selectDateTime(datetime) {
  console.log("Выбраны дата и время:", datetime);

  const dateObj = new Date(datetime);
  if (isNaN(dateObj.getTime())) {
    console.error("❌ Неверный формат даты:", datetime);
    alert("Ошибка: Неверный формат даты.");
    return;
  }

  localStorage.setItem("selectedDatetime", datetime);
  goTo('leo-online');
}

// Создание userId
function ensureUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

// Подготовка данных для бронирования
function prepareBookingData() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = ensureUserId();

  if (!service || !staff || !datetime) {
    console.error("❌ Нет всех обязательных данных для записи", { service, staff, datetime });
    return null;
  }

  try {
    const [date, time] = datetime.split('T');
    if (!date || !time) {
      console.error("❌ Неверный формат даты и времени:", datetime);
      return null;
    }

    return { 
      service, 
      staff, 
      date, 
      time, 
      userId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("❌ Ошибка при подготовке данных записи:", error);
    return null;
  }
}

// Модальное окно Telegram
function showTelegramModal() {
  let modal = document.getElementById("telegram-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "telegram-modal";
    modal.style.position = "fixed";
    modal.style.left = "0";
    modal.style.top = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.7)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000";

    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "white";
    modalContent.style.borderRadius = "10px";
    modalContent.style.padding = "20px";
    modalContent.style.maxWidth = "500px";
    modalContent.style.width = "90%";
    modalContent.style.textAlign = "center";

    const header = document.createElement("h2");
    header.textContent = "Подтверждение записи";
    header.style.marginBottom = "15px";
    header.style.color = "#444";

    const message = document.createElement("p");
    message.innerHTML = "Для подтверждения записи, пожалуйста, подпишитесь на нашего Telegram бота.<br><br><b>После подписки отправьте ему команду /start.</b>";
    message.style.marginBottom = "20px";
    message.style.lineHeight = "1.5";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "10px";

    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Перейти к боту";
    confirmButton.style.padding = "10px 20px";
    confirmButton.style.backgroundColor = "#4CAF50";
    confirmButton.style.color = "white";
    confirmButton.style.border = "none";
    confirmButton.style.borderRadius = "5px";
    confirmButton.style.cursor = "pointer";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Отмена";
    cancelButton.style.padding = "10px 20px";
    cancelButton.style.backgroundColor = "#f44336";
    cancelButton.style.color = "white";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "5px";
    cancelButton.style.cursor = "pointer";

    confirmButton.onclick = () => {
      modal.style.display = "none";
      window.open(TELEGRAM_BOT_URL, "_blank");
    };

    cancelButton.onclick = () => {
      modal.style.display = "none";
    };

    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);
    modalContent.appendChild(header);
    modalContent.appendChild(message);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  } else {
    modal.style.display = "flex";
  }
}

// Submit booking
window.submitVisit = async function() {
  console.log("=== НАЧАЛО ВЫПОЛНЕНИЯ submitVisit() ===");

  const { service, staff, datetime } = loadSavedData();
  if (!service || !staff || !datetime) {
    alert("Пожалуйста, выберите услугу, сотрудника и время перед оформлением записи.");
    return;
  }

  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Не удалось подготовить данные записи.");
    return;
  }

  const success = await savePendingBooking(bookingData);

  if (success) {
    showTelegramModal();
  } else {
    alert("❌ Не удалось сохранить запись. Попробуйте позже.");
  }
};

// Загрузка страницы
document.addEventListener('DOMContentLoaded', () => {
  console.log("📦 Страница полностью загружена");

  if (performance.getEntriesByType("navigation")[0].type === "reload") {
    if (window.location.pathname === "/" || window.location.pathname.includes("index") || window.location.pathname.includes("leo-online")) {
      clearStoredBookingData();
    }
  }

  renderSavedData();
});
