const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Пример занятых слотов на конкретную дату (можно позже брать из базы или сервера)
const bookedTimes = {
  "2025-05-01": ["9:00", "13:40"],
  "2025-05-02": ["10:00", "16:00"],
  "2025-05-03": ["12:00"],
  "2025-05-04": ["9:40", "15:00"],
  "2025-05-05": ["11:20", "13:40"],
  "2025-05-06": ["9:00"],
  "2025-05-07": ["13:40", "16:00"],
  "2025-05-08": ["12:00", "15:00"],
  "2025-05-09": ["9:40"],
  "2025-05-10": ["9:00", "11:20"],
  "2025-05-11": ["10:00", "13:40"],
  "2025-05-12": ["12:00"],
  "2025-05-13": ["13:40", "16:00"],
  "2025-05-14": ["9:00"],
  "2025-05-15": ["10:00", "15:00"],
  "2025-05-16": ["11:20", "12:00"],
  "2025-05-17": ["9:40"],
  "2025-05-18": ["13:40", "16:00"],
  "2025-05-19": ["9:00", "15:00"],
  "2025-05-20": ["10:00", "12:00"],
  "2025-05-21": ["9:40"],
  "2025-05-22": ["11:20", "13:40"],
  "2025-05-23": ["9:00", "10:00"],
  "2025-05-24": ["12:00", "16:00"],
  "2025-05-25": ["9:40", "13:40"],
  "2025-05-26": ["11:20"],
  "2025-05-27": ["10:00", "12:00"],
  "2025-05-28": ["9:00", "15:00"],
  "2025-05-29": ["13:40"],
  "2025-05-30": ["9:40", "11:20"],
  "2025-05-31": ["10:00", "16:00"],
  "2025-06-01": ["9:00", "13:40"]
};

// Список времён по услуге (рандомно подобранные интервалы)
const availableTimes = [
  "9:00", "9:40", "10:00", "11:20",
  "12:00", "13:40", "15:00", "16:00"
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
        
        // Дополнительно сохраняем их в одном формате, чтобы красиво отобразить на главной
        localStorage.setItem("selectedDatetime", `${selectedDate} в ${selectedTime}`);

        continueBtn.style.display = "block"; // Показываем кнопку
      });
    }

    timeContainer.appendChild(slot);
  });
}

// Обработчик нажатия на кнопку "Продолжить запись"
continueBtn.addEventListener("click", () => {
  if (selectedDate && selectedTime) {
    // Если дата и время выбраны, переходим на главную страницу
    window.location.href = "leo-online.html";
  }
});
