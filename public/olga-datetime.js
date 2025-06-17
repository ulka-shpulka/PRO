const timeContainer = document.getElementById("timeContainer");
const datePicker = document.getElementById("datePicker");
const continueBtn = document.getElementById("continueBtn");

// Список времён с промежутком 30-60 минут
const availableTimes = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30"
];

// Пример занятых слотов на даты с 1июня мая по 1 июля
const bookedTimes = {
  "2025-06-01": ["09:00", "11:30", "14:00"],
  "2025-06-02": ["10:30", "12:00", "15:00"],
  "2025-06-03": ["09:30", "13:00", "16:00"],
  "2025-06-04": ["10:00", "12:30", "15:30"],
  "2025-06-05": ["09:00", "11:00", "13:30", "16:30"],
  "2025-06-06": ["09:30", "10:30", "12:00", "14:00"],
  "2025-06-07": ["09:00", "11:30", "13:00", "15:00"],
  "2025-06-08": ["10:00", "12:30", "14:30"],
  "2025-06-09": ["09:30", "11:00", "13:30", "16:00"],
  "2025-06-10": ["09:00", "10:30", "12:00", "15:30"],
  "2025-06-11": ["09:30", "11:30", "14:00", "16:30"],
  "2025-06-12": ["10:00", "12:00", "13:30", "15:00"],
  "2025-06-13": ["09:00", "10:30", "12:30", "14:30"],
  "2025-06-14": ["09:30", "11:00", "13:00", "15:30"],
  "2025-06-15": ["09:00", "10:30", "12:00", "14:00", "16:00"],
  "2025-06-16": ["09:30", "11:30", "13:30", "15:00"],
  "2025-06-17": ["10:00", "12:30", "14:30", "16:30"],
  "2025-06-18": ["09:00", "11:00", "13:00", "15:30"],
  "2025-06-19": ["09:30", "10:30", "12:00", "14:00"],
  "2025-06-20": ["09:00", "11:30", "13:30", "16:00"],
  "2025-06-21": ["10:00", "12:30", "15:00"],
  "2025-06-22": ["09:30", "11:00", "13:00", "14:30"],
  "2025-06-23": ["09:00", "10:30", "12:00", "13:30", "16:30"],
  "2025-06-24": ["09:30", "11:30", "14:00"],
  "2025-06-25": ["10:00", "12:30", "15:30"],
  "2025-06-26": ["09:00", "11:00", "13:00", "14:30"],
  "2025-06-27": ["09:30", "10:30", "12:00", "15:00"],
  "2025-06-28": ["09:00", "11:30", "13:30", "16:00"],
  "2025-06-29": ["10:00", "12:30", "14:30"],
  "2025-06-30": ["09:30", "11:00", "13:00", "15:30"],
  "2025-06-31": ["09:00", "10:30", "12:00", "14:00", "16:00"],
  "2025-07-01": ["09:30", "11:30", "14:30"]
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
