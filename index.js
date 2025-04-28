require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();

// === НАСТРОЙКА БОТА через Webhook (НЕ POLLING!)
const bot = new TelegramBot(process.env.BOT_TOKEN);
const DOMAIN = process.env.DOMAIN;
const WEBHOOK_URL = `${DOMAIN}/bot${process.env.BOT_TOKEN}`;

bot.setWebHook(WEBHOOK_URL);

// Приём запросов от Telegram
app.use(bodyParser.json());
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const users = {};
const pendingBookings = {};

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// API для бронирования
app.post('/api/pending-booking', (req, res) => {
  const { service, staff, date, time, userId } = req.body;
  if (!service || !staff || !date || !time || !userId) {
    return res.status(400).json({ success: false });
  }

  const id = Math.random().toString(36).substring(2, 10);
  pendingBookings[userId] = { id, service, staff, date, time };
  res.json({ success: true });
});

// Обработка команд Telegram
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = `user_${msg.from.id}`;
  const booking = pendingBookings[userId];

  if (!booking) {
    bot.sendMessage(chatId, "У вас нет активных записей.");
    return;
  }

  const text = `✨ Ваша запись:\n\nУслуга: ${booking.service}\nСотрудник: ${booking.staff}\nДата: ${booking.date}\nВремя: ${booking.time}`;

  bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Подтвердить запись", callback_data: `confirm_${userId}` }],
        [{ text: "❌ Отменить запись", callback_data: `cancel_${userId}` }]
      ]
    }
  });
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.data.split('_')[1];

  if (query.data.startsWith('confirm_')) {
    bot.editMessageText('✅ Вы записаны!', {
      chat_id: chatId,
      message_id: query.message.message_id
    });
    delete pendingBookings[userId];
  } else if (query.data.startsWith('cancel_')) {
    bot.editMessageText('❌ Запись отменена.', {
      chat_id: chatId,
      message_id: query.message.message_id
    });
    delete pendingBookings[userId];
  }
});

// Подача сайта
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
