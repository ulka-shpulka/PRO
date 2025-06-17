const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Пример занятых слотов на даты с 1июня мая по 1 июля
const bookedTimes = {
  "2025-06-01": ["9:00", "13:00"],
  "2025-06-02": ["10:00", "14:30", "16:00"],
  "2025-06-03": ["9:30", "11:00"],
  "2025-06-04": ["12:00", "15:30"],
  "2025-06-05": ["10:30", "13:30", "16:30"],
  "2025-06-06": ["9:00", "11:30"],
  "2025-06-07": ["12:30", "14:00", "17:00"],
  "2025-06-08": ["10:00", "13:00"],
  "2025-06-09": ["9:30", "12:00", "15:00"],
  "2025-06-10": ["11:00", "14:30"],
  "2025-06-11": ["9:00", "10:30", "13:30"],
  "2025-06-12": ["12:00", "16:30"],
  "2025-06-13": ["9:30", "15:00"],
  "2025-06-14": ["10:00", "13:00", "16:00"],
  "2025-06-15": ["11:30", "14:00"],
  "2025-06-16": ["9:00", "10:30", "13:30", "17:00"],
  "2025-06-17": ["12:00", "14:30"],
  "2025-06-18": ["10:00", "13:00", "15:30"],
  "2025-06-19": ["11:00", "14:00"],
  "2025-06-20": ["9:30", "12:30", "16:00"],
  "2025-06-21": ["10:00", "13:30"],
  "2025-06-22": ["11:00", "14:30", "16:30"],
  "2025-06-23": ["9:00", "12:00"],
  "2025-06-24": ["10:30", "13:00", "15:00"],
  "2025-06-25": ["11:30", "14:00", "16:00"],
  "2025-06-26": ["9:30", "12:30"],
  "2025-06-27": ["10:00", "13:00", "17:00"],
  "2025-06-28": ["11:00", "15:30"],
  "2025-06-29": ["9:00", "10:30", "13:30"],
  "2025-06-30": ["12:00", "14:30", "16:30"],
  "2025-06-31": ["9:30", "11:30", "15:00"],
  "2025-07-01": ["10:00", "13:00", "16:00"]
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
