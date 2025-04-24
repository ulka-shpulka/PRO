// Функция для выбора услуги
function selectService(service) {
  // Сохраняем выбранную услугу в localStorage
  localStorage.setItem('selectedService', service);

  // При изменении услуги сбрасываем выбранного сотрудника
  localStorage.removeItem('selectedStaff');

  // Убираем выделение с предыдущей выбранной услуги
  const allServices = document.querySelectorAll('.service');
  allServices.forEach(function(serviceElement) {
    serviceElement.classList.remove('selected');
  });

  // Добавляем класс "selected" к текущей выбранной услуге
  const selectedServiceElement = event.target;
  selectedServiceElement.classList.add('selected');

  // Отображаем кнопку "Продолжить запись"
  document.getElementById('continueBtn').style.display = 'block';
}

// Функция для переключения категорий
function toggleCategory(category) {
  const categoryList = document.getElementById(category);
  categoryList.style.display = categoryList.style.display === 'block' ? 'none' : 'block';
}

// Переход на главную страницу
function goToMainPage() {
  window.location.href = 'amour-online.html';
}
