// index.js - основной файл сервера для интеграции с Telegram-ботом
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// Создаем экземпляр Express приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Токен вашего Telegram-бота (замените на ваш реальный токен)
const token = '7649901748:AAE-yAcdXAQKmIoO45ErEdVfdicBGD6dwKs';

// Инициализация бота в режиме polling (для разработки)
const bot = new TelegramBot(token, { polling: true });

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Указываем Express обслуживать статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public'))); // Указываем правильный путь

// 🟣 Отдаём index.html при заходе на /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html.html')); // Путь к твоему html файлу
});

// Маршрут для оформления записи
app.post('/book', (req, res) => {
  const { service, staff, date, time } = req.body;

  if (!service || !staff || !date || !time) {
    return res.status(400).json({
      success: false,
      error: 'Отсутствуют обязательные поля'
    });
  }

  const message = `
💇 *Новая запись*

🔹 Услуга: ${service}
👩‍🦰 Сотрудник: ${staff}
📅 Дата: ${date}
⏰ Время: ${time}
  `;

  const chatId = '1005939833';

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    .then(() => {
      console.log('Сообщение успешно отправлено администратору');
      res.status(200).json({
        success: true,
        message: 'Запись успешно оформлена!'
      });
    })
    .catch((error) => {
      console.error('Ошибка при отправке сообщения:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при отправке уведомления'
      });
    });
});

// Обработчики Telegram-бота
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || '';

  const welcomeMessage = `
Привет, ${firstName}! 👋

Добро пожаловать в бот нашего салона.
Здесь Вы можете:
• Отслеживать свои записи
• Узнать информацию о салоне
• Связаться с администратором

Спасибо, что выбрали нас!
  `;

  bot.sendMessage(chatId, welcomeMessage, {
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

bot.onText(/💇‍♀️ Мои записи/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'В настоящее время у вас нет активных записей. Чтобы записаться, посетите наш сайт.');
});

bot.onText(/ℹ️ Информация о салоне/, (msg) => {
  const chatId = msg.chat.id;
  const infoMessage = `
*О нашем салоне*

🏠 Адрес: [Ваш адрес]
⏰ График работы: Пн-Вс с 10:00 до 20:00
📞 Телефон: [Ваш телефон]
🌐 Сайт: [Ваш сайт]
  `;
  bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
});

bot.onText(/📞 Связаться с нами/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Напишите ваш вопрос, и администратор ответит вам в ближайшее время.');
});

// Общий обработчик текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (
    msg.text &&
    !msg.text.startsWith('/') &&
    !msg.text.includes('Мои записи') &&
    !msg.text.includes('Информация') &&
    !msg.text.includes('Связаться')
  ) {
    const adminChatId = '1005939833';
    const userName = msg.from.username ? `@${msg.from.username}` : 'Неизвестный пользователь';
    const userInfo = `Сообщение от ${userName} (${msg.from.first_name} ${msg.from.last_name || ''}):\n\n${msg.text}`;

    bot.sendMessage(adminChatId, userInfo)
      .then(() => {
        bot.sendMessage(chatId, 'Спасибо за сообщение! Мы ответим вам в ближайшее время.');
      })
      .catch(error => {
        console.error('Ошибка при пересылке сообщения:', error);
      });
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🤖 Бот запущен в режиме polling`);
});
