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
  bot = new TelegramBot(process.env.BOT_TOKEN, { polling: {
    params: {
      timeout: 10
    },
    interval: 2000
  }});
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

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || `user_${msg.from.id}`;

  let newestBooking = null;
  let newestBookingId = null;
  let newestTimestamp = 0;

  Object.entries(pendingBookings).forEach(([id, booking]) => {
    const ts = new Date(booking.timestamp).getTime();
    if (ts > newestTimestamp) {
      newestTimestamp = ts;
      newestBooking = booking;
      newestBookingId = id;
    }
  });

  users[chatId] = { username, lastBookingId: newestBookingId };

  if (newestBooking) {
    newestBooking.chatId = chatId;
    bot.sendMessage(chatId, `🎉 Ваша запись найдена:\n\n✨ Услуга: ${newestBooking.service}\n🧑‍💼 Специалист: ${newestBooking.staff}\n📅 Дата: ${newestBooking.date}\n🕒 Время: ${newestBooking.time}`, {
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

  if (action === 'confirm') {
    await bot.editMessageText(`✅ Ваш визит подтвержден!\n\n✨ Услуга: ${booking.service}\n🧑‍💼 Специалист: ${booking.staff}\n📅 Дата: ${booking.date}\n🕒 Время: ${booking.time}`, {
      chat_id: chatId,
      message_id: messageId
    });
    await bot.sendMessage(chatId, "✅ Ваша запись подтверждена!");
    delete pendingBookings[userId];
    bot.answerCallbackQuery(query.id, { text: "Запись подтверждена" });
  } else if (action === 'cancel') {
    await bot.deleteMessage(chatId, messageId);
    await bot.sendMessage(chatId, "❌ Ваша запись отменена.");
    delete pendingBookings[userId];
    bot.answerCallbackQuery(query.id, { text: "Запись отменена" });
  }
});

// Эндпоинт для записи
app.post('/api/pending-booking', (req, res) => {
  const { userId, ...booking } = req.body;
  pendingBookings[userId] = { ...booking, timestamp: new Date().toISOString() };
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