require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();

let bot;

if (process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(process.env.BOT_TOKEN);
  bot.setWebHook(process.env.WEBHOOK_URL || '');
} else {
  bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: {
      params: { timeout: 10 },
      interval: 2000
    }
  });
  bot.deleteWebHook();
}

// БД пользователей и записей
const users = {};
const pendingBookings = {};
const telegramUserIds = {}; // userId -> chatId

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Поиск записей по userId или chatId
function findBookingsForUser(userId, chatId) {
  let userBookings = [];

  const linkedUserId = chatId
    ? Object.keys(telegramUserIds).find(uid => telegramUserIds[uid] === chatId)
    : null;

  for (const [id, booking] of Object.entries(pendingBookings)) {
    if (
      (userId && id === userId) ||
      (linkedUserId && id === linkedUserId) ||
      (booking.userId && (booking.userId === userId || booking.userId === linkedUserId))
    ) {
      if (booking && !booking.cancelled) {
        userBookings.push({
          id,
          booking,
          timestamp: booking.timestamp ? new Date(booking.timestamp).getTime() : 0
        });
      }
    }
  }

  userBookings.sort((a, b) => b.timestamp - a.timestamp);

  return userBookings;
}

// Команда /start
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userIdParam = match && match[1] ? match[1].trim() : null;
    const username = msg.from.username || `user_${msg.from.id}`;

    console.log(`Получена команда /start от ${username} (chatId: ${chatId})`);

    users[chatId] = { username, lastBookingId: null };

    // Если передали userId в параметре — запомним связь
    if (userIdParam) {
      telegramUserIds[userIdParam] = chatId;
      console.log(`Связали userId ${userIdParam} с chatId ${chatId}`);
    }

    // Пытаемся найти бронь
    const userBookings = findBookingsForUser(userIdParam, chatId);

    if (userBookings.length > 0) {
      const newestBooking = userBookings[0];
      const booking = newestBooking.booking;
      const bookingId = newestBooking.id;

      users[chatId].lastBookingId = bookingId;
      booking.chatId = chatId;

      const service = booking.service || 'Не указана';
      const staff = booking.staff || 'Не указан';
      const date = booking.date || 'Не указана';
      const time = booking.time || 'Не указано';

      if (booking.confirmed) {
        await bot.sendMessage(chatId, `✅ Ваша запись подтверждена:\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}\n\nЖдем вас!`);
      } else {
        await bot.sendMessage(chatId, `🎉 Ваша запись найдена:\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "✅ Подтвердить запись", callback_data: `confirm_${bookingId}` }],
              [{ text: "❌ Отменить", callback_data: `cancel_${bookingId}` }]
            ]
          }
        });
      }
    } else {
      await bot.sendMessage(chatId, `Добро пожаловать в Leo Beauty! ✨\n\nДля записи перейдите на наш сайт.`);
    }
  } catch (error) {
    console.error('Ошибка в /start:', error);
    await bot.sendMessage(msg.chat.id, 'Произошла ошибка. Попробуйте позже.');
  }
});

// Кнопки подтверждения/отмены
bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const [action, bookingId] = query.data.split('_');
    const booking = pendingBookings[bookingId];

    if (!booking) {
      return bot.answerCallbackQuery(query.id, { text: "❌ Запись не найдена" });
    }

    const service = booking.service || 'Не указана';
    const staff = booking.staff || 'Не указан';
    const date = booking.date || 'Не указана';
    const time = booking.time || 'Не указано';

    if (action === 'confirm') {
      booking.confirmed = true;
      booking.cancelled = false;

      await bot.editMessageText(`✅ Ваш визит подтвержден!\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
        chat_id: chatId,
        message_id: messageId
      });
      await bot.sendMessage(chatId, "✅ Запись подтверждена! До встречи!");

      bot.answerCallbackQuery(query.id, { text: "Запись подтверждена!" });
    } else if (action === 'cancel') {
      booking.cancelled = true;
      booking.confirmed = false;

      await bot.editMessageText(`❌ Запись отменена\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
        chat_id: chatId,
        message_id: messageId
      });
      await bot.sendMessage(chatId, "❌ Запись отменена.");

      bot.answerCallbackQuery(query.id, { text: "Запись отменена!" });
    }
  } catch (error) {
    console.error('Ошибка в обработке кнопок:', error);
    if (query && query.message && query.message.chat && query.message.chat.id) {
      await bot.sendMessage(query.message.chat.id, "Произошла ошибка. Попробуйте еще раз.");
    }
    if (query && query.id) {
      bot.answerCallbackQuery(query.id, { text: "Произошла ошибка" });
    }
  }
});

// API для записи
app.post('/api/pending-booking', (req, res) => {
  try {
    const { userId, service, staff, date, time } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Отсутствует userId' });
    }

    pendingBookings[userId] = {
      service,
      staff,
      date,
      time,
      userId,
      timestamp: new Date().toISOString(),
      confirmed: false,
      cancelled: false
    };

    console.log(`Создана запись для ${userId}: ${JSON.stringify(pendingBookings[userId])}`);
    res.json({ success: true, bookingId: userId });
  } catch (error) {
    console.error('Ошибка при записи:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Для отладки
app.get('/api/bookings', (req, res) => {
  res.json({ pendingBookings, telegramUserIds });
});

// Webhook production
if (process.env.NODE_ENV === 'production') {
  app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Старт сервера
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
