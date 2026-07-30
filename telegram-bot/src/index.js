import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { handleStart } from './handlers/start.js';
import { handleMyTasks } from './handlers/myTasks.js';
import { handleTaskAction } from './handlers/taskActions.js';
import { handleReport } from './handlers/report.js';
import { handleProfile } from './handlers/profile.js';
import { handleCallbackQuery } from './handlers/callbackQuery.js';
import { checkPendingNotifications } from './services/notifications.js';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🤖 Marib Humanitarian Telegram Bot              ║
║                                                   ║
║   🚀 Bot is running...                            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
`);

// ===================
// COMMAND HANDLERS
// ===================

// /start - Main entry point
bot.onText(/\/start/, (msg) => handleStart(bot, msg));

// /help - Show help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
🤝 *مساعدة*

الأوامر المتاحة:

📋 /my_tasks - عرض مهامي
📝 /report - تقديم تقرير ميداني
👤 /profile - ملفي الشخصي
📊 /stats - إحصائياتي
❓ /help - المساعدة

_للحصول على مساعدة إضافية، تواصل مع المنسق_
  `, { parse_mode: 'Markdown' });
});

// /my_tasks - Show assigned tasks
bot.onText(/\/my_tasks/, (msg) => handleMyTasks(bot, msg));

// /report - Submit field report
bot.onText(/\/report/, (msg) => handleReport(bot, msg));

// /profile - Show volunteer profile
bot.onText(/\/profile/, (msg) => handleProfile(bot, msg));

// /stats - Show volunteer stats
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const { getVolunteerByTelegramId, getVolunteerStats } = await import('./services/database.js');
    const volunteer = await getVolunteerByTelegramId(chatId);
    
    if (!volunteer) {
      bot.sendMessage(chatId, '⚠️ أنت غير مسجل في النظام. اضغط /start للتسجيل.');
      return;
    }
    
    const stats = await getVolunteerStats(volunteer.id);
    
    bot.sendMessage(chatId, `
📊 *إحصائياتك*

✅ المهام المكتملة: ${stats.completed_tasks}
📋 المهام الحالية: ${stats.active_tasks}
📝 التقارير المقدمة: ${stats.total_reports}

━━━━━━━━━━━━━━━━━━━━━━━
🔄 للتحديث: /stats
  `, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Stats error:', error);
    bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
});

// ===================
// CALLBACK QUERIES
// ===================

bot.on('callback_query', (query) => handleCallbackQuery(bot, query));

// ===================
// MESSAGE HANDLERS
// ===================

// Handle contact sharing
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  
  try {
    const { updateVolunteerPhone } = await import('./services/database.js');
    
    const phone = contact.phone_number;
    await updateVolunteerPhone(chatId, phone);
    
    const { strings } = await import('./i18n/ar.js');
    bot.sendMessage(chatId, `✅ تم حفظ رقمك: ${phone}\n\n${strings.registration.askProvince}`);
  } catch (error) {
    console.error('Error saving contact:', error);
    bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
});

// Handle location sharing
bot.on('location', async (msg) => {
  const chatId = msg.chat.id;
  const location = msg.location;
  
  // Store location for current context (report or emergency)
  // This would typically use a temporary state storage
  
  bot.sendMessage(chatId, `📍 تم استلام موقعك!\n Longitude: ${location.longitude}\n Latitude: ${location.latitude}`);
});

// ===================
// ERROR HANDLING
// ===================

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// ===================
// BACKGROUND TASKS
// ===================

// Check for pending notifications every 30 seconds
setInterval(async () => {
  try {
    await checkPendingNotifications(bot);
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}, 30000);

console.log('Bot initialized successfully');
