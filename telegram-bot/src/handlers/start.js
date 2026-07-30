import { getVolunteerByTelegramId, createVolunteer, updateVolunteerField } from '../services/database.js';
import { strings } from '../i18n/ar.js';
import { mainMenuKeyboard } from '../keyboards/reply.js';

export async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name;
  const username = msg.from.username || '';

  try {
    // Check if already registered
    const volunteer = await getVolunteerByTelegramId(chatId);

    if (volunteer) {
      // Already registered - show welcome back
      await bot.sendMessage(chatId, `
🤝 *مرحباًعوداً ${volunteer.full_name}!*

أنت مسجل في النظام كمتطوع نشط.
      `, {
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard,
      });
      return;
    }

    // New user - start registration
    await bot.sendMessage(chatId, `
👋 *مرحباً بك في نظام المتطوعين!*

أنا مساعدك في إدارة المهام والتواصل مع المنسقين.

━━━━━━━━━━━━━━━━━━━━━━━
📋 *ما الذي سأقدمه لك:*
• استلام المهام وتنفيذها
• إرسال تقارير ميدانية
• التواصل مع المنسقين
• زر الطوارئ للاستعانة الفورية
━━━━━━━━━━━━━━━━━━━━━━━

🔄 للبدء، أحتاج بعض المعلومات:
    `, {
      parse_mode: 'Markdown',
    });

    // Ask for name
    await bot.sendMessage(chatId, `
✍️ ما هو *اسمك الكامل*؟

مثال: أحمد محمد علي
    `, { parse_mode: 'Markdown' });

    // Store state for next step (we'll handle this with a simple approach)
    // In production, use Redis or database for state management

  } catch (error) {
    console.error('Error in handleStart:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
}
