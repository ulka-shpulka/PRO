// leo-online.js - скрипт для страницы онлайн-записи

document.addEventListener("DOMContentLoaded", function () {
  // Загрузка сохраненных данных из localStorage
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");

  // Обновление UI с выбранными значениями
  document.getElementById("chosen-service").textContent = service || "Не выбрано";
  document.getElementById("chosen-staff").textContent = staff || "Не выбрано";
  document.getElementById("chosen-time").textContent = 
    datetime ? formatDateTime(datetime) : "Не выбрано";

  // Активация кнопки только при наличии необходимой информации
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = !(service && staff && datetime);
  
  // Добавляем класс для стилизации отключенной кнопки
  if (submitBtn.disabled) {
    submitBtn.classList.add("disabled");
  } else {
    submitBtn.classList.remove("disabled");
  }
});

// Функция для форматирования даты и времени
function formatDateTime(datetimeStr) {
  const dt = new Date(datetimeStr);
  
  // Форматирование даты
  const day = dt.getDate().toString().padStart(2, '0');
  const month = (dt.getMonth() + 1).toString().padStart(2, '0');
  const year = dt.getFullYear();
  
  // Форматирование времени
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');
  
  return `${day}.${month}.${year} в ${hours}:${minutes}`;
}

// Функция для перехода на другие страницы
function goTo(page) {
  // Если переходим назад к выбору услуг, сбрасываем выбор мастера и время
  if (page === 'services') {
    localStorage.removeItem("selectedEmployee");
    localStorage.removeItem("selectedDatetime");
  }
  
  // Если переходим назад к выбору мастера, сбрасываем выбор времени
  if (page === 'staff') {
    localStorage.removeItem("selectedDatetime");
  }

  window.location.href = `${page}.html`;
}

// Функция для отправки данных о записи
function submitVisit() {
  // Получаем данные из localStorage
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");

  // Проверяем наличие необходимых данных
  if (!service || !staff || !datetime) {
    alert("Пожалуйста, выберите услугу, сотрудника и время перед оформлением записи.");
    return;
  }

  // Спрашиваем у пользователя подтверждение подписки на бота
  const confirmed = confirm(
    "🛎 Чтобы подтвердить запись, подпишитесь на нашего Telegram-бота.\n\nНажмите OK, чтобы перейти."
  );
  
  if (!confirmed) return;

  // Отключаем кнопку и показываем статус загрузки
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.classList.add("disabled");
  submitBtn.textContent = "Отправка...";

  // Разделяем datetime на дату и время
  const [date, time] = datetime.split("T");

  // Отправляем данные на сервер
  sendBookingData(service, staff, date, time)
    .then((response) => {
      if (response.success) {
        alert("✅ Запись успешно оформлена! Информация отправлена в Telegram.");
      } else {
        throw new Error(response.error || "Неизвестная ошибка");
      }
    })
    .catch((error) => {
      console.error("Ошибка при оформлении записи:", error);
      alert("⚠️ Произошла ошибка при оформлении записи. Попробуйте позже или свяжитесь с нами через Telegram.");
    })
    .finally(() => {
      // Открываем Telegram-бот в новой вкладке
      window.open("https://t.me/RarlourBot", "_blank");
      
      // Очищаем данные о записи
      localStorage.clear();
      
      // Сбрасываем UI
      document.getElementById("chosen-service").textContent = "Не выбрано";
      document.getElementById("chosen-staff").textContent = "Не выбрано";
      document.getElementById("chosen-time").textContent = "Не выбрано";

      // Восстанавливаем кнопку
      submitBtn.disabled = true;
      submitBtn.classList.add("disabled");
      submitBtn.textContent = "ОФОРМИТЬ ВИЗИТ";
      
      // Возвращаемся на главную страницу (опционально)
      setTimeout(() => {
        window.location.href = "leo.html";
      }, 2000);
    });
}

// Функция для отправки данных на сервер
function sendBookingData(service, staff, date, time) {
  // URL вашего API (замените на реальный URL вашего сервера)
  const apiUrl = "http://localhost:3000/book";
  
  // Для продакшена используйте полный URL вашего сервера
  // const apiUrl = "https://ваш-домен.com/book";
  
  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      service, 
      staff, 
      date, 
      time
    }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    return response.json();
  });
}

// Функции для страницы выбора услуг
function selectService(serviceName) {
  localStorage.setItem("selectedService", serviceName);
  goTo('staff'); // Переходим к выбору сотрудника
}

// Функция для страницы выбора сотрудника
function selectStaff(staffName) {
  localStorage.setItem("selectedEmployee", staffName);
  goTo('datetime'); // Переходим к выбору даты и времени
}

// Функция для страницы выбора даты и времени
function selectDateTime(datetime) {
  localStorage.setItem("selectedDatetime", datetime);
  goTo('leo-online'); // Возвращаемся на страницу подтверждения
}