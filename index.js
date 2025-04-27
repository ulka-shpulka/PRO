require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const path = require('path');

// Environment variables
const token = process.env.BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
const domain = process.env.DOMAIN;
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/salon';

// Validate critical environment variables
if (!token || !adminChatId) {
  console.error('Ошибка: проверьте BOT_TOKEN и ADMIN_CHAT_ID');
  process.exit(1);
}

// Initialize bot and Express
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Express middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// Define schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  chatId: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  service: { type: String, required: true },
  staff: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  telegramUsername: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Define models
const User = mongoose.model('User', userSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// In-memory storage for pending bookings
const pendingBookings = {};

// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  if (!username) {
    return bot.sendMessage(chatId, 'Пожалуйста, установите username в настройках Telegram для использования нашего сервиса записи.');
  }

  try {
    // Save or update user
    await User.findOneAndUpdate(
      { username },
      { username, chatId },
      { upsert: true, new: true }
    );
    
    console.log(`✅ Пользователь ${username} зарегистрирован с chatId ${chatId}`);
    
    // Check if there's a pending booking
    const pendingBooking = pendingBookings[username];
    
    if (pendingBooking) {
      // Create confirmation buttons
      const confirmKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить запись', callback_data: `confirm_${username}` },
            { text: '❌ Отменить', callback_data: `cancel_${username}` }
          ]
        ]
      };
      
      // Send confirmation message
      await bot.sendMessage(
        chatId,
        `Найдена ваша запись:
        
✨ Услуга: ${pendingBooking.service}
🧑‍💼 Специалист: ${pendingBooking.staff}
📆 Дата: ${pendingBooking.date}
🕒 Время: ${pendingBooking.time}

Пожалуйста, подтвердите запись:`,
        { reply_markup: confirmKeyboard }
      );
    } else {
      // Welcome message
      await bot.sendMessage(
        chatId,
        `Добро пожаловать в Leo Beauty! ✨

Для записи на услуги используйте наш сайт.
        
Ваш аккаунт успешно связан с системой записи.`
      );
    }
  } catch (error) {
    console.error('Ошибка сохранения пользователя:', error);
    bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте позже.');
  }
});

// Handle callback queries (button clicks)
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  
  // Extract action and username
  const [command, username] = action.split('_');
  
  if (command === 'confirm' && pendingBookings[username]) {
    try {
      const booking = pendingBookings[username];
      
      // Save booking to database
      const newBooking = new Booking({
        ...booking,
        telegramUsername: username,
        status: 'confirmed'
      });
      await newBooking.save();
      
      // Notify admin
      const adminMessage = `
🆕 Новая запись!
Услуга: ${booking.service}
Специалист: ${booking.staff}
Дата: ${booking.date}
Время: ${booking.time}
От пользователя: @${username}
      `;
      await bot.sendMessage(adminChatId, adminMessage);
      
      // Notify user
      await bot.editMessageText(
        `✅ Ваш визит в Leo Beauty подтверждён!

✨ Услуга: ${booking.service}
🧑‍💼 Специалист: ${booking.staff}
📆 Дата: ${booking.date}
🕒 Время: ${booking.time}

Спасибо за ваш выбор! Ждём вас! 🌸`,
        {
          chat_id: chatId,
          message_id: messageId
        }
      );
      
      // Remove from pending
      delete pendingBookings[username];
      
    } catch (error) {
      console.error('Ошибка подтверждения записи:', error);
      bot.sendMessage(chatId, 'Произошла ошибка при подтверждении записи. Пожалуйста, попробуйте позже.');
    }
  } else if (command === 'cancel' && pendingBookings[username]) {
    // Remove from pending
    delete pendingBookings[username];
    
    // Notify user
    await bot.editMessageText(
      '❌ Запись отменена. Вы можете создать новую запись через наш сайт.',
      {
        chat_id: chatId,
        message_id: messageId
      }
    );
  }
});

// API Endpoints
app.post('/api/pending-booking', async (req, res) => {
  const { service, staff, date, time, telegramUsername } = req.body;

  if (!service || !staff || !date || !time || !telegramUsername) {
    console.error('Ошибка: Все поля обязательны', req.body);
    return res.status(400).json({ success: false, error: 'Все поля обязательны' });
  }

  try {
    // Check if user exists in database
    const user = await User.findOne({ username: telegramUsername });
    
    // Save the pending booking
    pendingBookings[telegramUsername] = { service, staff, date, time };
    console.log('Запись временно сохранена', pendingBookings[telegramUsername]);
    
    // If user already exists, send them the confirmation message
    if (user) {
      const confirmKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить запись', callback_data: `confirm_${telegramUsername}` },
            { text: '❌ Отменить', callback_data: `cancel_${telegramUsername}` }
          ]
        ]
      };
      
      await bot.sendMessage(
        user.chatId,
        `Найдена ваша запись:
        
✨ Услуга: ${service}
🧑‍💼 Специалист: ${staff}
📆 Дата: ${date}
🕒 Время: ${time}

Пожалуйста, подтвердите запись:`,
        { reply_markup: confirmKeyboard }
      );
    }
    
    return res.json({ 
      success: true, 
      message: 'Запись временно сохранена, переходите в Telegram для подтверждения.',
      userExists: !!user
    });
  } catch (error) {
    console.error('Ошибка при сохранении временной записи:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
});

// Server
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`Домен: ${domain}`);
});

// Error handling for Telegram bot
bot.on('polling_error', (error) => {
  console.error('Ошибка Telegram бота:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Завершение работы сервера...');
  await mongoose.connection.close();
  process.exit(0);
});