const API_BASE_URL = "https://pro-1-qldl.onrender.com/api";
const TELEGRAM_BOT_URL = "https://t.me/MLfeBot";

window.goTo = function(section) {
  localStorage.setItem("returnUrl", window.location.href);
  switch (section) {
    case 'services':
    case 'staff':
    case 'datetime':
    case 'leo-online':
      window.location.href = `${section}.html`;
      break;
    default:
      console.error(`Неизвестный раздел: ${section}`);
  }
};

function formatDateTime(isoString) {
  const date = new Date(isoString);
  return !isNaN(date) 
    ? date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "Неверный формат даты";
}

function clearStoredBookingData() {
  const userId = localStorage.getItem("userId");
  localStorage.clear();
  if (userId) localStorage.setItem("userId", userId);
}

function renderSavedData() {
  const service = localStorage.getItem("selectedService") || "Не выбрано";
  const staff = localStorage.getItem("selectedEmployee") || "Не выбрано";
  const datetime = localStorage.getItem("selectedDatetime") || "Не выбрано";

  document.getElementById("chosen-service")?.textContent = service;
  document.getElementById("chosen-staff")?.textContent = staff;
  document.getElementById("chosen-time")?.textContent = datetime !== "Не выбрано" ? formatDateTime(datetime) : "Не выбрано";

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    const disabled = (service === "Не выбрано" || staff === "Не выбрано" || datetime === "Не выбрано");
    submitBtn.disabled = disabled;
    submitBtn.style.opacity = disabled ? "0.6" : "1";
    submitBtn.style.cursor = disabled ? "not-allowed" : "pointer";
  }
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
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = ensureUserId();

  if (!service || !staff || !datetime) return null;

  let date = "";
  let time = "";

  const dateObj = new Date(datetime);
  if (!isNaN(dateObj)) {
    date = dateObj.toISOString().split('T')[0];
    time = dateObj.toTimeString().slice(0, 5);
  } else {
    return null;
  }

  return { service, staff, date, time, userId };
}

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
        <p>Подпишитесь на бота и отправьте ему команду <b>/start</b> для подтверждения записи.</p>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
          <button id="go-to-bot" style="padding: 12px 25px; background: #4CAF50; color: white; border: none; border-radius: 5px;">Перейти к боту</button>
          <button id="cancel-modal" style="padding: 12px 25px; background: #f44336; color: white; border: none; border-radius: 5px;">Отмена</button>
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
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  } else {
    modal.style.display = "flex";
  }
}

window.submitVisit = async function() {
  const bookingData = prepareBookingData();
  if (!bookingData) {
    alert("Пожалуйста, выберите услугу, сотрудника и время!");
    return;
  }

  const success = await savePendingBooking(bookingData);
  if (success) {
    showTelegramModal();
  } else {
    alert("Ошибка сохранения брони. Попробуйте позже.");
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage.includes('services')) initServicesPage();
  if (currentPage.includes('staff')) initStaffPage();
  if (currentPage.includes('datetime')) initDatetimePage();
  if (currentPage.includes('leo-online') || currentPage === 'index.html' || currentPage === '') {
    renderSavedData();
    if (performance.getEntriesByType("navigation")[0].type === "reload") {
      clearStoredBookingData();
      renderSavedData();
    }
  }

  const selectionElements = document.querySelectorAll('.selection');
  selectionElements.forEach(el => {
    el.addEventListener('click', () => {
      const section = el.getAttribute('onclick')?.match(/goTo\('(.+?)'\)/)?.[1];
      if (section) goTo(section);
    });
  });
});

function initServicesPage() {
  document.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('click', function() {
      const serviceName = this.querySelector('.service-name').textContent;
      localStorage.setItem('selectedService', serviceName);
      window.location.href = localStorage.getItem('returnUrl') || 'leo-online.html';
    });
  });
}

function initStaffPage() {
  document.querySelectorAll('.staff-item').forEach(item => {
    item.addEventListener('click', function() {
      const staffName = this.querySelector('.staff-name').textContent;
      localStorage.setItem('selectedEmployee', staffName);
      window.location.href = localStorage.getItem('returnUrl') || 'leo-online.html';
    });
  });
}

function initDatetimePage() {
  const dateInput = document.getElementById('date-picker');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  const confirmBtn = document.getElementById('confirm-datetime');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const dateVal = dateInput.value;
      const timeVal = document.getElementById('time-picker')?.value;
      if (dateVal && timeVal) {
        localStorage.setItem('selectedDatetime', `${dateVal}T${timeVal}`);
        window.location.href = localStorage.getItem('returnUrl') || 'leo-online.html';
      } else {
        alert('Выберите дату и время!');
      }
    });
  }
}
