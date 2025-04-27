require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const path = require('path');

const token = process.env.BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
const domain = process.env.DOMAIN;
const port = process.env.PORT || 3000;

if (!token || !adminChatId) {
  console.error('Ошибка: проверьте BOT_TOKEN и ADMIN_CHAT_ID');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Для хранения пользователей и временных записей
const users = {}; // { telegramUsername: chatId }
const pendingBookings = {}; // { telegramUsername: {service, staff, date, time} }

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  if (username) {
    users[username] = chatId;
    console.log(`✅ Пользователь ${username} зарегистрирован с chatId ${chatId}`);
  }

  bot.sendMessage(chatId, `Добро пожаловать в Leo Beauty! ✨\n\nДля записи на услуги используйте наш сайт.`);
});

app.post('/api/pending-booking', async (req, res) => {
  const { service, staff, date, time, userId } = req.body;

  if (!service || !staff || !date || !time || !userId) {
    return res.status(400).json({ success: false, error: 'Все поля обязательны' });
  }

  // Сохраняем временную запись
  pendingBookings[userId] = { service, staff, date, time };

  return res.json({ success: true, message: 'Запись временно сохранена, переходите в Telegram для подтверждения.' });
});

app.post('/api/booking', async (req, res) => {
  try {
    const { service, staff, date, time, telegramUsername } = req.body;

    if (!service || !staff || !date || !time || !telegramUsername) {
      return res.status(400).json({ success: false, error: 'Все поля обязательны' });
    }

    const userChatId = users[telegramUsername];

    if (!userChatId) {
      return res.status(400).json({ success: false, error: 'Пользователь не запустил бота в Telegram' });
    }

    const adminMessage = `
🆕 Новая запись!
Услуга: ${service}
Специалист: ${staff}
Дата: ${date}
Время: ${time}
От пользователя: @${telegramUsername}
    `;
    await bot.sendMessage(adminChatId, adminMessage);

    const userMessage = `
✅ Ваш визит в Leo Beauty подтверждён!

✨ Услуга: ${service}
🧑‍💼 Специалист: ${staff}
📆 Дата: ${date}
🕒 Время: ${time}

Спасибо за ваш выбор! Ждём вас! 🌸
    `;
    await bot.sendMessage(userChatId, userMessage);

    return res.json({ success: true, message: 'Запись оформлена и подтверждение отправлено' });
  } catch (error) {
    console.error('Ошибка бронирования:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Домен: ${domain}`);
});

bot.on('polling_error', (error) => {
  console.error('Ошибка Telegram бота:', error);
});
