require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();

// Choose polling OR webhook mode, not both
let bot;

if (process.env.NODE_ENV === 'production') {
  // Use webhook in production
  bot = new TelegramBot(process.env.BOT_TOKEN);
  bot.setWebHook(process.env.WEBHOOK_URL || '');
} else {
  // Use polling in development
  bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: {
      params: {
        timeout: 10
      },
      interval: 2000
    }
  });
  // Make sure to delete any existing webhook
  bot.deleteWebHook();
}

// Обработчик пользователей и записи
const users = {};
const pendingBookings = {};

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Получение последней записи для пользователя
function getLastBookingForUser(chatId) {
  const user = users[chatId];
  if (!user || !user.lastBookingId) return null;
  return pendingBookings[user.lastBookingId];
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  try {
    const chatId = msg.chat.id;
    
    // Проверяем, что у нас есть данные пользователя
    if (!msg.from) {
      console.error('Ошибка: msg.from отсутствует в сообщении');
      bot.sendMessage(chatId, 'Произошла ошибка при обработке команды. Пожалуйста, попробуйте снова.');
      return;
    }
    
    const username = msg.from.username || `user_${msg.from.id}`;
    console.log(`Получена команда /start от пользователя ${username}, chatId: ${chatId}`);
    
    // Сохраняем информацию о пользователе
    users[chatId] = { username, lastBookingId: null };

    // Ищем неподтвержденные записи
    let availableBookings = [];
    
    for (const [id, booking] of Object.entries(pendingBookings)) {
      if (booking && booking.confirmed === false && booking.cancelled === false) {
        availableBookings.push({
          id,
          booking,
          timestamp: booking.timestamp ? new Date(booking.timestamp).getTime() : 0
        });
      }
    }
    
    // Сортируем по времени создания (от новых к старым)
    availableBookings.sort((a, b) => b.timestamp - a.timestamp);
    
    // Берем самую свежую запись
    const newestBooking = availableBookings.length > 0 ? availableBookings[0] : null;
    
    if (newestBooking) {
      const booking = newestBooking.booking;
      const bookingId = newestBooking.id;
      
      // Обновляем данные пользователя с ID записи
      users[chatId].lastBookingId = bookingId;
      
      // Привязываем chatId к записи
      booking.chatId = chatId;
      
      // Форматируем данные с проверкой на undefined
      const service = booking.service || 'Не указана';
      const staff = booking.staff || 'Не указан';
      const date = booking.date || 'Не указана';
      const time = booking.time || 'Не указано';
      
      bot.sendMessage(chatId, `🎉 Ваша запись найдена:\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✅ Подтвердить запись", callback_data: `confirm_${bookingId}` }],
            [{ text: "❌ Отменить", callback_data: `cancel_${bookingId}` }]
          ]
        }
      }).catch(error => {
        console.error('Ошибка при отправке сообщения с записью:', error);
      });
    } else {
      // Если нет записей - отправляем приветственное сообщение
      bot.sendMessage(chatId, `Добро пожаловать в Leo Beauty! ✨\n\nДля записи перейдите на наш сайт.`)
      .catch(error => {
        console.error('Ошибка при отправке приветственного сообщения:', error);
      });
    }
  } catch (error) {
    console.error('Критическая ошибка в обработчике /start:', error);
    
    try {
      bot.sendMessage(msg.chat.id, 'Произошла ошибка при обработке команды. Пожалуйста, попробуйте снова позже.');
    } catch (e) {
      console.error('Не удалось отправить сообщение об ошибке:', e);
    }
  }
});

// Обработка кнопок
bot.on('callback_query', async (query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const [action, bookingId] = query.data.split('_');
    const booking = pendingBookings[bookingId];

    if (!booking) {
      bot.answerCallbackQuery(query.id, { text: "❌ Запись не найдена" });
      return;
    }

    // Получаем данные для отображения
    const service = booking.service || 'Не указана';
    const staff = booking.staff || 'Не указан';
    const date = booking.date || 'Не указана';
    const time = booking.time || 'Не указано';

    if (action === 'confirm') {
      // Обновляем сообщение с кнопками
      await bot.editMessageText(`✅ Ваш визит подтвержден!\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] } // Убираем кнопки
      });
      
      // Отправляем дополнительное сообщение с подтверждением
      await bot.sendMessage(chatId, "✅ Ваша запись подтверждена! Ждем вас в назначенное время.");
      
      // Помечаем запись как подтвержденную
      booking.confirmed = true;
      booking.cancelled = false;
      
      // Отвечаем на callback query
      bot.answerCallbackQuery(query.id, { text: "Запись подтверждена!" });
    } else if (action === 'cancel') {
      // Удаляем сообщение с кнопками
      await bot.editMessageText(`❌ Запись отменена\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] } // Убираем кнопки
      });
      
      // Отправляем сообщение об отмене
      await bot.sendMessage(chatId, "❌ Ваша запись отменена.");
      
      // Удаляем запись полностью из системы
      delete pendingBookings[bookingId];
      
      // Отвечаем на callback query
      bot.answerCallbackQuery(query.id, { text: "Запись отменена!" });
    }
  } catch (error) {
    console.error('Ошибка при обработке кнопки:', error);
    
    try {
      // Пытаемся ответить пользователю, что произошла ошибка
      if (query && query.message && query.message.chat && query.message.chat.id) {
        await bot.sendMessage(query.message.chat.id, "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.");
      }
      
      if (query && query.id) {
        bot.answerCallbackQuery(query.id, { text: "Произошла ошибка" });
      }
    } catch (sendError) {
      console.error('Не удалось отправить сообщение об ошибке:', sendError);
    }
  }
});

// Эндпоинт для записи
app.post('/api/pending-booking', (req, res) => {
  try {
    const { userId, service, staff, date, time } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Отсутствует обязательное поле userId' 
      });
    }
    
    // Сохраняем данные записи
    pendingBookings[userId] = { 
      service, 
      staff, 
      date, 
      time, 
      timestamp: new Date().toISOString(),
      confirmed: false,
      cancelled: false
    };
    
    console.log(`Новая запись создана: ${JSON.stringify(pendingBookings[userId])}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Webhook endpoint for production mode
if (process.env.NODE_ENV === 'production') {
  app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));