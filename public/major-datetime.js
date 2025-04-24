const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Пример занятых слотов на конкретную дату (можно позже брать из базы или сервера)
const bookedTimes = {
  "2025-05-01": ["9:00", "13:00"],
  "2025-05-02": ["10:00", "14:30", "16:00"],
  "2025-05-03": ["9:30", "11:00"],
  "2025-05-04": ["12:00", "15:30"],
  "2025-05-05": ["10:30", "13:30", "16:30"],
  "2025-05-06": ["9:00", "11:30"],
  "2025-05-07": ["12:30", "14:00", "17:00"],
  "2025-05-08": ["10:00", "13:00"],
  "2025-05-09": ["9:30", "12:00", "15:00"],
  "2025-05-10": ["11:00", "14:30"],
  "2025-05-11": ["9:00", "10:30", "13:30"],
  "2025-05-12": ["12:00", "16:30"],
  "2025-05-13": ["9:30", "15:00"],
  "2025-05-14": ["10:00", "13:00", "16:00"],
  "2025-05-15": ["11:30", "14:00"],
  "2025-05-16": ["9:00", "10:30", "13:30", "17:00"],
  "2025-05-17": ["12:00", "14:30"],
  "2025-05-18": ["10:00", "13:00", "15:30"],
  "2025-05-19": ["11:00", "14:00"],
  "2025-05-20": ["9:30", "12:30", "16:00"],
  "2025-05-21": ["10:00", "13:30"],
  "2025-05-22": ["11:00", "14:30", "16:30"],
  "2025-05-23": ["9:00", "12:00"],
  "2025-05-24": ["10:30", "13:00", "15:00"],
  "2025-05-25": ["11:30", "14:00", "16:00"],
  "2025-05-26": ["9:30", "12:30"],
  "2025-05-27": ["10:00", "13:00", "17:00"],
  "2025-05-28": ["11:00", "15:30"],
  "2025-05-29": ["9:00", "10:30", "13:30"],
  "2025-05-30": ["12:00", "14:30", "16:30"],
  "2025-05-31": ["9:30", "11:30", "15:00"],
  "2025-06-01": ["10:00", "13:00", "16:00"]
};



// Список времён по услуге (рандомно подобранные интервалы)
const availableTimes = [
  "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
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
    window.location.href = "major-online.html";
  }
}
