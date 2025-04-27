document.addEventListener("DOMContentLoaded", function () {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = localStorage.getItem("telegramUserId");

  console.log("Service:", service);
  console.log("Staff:", staff);
  console.log("Datetime:", datetime);
  console.log("User ID:", userId);

  // Обновление текста на странице
  document.getElementById("chosen-service").textContent = service || "Не выбрано";
  document.getElementById("chosen-staff").textContent = staff || "Не выбрано";
  document.getElementById("chosen-time").textContent = datetime ? formatDateTime(datetime) : "Не выбрано";

  const submitBtn = document.getElementById("submitBtn");

  // Деактивация кнопки, если что-то не выбрано
  const isFormComplete = service && staff && datetime && userId;
  submitBtn.disabled = !isFormComplete;

  console.log("Form complete:", isFormComplete);

  if (submitBtn.disabled) {
    submitBtn.classList.add("disabled");
  } else {
    submitBtn.classList.remove("disabled");
  }
});

function formatDateTime(datetimeStr) {
  const dt = new Date(datetimeStr);
  const day = dt.getDate().toString().padStart(2, '0');
  const month = (dt.getMonth() + 1).toString().padStart(2, '0');
  const year = dt.getFullYear();
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year} в ${hours}:${minutes}`;
}

function goTo(page) {
  if (page === 'services') {
    localStorage.removeItem("selectedEmployee");
    localStorage.removeItem("selectedDatetime");
  }
  if (page === 'staff') {
    localStorage.removeItem("selectedDatetime");
  }
  window.location.href = `${page}.html`;
}

function submitVisit() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");
  const userId = localStorage.getItem("telegramUserId"); // Получаем userId

  console.log("Submitting Visit with data:", { service, staff, datetime, userId });

  if (!service || !staff || !datetime || !userId) {
    alert("Пожалуйста, выберите услугу, сотрудника и время перед оформлением записи.");
    return;
  }

  const confirmed = confirm(
    "🛎 Чтобы подтвердить запись, подпишитесь на нашего Telegram-бота.\n\nНажмите OK, чтобы перейти."
  );
  
  if (!confirmed) return;

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.classList.add("disabled");
  submitBtn.textContent = "Отправка...";

  const [date, time] = datetime.split("T");

  sendBookingData(service, staff, date, time, userId) // Передаем userId
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
      window.open("https://t.me/MLfeBot", "_blank");
      localStorage.clear();
      document.getElementById("chosen-service").textContent = "Не выбрано";
      document.getElementById("chosen-staff").textContent = "Не выбрано";
      document.getElementById("chosen-time").textContent = "Не выбрано";
      submitBtn.disabled = true;
      submitBtn.classList.add("disabled");
      submitBtn.textContent = "ОФОРМИТЬ ВИЗИТ";

      setTimeout(() => {
        window.location.href = "leo.html";
      }, 2000);
    });
}

function sendBookingData(service, staff, date, time, userId) {
  const apiUrl = "https://pro-1-qldl.onrender.com/api/booking";
  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ service, staff, date, time, userId }) // Передаем userId
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    return response.json();
  });
}

function getTelegramUserId() {
  return localStorage.getItem('telegramUserId');
}

function selectService(serviceName) {
  localStorage.setItem("selectedService", serviceName);
  goTo('staff');
}

function selectStaff(staffName) {
  localStorage.setItem("selectedEmployee", staffName);
  goTo('datetime');
}

function selectDateTime(datetime) {
  localStorage.setItem("selectedDatetime", datetime);
  goTo('leo-online');
}
