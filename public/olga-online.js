// Загружаем выбранную услугу, сотрудника и дату/время из localStorage
window.onload = function() {
    const service = localStorage.getItem('selectedService');
    const staff = localStorage.getItem('selectedStaff');
    const selectedDate = localStorage.getItem('selectedDate');
    const selectedTime = localStorage.getItem('selectedTime');
  
    // Отображаем выбранные данные на главной странице
    if (service) {
      document.getElementById('chosen-service').textContent = service;
    } else {
      document.getElementById('chosen-service').textContent = 'Не выбрано';
    }
  
    if (staff) {
      const selectedStaff = JSON.parse(staff);
      document.getElementById('chosen-staff').textContent = `${selectedStaff.name} (${selectedStaff.experience})`;
    } else {
      document.getElementById('chosen-staff').textContent = 'Не выбрано';
    }
  
    if (selectedDate && selectedTime) {
      document.getElementById('chosen-time').textContent = `Дата: ${selectedDate}, Время: ${selectedTime}`;
    } else {
      document.getElementById('chosen-time').textContent = 'Не выбрано';
    }
  };
  
  // Переход к следующей странице
  function goTo(page) {
    if (page === 'olga-service') {
      window.location.href = 'olga-service.html';
    } else if (page === 'olga-staff') {
      window.location.href = 'olga-staff.html';
    } else if (page === 'olga-datetime') {
      window.location.href = 'olga-datetime.html';
    }
  }
  
  function submitVisit() {
    alert('Ваш визит оформлен!');
    // Сбросить все данные при оформлении визита
    localStorage.clear();
  }
  