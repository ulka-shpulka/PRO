console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ СКРИПТА ===");
console.log("Скрипт leo-online.js загружен");
console.log("document.readyState:", document.readyState);

// Константы
const API_BASE_URL = "https://pro-1-qldl.onrender.com/api";
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot";

// Навигация
window.goTo = function(section) {
  // Сохраняем текущий URL для возврата после выбора
  localStorage.setItem("returnUrl", window.location.href);
  
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

  const serviceElement = document.getElementById("chosen-service");
  const staffElement = document.getElementById("chosen-staff");
  const timeElement = document.getElementById("chosen-time");
  
  if (serviceElement) serviceElement.textContent = service;
  if (staffElement) staffElement.textContent = staff;
  if (timeElement) timeElement.textContent = datetime !== "Не выбрано" ? formatDateTime(datetime) : "Не выбрано";
    
  // Обновляем доступность кнопки Оформить визит
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    if (service === "Не выбрано" || staff === "Не выбрано" || datetime === "Не выбрано") {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.6";
      submitBtn.style.cursor = "not-allowed";
    } else {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
    }
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
  
  // Разбиваем дату и время
  let date = "";
  let time = "";
  
  if (datetime.includes('T')) {
    [date, time] = datetime.split('T');
  } else {
    // Если дата в другом формате, попробуем преобразовать ее
    const dateObj = new Date(datetime);
    if (!isNaN(dateObj)) {
      date = dateObj.toISOString().split('T')[0];
      time = dateObj.toTimeString().split(' ')[0].substring(0, 5);
    }
  }
  
  return { 
    service, 
    staff, 
    date, 
    time, 
    userId, 
    timestamp: new Date().toISOString() 
  };
}

// Модальное окно подтверждения
function showTelegramModal() {
  // Создаем или получаем модальное окно
  let modal = document.getElementById("telegram-modal");
  
  if (!modal) {
    // Создаем модальное окно, если оно еще не существует
    modal = document.createElement("div");
    modal.id = "telegram-modal";
    modal.style = `
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%;
      background: rgba(0,0,0,0.7); 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      z-index: 9999;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white; 
        padding: 30px; 
        border-radius: 10px; 
        text-align: center; 
        max-width: 400px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      ">
        <h2 style="margin-top: 0; color: #333;">Подтверждение записи</h2>
        <p style="margin: 20px 0; line-height: 1.5;">
          После подписки на бота отправьте ему команду <b>/start</b>, чтобы получить подтверждение вашей записи.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
          <button id="go-to-bot" style="
            padding: 12px 25px; 
            background: #4CAF50; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
          ">Перейти к боту</button>
          <button id="cancel-modal" style="
            padding: 12px 25px; 
            background: #f44336; 
            color: white; 
            border: none; 
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
          ">Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Добавляем обработчики событий для кнопок
    document.getElementById("go-to-bot").onclick = () => {
      window.open(TELEGRAM_BOT_URL, "_blank");
      modal.style.display = "none";
    };
    
    document.getElementById("cancel-modal").onclick = () => {
      modal.style.display = "none";
    };
    
    // Закрытие модального окна при клике вне него
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  } else {
    // Если модальное окно уже существует, просто показываем его
    modal.style.display = "flex";
  }
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
  
  try {
    const success = await savePendingBooking(bookingData);
    if (success) {
      showTelegramModal();
    } else {
      alert("Ошибка сохранения записи. Пожалуйста, попробуйте снова.");
    }
  } catch (error) {
    console.error("Ошибка при отправке данных:", error);
    alert("Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.");
  }
};

// Инициализация страниц соответствующих разделов
function initServicesPage() {
  // Проверяем, находимся ли мы на странице услуг
  if (!document.querySelector('.service-list')) return;
  
  // Добавляем обработчики к элементам услуг
  const serviceItems = document.querySelectorAll('.service-item');
  serviceItems.forEach(item => {
    item.addEventListener('click', function() {
      const serviceName = this.querySelector('.service-name').textContent;
      localStorage.setItem('selectedService', serviceName);
      
      // Переходим назад или на следующий шаг
      const returnUrl = localStorage.getItem('returnUrl') || 'leo-online.html';
      window.location.href = returnUrl;
    });
  });
}

function initStaffPage() {
  // Проверяем, находимся ли мы на странице сотрудников
  if (!document.querySelector('.staff-list')) return;
  
  // Добавляем обработчики к элементам сотрудников
  const staffItems = document.querySelectorAll('.staff-item');
  staffItems.forEach(item => {
    item.addEventListener('click', function() {
      const staffName = this.querySelector('.staff-name').textContent;
      localStorage.setItem('selectedEmployee', staffName);
      
      // Переходим назад или на следующий шаг
      const returnUrl = localStorage.getItem('returnUrl') || 'leo-online.html';
      window.location.href = returnUrl;
    });
  });
}

function initDatetimePage() {
  // Проверяем, находимся ли мы на странице выбора даты и времени
  if (!document.querySelector('.datetime-picker')) return;
  
  // Добавляем обработчик для кнопки подтверждения даты и времени
  const dateTimeConfirmBtn = document.getElementById('confirm-datetime');
  if (dateTimeConfirmBtn) {
    dateTimeConfirmBtn.addEventListener('click', function() {
      const dateInput = document.getElementById('date-picker');
      const timeInput = document.getElementById('time-picker');
      
      if (dateInput && timeInput && dateInput.value && timeInput.value) {
        const isoDateTime = `${dateInput.value}T${timeInput.value}`;
        localStorage.setItem('selectedDatetime', isoDateTime);
        
        // Переходим назад или на следующий шаг
        const returnUrl = localStorage.getItem('returnUrl') || 'leo-online.html';
        window.location.href = returnUrl;
      } else {
        alert('Пожалуйста, выберите дату и время');
      }
    });
  }
  
  // Установка минимальной даты (сегодня)
  const dateInput = document.getElementById('date-picker');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }
}

// При загрузке
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded событие сработало");
  
  // Определяем, на какой странице мы находимся
  const currentPage = window.location.pathname.split('/').pop();
  console.log("Текущая страница:", currentPage);
  
  // Инициализируем соответствующую страницу
  if (currentPage.includes('services')) {
    initServicesPage();
  } else if (currentPage.includes('staff')) {
    initStaffPage();
  } else if (currentPage.includes('datetime')) {
    initDatetimePage();
  } else if (currentPage.includes('leo-online') || currentPage === 'index.html' || currentPage === '') {
    renderSavedData();
    
    // Очищаем данные при перезагрузке главной страницы
    if (performance.getEntriesByType("navigation")[0].type === "reload") {
      clearStoredBookingData();
      renderSavedData(); // Обновляем отображение после очистки
    }
  }
  
  // Добавляем обработчики для элементов навигации на любой странице
  const selectionElements = document.querySelectorAll('.selection');
  selectionElements.forEach(element => {
    element.addEventListener('click', function() {
      const section = this.getAttribute('onclick').match(/goTo\('(.+?)'\)/)[1];
      if (section) goTo(section);
    });
  });
});

// Для диагностики - выводим сохраненные данные в консоль
console.log("Сохраненные данные:");
console.log("- Услуга:", localStorage.getItem("selectedService"));
console.log("- Сотрудник:", localStorage.getItem("selectedEmployee"));
console.log("- Дата/время:", localStorage.getItem("selectedDatetime"));
console.log("- ID пользователя:", localStorage.getItem("userId"));