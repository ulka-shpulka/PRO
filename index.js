// index.js - основной файл сервера

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const path = require('path');

// Загрузка переменных окружения
const token = process.env.BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
const domain = process.env.DOMAIN;
const port = process.env.PORT || 3000;

// Проверка наличия обязательных переменных окружения
if (!token || token === 'your-bot-token-here') {
  console.error('Ошибка: BOT_TOKEN не указан или имеет значение по умолчанию');
  process.exit(1);
}

if (!adminChatId || adminChatId === 'your-admin-chat-id-here') {
  console.error('Ошибка: ADMIN_CHAT_ID не указан или имеет значение по умолчанию');
  process.exit(1);
}

// Инициализация бота
const bot = new TelegramBot(token, { polling: true });

// Инициализация Express
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Простая авторизация для API запросов
const apiAuth = (req, res, next) => {
  // Здесь можно реализовать более серьезную авторизацию
  // Для демонстрации используем упрощенный вариант
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Токен не предоставлен' });
  }
  
  // В реальном приложении здесь была бы проверка токена
  // Для примера пропускаем любой токен
  next();
};

// Маршруты API
app.post('/api/booking', apiAuth, async (req, res) => {
  try {
    const { service, staff, date, time } = req.body;
    
    if (!service || !staff || !date || !time) {
      return res.status(400).json({ success: false, error: 'Все поля обязательны' });
    }
    
    // Отправка уведомления админу в Telegram
    const message = `
🆕 Новая запись!\n
Услуга: ${service}
Специалист: ${staff}
Дата: ${date}
Время: ${time}
    `;
    
    await bot.sendMessage(adminChatId, message);
    
    // Можно добавить сохранение в БД, если нужно
    
    return res.json({ success: true, message: 'Запись успешно создана' });
  } catch (error) {
    console.error('Ошибка при обработке бронирования:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// Обработчики команд Telegram-бота
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
Добро пожаловать в Leo Beauty!

Мы рады приветствовать Вас в нашем салоне красоты.
Здесь Вы можете получать уведомления о своих записях и акциях.

Для записи на услуги, пожалуйста, воспользуйтесь нашим сайтом.
  `);
  
  // Отправляем ID чата в консоль, чтобы администратор мог его использовать
  console.log(`Новый пользователь бота. Chat ID: ${chatId}`);
});

// Маршрут для проверки работоспособности сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Обработка несуществующих маршрутов API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Обработка всех остальных запросов - отдаем index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Домен: ${domain}`);
});

// Запуск бота
console.log('Telegram бот запущен');
bot.on('polling_error', (error) => {
  console.error('Ошибка в работе Telegram бота:', error);
});