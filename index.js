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

const users = {};
const pendingBookings = {};

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

function resetData() {
  Object.keys(users).forEach(chatId => delete users[chatId]);
  Object.keys(pendingBookings).forEach(bookingId => delete pendingBookings[bookingId]);
}
resetData();

bot.onText(/\/start/, (msg) => {
  try {
    const chatId = msg.chat.id;
    users[chatId] = { username: msg.from.username || `user_${msg.from.id}`, lastBookingId: null };

    const lastBooking = getLastBookingForUser(chatId);

    if (lastBooking) {
      const { id, service, staff, date, time } = lastBooking;
      users[chatId].lastBookingId = id;

      bot.sendMessage(chatId, `🎉 Ваша запись найдена:\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Подтвердить", callback_data: `confirm_${id}` }],
            [{ text: "❌ Отменить", callback_data: `cancel_${id}` }]
          ]
        }
      });
    } else {
      bot.sendMessage(chatId, `Добро пожаловать в Leo Beauty! ✨\n\nПожалуйста, подпишитесь на нашего Telegram-бота и отправьте ему "/start" после подписки.`);
    }
  } catch (error) {
    console.error('Ошибка в обработчике /start:', error);
  }
});

bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const [action, bookingId] = query.data.split('_');
    const booking = pendingBookings[bookingId];

    if (!booking) {
      await bot.answerCallbackQuery(query.id, { text: "❌ Запись не найдена" });
      return;
    }

    if (action === 'confirm') {
      users[chatId].lastBookingId = bookingId;
      await bot.editMessageText(`✅ Ваша запись подтверждена!`, {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    } else if (action === 'cancel') {
      delete pendingBookings[bookingId];
      await bot.editMessageText(`❌ Запись отменена.`, {
        chat_id: chatId,
        message_id: query.message.message_id
      });
    }
  } catch (error) {
    console.error('Ошибка в обработчике callback_query:', error);
  }
});

app.post('/api/pending-booking', (req, res) => {
  try {
    const { service, staff, date, time, userId } = req.body;

    if (!service || !staff || !date || !time || !userId) {
      return res.status(400).json({ success: false, message: "Отсутствуют обязательные данные" });
    }

    const id = Math.random().toString(36).substr(2, 9);
    pendingBookings[id] = { id, service, staff, date, time, userId };

    res.json({ success: true, id });
  } catch (error) {
    console.error('Ошибка при сохранении записи:', error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

function getLastBookingForUser(chatId) {
  const user = users[chatId];
  return user?.lastBookingId ? pendingBookings[user.lastBookingId] : null;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
