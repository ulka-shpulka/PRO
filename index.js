require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// Environment variables
const token = process.env.BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
const domain = process.env.DOMAIN;
const port = process.env.PORT || 3000;

// Validate critical environment variables
if (!token || !adminChatId) {
  console.error('Ошибка: проверьте BOT_TOKEN и ADMIN_CHAT_ID');
  process.exit(1);
}

// Initialize bot and Express
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Express middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Storage for users and bookings
const users = {}; // { chatId: username }
const pendingBookings = {}; // { userId: { service, staff, date, time } }

// Обработчик команды /start для бота
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || `user_${msg.from.id}`;

  // Сохраняем пользователя
  users[chatId] = username;
  console.log(`✅ Пользователь ${username} (${chatId}) зарегистрирован`);

  // Проверяем все ожидающие записи для этого пользователя
  let foundBooking = false;
  
  // Поиск по всем pendingBookings
  Object.keys(pendingBookings).forEach(userId => {
    const booking = pendingBookings[userId];
    
    // Добавляем chatId к бронированию для последующего использования
    booking.chatId = chatId;
    
    // Отправляем сообщение с подтверждением
    bot.sendMessage(
      chatId,
      `🎉 Спасибо за подписку на Leo Beauty! 

Мы нашли вашу запись:

✨ Услуга: ${booking.service}
🧑‍💼 Специалист: ${booking.staff}
📆 Дата: ${booking.date}
🕒 Время: ${booking.time}

Нажмите кнопку "Подтвердить", чтобы завершить запись.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Подтвердить", callback_data: `confirm_${userId}` }],
            [{ text: "❌ Отменить", callback_data: `cancel_${userId}` }]
          ]
        }
      }
    );
    
    foundBooking = true;
  });
  
  // Если бронирований не найдено, отправляем приветственное сообщение
  if (!foundBooking) {
    bot.sendMessage(
      chatId,
      `Добро пожаловать в Leo Beauty! ✨

Чтобы записаться на наши услуги, пожалуйста, воспользуйтесь нашим сайтом и выберите подходящие услугу, специалиста и время.

Мы с нетерпением ждем встречи с вами!`
    );
  }
});

// Обработчик callback-запросов (кнопок в сообщениях)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  
  // Разбираем data: "confirm_userId" или "cancel_userId"
  const [action, userId] = data.split('_');
  const booking = pendingBookings[userId];
  
  if (!booking) {
    bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Запись не найдена или устарела" });
    return;
  }
  
  if (action === 'confirm') {
    // Отправляем уведомление администратору
    bot.sendMessage(
      adminChatId,
      `🆕 Новая запись!

Услуга: ${booking.service}
Специалист: ${booking.staff}
Дата: ${booking.date}
Время: ${booking.time}
От пользователя: ${users[chatId] || "Неизвестно"}`
    );
    
    // Отправляем подтверждение клиенту
    bot.editMessageText(
      `✅ Ваш визит в Leo Beauty подтверждён!

✨ Услуга: ${booking.service}
🧑‍💼 Специалист: ${booking.staff}
📆 Дата: ${booking.date}
🕒 Время: ${booking.time}

Спасибо за ваш выбор! Ждём вас! 🌸`,
      {
        chat_id: chatId,
        message_id: messageId
      }
    );
    
    // Удаляем запись из ожидающих
    delete pendingBookings[userId];
    
    // Отвечаем на callback_query
    bot.answerCallbackQuery(callbackQuery.id, { text: "✅ Запись подтверждена!" });
  } 
  else if (action === 'cancel') {
    // Отменяем запись
    bot.editMessageText(
      `❌ Запись отменена. 

Вы можете создать новую запись через наш сайт.`,
      {
        chat_id: chatId,
        message_id: messageId
      }
    );
    
    // Удаляем запись из ожидающих
    delete pendingBookings[userId];
    
    // Отвечаем на callback_query
    bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Запись отменена" });
  }
});

// API Endpoints
app.post('/api/pending-booking', (req, res) => {
  try {
    console.log("Получен запрос на создание записи:", req.body);
    
    const { service, staff, date, time, userId } = req.body;

    // Проверяем наличие обязательных полей
    if (!service || !staff || !date || !time || !userId) {
      console.error('Ошибка: Не все обязательные поля предоставлены', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'Требуются все обязательные поля (service, staff, date, time, userId)' 
      });
    }

    // Сохраняем временную запись
    pendingBookings[userId] = { service, staff, date, time };
    console.log('✅ Запись временно сохранена:', pendingBookings[userId]);

    return res.json({ 
      success: true, 
      message: 'Запись временно сохранена, пожалуйста перейдите в Telegram бота для подтверждения.'
    });
  } catch (error) {
    console.error('❌ Ошибка обработки запроса:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// Простой эндпоинт для проверки работоспособности сервера
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Server
const server = app.listen(port, () => {
  console.log(`✅ Сервер запущен на порту ${port}`);
  console.log(`📡 Домен: ${domain}`);
});

// Error handling for Telegram bot
bot.on('polling_error', (error) => {
  console.error('❌ Ошибка Telegram бота:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Завершение работы сервера...');
  server.close(() => {
    console.log('Сервер остановлен');
    process.exit(0);
  });
});

// Для обработки необработанных исключений
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
});