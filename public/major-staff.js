const staffData = {
  "Короткая(простая) (3000₸ / 1 ч)": [
    { name: "Вера", experience: "Стаж: 5 лет" },
    { name: "Наташа", experience: "Стаж: 1 год" },
    { name: "Инна", experience: "Стаж: 2 года" }
  ],
  "Пикси (4000₸ / 1 ч)": [
    { name: "Зоя", experience: "Стаж: 6 лет" },
    { name: "Тамара", experience: "Стаж: 3 года" },
    { name: "Оксана", experience: "Стаж: 4 года" }
  ],
  "Каскад (4000₸ / 1.5 ч)": [
    { name: "Нелли", experience: "Стаж: 5 лет" },
    { name: "Элина", experience: "Стаж: 2 года" },
    { name: "Валентина", experience: "Стаж: 6 лет" }
  ],
  "Корни (3000₸+с/м / 3 ч)": [
    { name: "Снежана", experience: "Стаж: 4 года" },
    { name: "Диана", experience: "Стаж: 5 лет" },
    { name: "Кира", experience: "Стаж: 2 года" }
  ],
  "Короткая стрижка (5000₸+с/м / 4 ч)": [
    { name: "Роза", experience: "Стаж: 1 год" },
    { name: "Карина", experience: "Стаж: 3 года" },
    { name: "Зина", experience: "Стаж: 2 года" }
  ],
  "Ниже плеч длина (7000₸-15000₸+с/м / 5-6 ч)": [
    { name: "Эвелина", experience: "Стаж: 4 года" },
    { name: "Ярослава", experience: "Стаж: 2 года" },
    { name: "София", experience: "Стаж: 3 года" }
  ],
  "Короткая стрижка (7000₸ / 3 ч)": [
    { name: "Агата", experience: "Стаж: 2 года" },
    { name: "Виктория", experience: "Стаж: 5 лет" },
    { name: "Тая", experience: "Стаж: 3 года" }
  ],
  "Ниже плеч длина (10000₸ / 5 ч)": [
    { name: "Леся", experience: "Стаж: 6 лет" },
    { name: "Яна", experience: "Стаж: 3 года" },
    { name: "Лариса", experience: "Стаж: 2 года" }
  ],
  "Коррекция + форма (4000₸ / 2 ч)": [
    { name: "Галина", experience: "Стаж: 4 года" },
    { name: "Марианна", experience: "Стаж: 3 года" },
    { name: "Эльвира", experience: "Стаж: 2 года" }
  ],
  "Коррекция + окрашивание (2500₸ / 1 ч)": [
    { name: "Таисия", experience: "Стаж: 6 лет" },
    { name: "Регина", experience: "Стаж: 3 года" },
    { name: "Люба", experience: "Стаж: 1 год" }
  ],
  "Комплекс коррекция бровей (4000₸ / 2 ч)": [
    { name: "Гюзель", experience: "Стаж: 7 лет" },
    { name: "Эмилия", experience: "Стаж: 4 года" },
    { name: "Рита", experience: "Стаж: 2 года" }
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
    window.location.href = "major-online.html";
  });
  