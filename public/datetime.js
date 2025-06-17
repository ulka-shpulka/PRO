const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Пример занятых слотов на даты с 1июня мая по 1 июля
const bookedTimes = {
  "2025-06-01": ["9:00", "13:40"],
  "2025-06-02": ["10:00", "16:00"],
  "2025-06-03": ["12:00"],
  "2025-06-04": ["9:40", "15:00"],
  "2025-06-05": ["11:20", "13:40"],
  "2025-06-06": ["9:00"],
  "2025-06-07": ["13:40", "16:00"],
  "2025-06-08": ["12:00", "15:00"],
  "2025-06-09": ["9:40"],
  "2025-06-10": ["9:00", "11:20"],
  "2025-06-11": ["10:00", "13:40"],
  "2025-06-12": ["12:00"],
  "2025-06-13": ["13:40", "16:00"],
  "2025-06-14": ["9:00"],
  "2025-06-15": ["10:00", "15:00"],
  "2025-06-16": ["11:20", "12:00"],
  "2025-06-17": ["9:40"],
  "2025-06-18": ["13:40", "16:00"],
  "2025-06-19": ["9:00", "15:00"],
  "2025-06-20": ["10:00", "12:00"],
  "2025-06-21": ["9:40"],
  "2025-06-22": ["11:20", "13:40"],
  "2025-06-23": ["9:00", "10:00"],
  "2025-06-24": ["12:00", "16:00"],
  "2025-06-25": ["9:40", "13:40"],
  "2025-06-26": ["11:20"],
  "2025-06-27": ["10:00", "12:00"],
  "2025-06-28": ["9:00", "15:00"],
  "2025-06-29": ["13:40"],
  "2025-06-30": ["9:40", "11:20"],
  "2025-06-31": ["10:00", "16:00"],
  "2025-07-01": ["9:00", "13:40"]
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

        // Создаем объект даты
        const [year, month, day] = selectedDate.split('-');
        const [hours, minutes] = selectedTime.split(':');
        
        // Формируем ISO строку в формате YYYY-MM-DDThh:mm
        // Этот формат ожидается функцией formatDateTime на главной странице
        const isoDateTime = `${selectedDate}T${selectedTime}`;
        
        // Сохраняем выбранную дату и время в localStorage в правильном формате
        localStorage.setItem("selectedDatetime", isoDateTime);

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