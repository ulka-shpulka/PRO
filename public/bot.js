const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Telegram бот токен
const token = '7492776215:AAFBnBmCvf_LL1QlW7zOXO19piWCRvWNb3k';
const bot = new TelegramBot(token, { polling: true });

// База данных для хранения информации (в реальном проекте используйте настоящую БД)
const userDB = {};
const bookingsDB = {};
const authRequests = {};

// Информация о салонах
const salons = {
  "Madame": "https://madame-salon.ru",
  "Amor&Amur": "https://amor-amur.ru",
  "Major": "https://major-salon.ru",
  "Ольга": "https://olga-salon.ru"
};

// Обработка старта бота и авторизации
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const authId = match[1];
  
  // Проверяем, есть ли запрос на авторизацию с таким ID
  if (authRequests[authId]) {
    // Сохраняем информацию о пользователе
    userDB[chatId] = {
      id: chatId,
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name,
      auth_id: authId
    };
    
    // Помечаем запрос как авторизованный
    authRequests[authId].authorized = true;
    authRequests[authId].userData = userDB[chatId];
    
    // Отправляем приветственное сообщение
    bot.sendMessage(chatId, `Здравствуйте, ${msg.from.first_name}! Вы успешно авторизованы. Теперь вы можете завершить запись на сайте.`, {
      reply_markup: {
        keyboard: [
          [{ text: "Мои записи" }, { text: "Салоны" }],
          [{ text: "Помощь" }]
        ],
        resize_keyboard: true
      }
    });
  } else {
    // Обычный старт бота
    bot.sendMessage(chatId, `Здравствуйте, ${msg.from.first_name}! Добро пожаловать в бот для записи в салон красоты.`, {
      reply_markup: {
        keyboard: [
          [{ text: "Мои записи" }, { text: "Салоны" }],
          [{ text: "Помощь" }]
        ],
        resize_keyboard: true
      }
    });
  }
});

// Обработка простой команды старт
bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  
  // Сохраняем информацию о пользователе
  userDB[chatId] = {
    id: chatId,
    username: msg.from.username,
    first_name: msg.from.first_name,
    last_name: msg.from.last_name
  };
  
  // Отправляем приветственное сообщение
  bot.sendMessage(chatId, `Здравствуйте, ${msg.from.first_name}! Добро пожаловать в бот для записи в салон красоты.`, {
    reply_markup: {
      keyboard: [
        [{ text: "Мои записи" }, { text: "Салоны" }],
        [{ text: "Помощь" }]
      ],
      resize_keyboard: true
    }
  });
});

// Обработка кнопки "Мои записи"
bot.onText(/Мои записи/, (msg) => {
  const chatId = msg.chat.id;
  
  // Получаем записи пользователя
  const userBookings = bookingsDB[chatId] || [];
  
  if (userBookings.length === 0) {
    bot.sendMessage(chatId, "У вас пока нет записей.");
    return;
  }
  
  // Формируем сообщение со списком записей
  let message = "Ваши записи:\n\n";
  
  userBookings.forEach((booking, index) => {
    message += `${index + 1}. Салон: ${booking.salon}\n` +
               `   Услуга: ${booking.service}\n` +
               `   Сотрудник: ${booking.staff}\n` +
               `   Дата и время: ${booking.date} в ${booking.time}\n\n`;
  });
  
  bot.sendMessage(chatId, message);
});

// Обработка кнопки "Салоны"
bot.onText(/Салоны/, (msg) => {
  const chatId = msg.chat.id;
  
  // Создаем инлайн-кнопки для каждого салона
  const inlineKeyboard = Object.entries(salons).map(([name, url]) => {
    return [{ text: name, url: url }];
  });
  
  bot.sendMessage(chatId, "Выберите салон, чтобы посетить его сайт:", {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
});

// Обработка кнопки "Помощь"
bot.onText(/Помощь/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, "Если у вас возникли вопросы, пожалуйста, свяжитесь с администратором:\n\nEmail: admin@example.com\nTelegram: @admin_username");
});

// Добавление новой записи
app.post('/book', (req, res) => {
  const { service, staff, date, time, salon, telegramUserId } = req.body;
  
  // Проверяем наличие всех данных
  if (!service || !staff || !date || !time || !salon || !telegramUserId) {
    return res.status(400).json({ success: false, error: "Отсутствуют необходимые данные" });
  }
  
  // Добавляем запись в базу данных
  if (!bookingsDB[telegramUserId]) {
    bookingsDB[telegramUserId] = [];
  }
  
  bookingsDB[telegramUserId].push({
    service,
    staff,
    date,
    time,
    salon,
    bookingDate: new Date().toISOString()
  });
  
  res.json({ success: true });
});

// Проверка статуса авторизации
app.get('/check-telegram-auth', (req, res) => {
  const { authId } = req.query;
  
  if (!authId || !authRequests[authId]) {
    return res.json({ authorized: false });
  }
  
  res.json({ 
    authorized: authRequests[authId].authorized || false,
    userData: authRequests[authId].userData || null
  });
});

// Создание запроса на авторизацию
app.post('/create-auth-request', (req, res) => {
  const { authId } = req.body;
  
  if (!authId) {
    return res.status(400).json({ success: false, error: "Отсутствует ID авторизации" });
  }
  
  authRequests[authId] = {
    created: new Date().toISOString(),
    authorized: false,
    userData: null
  };
  
  // Установка тайм-аута на удаление запроса через 10 минут
  setTimeout(() => {
    delete authRequests[authId];
  }, 10 * 60 * 1000);
  
  res.json({ success: true });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});