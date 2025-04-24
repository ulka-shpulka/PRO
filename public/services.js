function toggleCategory(id) {
  const element = document.getElementById(id);
  element.classList.toggle("open");
}

function selectService(serviceText) {
  const serviceName = serviceText.split(" (")[0]; // Убираем цену и время
  localStorage.setItem("selectedService", serviceName);

  // Удаляем выделение со всех
  document.querySelectorAll(".service").forEach(el => {
    el.classList.remove("selected");
  });

  // Добавляем выделение выбранному
  const services = document.querySelectorAll(".service");
  services.forEach(service => {
    if (service.textContent.includes(serviceName)) {
      service.classList.add("selected");
    }
  });

  // Показываем кнопку "Продолжить"
  const btn = document.getElementById("continueBtn");
  btn.style.display = "block";
}

