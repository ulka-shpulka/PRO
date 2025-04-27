require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();

// Choose polling OR webhook mode, not both
let bot;

if (process.env.NODE_ENV === 'production') {
  // Use webhook in production
  bot = new TelegramBot(process.env.BOT_TOKEN);
  bot.setWebHook(process.env.WEBHOOK_URL || '');
} else {
  // Use polling in development
  bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: {
      params: {
        timeout: 10
      },
      interval: 2000
    }
  });
  // Make sure to delete any existing webhook
  bot.deleteWebHook();
}

// Обработчик пользователей и записи
const users = {};
const pendingBookings = {};

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Получение последней записи для пользователя
function getLastBookingForUser(chatId) {
  const user = users[chatId];
  if (!user || !user.lastBookingId) return null;
  return pendingBookings[user.lastBookingId];
}

// Получение всех записей для пользователя по userId
function getBookingsByUserId(userId) {
  return Object.entries(pendingBookings)
    .filter(([id, _]) => id === userId)
    .map(([_, booking]) => booking);
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || `user_${msg.from.id}`;

  // Ищем самую новую запись
  let newestBooking = null;
  let newestBookingId = null;
  let newestTimestamp = 0;

  Object.entries(pendingBookings).forEach(([id, booking]) => {
    if (booking.timestamp && !booking.confirmed && !booking.cancelled) {
      const ts = new Date(booking.timestamp).getTime();
      if (ts > newestTimestamp) {
        newestTimestamp = ts;
        newestBooking = booking;
        newestBookingId = id;
      }
    }
  });

  users[chatId] = { username, lastBookingId: newestBookingId };

  if (newestBooking) {
    newestBooking.chatId = chatId;
    
    // Форматируем дату и время для отображения
    const date = newestBooking.date ? newestBooking.date : 'Не указана';
    const time = newestBooking.time ? newestBooking.time : 'Не указано';
    
    bot.sendMessage(chatId, `🎉 Ваша запись найдена:\n\n✨ Услуга: ${newestBooking.service}\n🧑‍💼 Специалист: ${newestBooking.staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Подтвердить", callback_data: `confirm_${newestBookingId}` }],
          [{ text: "❌ Отменить", callback_data: `cancel_${newestBookingId}` }]
        ]
      }
    });
  } else {
    bot.sendMessage(chatId, `Добро пожаловать в Leo Beauty! ✨\n\nДля записи перейдите на наш сайт.`);
  }
});

// Обработка кнопок
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const [action, userId] = query.data.split('_');
  const booking = pendingBookings[userId];

  if (!booking) {
    bot.answerCallbackQuery(query.id, { text: "❌ Запись не найдена" });
    return;
  }

  try {
    if (action === 'confirm') {
      // Первый шаг: обновляем сообщение с кнопками
      await bot.editMessageText(`✅ Ваш визит подтвержден!\n\n✨ Услуга: ${booking.service}\n🧑‍💼 Специалист: ${booking.staff}\n📅 Дата: ${booking.date}\n🕒 Время: ${booking.time}`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: []  // Убираем кнопки
        }
      });
      
      // Второй шаг: отправляем подтверждающее сообщение
      await bot.sendMessage(chatId, "✅ Ваша запись подтверждена! Ждем вас в назначенное время.");
      
      // Помечаем запись как подтвержденную
      booking.confirmed = true;
      bot.answerCallbackQuery(query.id, { text: "Запись подтверждена" });
    } else if (action === 'cancel') {
      // Удаляем сообщение с кнопками
      await bot.deleteMessage(chatId, messageId);
      
      // Отправляем сообщение об отмене
      await bot.sendMessage(chatId, "❌ Ваша запись отменена.");
      
      // Помечаем запись как отмененную или удаляем
      booking.cancelled = true;
      bot.answerCallbackQuery(query.id, { text: "Запись отменена" });
    }
  } catch (error) {
    console.error('Ошибка при обработке кнопки:', error);
    bot.sendMessage(chatId, "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.");
  }
});

// Добавляем API endpoint для получения всех записей
app.get('/api/bookings', (req, res) => {
  res.json(pendingBookings);
});

// Эндпоинт для записи
app.post('/api/pending-booking', (req, res) => {
  const { userId, service, staff, date, time } = req.body;
  
  if (!userId || !service || !staff) {
    return res.status(400).json({ 
      success: false, 
      message: 'Отсутствуют обязательные поля (userId, service, staff)' 
    });
  }
  
  pendingBookings[userId] = { 
    service, 
    staff, 
    date, 
    time, 
    timestamp: new Date().toISOString(),
    confirmed: false,
    cancelled: false
  };
  
  console.log(`Новая запись создана: ${JSON.stringify(pendingBookings[userId])}`);
  res.json({ success: true });
});

// Webhook endpoint for production mode
if (process.env.NODE_ENV === 'production') {
  app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));