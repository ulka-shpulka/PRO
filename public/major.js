document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("loaded");
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    // Добавляем класс loaded для анимаций при загрузке
    document.body.classList.add("loaded");
    
    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', adjustLayoutOnResize);
    
    // Проверяем размер экрана при загрузке
    adjustLayoutOnResize();
    
    // Анимация для появления отзывов при прокрутке
    const reviews = document.querySelectorAll('.review-modern');
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    reviews.forEach(review => {
      observer.observe(review);
    });
  });
  
  // Функция для корректировки макета при изменении размера экрана
  function adjustLayoutOnResize() {
    const isMobile = window.innerWidth <= 1000;
    const reviewContainers = document.querySelectorAll('.review-modern');
    
    // Устанавливаем задержки анимации для мобильных устройств
    if (isMobile) {
      reviewContainers.forEach((container, index) => {
        container.style.animationDelay = `${0.1 + (index * 0.2)}s`;
      });
    }
  }