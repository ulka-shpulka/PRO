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
const telegramUserIds = {}; // Новый объект для хранения связей между userId и chatId

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Функция для поиска записей пользователя по userId или telegramId
function findBookingsForUser(userId, chatId) {
  let userBookings = [];
  
  // Проверяем, есть ли связь между chatId и userId
  const linkedUserId = chatId ? Object.keys(telegramUserIds).find(uid => telegramUserIds[uid] === chatId) : null;
  
  for (const [id, booking] of Object.entries(pendingBookings)) {
    // Если запись принадлежит пользователю (проверяем и по прямому userId и по связанному userId)
    if ((userId && id.includes(userId)) || (linkedUserId && id.includes(linkedUserId)) || (booking.userId && (booking.userId === userId || booking.userId === linkedUserId))) {
      if (booking && !booking.cancelled) {
        userBookings.push({
          id,
          booking,
          timestamp: booking.timestamp ? new Date(booking.timestamp).getTime() : 0
        });
      }
    }
  }
  
  // Сортируем по времени создания (от новых к старым)
  userBookings.sort((a, b) => b.timestamp - a.timestamp);
  
  return userBookings;
}

// Команда /start
bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
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
    
    // Проверяем, был ли передан userId как параметр
    // Например: /start user_123456
    const userIdParam = match && match[1] ? match[1].trim() : null;
    
    // Сохраняем информацию о пользователе
    users[chatId] = { username, lastBookingId: null };
    
    // Если передан userId, связываем его с текущим chatId
    if (userIdParam) {
      console.log(`Связываем userId ${userIdParam} с chatId ${chatId}`);
      telegramUserIds[userIdParam] = chatId;
    }
    
    // Ищем записи для пользователя
    const userBookings = findBookingsForUser(userIdParam, chatId);
    
    if (userBookings.length > 0) {
      // Берем самую свежую запись
      const newestBooking = userBookings[0];
      const booking = newestBooking.booking;
      const bookingId = newestBooking.id;
      
      // Обновляем данные пользователя с ID записи
      users[chatId].lastBookingId = bookingId;
      
      // Привязываем chatId к записи
      booking.chatId = chatId;
      
      // Если запись уже подтверждена, показываем соответствующее сообщение
      if (booking.confirmed) {
        const service = booking.service || 'Не указана';
        const staff = booking.staff || 'Не указан';
        const date = booking.date || 'Не указана';
        const time = booking.time || 'Не указано';
        
        bot.sendMessage(chatId, `✅ Ваша запись уже подтверждена:\n\n✨ Услуга: ${service}\n🧑‍💼 Специалист: ${staff}\n📅 Дата: ${date}\n🕒 Время: ${time}\n\nЖдем вас в назначенное время!`);
        return;
      }
      
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
      
      // Отменяем запись
      booking.cancelled = true;
      booking.confirmed = false;
      
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
      userId, // Добавляем userId в саму запись для удобства поиска
      timestamp: new Date().toISOString(),
      confirmed: false,
      cancelled: false
    };
    
    console.log(`Новая запись создана: ${JSON.stringify(pendingBookings[userId])}`);
    res.json({ success: true, bookingId: userId });
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// Добавим эндпоинт для получения всех записей (для отладки)
app.get('/api/bookings', (req, res) => {
  res.json({ pendingBookings, telegramUserIds });
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