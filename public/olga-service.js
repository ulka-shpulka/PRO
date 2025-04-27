// Функция для выбора услуги
function selectService(serviceName) {
  // Сохраняем выбранную услугу в localStorage
  localStorage.setItem('selectedService', serviceName);

  // При изменении услуги сбрасываем выбранного сотрудника
  localStorage.removeItem('selectedStaff');

  // Убираем выделение с предыдущей выбранной услуги
  const allServices = document.querySelectorAll('.service');
  allServices.forEach(function(serviceElement) {
    serviceElement.classList.remove('selected');
  });

  // Добавляем класс "selected" к текущей выбранной услуге
  const services = document.querySelectorAll('.service');
  services.forEach(service => {
    if (service.textContent.includes(serviceName.split('(')[0].trim())) {
      service.classList.add('selected');
    }
  });

  // Отображаем кнопку "Продолжить запись"
  document.getElementById('continueBtn').style.display = 'block';
}

// Функция для переключения категорий
function toggleCategory(categoryId) {
  const categoryList = document.getElementById(categoryId);

  if (categoryList) {
    if (categoryList.style.display === 'flex') {
      categoryList.style.display = 'none';
    } else {
      categoryList.style.display = 'flex';
    }
  }
}

// Функция перехода на страницу онлайн-записи
function goToOnline() {
  window.location.href = 'olga-online.html';
}

// При загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Скрыть все списки услуг
  const serviceLists = document.querySelectorAll('.services-list');
  serviceLists.forEach(list => {
    list.style.display = 'none';
  });
});
