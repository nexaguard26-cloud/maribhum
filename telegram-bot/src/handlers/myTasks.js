import { getVolunteerByTelegramId, getVolunteerTasks } from '../services/database.js';
import { taskInlineKeyboard, taskDetailsKeyboard } from '../keyboards/inline.js';

export async function handleMyTasks(bot, msg) {
  const chatId = msg.chat.id;

  try {
    // Get volunteer
    const volunteer = await getVolunteerByTelegramId(chatId);

    if (!volunteer) {
      await bot.sendMessage(chatId, 
        '⚠️ أنت غير مسجل في النظام.\n\nاضغط /start للتسجيل أولاً.'
      );
      return;
    }

    // Get active tasks
    const tasks = await getVolunteerTasks(volunteer.id);

    if (tasks.length === 0) {
      await bot.sendMessage(chatId, `
📭 *لا توجد مهام حالياً*

لم يتم تعيين أي مهمة لك بعد.
سيتم إشعارك عند توفر مهام جديدة.

━━━━━━━━━━━━━━━━━━━━━━━
🔄 للتحديث: /my_tasks
      `, { parse_mode: 'Markdown' });
      return;
    }

    // Show tasks
    for (const task of tasks) {
      const priorityEmoji = {
        critical: '🔴',
        high: '🟠',
        normal: '🟡',
        low: '🟢',
      }[task.priority] || '⚪';

      const statusEmoji = {
        assigned: '📋',
        in_progress: '🔄',
      }[task.status] || '📋';

      const message = `
${statusEmoji} ${priorityEmoji} *${task.title}*

📝 ${task.description || 'لا يوجد وصف'}

📍 ${task.location_text || task.district || 'غير محدد'}
👥 ${task.target_beneficiaries || 0} مستفيد
⏰ الموعد: ${task.due_date || 'غير محدد'}

━━━━━━━━━━━━━━━━━━━━━━━
      `;

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: taskInlineKeyboard(task.id, task.status),
      });
    }

  } catch (error) {
    console.error('Error in handleMyTasks:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
}
