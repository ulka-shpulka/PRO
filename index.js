const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = '7492776215:AAFBnBmCvf_LL1QlW7zOXO19piWCRvWNb3k';
const SERVER_URL = 'https://pro-1-qldl.onrender.com';

const bot = new TelegramBot(BOT_TOKEN, { webHook: { port: process.env.PORT || 3000 } });

const bookingsFilePath = path.join(__dirname, 'bookings.json'); // Путь к файлу с бронированиями

let bookings = [];

// Проверяем, если файл с бронированиями существует, загружаем его содержимое
if (fs.existsSync(bookingsFilePath)) {
  const fileData = fs.readFileSync(bookingsFilePath, 'utf8');
  bookings = JSON.parse(fileData);
}

const CHANNEL_ID = '@MLfeBot';
const ADMIN_USERNAME = '@sae_bun';

// Функция для отправки данных клиенту в Telegram
async function sendBookingDetailsToClient(userId, service, staff, date, time) {
  const message = `
  📅 Ваше бронирование:
  ✨ Услуга: ${service}
  🧑‍💼 Сотрудник: ${staff}
  📆 Дата: ${date}
  🕒 Время: ${time}
  
  Спасибо, что выбрали нас!
  `;

  try {
    await bot.sendMessage(userId, message);
  } catch (error) {
    console.error('Ошибка при отправке сообщения пользователю:', error);
  }
}

// Проверка подписки
async function checkSubscription(userId) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
      params: { chat_id: CHANNEL_ID, user_id: userId }
    });
    const status = response.data.result.status;
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return false;
  }
}

// Основная клавиатура
function getMainKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📝 Мои записи', callback_data: 'my_records' }],
        [{ text: '🏢 Салоны', callback_data: 'salons' }],
        [{ text: '🆘 Помощь', callback_data: 'help' }]
      ]
    }
  };
}

bot.setWebHook(`${SERVER_URL}/botWebhook`);

app.post('/botWebhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// При старте
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'Клиент';

  await bot.sendMessage(chatId, `Здравствуйте, ${firstName}! Для доступа к системе записи, подпишитесь на наш канал ${CHANNEL_ID}`);

  const isSubscribed = await checkSubscription(userId);

  if (isSubscribed) {
    await bot.sendMessage(chatId, `Спасибо за подписку! Теперь вы можете использовать все функции бота.`, getMainKeyboard());
  } else {
    await bot.sendMessage(chatId, `Пожалуйста, подпишитесь на канал ${CHANNEL_ID}, чтобы продолжить!`);
  }
});

// Обработка callback-запросов
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  const isSubscribed = await checkSubscription(userId);
  if (!isSubscribed) {
    await bot.sendMessage(chatId, `Для использования бота необходимо подписаться на наш канал ${CHANNEL_ID}`);
    return;
  }

  switch (data) {
    case 'my_records':
      await showUserBookings(chatId, userId);
      break;
    case 'salons':
      await showSalons(chatId);
      break;
    case 'help':
      await bot.sendMessage(chatId, `По всем вопросам обращайтесь к администратору: ${ADMIN_USERNAME}`, getMainKeyboard());
      break;
    default:
      await bot.sendMessage(chatId, 'Выберите действие:', getMainKeyboard());
  }
});

// Отображение записей пользователя
async function showUserBookings(chatId, userId) {
  const userBookings = bookings.filter(b => b.userId === userId);
  if (userBookings.length === 0) {
    return bot.sendMessage(chatId, 'У вас пока нет ни одной записи.', getMainKeyboard());
  }

  let message = '📋 *Ваши записи:*\n\n';
  userBookings.forEach((booking, index) => {
    message += `*${index + 1}.* ${booking.service}\n🧑‍💼 ${booking.staff}\n📅 ${booking.date} в ${booking.time}\n🏢 ${booking.salon}\n\n`;
  });

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...getMainKeyboard() });
}

// Вывод информации о салонах
async function showSalons(chatId) {
  const salons = [
    { name: 'Салон 1', address: 'ул. Пушкина, 10' },
    { name: 'Салон 2', address: 'ул. Лермонтова, 15' },
    { name: 'Салон 3', address: 'ул. Гоголя, 20' },
    { name: 'Салон 4', address: 'ул. Толстого, 25' }
  ];

  const salonKeyboard = {
    reply_markup: {
      inline_keyboard: salons.map((salon, idx) => [{
        text: salon.name,
        callback_data: `salon_${idx}`
      }]).concat([[{ text: '◀️ Назад', callback_data: 'back_to_main' }]])
    }
  };

  await bot.sendMessage(chatId, '🏢 *Выберите салон:*', { parse_mode: 'Markdown', ...salonKeyboard });
}

// API для бронирования
app.post('/api/booking', async (req, res) => {
  try {
    const { service, staff, date, time, userId } = req.body;

    // Добавление записи в массив
    const booking = {
      userId,
      userName: 'Клиент',
      service,
      staff,
      date,
      time,
      salon: 'Салон 1',
      createdAt: new Date()
    };

    bookings.push(booking); // Сохраняем в массив

    // Сохраняем данные в JSON файл
    fs.writeFileSync(bookingsFilePath, JSON.stringify(bookings, null, 2));

    // Отправляем информацию в Telegram
    await sendBookingDetailsToClient(userId, service, staff, date, time);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

app.listen(10001, () => {
  console.log('Server is running on port 10001');
});

