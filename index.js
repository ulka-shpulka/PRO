// index.js

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = '7492776215:AAFBnBmCvf_LL1QlW7zOXO19piWCRvWNb3k';
const SERVER_URL = 'https://pro-1-qldl.onrender.com';

const bot = new TelegramBot(BOT_TOKEN, { webHook: { port: process.env.PORT || 3000 } });

mongoose.connect('mongodb://localhost:27017/beauty_salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const BookingSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  userName: { type: String },
  service: { type: String, required: true },
  staff: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  salon: { type: String, default: 'Салон 1' },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', BookingSchema);

const CHANNEL_ID = '@MLfeBot';
const ADMIN_USERNAME = '@sae_bun';

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

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const messageId = query.message.message_id;
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

async function showUserBookings(chatId, userId) {
  const bookings = await Booking.find({ userId }).sort({ date: 1, time: 1 });
  if (bookings.length === 0) {
    return bot.sendMessage(chatId, 'У вас пока нет ни одной записи.', getMainKeyboard());
  }

  let message = '📋 *Ваши записи:*\n\n';
  bookings.forEach((booking, index) => {
    message += `*${index + 1}.* ${booking.service}\n🧑‍💼 ${booking.staff}\n📅 ${booking.date} в ${booking.time}\n🏢 ${booking.salon}\n\n`;
  });

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...getMainKeyboard() });
}

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

app.post('/api/booking', async (req, res) => {
  try {
    const { service, staff, date, time } = req.body;

    const booking = new Booking({
      userId: 0,
      userName: 'Клиент',
      service,
      staff,
      date,
      time,
      salon: 'Салон 1'
    });

    await booking.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});
