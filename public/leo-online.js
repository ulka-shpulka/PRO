// Сохраняем код в файл leo-online.js (полная замена)

// Немедленно запускаем диагностику при загрузке скрипта
console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

// Функция для проверки данных
function checkData() {
  console.log("=== ДИАГНОСТИКА ДАННЫХ ===");
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = localStorage.getItem("telegramUserId");
  
  console.log("Service:", service, service ? "OK" : "MISSING");
  console.log("Staff:", staff, staff ? "OK" : "MISSING");
  console.log("Datetime:", datetime, datetime ? "OK" : "MISSING");
  console.log("User ID:", userId, userId ? "OK" : "MISSING");

  // Если userId отсутствует, установим временный ID для тестирования
  if (!userId) {
    console.log("⚠️ Установка временного userId для тестирования");
    localStorage.setItem("telegramUserId", "TEST_USER_" + Math.floor(Math.random() * 1000000));
  }

  return {
    service: service || null,
    staff: staff || null,
    datetime: datetime || null,
    userId: localStorage.getItem("telegramUserId") || null
  };
}

// Функция для проверки элементов DOM
function checkDOMElements() {
  console.log("=== ДИАГНОСТИКА DOM ЭЛЕМЕНТОВ ===");
  
  const elements = {
    serviceElement: document.getElementById("chosen-service"),
    staffElement: document.getElementById("chosen-staff"),
    timeElement: document.getElementById("chosen-time"),
    submitBtn: document.getElementById("submitBtn")
  };
  
  console.log("Service element:", elements.serviceElement ? "Найден" : "НЕ НАЙДЕН");
  console.log("Staff element:", elements.staffElement ? "Найден" : "НЕ НАЙДЕН");
  console.log("Time element:", elements.timeElement ? "Найден" : "НЕ НАЙДЕН");
  console.log("Submit button:", elements.submitBtn ? "Найден" : "НЕ НАЙДЕН");
  
  if (elements.submitBtn) {
    console.log("Button attributes:", {
      id: elements.submitBtn.id,
      disabled: elements.submitBtn.disabled,
      classList: Array.from(elements.submitBtn.classList),
      onclick: elements.submitBtn.onclick ? "функция присутствует" : "ОТСУТСТВУЕТ",
      innerHTML: elements.submitBtn.innerHTML
    });
  }
  
  return elements;
}

