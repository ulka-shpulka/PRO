console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

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

document.addEventListener('DOMContentLoaded', () => {
  console.log("📦 Страница полностью загружена");
  renderSavedData(); 
});

const TELEGRAM_BOT_URL = "https://t.me/MLfeBot"; // Бот

async function savePendingBooking(bookingData) {
  try {
    const response = await fetch('https://pro-1-qldl.onrender.com/api/pending-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    const data = await response.json();
    console.log('Ответ сервера на сохранение pending booking:', data);
    if (!data.success) {
      alert("❌ Не удалось сохранить запись. Попробуйте позже.");
      return false;
    }
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении pending booking:', error);
    alert("❌ Не удалось сохранить запись. Попробуйте позже.");
    return false;
  }
}

function saveData() {
  console.log("💾 Сохраняем выбранные данные в localStorage");
}

function loadSavedData() {
  console.log("📥 Загружаем сохранённые данные из localStorage");
  return {
    service: localStorage.getItem("selectedService") || null,
    staff: localStorage.getItem("selectedEmployee") || null,
    datetime: localStorage.getItem("selectedDatetime") || null,
    userId: localStorage.getItem("telegramUserId") || null
  };
}

function createTelegramMessage() {
  const { service, staff, datetime } = loadSavedData();
  if (!service || !staff || !datetime) {
    console.error("❌ Не все данные выбраны для формирования сообщения");
    return null;
  }
  
  const formattedDateTime = formatDateTime(datetime);
  
  return `Новая запись!
Услуга: ${service}
Специалист: ${staff}
Дата и время: ${formattedDateTime}
  `.trim();
}

function sendToTelegram() {
  const message = createTelegramMessage();
  if (!message) {
    alert("⚠️ Невозможно отправить запись: заполните все поля.");
    return;
  }
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`${TELEGRAM_BOT_URL}?start=${encodedMessage}`, '_blank');
}

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
  localStorage.setItem("selectedDatetime", datetime);
  goTo('leo-online');
}

function prepareBookingData() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = localStorage.getItem("telegramUserId");

  if (!service || !staff || !datetime || !userId) {
    console.error("❌ Нет всех обязательных данных для записи", { service, staff, datetime, userId });
    return null;
  }

  const [date, time] = datetime.split('T');

  return { service, staff, date, time, userId };
}

function formatDateTime(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleString('ru-RU', options);
}

function checkDOMElements() {
  return {
    serviceElement: document.getElementById("selectedService"),
    staffElement: document.getElementById("selectedEmployee"),
    timeElement: document.getElementById("selectedDatetime")
  };
}

window.submitVisit = async function() {
  console.log("=== НАЧАЛО ВЫПОЛНЕНИЯ submitVisit() ===");
  
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Пожалуйста, выберите услугу, сотрудника и время перед оформлением записи.");
    return;
  }

  const confirmed = confirm(
    "🛎 Чтобы подтвердить запись, подпишитесь на нашего Telegram-бота.\n\nНажмите OK, чтобы перейти."
  );

  if (!confirmed) {
    console.log("Пользователь отменил запись");
    return;
  }

  const success = await savePendingBooking(bookingData);

  if (success) {
    console.log("✅ Pending booking успешно сохранено. Переход к боту...");
    window.open(`${TELEGRAM_BOT_URL}`, '_blank');
  } else {
    alert("❌ Не удалось сохранить запись. Попробуйте позже.");
  }
};
