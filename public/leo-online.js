// leo-online.js - скрипт для страницы онлайн-записи

document.addEventListener("DOMContentLoaded", function () {
  // Загрузка сохраненных данных из localStorage
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");

  // Обновление UI с выбранными значениями
  document.getElementById("chosen-service").textContent = service || "Не выбрано";
  document.getElementById("chosen-staff").textContent = staff || "Не выбрано";
  document.getElementById("chosen-time").textContent = 
    datetime ? formatDateTime(datetime) : "Не выбрано";

  // Активация кнопки только при наличии необходимой информации
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = !(service && staff && datetime);
  
  // Добавляем класс для стилизации отключенной кнопки
  if (submitBtn.disabled) {
    submitBtn.classList.add("disabled");
  } else {
    submitBtn.classList.remove("disabled");
  }
});

// Функция для форматирования даты и времени
function formatDateTime(datetimeStr) {
  const dt = new Date(datetimeStr);
  
  // Форматирование даты
  const day = dt.getDate().toString().padStart(2, '0');
  const month = (dt.getMonth() + 1).toString().padStart(2, '0');
  const year = dt.getFullYear();
  
  // Форматирование времени
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');
  
  return `${day}.${month}.${year} в ${hours}:${minutes}`;
}

// Функция для перехода на другие страницы
function goTo(page) {
  // Если переходим назад к выбору услуг, сбрасываем выбор мастера и время
  if (page === 'services') {
    localStorage.removeItem("selectedEmployee");
    localStorage.removeItem("selectedDatetime");
  }
  
  // Если переходим назад к выбору мастера, сбрасываем выбор времени
  if (page === 'staff') {
    localStorage.removeItem("selectedDatetime");
  }

  window.location.href = `${page}.html`;
}

function submitVisit() {
  const service = localStorage.getItem("selectedService");
  const staff = localStorage.getItem("selectedEmployee");
  const datetime = localStorage.getItem("selectedDatetime");

  if (!service || !staff || !datetime) {
    alert("Пожалуйста, выберите услугу, сотрудника и время перед оформлением записи.");
    return;
  }

  const confirmed = confirm(
    "🛎 Чтобы подтвердить запись, подпишитесь на нашего Telegram-бота.\n\nНажмите OK, чтобы перейти."
  );
  
  if (!confirmed) return;

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.classList.add("disabled");
  submitBtn.textContent = "Отправка...";

  const [date, time] = datetime.split("T");

  sendBookingData(service, staff, date, time)
    .then((response) => {
      if (response.success) {
        alert("✅ Запись успешно оформлена! Информация отправлена в Telegram.");
      } else {
        throw new Error(response.error || "Неизвестная ошибка");
      }
    })
    .catch((error) => {
      console.error("Ошибка при оформлении записи:", error);
      alert("⚠️ Произошла ошибка при оформлении записи. Попробуйте позже или свяжитесь с нами через Telegram.");
    })
    .finally(() => {
      window.open("https://t.me/MLfeBot", "_blank");
      
      localStorage.clear();
      
      document.getElementById("chosen-service").textContent = "Не выбрано";
      document.getElementById("chosen-staff").textContent = "Не выбрано";
      document.getElementById("chosen-time").textContent = "Не выбрано";

      submitBtn.disabled = true;
      submitBtn.classList.add("disabled");
      submitBtn.textContent = "ОФОРМИТЬ ВИЗИТ";
      
      setTimeout(() => {
        window.location.href = "leo.html";
      }, 2000);
    });
}


// Функция для отправки данных на сервер
function sendBookingData(service, staff, date, time) {
  // URL вашего API (замените на реальный URL вашего сервера)
  const apiUrl = " https://lumire.onrender.com/7649901748:AAE-yAcdXAQKmIoO45ErEdVfdicBGD6dwKs";
  
  // Для продакшена используйте полный URL вашего сервера
  // const apiUrl = "https://ваш-домен.com/book";
  
  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      service, 
      staff, 
      date, 
      time
    }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    return response.json();
  });
}

// Функции для страницы выбора услуг
function selectService(serviceName) {
  localStorage.setItem("selectedService", serviceName);
  goTo('staff'); // Переходим к выбору сотрудника
}

// Функция для страницы выбора сотрудника
function selectStaff(staffName) {
  localStorage.setItem("selectedEmployee", staffName);
  goTo('datetime'); // Переходим к выбору даты и времени
}

