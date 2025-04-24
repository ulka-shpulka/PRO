const staffByService = {
    "Френч": [
      { name: "Алиса Ковалева", experience: "5 лет" },
      { name: "Мария Смирнова", experience: "3 года" }
    ],
    "Маникюр": [
      { name: "Светлана Никифорова", experience: "6 лет" },
      { name: "Елена Ильина", experience: "4 года" }
    ],
    "Педикюр": [
      { name: "Виктория Чернова", experience: "3 года" },
      { name: "Юлия Фомина", experience: "5 лет" }
    ],
  
    "Окрашивание": [
      { name: "Дмитрий Лисин", experience: "8 лет" },
      { name: "Анна Соловьева", experience: "6 лет" },
      { name: "Светлана Рябова", experience: "7 лет" }
    ],
    "Стрижка": [
      { name: "Иван Мельников", experience: "4 года" },
      { name: "Артём Зуев", experience: "5 лет" }
    ],
    "Укладка": [
      { name: "Наталья Белая", experience: "6 лет" },
      { name: "Екатерина Петрова", experience: "7 лет" }
    ],
  
    "Общий массаж": [
      { name: "Олег Громов", experience: "9 лет" },
      { name: "Татьяна Сергеева", experience: "5 лет" }
    ],
    "Массаж лица": [
      { name: "Ирина Кудрявцева", experience: "4 года" },
      { name: "Марина Алексеева", experience: "6 лет" }
    ],
  
    "Дневной макияж": [
      { name: "Ольга Захарова", experience: "6 лет" },
      { name: "Вера Орлова", experience: "3 года" }
    ],
    "Вечерний макияж": [
      { name: "Алена Гаврилова", experience: "7 лет" },
      { name: "Кристина Данилова", experience: "5 лет" }
    ]
  };
  
  const selectedService = localStorage.getItem("selectedService");
  const container = document.getElementById("employee-container");
  const serviceNameHeading = document.getElementById("selected-service-name");
  const continueBtn = document.getElementById("continueBtn");
  
  if (selectedService) {
    serviceNameHeading.textContent = `Выбранная услуга: ${selectedService}`;
    const staffList = staffByService[selectedService];
  
    if (staffList && staffList.length > 0) {
      staffList.forEach(({ name, experience }) => {
        const label = document.createElement("label");
        label.className = "employee-card";
  
        const span = document.createElement("span");
        span.innerHTML = `<strong>${name}</strong><br><small>Стаж: ${experience}</small>`;
  
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "employee";
        input.value = name;
  
        label.appendChild(span);
        label.appendChild(input);
        container.appendChild(label);
  
        input.addEventListener("change", () => {
          localStorage.setItem("selectedEmployee", input.value);
          continueBtn.style.display = "block";
        });
      });
    } else {
      container.innerHTML = `<p>Нет сотрудников, оказывающих услугу "${selectedService}"</p>`;
    }
  } else {
    container.innerHTML = `<p>Пожалуйста, сначала выберите услугу.</p>`;
  }
  
  function continueBooking() {
    const selectedRadio = document.querySelector('input[name="employee"]:checked');
    if (selectedRadio) {
      localStorage.setItem("selectedEmployee", selectedRadio.value); // на всякий случай
      window.location.href = "index.html";
    } else {
      alert("Пожалуйста, выберите сотрудника перед продолжением.");
    }
  }
  