// Функции форматирования даты
function formatDateTime(datetimeStr) {
  if (!datetimeStr) return "Не выбрано";
  
  try {
    const dt = new Date(datetimeStr);
    if (isNaN(dt.getTime())) {
      console.error("❌ Некорректная дата:", datetimeStr);
      return "Некорректная дата";
    }
    
    const day = dt.getDate().toString().padStart(2, '0');
    const month = (dt.getMonth() + 1).toString().padStart(2, '0');
    const year = dt.getFullYear();
    const hours = dt.getHours().toString().padStart(2, '0');
    const minutes = dt.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} в ${hours}:${minutes}`;
  } catch (error) {
    console.error("❌ Ошибка форматирования даты:", error);
    return "Ошибка даты";
  }
}

// Функция навигации
function goTo(page) {
  console.log(`Переход на страницу: ${page}.html`);
  
  if (page === 'services') {
    localStorage.removeItem("selectedEmployee");
    localStorage.removeItem("selectedDatetime");
  }
  if (page === 'staff') {
    localStorage.removeItem("selectedDatetime");
  }
  
  window.location.href = `${page}.html`;
}

// Отдельная функция для подготовки данных записи
function prepareBookingData() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = localStorage.getItem("telegramUserId");
  
  if (!service || !staff || !datetime || !userId) {
    console.error("❌ Не все данные для записи доступны");
    return null;
  }
  
  let date, time;
  try {
    [date, time] = datetime.split("T");
    if (!date || !time) {
      console.warn("⚠️ Проблема с форматом даты/времени, пробуем альтернативный парсинг");
      const dt = new Date(datetime);
      date = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
      time = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.error("❌ Критическая ошибка обработки даты:", error);
    return null;
  }
  
  return { service, staff, date, time, userId };
}

// Функция отправки данных
function sendBookingData(service, staff, date, time, userId) {
  console.log("📤 Отправка данных на сервер:", { service, staff, date, time, userId });
  
  const apiUrl = "https://pro-1-qldl.onrender.com/api/booking";
  
  // Добавляем тайм-аут для отладки
  console.log("Начало отправки запроса...");
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer simple-token" // Простой токен для тестирования
        },
        body: JSON.stringify({ service, staff, date, time, userId })
      })
      .then(response => {
        console.log("Получен ответ от сервера:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP ошибка: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Данные от сервера:", data);
        resolve(data);
      })
      .catch(error => {
        console.error("❌ Ошибка запроса:", error);
        reject(error);
      });
    }, 500); // Задержка для отладки
  });
}

// Главная функция обработки записи
window.submitVisit = function() {
  console.log("=== НАЧАЛО ВЫПОЛНЕНИЯ submitVisit() ===");
  
  // 1. Блокируем повторное нажатие
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add("disabled");
    console.log("Кнопка заблокирована");
  } else {
    console.error("❌ Кнопка не найдена в DOM");
  }
  
  // 2. Готовим данные
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
  
  // 3. Запрос подтверждения
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
  
  // 4. Обновление интерфейса
  if (submitBtn) {
    submitBtn.textContent = "Отправка...";
  }
  
  console.log("Отправка данных...");
  
  // 5. Выполнение запроса
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
    
    // Открываем Telegram бота
    try {
      window.open("https://t.me/MLfeBot", "_blank");
    } catch (e) {
      console.error("❌ Не удалось открыть Telegram:", e);
    }
    
    // Очищаем данные
    localStorage.clear();
    
    // Обновляем UI
    const elements = checkDOMElements();
    if (elements.serviceElement) elements.serviceElement.textContent = "Не выбрано";
    if (elements.staffElement) elements.staffElement.textContent = "Не выбрано";
    if (elements.timeElement) elements.timeElement.textContent = "Не выбрано";
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("disabled");
      submitBtn.textContent = "ОФОРМИТЬ ВИЗИТ";
    }
    
    // Переходим на главную
    console.log("Подготовка перехода на leo.html через 2 секунды");
    setTimeout(() => {
      console.log("Переход на leo.html");
      window.location.href = "leo.html";
    }, 2000);
  });
  
  console.log("=== КОНЕЦ ВЫПОЛНЕНИЯ submitVisit() ===");
};

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

function getTelegramUserId() {
  return localStorage.getItem('telegramUserId');
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function() {
  console.log("=== DOMContentLoaded СОБЫТИЕ ===");
  
  // Запуск диагностики
  const data = checkData();
  const elements = checkDOMElements();
  
  // Обновление интерфейса
  if (elements.serviceElement) elements.serviceElement.textContent = data.service || "Не выбрано";
  if (elements.staffElement) elements.staffElement.textContent = data.staff || "Не выбрано";
  if (elements.timeElement) elements.timeElement.textContent = data.datetime ? formatDateTime(data.datetime) : "Не выбрано";
  
  // Обновление состояния кнопки
  if (elements.submitBtn) {
    // Проверка заполнения всех полей
    const isFormComplete = data.service && data.staff && data.datetime && data.userId;
    
    console.log("Форма заполнена полностью:", isFormComplete);
    
    elements.submitBtn.disabled = !isFormComplete;
    
    if (elements.submitBtn.disabled) {
      elements.submitBtn.classList.add("disabled");
    } else {
      elements.submitBtn.classList.remove("disabled");
    }
    
    // ВАЖНО! Переопределяем обработчик событий напрямую
    // (может не понадобиться из-за атрибута onclick в HTML)
    if (!elements.submitBtn.onclick) {
      console.warn("⚠️ У кнопки нет обработчика onclick, добавляем резервный");
      elements.submitBtn.onclick = window.submitVisit;
    }
  }
  
  // Дополнительный диагност: кликабельна ли кнопка?
  console.log("=== ДИАГНОСТИКА КЛИКАБЕЛЬНОСТИ ===");
  if (elements.submitBtn) {
    console.log("Кнопка может быть нажата:", !elements.submitBtn.disabled);
    console.log("Свойство onclick кнопки:", elements.submitBtn.onclick ? "НАЗНАЧЕНО" : "ОТСУТСТВУЕТ");
    
    // Тестовый клик для отладки в консоли
    console.log("Чтобы протестировать кнопку вручную, выполните в консоли: document.getElementById('submitBtn').click()");
  }
});

// Резервный способ: делегирование события на уровне документа
document.addEventListener('click', function(event) {
  if (event.target && event.target.id === 'submitBtn') {
    console.log("Клик на кнопку обнаружен через делегирование!");
    // Не вызываем submitVisit здесь, так как у кнопки уже есть onclick в HTML
  }
});

// Вывод финального сообщения
console.log("=== СКРИПТ ПОЛНОСТЬЮ ЗАГРУЖЕН ===");
console.log("Для ручного запуска записи используйте: window.submitVisit()");