// Функция для страницы выбора даты и времени
function selectDateTime(datetime) {
  localStorage.setItem("selectedDatetime", datetime);
  goTo('leo-online'); // Возвращаемся на страницу подтверждения
}

// Импортируем необходимые библиотеки
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

// Конфигурация
const BOT_TOKEN = '7492776215:AAFBnBmCvf_LL1QlW7zOXO19piWCRvWNb3k';
const CHANNEL_ID = '@MLfeBot'; // Замените на username вашего канала с @ или его ID
const ADMIN_USERNAME = '@sae_bun'; // Замените на username администратора

// Подключение к базе данных
mongoose.connect('mongodb://localhost:27017/beauty_salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Создание схемы для записей
const BookingSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  userName: { type: String },
  service: { type: String, required: true },
  staff: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  salon: { type: String, required: true, default: 'Салон 1' },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', BookingSchema);

// Инициализация бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Список салонов
const salons = [
  { name: 'Салон 1', address: 'ул. Пушкина, 10', link: 'https://maps.google.com/?q=Салон1' },
  { name: 'Салон 2', address: 'ул. Лермонтова, 15', link: 'https://maps.google.com/?q=Салон2' },
  { name: 'Салон 3', address: 'ул. Гоголя, 20', link: 'https://maps.google.com/?q=Салон3' },
  { name: 'Салон 4', address: 'ул. Толстого, 25', link: 'https://maps.google.com/?q=Салон4' }
];

// Функция для проверки подписки пользователя на канал
async function checkSubscription(userId) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
      params: {
        chat_id: CHANNEL_ID,
        user_id: userId
      }
    });
    
    const status = response.data.result.status;
    
    // Пользователь подписан если его статус один из: member, administrator, creator
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return false;
  }
}

// Функция создания клавиатуры с основными кнопками
function getMainKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📝 Мои записи', callback_data: 'my_records' }],
        [{ text: '🏢 Салоны', callback_data: 'salons' }],
        [{ text: '🆘 Помощь', callback_data: 'help' }]
      ]
    }
  };
}

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'Клиент';
  
  // Приветственное сообщение
  await bot.sendMessage(chatId, `Здравствуйте, ${firstName}! Для доступа к системе записи, подпишитесь на наш канал ${CHANNEL_ID}`);
  
  // Проверяем подписку
  const isSubscribed = await checkSubscription(userId);
  
  if (isSubscribed) {
    await bot.sendMessage(chatId, `Спасибо за подписку! Теперь вы можете использовать все функции бота.`, getMainKeyboard());
  } else {
    await bot.sendMessage(chatId, `Пожалуйста, подпишитесь на канал ${CHANNEL_ID}, чтобы продолжить!`);
  }
});

// Обработчик колбэк-запросов от кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;
  const data = query.data;
  
  // Подтверждаем получение колбэка
  await bot.answerCallbackQuery(query.id);
  
  // Проверяем подписку перед выполнением любых действий
  const isSubscribed = await checkSubscription(userId);
  
  if (!isSubscribed) {
    await bot.sendMessage(chatId, `Для использования бота необходимо подписаться на наш канал ${CHANNEL_ID}`);
    return;
  }
  
  // Обработка различных кнопок
  switch (data) {
    case 'my_records':
      await showUserBookings(chatId, userId);
      break;
      
    case 'salons':
      await showSalons(chatId);
      break;
      
    case 'help':
      await bot.sendMessage(chatId, `По всем вопросам обращайтесь к администратору: ${ADMIN_USERNAME}`, getMainKeyboard());
      break;
      
    // Обработка выбора салона
    case 'salon_1':
    case 'salon_2':
    case 'salon_3':
    case 'salon_4':
      const salonIndex = parseInt(data.split('_')[1]) - 1;
      await showSalonDetails(chatId, salonIndex);
      break;
      
    case 'back_to_main':
      await bot.editMessageText('Выберите действие:', {
        chat_id: chatId,
        message_id: messageId,
        ...getMainKeyboard()
      });
      break;
  }
});

