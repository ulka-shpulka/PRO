require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const app = express();

// Определяем режим работы бота (polling или webhook)
const BOT_MODE = process.env.BOT_MODE || 'polling';
const BOT_TOKEN = process.env.BOT_TOKEN;
const DOMAIN = process.env.DOMAIN || 'https://pro-1-qldl.onrender.com';

let bot;

// Инициализация бота в зависимости от выбранного режима
if (BOT_MODE === 'polling') {
  // Настройка бота в режиме polling
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log('Бот запущен в режиме polling');
  
  // Отлавливаем ошибки polling
  bot.on('polling_error', (error) => {
    console.log('Ошибка polling:', error.message);
    
    if (error.message.includes('409 Conflict') || error.message.includes('terminated by other getUpdates')) {
      console.log('Обнаружен конфликт polling, перезапуск через 5 секунд...');
      
      // Останавливаем текущий polling
      bot.stopPolling()
        .then(() => {
          console.log('Polling остановлен');
          setTimeout(() => {
            bot.startPolling()
              .then(() => console.log('Polling успешно перезапущен'))
              .catch(e => console.error('Ошибка при перезапуске polling:', e));
          }, 5000);
        })
        .catch(e => console.error('Ошибка при остановке polling:', e));
    }
  });
} else {
  // Настройка бота в режиме webhook
  bot = new TelegramBot(BOT_TOKEN, { polling: false });
  
  const webhookUrl = `${DOMAIN}/bot${BOT_TOKEN}`;
  bot.setWebHook(webhookUrl)
    .then(() => {
      console.log(`Webhook установлен на ${webhookUrl}`);
    })
    .catch(error => {
      console.error('Ошибка при установке webhook:', error);
    });
  
  // Обрабатываем входящие обновления через webhook
  app.post(`/bot${BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Хранилище данных
const userTelegramMap = {}; // Соотношение userId с telegramId
const pendingBookings = {}; // Хранение бронирований по userId

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API для бронирования
app.post('/api/pending-booking', (req, res) => {
  const { service, staff, date, time, userId } = req.body;
  
  if (!service || !staff || !date || !time || !userId) {
    return res.status(400).json({ success: false, message: "Неполные данные" });
  }
  
  const bookingId = Math.random().toString(36).substring(2, 10);
  pendingBookings[userId] = { 
    id: bookingId, 
    service, 
    staff, 
    date, 
    time,
    createdAt: new Date().toISOString()
  };
  
  res.json({ success: true, bookingId });
});

// API для связывания пользователя сайта с пользователем Telegram
app.post('/api/link-telegram', (req, res) => {
  const { userId, telegramId } = req.body;
  
  if (!userId || !telegramId) {
    return res.status(400).json({ success: false, message: "Неполные данные" });
  }
  
  userTelegramMap[telegramId] = userId;
  res.json({ success: true });
});

// Получение данных о записи для Telegram ID
app.get('/api/booking-by-telegram/:telegramId', (req, res) => {
  const telegramId = req.params.telegramId;
  const userId = userTelegramMap[telegramId];
  
  if (!userId || !pendingBookings[userId]) {
    return res.status(404).json({ success: false, message: "Запись не найдена" });
  }
  
  res.json({ success: true, booking: pendingBookings[userId] });
});

// Обработка команды /start с параметром из deep link
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const startParameter = match[1]; // Параметр из deep link (userId)
  
  // Приветственное сообщение
  bot.sendMessage(chatId, "👋 Добро пожаловать в бот для записи на услуги!");
  
  // Если есть параметр из deep link, связываем пользователя
  if (startParameter) {
    const userId = startParameter;
    userTelegramMap[telegramId] = userId;
    console.log(`Связан telegramId ${telegramId} с userId ${userId}`);
    bot.sendMessage(chatId, "✅ Ваш аккаунт успешно связан с сайтом!");
  }
  
  // Проверяем, есть ли связь с аккаунтом на сайте
  const userId = userTelegramMap[telegramId];
  
  if (!userId) {
    bot.sendMessage(chatId, 
      "Для подтверждения записи с сайта, пожалуйста, перейдите на сайт и выберите услугу. " +
      "После этого вернитесь в бот и нажмите кнопку ниже:", 
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Проверить записи", callback_data: "check_bookings" }]
          ]
        }
      }
    );
    return;
  }
  
  // Если пользователь связан, проверяем наличие бронирования
  const booking = pendingBookings[userId];
  
  if (!booking) {
    bot.sendMessage(chatId, 
      "У вас нет активных записей. Пожалуйста, выберите услугу на сайте.", 
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Проверить записи", callback_data: "check_bookings" }]
          ]
        }
      }
    );
    return;
  }
  
  // Показываем информацию о записи
  const { service, staff, date, time } = booking;
  const formattedDate = new Date(date).toLocaleDateString('ru-RU');
  
  const text = `✨ Ваша запись:\n\n🔹 Услуга: ${service}\n🔹 Специалист: ${staff}\n🔹 Дата: ${formattedDate}\n🔹 Время: ${time}`;
  
  bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "❌ Отменить запись", callback_data: `cancel_${userId}` }]
      ]
    }
  });
});

// Обработка нажатий на кнопки
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id.toString();
  
  // Обработка кнопки "Проверить записи"
  if (query.data === "check_bookings") {
    const userId = userTelegramMap[telegramId];
    
    if (!userId) {
      bot.answerCallbackQuery(query.id, { text: "Вы еще не связали аккаунт с сайтом" });
      bot.sendMessage(chatId, "Пожалуйста, выберите услугу на сайте и нажмите 'Оформить визит'");
      return;
    }
    
    const booking = pendingBookings[userId];
    
    if (!booking) {
      bot.answerCallbackQuery(query.id, { text: "Записи не найдены" });
      bot.sendMessage(chatId, "У вас нет активных записей. Пожалуйста, выберите услугу на сайте.");
      return;
    }
    
    const { service, staff, date, time } = booking;
    const formattedDate = new Date(date).toLocaleDateString('ru-RU');
    
    const text = `✨ Ваша запись:\n\n🔹 Услуга: ${service}\n🔹 Специалист: ${staff}\n🔹 Дата: ${formattedDate}\n🔹 Время: ${time}`;
    
    bot.answerCallbackQuery(query.id);

    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Отменить запись", callback_data: `cancel_${userId}` }]
        ]
      }
    });
  }
  
  // Обработка отмены записи
  if (query.data.startsWith('cancel_')) {
    const userId = query.data.split('_')[1];
    
    bot.deleteMessage(chatId, query.message.message_id)
      .then(() => {
        delete pendingBookings[userId];
        bot.answerCallbackQuery(query.id, { text: "❌ Запись отменена" });
      })
      .catch(error => {
        bot.editMessageText('❌ Запись отменена', {
          chat_id: chatId,
          message_id: query.message.message_id
        });
        delete pendingBookings[userId];
        bot.answerCallbackQuery(query.id, { text: "❌ Запись отменена" });
      });
  }
});

// Подача сайта
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
