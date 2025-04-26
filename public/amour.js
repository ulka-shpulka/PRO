document.addEventListener("DOMContentLoaded", () => {
  console.log("Amor&Amur page loaded");

  // Функция для проверки ширины экрана и адаптации верстки
  function checkScreenWidth() {
    const isMobile = window.innerWidth <= 1000;
    const container = document.querySelector(".container");
    const circle = document.querySelector(".circle");
    const rightButton = document.querySelector(".right-button"); // Записаться
    const leftButton = document.querySelector(".left-button"); // Местонахождение
    const bottomButton = document.querySelector(".bottom-button"); // Контакты (id="contactBtn")
    
    // Проверяем, существует ли уже контейнер для кнопок
    let buttonsContainer = document.querySelector(".mobile-buttons-container");
    
    if (isMobile) {
      // Если мобильная версия и контейнер еще не создан
      if (!buttonsContainer) {
        buttonsContainer = document.createElement("div");
        buttonsContainer.className = "mobile-buttons-container";
        
        // Сначала очищаем классы, которые могут мешать корректному отображению
        bottomButton.style.position = "static";
        bottomButton.style.bottom = "auto";
        bottomButton.style.left = "auto";
        bottomButton.style.transform = "none";
        
        // Добавляем кнопки в контейнер в нужном порядке
        buttonsContainer.appendChild(leftButton); // Местонахождение
        buttonsContainer.appendChild(rightButton); // Записаться
        buttonsContainer.appendChild(bottomButton); // Контакты
        
        // Добавляем контейнер с кнопками после круга с логотипом
        container.appendChild(buttonsContainer);
      }
    } else {
      // Если десктопная версия и контейнер существует
      if (buttonsContainer) {
        // Сбрасываем стили, добавленные для мобильной версии
        bottomButton.style.position = "";
        bottomButton.style.bottom = "";
        bottomButton.style.left = "";
        bottomButton.style.transform = "";
        
        // Возвращаем кнопки в circle
        circle.appendChild(rightButton);
        circle.appendChild(leftButton);
        circle.appendChild(bottomButton);
        
        // Удаляем временный контейнер
        buttonsContainer.remove();
      }
    }
  }
  
  // Проверяем при загрузке страницы
  checkScreenWidth();
  
  // Проверяем при изменении размера окна
  window.addEventListener("resize", checkScreenWidth);

  // Остальные обработчики событий остаются без изменений...
  // Переход на страницу онлайн-записи
  document.querySelector(".right-button").addEventListener("click", () => {
    window.location.href = "amour-online.html";
  });

  // Открытие модального окна карты
  document.querySelector(".left-button").addEventListener("click", () => {
    document.getElementById("mapModal").classList.add("show");
  });

  // Закрытие модального окна карты
  document.getElementById("closeMap").addEventListener("click", () => {
    document.getElementById("mapModal").classList.remove("show");
  });

  // Открытие модального окна с контактами
  document.getElementById("contactBtn").addEventListener("click", () => {
    const contactsModal = document.getElementById("contactsModal");
    contactsModal.style.display = "flex";

    // Анимация появления
    const contactContent = contactsModal.querySelector(".contacts-content");
    contactContent.style.animation = "fadeInContacts 0.5s ease forwards";
  });

  // Закрытие модального окна с контактами
  document.getElementById("closeContacts").addEventListener("click", () => {
    document.getElementById("contactsModal").style.display = "none";
  });
});