// Функция для отображения записей пользователя
async function showUserBookings(chatId, userId) {
  try {
    // Получаем записи пользователя из базы данных
    const bookings = await Booking.find({ userId }).sort({ date: 1, time: 1 });
    
    if (bookings.length === 0) {
      await bot.sendMessage(chatId, 'У вас пока нет ни одной записи.', getMainKeyboard());
      return;
    }
    
    let message = '📋 *Ваши записи:*\n\n';
    
    bookings.forEach((booking, index) => {
      message += `*${index + 1}.* ${booking.service}\n`;
      message += `🧑‍💼 Мастер: ${booking.staff}\n`;
      message += `📍 Салон: ${booking.salon}\n`;
      message += `📅 Дата: ${booking.date}\n`;
      message += `🕒 Время: ${booking.time}\n\n`;
    });
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...getMainKeyboard()
    });
  } catch (error) {
    console.error('Ошибка при получении записей:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка при загрузке ваших записей. Пожалуйста, попробуйте позже.', getMainKeyboard());
  }
}

// Функция для отображения списка салонов
async function showSalons(chatId) {
  const salonKeyboard = {
    reply_markup: {
      inline_keyboard: [
        ...salons.map((salon, index) => ([
          { text: salon.name, callback_data: `salon_${index + 1}` }
        ])),
        [{ text: '◀️ Назад', callback_data: 'back_to_main' }]
      ]
    }
  };
  
  await bot.sendMessage(chatId, '🏢 *Выберите салон для получения подробной информации:*', {
    parse_mode: 'Markdown',
    ...salonKeyboard
  });
}

// Функция для отображения информации о конкретном салоне
async function showSalonDetails(chatId, index) {
  const salon = salons[index];
  
  const message = `🏢 *${salon.name}*\n\n` +
                 `📍 Адрес: ${salon.address}\n` +
                 `🔗 [Посмотреть на карте](${salon.link})`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '◀️ К списку салонов', callback_data: 'salons' }],
        [{ text: '◀️ В главное меню', callback_data: 'back_to_main' }]
      ]
    }
  };
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
    ...keyboard
  });
}

// API endpoint для обработки запросов от сайта
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Эндпоинт для создания записи
app.post('/api/booking', async (req, res) => {
  try {
    const { userId, userName, service, staff, date, time, salon } = req.body;
    
    // Проверяем подписку пользователя
    const isSubscribed = await checkSubscription(userId);
    
    if (!isSubscribed) {
      return res.status(403).json({ 
        success: false, 
        error: 'Пользователь не подписан на канал' 
      });
    }
    
    // Создаем новую запись
    const booking = new Booking({
      userId,
      userName,
      service,
      staff,
      date,
      time,
      salon: salon || 'Салон 1'
    });
    
    await booking.save();
    
    // Отправляем уведомление пользователю
    await bot.sendMessage(userId, 
      `✅ *Запись успешно оформлена!*\n\n` +
      `💇‍♀️ Услуга: ${service}\n` +
      `🧑‍💼 Мастер: ${staff}\n` +
      `🏢 Салон: ${salon || 'Салон 1'}\n` +
      `📅 Дата: ${date}\n` +
      `🕒 Время: ${time}`,
      {
        parse_mode: 'Markdown',
        ...getMainKeyboard()
      }
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Ошибка сервера при обработке запроса' 
    });
  }
});

// Запуск веб-сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Обработчик webhook для обновления записей с сайта
app.post('/book', async (req, res) => {
  try {
    const { service, staff, date, time, userId, userName } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать userId пользователя Telegram'
      });
    }
    
    // Проверяем подписку
    const isSubscribed = await checkSubscription(userId);
    
    if (!isSubscribed) {
      return res.status(403).json({ 
        success: false, 
        error: 'Пользователь не подписан на канал'
      });
    }
    
    // Создаем запись
    const booking = new Booking({
      userId,
      userName: userName || 'Клиент',
      service,
      staff,
      date,
      time,
      salon: req.body.salon || 'Салон 1'
    });
    
    await booking.save();
    
    // Отправляем подтверждение
    await bot.sendMessage(userId, 
      `✅ *Запись успешно оформлена!*\n\n` +
      `💇‍♀️ Услуга: ${service}\n` +
      `🧑‍💼 Мастер: ${staff}\n` +
      `🏢 Салон: ${req.body.salon || 'Салон 1'}\n` +
      `📅 Дата: ${date}\n` +
      `🕒 Время: ${time}`,
      {
        parse_mode: 'Markdown',
        ...getMainKeyboard()
      }
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при обработке webhook:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Запускаем бота
console.log('Bot is running...');