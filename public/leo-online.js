console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

// API URL configuration - make sure this matches your server
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

// Очистка данных при загрузке страницы
function clearStoredBookingData() {
  // Очищаем только данные о записи, но сохраняем userId
  const userId = localStorage.getItem("userId");
  localStorage.clear();
  
  // Восстанавливаем userId, если он был
  if (userId) {
    localStorage.setItem("userId", userId);
  }
  
  console.log("🧹 Данные о записи очищены");
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

// Load DOM event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log("📦 Страница полностью загружена");
  
  // Очищаем данные бронирования при загрузке главной страницы
  if (window.location.pathname === "/" || window.location.pathname.includes("index") || window.location.pathname.includes("leo-online")) {
    clearStoredBookingData();
  }
  
  renderSavedData();
});

// Save pending booking to the server - simplified to reduce errors
async function savePendingBooking(bookingData) {
  try {
    console.log("Отправляем данные на сервер:", bookingData);
    
    const response = await fetch(`${API_BASE_URL}/pending-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    // Handle non-OK responses
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

// Selection functions
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

  // Проверяем, что дата и время в правильном формате
  const dateObj = new Date(datetime);
  if (isNaN(dateObj.getTime())) {
    console.error("❌ Неверный формат даты:", datetime);
    alert("Ошибка: Неверный формат даты.");
    return;
  }

  localStorage.setItem("selectedDatetime", datetime);
  goTo('leo-online');
}

// Generate unique user ID if not present
function ensureUserId() {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("userId", userId);
  }
  return userId;
}

// Prepare booking data for submission
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
    
    // Дополнительная проверка на формат даты и времени
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
      timestamp: new Date().toISOString() // Добавляем метку времени для сортировки
    };
  } catch (error) {
    console.error("❌ Ошибка при подготовке данных записи:", error);
    return null;
  }
}

// Создаем и показываем модальное окно с просьбой подписаться на бота
function showTelegramModal() {
  // Проверяем, существует ли уже модальное окно
  let modal = document.getElementById("telegram-modal");
  
  // Если нет, создаем его
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
    message.innerHTML = "Для подтверждения записи, пожалуйста, подпишитесь на нашего Telegram бота.<br><br><b>После подписки на бота, отправьте ему команду /start, чтобы получить подтверждение вашей записи.</b>";
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
    
    // Добавляем обработчики событий
    confirmButton.onclick = async () => {
      // Скрываем модальное окно
      modal.style.display = "none";
      
      // Открываем Telegram бота в новой вкладке
      window.open(TELEGRAM_BOT_URL, "_blank");
    };
    
    cancelButton.onclick = () => {
      modal.style.display = "none";
    };
    
    // Собираем модальное окно
    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);
    
    modalContent.appendChild(header);
    modalContent.appendChild(message);
    modalContent.appendChild(buttonContainer);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  } else {
    // Если модальное окно уже существует, просто показываем его
    modal.style.display = "flex";
  }
}

// Handle the submission process
window.submitVisit = async function() {
  console.log("=== НАЧАЛО ВЫПОЛНЕНИЯ submitVisit() ===");
  
  // Check if all required data is selected
  const { service, staff, datetime } = loadSavedData();
  if (!service || !staff || !datetime) {
    alert("Пожалуйста, выберите услугу, сотрудника и время перед оформлением записи.");
    return;
  }
  
  // Prepare booking data
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Не удалось подготовить данные записи. Проверьте все поля.");
    return;
  }

  // Сохраняем данные записи на сервере
  const success = await savePendingBooking(bookingData);
  
  if (success) {
    // Показываем модальное окно с предложением подписаться на Telegram бота
    showTelegramModal();
  } else {
    alert("❌ Не удалось сохранить запись. Попробуйте позже или свяжитесь с администратором.");
  }
};

// Добавляем обработчик события для очистки данных при закрытии/обновлении страницы
window.addEventListener('beforeunload', function() {
  if (window.location.pathname === "/" || window.location.pathname.includes("index") || window.location.pathname.includes("leo-online")) {
    clearStoredBookingData();
  }
});