const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Пример занятых слотов на конкретную дату (можно позже брать из базы или сервера)
const bookedTimes = {
  "2025-04-15": ["10:00", "13:40", "16:00"],
  "2025-04-16": ["9:15", "12:00"],
  "2025-04-17": ["9:30", "12:20"],
  "2025-04-18": ["9:50", "12:40"],
  "2025-04-19": ["11:15", "12:00"],
  "2025-04-20": ["9:15", "12:00"],
  "2025-04-21": ["15:15", "16:00"],
  "2025-04-22": ["13:15", "13:00"],

};

// Список времён по услуге (рандомно подобранные интервалы)
const availableTimes = [
  "9:00", "9:15", "9:30", "9:40", "9:50", "10:00", "11:15", "11:20",
  "12:00", "12:20", "12:40", "13:00", "13:15", "13:40", "15:00", "15:15", "16:00"
];

let selectedTime = "";
let selectedDate = "";

// Когда выбираем дату
datePicker.addEventListener("change", () => {
  selectedDate = datePicker.value;
  renderTimeSlots(selectedDate);
});

// Функция отрисовки доступных слотов на выбранную дату
function renderTimeSlots(date) {
  timeContainer.innerHTML = ""; // Очищаем контейнер
  timeContainer.classList.add("visible");
  selectedTime = ""; // Сбрасываем выбранное время
  continueBtn.style.display = "none"; // Скрываем кнопку

  availableTimes.forEach(time => {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.textContent = time;

    // Проверяем, занято ли это время на выбранную дату
    if (bookedTimes[date]?.includes(time)) {
      slot.classList.add("booked"); // Если занято — добавляем класс booked
    } else {
      // Если доступно, то по клику выбираем время
      slot.addEventListener("click", () => {
        document.querySelectorAll(".time-slot").forEach(el => el.classList.remove("selected"));
        slot.classList.add("selected"); // Подсвечиваем выбранное время
        selectedTime = time;
        // Сохраняем выбранную дату и время в localStorage
        localStorage.setItem("selectedDate", selectedDate);
        localStorage.setItem("selectedTime", selectedTime);

        // Для отладки
        console.log("Selected Date: ", selectedDate);
        console.log("Selected Time: ", selectedTime);

        continueBtn.style.display = "block"; // Показываем кнопку
      });
    }

    timeContainer.appendChild(slot);
  });
}

// Функция перехода на страницу с подтверждением записи
function continueBooking() {
  if (selectedDate && selectedTime) {
    // Если дата и время выбраны, переходим на главную страницу
    window.location.href = "amour-online.html";
  }
}
