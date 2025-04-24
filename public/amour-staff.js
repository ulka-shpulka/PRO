const staffData = {
  "Маникюр однотонное покрытие (6000₸ / 2-3 ч)": [
    { name: "Анна", experience: "Стаж: 4 года" },
    { name: "Дарья", experience: "Стаж: 2 года" },
    { name: "Людмила", experience: "Стаж: 3 года" }
  ],
  "Маникюр без покрытия (4000₸ / 2 ч)": [
    { name: "Светлана", experience: "Стаж: 3 года" },
    { name: "Олеся", experience: "Стаж: 2 года" },
    { name: "Вероника", experience: "Стаж: 4 года" }
  ],
  "Френч (+1000 / 2 ч)": [
    { name: "Кристина", experience: "Стаж: 5 лет" },
    { name: "Яна", experience: "Стаж: 3 года" },
    { name: "Диана", experience: "Стаж: 2 года" }
  ],
  "Коррекция бровей (2000-2500₸ / 2 ч)": [
    { name: "Елена", experience: "Стаж: 6 лет" },
    { name: "Алина", experience: "Стаж: 3 года" },
    { name: "Мария", experience: "Стаж: 2 года" }
  ],
  "Окрашивание бровей (4000₸ / 2 ч)": [
    { name: "Ирина", experience: "Стаж: 3 года" },
    { name: "Жанна", experience: "Стаж: 4 года" },
    { name: "Оксана", experience: "Стаж: 2 года" }
  ],
  "Ламинирование бровей (5000₸ / 60 мин)": [
    { name: "Марина", experience: "Стаж: 4 года" },
    { name: "Лилия", experience: "Стаж: 3 года" },
    { name: "Алена", experience: "Стаж: 2 года" }
  ],
  "Ресницы без окрашивания (5500₸ / 1 ч)": [
    { name: "Алёна", experience: "Стаж: 2 года" },
    { name: "Валерия", experience: "Стаж: 4 года" },
    { name: "Ксения", experience: "Стаж: 3 года" }
  ],
  "Ресницы с окрашиванием (6000₸ / 1,5 ч)": [
    { name: "Жанна", experience: "Стаж: 5 лет" },
    { name: "Полина", experience: "Стаж: 3 года" },
    { name: "Виктория", experience: "Стаж: 2 года" }
  ],
  "Дневной макияж (7000₸ / 1 ч)": [
    { name: "Татьяна", experience: "Стаж: 4 года" },
    { name: "Юлия", experience: "Стаж: 2 года" },
    { name: "Римма", experience: "Стаж: 3 года" }
  ],
  "Вечерний макияж (7000₸ / 1 ч)": [
    { name: "Наталья", experience: "Стаж: 6 лет" },
    { name: "Злата", experience: "Стаж: 3 года" },
    { name: "Нина", experience: "Стаж: 2 года" }
  ],
  "Свадебный макияж (9000₸ / 1.5 ч)": [
    { name: "Ольга", experience: "Стаж: 7 лет" },
    { name: "Екатерина", experience: "Стаж: 4 года" },
    { name: "Мила", experience: "Стаж: 3 года" }
  ]
};


const staffListDiv = document.getElementById("staffList");
const continueBtn = document.getElementById("continueBtn");
const selectedService = localStorage.getItem("selectedService");

// сбрасываем ранее выбранного сотрудника, если услуга была изменена
const previousStaff = JSON.parse(localStorage.getItem("selectedStaff"));
const previousService = localStorage.getItem("serviceForStaff");
if (previousService !== selectedService) {
  localStorage.removeItem("selectedStaff");
  localStorage.setItem("serviceForStaff", selectedService);
}

if (selectedService && staffData[selectedService]) {
  staffData[selectedService].forEach(staff => {
    const div = document.createElement("div");
    div.classList.add("staff");

    const name = document.createElement("div");
    name.classList.add("staff-name");
    name.textContent = staff.name;

    const exp = document.createElement("div");
    exp.classList.add("staff-experience");
    exp.textContent = staff.experience;

    div.appendChild(name);
    div.appendChild(exp);

    div.addEventListener("click", () => {
      document.querySelectorAll(".staff").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");

      localStorage.setItem("selectedStaff", JSON.stringify(staff));
      continueBtn.style.display = "block";
    });

    staffListDiv.appendChild(div);
  });
}

continueBtn.addEventListener("click", () => {
  window.location.href = "amour-online.html";
});
