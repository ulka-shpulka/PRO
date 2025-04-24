document.addEventListener("DOMContentLoaded", () => {
  console.log("Amor&Amur page loaded");

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

    // Анимация появления (если надо анимировать содержимое)
    const contactContent = contactsModal.querySelector(".contacts-content");
    contactContent.style.animation = "fadeInContacts 0.5s ease forwards";
  });

  // Закрытие модального окна с контактами
  document.getElementById("closeContacts").addEventListener("click", () => {
    document.getElementById("contactsModal").style.display = "none";
  });
});
