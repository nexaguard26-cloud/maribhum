import { handleTaskAction } from './taskActions.js';
import { handleReportCallback } from './report.js';

export async function handleCallbackQuery(bot, query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  try {
    // Parse callback data
    const [type, action, ...params] = data.split(':');

    switch (type) {
      case 'task':
        // Format: task:action:taskId
        const taskId = params[0];
        await handleTaskAction(bot, query.message, action, taskId);
        break;

      case 'report':
        // Report callback handler
        await handleReportCallback(bot, query);
        break;

      case 'profile':
        // Profile related callbacks
        await handleProfileCallback(bot, query);
        break;

      default:
        await bot.answerCallbackQuery(query.id, {
          text: 'إجراء غير معروف',
          show_alert: true,
        });
    }

  } catch (error) {
    console.error('Error in callback query:', error);
    await bot.answerCallbackQuery(query.id, {
      text: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      show_alert: true,
    });
  }
}

async function handleProfileCallback(bot, query) {
  const data = query.data;
  const [type, action] = data.split(':');

  await bot.answerCallbackQuery(query.id);

  switch (action) {
    case 'edit':
      await bot.sendMessage(query.message.chat.id, 
        '📝 هذه الميزة قادمة قريباً...\nيمكنك التواصل مع المنسق لتعديل بياناتك.'
      );
      break;
    case 'skills':
      await bot.sendMessage(query.message.chat.id, 
        '🎯 هذه الميزة قادمة قريباً...\nيمكنك التواصل مع المنسق لتعديل مهاراتك.'
      );
      break;
    default:
      break;
  }
}
