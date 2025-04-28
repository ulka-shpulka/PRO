require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
let bot;

// Используйте вебхук в режиме производства
if (process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(process.env.BOT_TOKEN);
  bot.setWebHook(process.env.WEBHOOK_URL || '');
} else {
  bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: {
      params: {
        timeout: 10
      },
      interval: 2000
    }
  });
  bot.deleteWebHook();
}

// Обработчик пользователей и записи
const users = {};
const pendingBookings = {};

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Сброс данных пользователей и записей при каждом запуске сервера
function resetData() {
  Object.keys(users).forEach(chatId => delete users[chatId]);
  Object.keys(pendingBookings).forEach(bookingId => delete pendingBookings[bookingId]);
}
resetData(); // Вызываем сброс данных при инициализации

// Команда /start
bot.onText(/\/start/, (msg) => {
  try {
    const chatId = msg.chat.id;
    users[chatId] = { username: msg.from.username || `user_${msg.from.id}`, lastBookingId: null };

    // Проверяем на наличие неподтвержденной записи
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
      // Попросить подписаться на бота
      bot.sendMessage(chatId, `Добро пожаловать в Leo Beauty! ✨\n\nПожалуйста, подпишитесь на нашего Telegram-бота и напишите ему "/start" после подписки.`);
    }
  } catch (error) {
    console.error('Ошибка в обработчике /start:', error);
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const [action, bookingId] = query.data.split('_');
  const booking = pendingBookings[bookingId];

  if (!booking) {
    bot.answerCallbackQuery(query.id, { text: "❌ Запись не найдена" });
    return;
  }

  if (action === 'confirm') {
    users[chatId].lastBookingId = bookingId;
    await bot.editMessageText(`✅ Ваша запись подтверждена!`, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: { inline_keyboard: [] }
    });
  } else if (action === 'cancel') {
    delete pendingBookings[bookingId];
    await bot.editMessageText(`❌ Запись отменена.`, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: { inline_keyboard: [] }
    });
  }
});

// Функция для получения последней записи для пользователя
function getLastBookingForUser(chatId) {
  const user = users[chatId];
  return user?.lastBookingId ? pendingBookings[user.lastBookingId] : null;
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
