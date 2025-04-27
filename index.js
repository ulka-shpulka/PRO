// index.js - основной файл сервера для Telegram-бота
require('dotenv').config(); // подключаем .env

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Загружаем токен и домен из переменных окружения
const token = process.env.BOT_TOKEN;  // Используем переменную BOT_TOKEN
const domain = process.env.DOMAIN;    // Используем переменную DOMAIN
const adminChatId = process.env.ADMIN_CHAT_ID; // Используем ADMIN_CHAT_ID
const port = process.env.PORT || 3000;  // Используем PORT

// Проверка на наличие токена и домена
if (!token || !domain || !adminChatId) {
  console.error('❌ BOT_TOKEN, DOMAIN и ADMIN_CHAT_ID должны быть установлены в .env файле');
  process.exit(1);
}

const bot = new TelegramBot(token, { webHook: true });

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Отдаём index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Функция для удаления старого вебхука
const removeWebhook = async () => {
  try {
    const url = `https://api.telegram.org/bot${token}/deleteWebHook`;
    const response = await axios.get(url);
    if (response.data.ok) {
      console.log('🌐 Старый вебхук удален');
    } else {
      console.log('❌ Ошибка при удалении старого вебхука');
    }
  } catch (error) {
    console.error('Ошибка при удалении старого вебхука:', error);
  }
};

// Удаляем старый вебхук перед установкой нового
removeWebhook().then(() => {
  bot.setWebHook(`${domain}/botWebhook`)
    .then(() => {
      console.log(`🌐 Webhook установлен по адресу: ${domain}/botWebhook`);
    })
    .catch(error => {
      console.error('Ошибка при установке Webhook:', error);
    });
});

// Обработка Webhook от Telegram
app.post(`/botWebhook`, (req, res) => {
  console.log('Received update:', req.body); // Логирование полученных данных
  bot.processUpdate(req.body);
  res.sendStatus(200); // Ответ Telegram, чтобы показать, что запрос принят
});

// Обработка записи с сайта
app.post('/book', (req, res) => {
  const { service, staff, date, time } = req.body;

  if (!service || !staff || !date || !time) {
    return res.status(400).json({ success: false, error: 'Отсутствуют обязательные поля' });
  }

  const message = `  
💇 *Новая запись*

🔹 Услуга: ${service}
👩‍🦰 Сотрудник: ${staff}
📅 Дата: ${date}
⏰ Время: ${time}
  `;

  bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' })
    .then(() => res.status(200).json({ success: true, message: 'Запись успешно оформлена!' }))
    .catch(error => {
      console.error('Ошибка при отправке сообщения:', error);
      res.status(500).json({ success: false, error: 'Ошибка при отправке уведомления' });
    });
});

// === Обработчики Telegram ===

// Приветствие
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';

  bot.sendMessage(chatId, `
Привет, ${firstName}! 👋

Добро пожаловать в бот нашего салона.
Здесь Вы можете:
• Отслеживать свои записи
• Узнать информацию о салоне
• Связаться с администратором

Спасибо, что выбрали нас!
  `, {
    reply_markup: {
      keyboard: [
        ['💇‍♀️ Мои записи'],
        ['ℹ️ Информация о салоне'],
        ['📞 Связаться с нами']
      ],
      resize_keyboard: true
    }
  });
});

// Обработка кнопок
const handlers = {
  '💇‍♀️ Мои записи': 'В настоящее время у вас нет активных записей. Чтобы записаться, посетите наш сайт.',
  'ℹ️ Информация о салоне': `
*О нашем салоне*

🏠 Адрес: [Ваш адрес]
⏰ График работы: Пн-Вс с 10:00 до 20:00
📞 Телефон: [Ваш телефон]
🌐 Сайт: [Ваш сайт]
  `,
  '📞 Связаться с нами': 'Напишите ваш вопрос, и администратор ответит вам в ближайшее время.'
};

// Обработка входящих сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (handlers[text]) {
    bot.sendMessage(chatId, handlers[text], { parse_mode: 'Markdown' });
  } else if (text && !text.startsWith('/')) {
    const userName = msg.from.username ? `@${msg.from.username}` : 'Неизвестный пользователь';
    const userInfo = `Сообщение от ${userName} (${msg.from.first_name} ${msg.from.last_name || ''}):\n\n${text}`;

    bot.sendMessage(adminChatId, userInfo)
      .then(() => bot.sendMessage(chatId, 'Спасибо за сообщение! Мы ответим вам в ближайшее время.'))
      .catch(error => console.error('Ошибка при пересылке сообщения:', error));
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

console.log('BOT_TOKEN:', process.env.BOT_TOKEN);
console.log('DOMAIN:', process.env.DOMAIN);
console.log('ADMIN_CHAT_ID:', process.env.ADMIN_CHAT_ID)
