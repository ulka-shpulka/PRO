// === leo-online.js (обновлённая версия) ===

// Немедленно запускаем диагностику при загрузке скрипта
console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

// Константы
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot"; // <-- твой бот здесь

// Сохранение данных
function saveData() {
  console.log("💾 Сохраняем выбранные данные в localStorage");
  // Ничего не делаем напрямую - сохраняем в select* функциях
}

// Загрузка данных
function loadSavedData() {
  console.log("📥 Загружаем сохранённые данные из localStorage");
  return {
    service: localStorage.getItem("selectedService") || null,
    staff: localStorage.getItem("selectedEmployee") || null,
    datetime: localStorage.getItem("selectedDatetime") || null,
    userId: localStorage.getItem("telegramUserId") || null
  };
}

// Формирование сообщения для Telegram
function createTelegramMessage() {
  const { service, staff, datetime } = loadSavedData();
  if (!service || !staff || !datetime) {
    console.error("❌ Не все данные выбраны для формирования сообщения");
    return null;
  }
  
  const formattedDateTime = formatDateTime(datetime);
  
  return `
Новая запись!
Услуга: ${service}
Специалист: ${staff}
Дата и время: ${formattedDateTime}
  `.trim();
}

// Перенаправление в Telegram с сообщением
function sendToTelegram() {
  const message = createTelegramMessage();
  if (!message) {
    alert("⚠️ Невозможно отправить запись: заполните все поля.");
    return;
  }
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`${TELEGRAM_BOT_URL}?start=${encodedMessage}`, '_blank');
}

// Функции выбора
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

// Функция получения Telegram user ID
function getTelegramUserId() {
  return localStorage.getItem('telegramUserId');
}

// Остальной твой код (checkData, checkDOMElements, formatDateTime, goTo и т.д.)
// ... (он остаётся полностью таким, как ты прислал выше)

// Главная функция обработки записи
window.submitVisit = function() {
  console.log("=== НАЧАЛО ВЫПОЛНЕНИЯ submitVisit() ===");
  
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add("disabled");
    console.log("Кнопка заблокирована");
  }
  
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Пожалуйста, выберите услугу, сотрудника и время перед оформлением записи.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled");
    }
    return;
  }
  
  console.log("Данные для записи готовы:", bookingData);

  const confirmed = confirm(
    "🛎 Чтобы подтвердить запись, подпишитесь на нашего Telegram-бота.\n\nНажмите OK, чтобы перейти."
  );
  
  if (!confirmed) {
    console.log("Пользователь отменил запись");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("disabled");
    }
    return;
  }
  
  if (submitBtn) {
    submitBtn.textContent = "Отправка...";
  }
  
  console.log("Отправка данных...");
  
  sendBookingData(
    bookingData.service,
    bookingData.staff,
    bookingData.date,
    bookingData.time,
    bookingData.userId
  )
  .then(response => {
    console.log("✅ Успешный ответ:", response);
    if (response.success) {
      alert("✅ Запись успешно оформлена! Информация отправлена в Telegram.");
    } else {
      throw new Error(response.error || "Неизвестная ошибка сервера");
    }
  })
  .catch(error => {
    console.error("❌ Ошибка при записи:", error);
    alert("⚠️ Произошла ошибка при оформлении записи. Попробуйте позже или свяжитесь с нами через Telegram.");
  })
  .finally(() => {
    console.log("Финальная обработка...");
    
    // Открываем Telegram
    sendToTelegram();

    // Очищаем localStorage
    localStorage.clear();
    
    // Обновляем интерфейс
    const elements = checkDOMElements();
    if (elements.serviceElement) elements.serviceElement.textContent = "Не выбрано";
    if (elements.staffElement) elements.staffElement.textContent = "Не выбрано";
    if (elements.timeElement) elements.timeElement.textContent = "Не выбрано";
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("disabled");
      submitBtn.textContent = "ОФОРМИТЬ ВИЗИТ";
    }
    
    console.log("Подготовка перехода на leo.html через 2 секунды");
    setTimeout(() => {
      console.log("Переход на leo.html");
      window.location.href = "leo.html";
    }, 2000);
  });
  
  console.log("=== КОНЕЦ ВЫПОЛНЕНИЯ submitVisit() ===");
};

// Остальная часть твоего кода с DOMContentLoaded, делегированием клика и финальными логами
// ... (она остаётся без изменений)

console.log("=== СКРИПТ ПОЛНОСТЬЮ ЗАГРУЖЕН ===");
console.log("Для ручного запуска записи используйте: window.submitVisit()");
