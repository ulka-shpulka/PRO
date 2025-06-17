const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Генерация всех временных слотов с шагом 30–60 минут
function generateAvailableTimes() {
  const times = [];
  let current = new Date(0, 0, 0, 9, 0); // начало в 9:00
  const end = new Date(0, 0, 0, 17, 0); // конец в 17:00

  while (current <= end) {
    const hours = current.getHours().toString().padStart(2, "0");
    const minutes = current.getMinutes().toString().padStart(2, "0");
    times.push(`${hours}:${minutes}`);

    const step = Math.random() < 0.5 ? 30 : 60; // случайный шаг 30 или 60 мин
    current.setMinutes(current.getMinutes() + step);
  }

  return times;
}

// Список всех доступных времен
const availableTimes = generateAvailableTimes();

// Пример занятых слотов на даты с 1июня мая по 1 июля
const bookedTimes = {
  "2025-06-01": ["09:30", "11:00", "13:30"],
  "2025-06-02": ["10:00", "12:00", "14:00", "16:00"],
  "2025-06-03": ["09:00", "11:30", "13:00", "15:30"],
  "2025-06-04": ["09:30", "12:30", "14:30"],
  "2025-06-05": ["10:30", "13:00", "15:00"],
  "2025-06-06": ["09:00", "11:00", "12:30"],
  "2025-06-07": ["09:30", "12:00", "14:00"],
  "2025-06-08": ["10:00", "11:30", "13:30"],
  "2025-06-09": ["09:00", "10:30", "12:00", "15:00"],
  "2025-06-10": ["09:30", "11:00", "13:00", "14:30"],
  "2025-06-11": ["10:00", "12:00", "13:30"],
  "2025-06-12": ["09:00", "11:30", "14:00"],
  "2025-06-13": ["09:30", "12:00", "13:00", "15:00"],
  "2025-06-14": ["10:00", "11:30", "14:30"],
  "2025-06-15": ["09:00", "10:30", "13:00", "15:30"],
  "2025-06-16": ["09:30", "11:00", "13:30"],
  "2025-06-17": ["10:00", "12:30", "14:00"],
  "2025-06-18": ["09:00", "11:00", "13:00", "15:00"],
  "2025-06-19": ["09:30", "12:00", "14:30"],
  "2025-06-20": ["10:00", "11:30", "13:30"],
  "2025-06-21": ["09:00", "12:00", "14:00"],
  "2025-06-22": ["09:30", "11:00", "13:00", "15:30"],
  "2025-06-23": ["10:00", "12:30", "14:30"],
  "2025-06-24": ["09:00", "11:30", "13:00", "15:00"],
  "2025-06-25": ["09:30", "12:00", "14:00"],
  "2025-06-26": ["10:00", "11:30", "13:30"],
  "2025-06-27": ["09:00", "10:30", "12:00", "15:00"],
  "2025-06-28": ["09:30", "11:00", "13:00", "14:30"],
  "2025-06-29": ["10:00", "12:30", "14:00"],
  "2025-06-30": ["09:00", "11:30", "13:30"],
  "2025-06-31": ["09:30", "12:00", "14:30"],
  "2025-07-01": ["10:00", "11:00", "13:00"]
};

let selectedTime = "";
let selectedDate = "";

// При выборе даты
datePicker.addEventListener("change", () => {
  selectedDate = datePicker.value;
  renderTimeSlots(selectedDate);
});

// Отрисовка всех слотов
function renderTimeSlots(date) {
  timeContainer.innerHTML = "";
  timeContainer.classList.add("visible");
  selectedTime = "";
  continueBtn.style.display = "none";

  availableTimes.forEach(time => {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.textContent = time;

    const bookedForDate = bookedTimes[date] || [];
    const isBooked = bookedForDate.includes(time);

    if (isBooked) {
      slot.classList.add("booked");
      // Забронированные нельзя выбрать
    } else {
      slot.addEventListener("click", () => {
        document.querySelectorAll(".time-slot").forEach(el => el.classList.remove("selected"));
        slot.classList.add("selected");
        selectedTime = time;

        localStorage.setItem("selectedDate", selectedDate);
        localStorage.setItem("selectedTime", selectedTime);

        console.log("Selected Date:", selectedDate);
        console.log("Selected Time:", selectedTime);

        continueBtn.style.display = "block";
      });
    }

    timeContainer.appendChild(slot);
  });
}

// Переход на следующую страницу
function continueBooking() {
  if (selectedDate && selectedTime) {
    window.location.href = "amour-online.html";
  }
}
continueBtn.addEventListener("click", continueBooking);
