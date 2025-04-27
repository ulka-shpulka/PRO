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
  renderSavedData();
});

// Save pending booking to the server
async function savePendingBooking(bookingData) {
  try {
    const response = await fetch(`${API_BASE_URL}/pending-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Ответ сервера на сохранение pending booking:', data);
    
    if (!data.success) {
      alert(`❌ Не удалось сохранить запись: ${data.error || 'Неизвестная ошибка'}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении pending booking:', error);
    alert("❌ Не удалось сохранить запись. Попробуйте позже.");
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
    telegramUsername: localStorage.getItem("telegramUsername") || null
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

// Prepare booking data for submission
function prepareBookingData() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  
  // Get telegramUsername if it was saved previously, or prompt for it
  let telegramUsername = localStorage.getItem("telegramUsername");
  
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
      telegramUsername 
    };
  } catch (error) {
    console.error("❌ Ошибка при подготовке данных записи:", error);
    return null;
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
  
  // Ask for Telegram username
  let telegramUsername = prompt("Введите ваш username в Telegram (без @):");
  if (!telegramUsername) {
    alert("Для подтверждения записи необходим ваш username в Telegram.");
    return;
  }
  
  // Save username to localStorage
  localStorage.setItem("telegramUsername", telegramUsername);
  
  // Prepare booking data with updated username
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Не удалось подготовить данные записи. Проверьте все поля.");
    return;
  }

  const confirmed = confirm(
    "🛎 Чтобы подтвердить запись, подпишитесь на нашего Telegram-бота.\n\nНажмите OK, чтобы перейти."
  );

  if (!confirmed) {
    console.log("Пользователь отменил запись");
    return;
  }

  // Save pending booking to server
  const success = await savePendingBooking(bookingData);

  if (success) {
    console.log("✅ Pending booking успешно сохранено. Переход к боту...");
    
    // Open Telegram bot in new tab
    window.open(`${TELEGRAM_BOT_URL}`, '_blank');
    
    // Show follow-up instructions
    setTimeout(() => {
      alert("После подписки на бота, напишите ему команду /start чтобы получить подтверждение записи.");
    }, 500);
  }
};