const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Список времён с промежутком 30-60 минут
const availableTimes = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

// Пример занятых слотов на даты с 1 мая по 1 июня
const bookedTimes = {
  "2025-05-01": ["09:00", "11:30", "14:00"],
  "2025-05-02": ["10:30", "12:00", "15:00"],
  "2025-05-03": ["09:30", "13:00", "16:00"],
  "2025-05-04": ["10:00", "12:30", "15:30"],
  "2025-05-05": ["09:00", "11:00", "13:30", "16:30"],
  "2025-05-06": ["09:30", "10:30", "12:00", "14:00"],
  "2025-05-07": ["09:00", "11:30", "13:00", "15:00"],
  "2025-05-08": ["10:00", "12:30", "14:30"],
  "2025-05-09": ["09:30", "11:00", "13:30", "16:00"],
  "2025-05-10": ["09:00", "10:30", "12:00", "15:30"],
  "2025-05-11": ["09:30", "11:30", "14:00", "16:30"],
  "2025-05-12": ["10:00", "12:00", "13:30", "15:00"],
  "2025-05-13": ["09:00", "10:30", "12:30", "14:30"],
  "2025-05-14": ["09:30", "11:00", "13:00", "15:30"],
  "2025-05-15": ["09:00", "10:30", "12:00", "14:00", "16:00"],
  "2025-05-16": ["09:30", "11:30", "13:30", "15:00"],
  "2025-05-17": ["10:00", "12:30", "14:30", "16:30"],
  "2025-05-18": ["09:00", "11:00", "13:00", "15:30"],
  "2025-05-19": ["09:30", "10:30", "12:00", "14:00"],
  "2025-05-20": ["09:00", "11:30", "13:30", "16:00"],
  "2025-05-21": ["10:00", "12:30", "15:00"],
  "2025-05-22": ["09:30", "11:00", "13:00", "14:30"],
  "2025-05-23": ["09:00", "10:30", "12:00", "13:30", "16:30"],
  "2025-05-24": ["09:30", "11:30", "14:00"],
  "2025-05-25": ["10:00", "12:30", "15:30"],
  "2025-05-26": ["09:00", "11:00", "13:00", "14:30"],
  "2025-05-27": ["09:30", "10:30", "12:00", "15:00"],
  "2025-05-28": ["09:00", "11:30", "13:30", "16:00"],
  "2025-05-29": ["10:00", "12:30", "14:30"],
  "2025-05-30": ["09:30", "11:00", "13:00", "15:30"],
  "2025-05-31": ["09:00", "10:30", "12:00", "14:00", "16:00"],
  "2025-06-01": ["09:30", "11:30", "14:30"]
};

let selectedTime = "";
let selectedDate = "";

// Когда выбираем дату
datePicker.addEventListener("change", () => {
  selectedDate = datePicker.value;
  renderTimeSlots(selectedDate);
});

// Отрисовка доступных слотов
function renderTimeSlots(date) {
  timeContainer.innerHTML = ""; 
  timeContainer.classList.add("visible");
  selectedTime = "";
  continueBtn.style.display = "none";

  availableTimes.forEach(time => {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.textContent = time;

    const isBooked = bookedTimes[date]?.includes(time);

    if (isBooked) {
      slot.classList.add("booked");
      // Нельзя выбрать занятое время
    } else {
      slot.addEventListener("click", () => {
        document.querySelectorAll(".time-slot").forEach(el => el.classList.remove("selected"));
        slot.classList.add("selected");
        selectedTime = time;
        localStorage.setItem("selectedDate", selectedDate);
        localStorage.setItem("selectedTime", selectedTime);

        console.log("Selected Date: ", selectedDate);
        console.log("Selected Time: ", selectedTime);

        continueBtn.style.display = "block";
      });
    }

    timeContainer.appendChild(slot);
  });
}

// Переход на следующую страницу
function continueBooking() {
  if (selectedDate && selectedTime) {
    window.location.href = "olga-online.html";
  }
}
continueBtn.addEventListener("click", continueBooking);
