require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const app = express();

// === НАСТРОЙКА БОТА через POLLING
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const DOMAIN = process.env.DOMAIN || 'https://pro-1-qldl.onrender.com';

// Сначала удаляем любые существующие webhook
bot.deleteWebHook()
  .then(() => {
    console.log('Webhook удален, бот работает в режиме polling');
  })
  .catch(error => {
    console.error('Ошибка при удалении webhook:', error);
    // Продолжаем работу, даже если была ошибка
  });

// Отлавливаем ошибки polling
bot.on('polling_error', (error) => {
  console.log('Ошибка polling:', error.message);
  // Логируем ошибку, но не останавливаем работу
});

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
    
    // Связываем telegramId с userId
    userTelegramMap[telegramId] = userId;
    
    // В реальном приложении здесь бы сохраняли связь в базу данных
    console.log(`Связан telegramId ${telegramId} с userId ${userId}`);
    
    bot.sendMessage(chatId, "✅ Ваш аккаунт успешно связан с сайтом!");
  }
  
  // Проверяем, есть ли связь с аккаунтом на сайте
  const userId = userTelegramMap[telegramId];
  
  if (!userId) {
    // Если пользователь не связан, предлагаем связать
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
  
  // Форматируем дату для читаемости
  const formattedDate = new Date(date).toLocaleDateString('ru-RU');
  
  const text = `✨ Ваша запись:\n\n🔹 Услуга: ${service}\n🔹 Специалист: ${staff}\n🔹 Дата: ${formattedDate}\n🔹 Время: ${time}`;
  
  bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Подтвердить запись", callback_data: `confirm_${userId}` }],
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
    // Проверяем, есть ли связь с аккаунтом на сайте
    const userId = userTelegramMap[telegramId];
    
    if (!userId) {
      bot.answerCallbackQuery(query.id, { text: "Вы еще не связали аккаунт с сайтом" });
      bot.sendMessage(chatId, "Пожалуйста, выберите услугу на сайте и нажмите 'Оформить визит'");
      return;
    }
    
    // Проверяем наличие бронирования
    const booking = pendingBookings[userId];
    
    if (!booking) {
      bot.answerCallbackQuery(query.id, { text: "Записи не найдены" });
      bot.sendMessage(chatId, "У вас нет активных записей. Пожалуйста, выберите услугу на сайте.");
      return;
    }
    
    // Показываем информацию о записи
    const { service, staff, date, time } = booking;
    const formattedDate = new Date(date).toLocaleDateString('ru-RU');
    
    const text = `✨ Ваша запись:\n\n🔹 Услуга: ${service}\n🔹 Специалист: ${staff}\n🔹 Дата: ${formattedDate}\n🔹 Время: ${time}`;
    
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Подтвердить запись", callback_data: `confirm_${userId}` }],
          [{ text: "❌ Отменить запись", callback_data: `cancel_${userId}` }]
        ]
      }
    });
  }
  // Обработка подтверждения записи
  else if (query.data.startsWith('confirm_')) {
    const userId = query.data.split('_')[1];
    
    // Проверяем наличие бронирования
    if (!pendingBookings[userId]) {
      bot.answerCallbackQuery(query.id, { text: "Запись уже обработана или не существует" });
      return;
    }
    
    // Уведомляем пользователя о подтверждении через callback
    bot.answerCallbackQuery(query.id, { text: "✅ Запись подтверждена!" });
    
    // Отправляем отдельное сообщение "Запись подтверждена!"
    bot.sendMessage(chatId, "✅ Запись подтверждена!");
    
    // Удаляем запись из pendingBookings после подтверждения
    delete pendingBookings[userId];
  }
  // Обработка отмены записи
  else if (query.data.startsWith('cancel_')) {
    const userId = query.data.split('_')[1];
    
    // Первым делом удаляем сообщение с записью
    bot.deleteMessage(chatId, query.message.message_id)
      .then(() => {
        console.log("Сообщение успешно удалено");
        
        // Удаляем запись из pendingBookings только после успешного удаления сообщения
        delete pendingBookings[userId];
        
        // Уведомляем пользователя об отмене через callback, но не показываем сообщение в чате
        bot.answerCallbackQuery(query.id, { text: "❌ Запись отменена" });
      })
      .catch(error => {
        console.error("Ошибка при удалении сообщения:", error);
        
        // Если не удается удалить сообщение, редактируем его
        bot.editMessageText('❌ Запись отменена', {
          chat_id: chatId,
          message_id: query.message.message_id
        }).catch(e => console.error("Ошибка при редактировании сообщения:", e));
        
        // Удаляем запись из pendingBookings в любом случае
        delete pendingBookings[userId];
        
        // Уведомляем пользователя через callback
        bot.answerCallbackQuery(query.id, { text: "❌ Запись отменена" });
      });
  }
  // Показ деталей записи
  else if (query.data.startsWith('details_')) {
    const userId = query.data.split('_')[1];
    const booking = pendingBookings[userId];
    
    if (!booking) {
      bot.answerCallbackQuery(query.id, { text: "Информация о записи недоступна" });
      return;
    }
    
    const { service, staff, date, time } = booking;
    const formattedDate = new Date(date).toLocaleDateString('ru-RU');
    
    const text = `📋 Детали вашей записи:\n\n` +
                 `🔹 Услуга: ${service}\n` +
                 `🔹 Специалист: ${staff}\n` +
                 `🔹 Дата: ${formattedDate}\n` +
                 `🔹 Время: ${time}\n\n` +
                 `Пожалуйста, приходите за 10 минут до назначенного времени.`;
    
    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId, text);
  }
});
// Подача сайта
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));