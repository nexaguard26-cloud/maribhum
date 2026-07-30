import { updateTaskStatus, getTaskById, getVolunteerByTelegramId } from '../services/database.js';
import { sendNotificationToCoordinators } from '../services/notifications.js';

export async function handleTaskAction(bot, msg, action, taskId) {
  const chatId = msg.chat.id;

  try {
    switch (action) {
      case 'complete':
        await completeTask(bot, chatId, taskId);
        break;
      case 'start':
        await startTask(bot, chatId, taskId);
        break;
      case 'details':
        await showTaskDetails(bot, chatId, taskId);
        break;
      case 'emergency':
        await sendEmergencyAlert(bot, chatId, taskId);
        break;
      case 'location':
        await requestLocation(bot, chatId);
        break;
      default:
        await bot.sendMessage(chatId, '❌ إجراء غير معروف.');
    }
  } catch (error) {
    console.error('Error in handleTaskAction:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
}

async function completeTask(bot, chatId, taskId) {
  const volunteer = await getVolunteerByTelegramId(chatId);
  
  if (!volunteer) {
    await bot.sendMessage(chatId, '⚠️ أنت غير مسجل في النظام.');
    return;
  }

  const task = await getTaskById(taskId);
  
  if (!task) {
    await bot.sendMessage(chatId, '❌ المهمة غير موجودة.');
    return;
  }

  if (task.assigned_to !== volunteer.id) {
    await bot.sendMessage(chatId, '❌ هذه المهمة ليست مخصصة لك.');
    return;
  }

  // Update task status
  await updateTaskStatus(taskId, 'completed', volunteer.id);

  // Notify coordinators
  await sendNotificationToCoordinators(
    volunteer.organization_id,
    `✅ *تم إكمال المهمة!*

👤 المتطوع: ${volunteer.full_name}
📋 المهمة: ${task.title}
📍 المكان: ${task.location_text || 'غير محدد'}
    `
  );

  await bot.sendMessage(chatId, `
✅ *تم إكمال المهمة بنجاح!*

📋 ${task.title}
📍 ${task.location_text || ''}

شكراً لخدمتك! 🙏
  `, { parse_mode: 'Markdown' });
}

async function startTask(bot, chatId, taskId) {
  await updateTaskStatus(taskId, 'in_progress');

  const task = await getTaskById(taskId);

  await bot.sendMessage(chatId, `
🔄 *تم بدء تنفيذ المهمة*

📋 ${task?.title || ''}
⏰ بدأت: ${new Date().toLocaleString('ar-YE')}

💡 عند الانتهاء اضغط "أكملت المهمة"
  `, { parse_mode: 'Markdown' });
}

async function showTaskDetails(bot, chatId, taskId) {
  const task = await getTaskById(taskId);

  if (!task) {
    await bot.sendMessage(chatId, '❌ المهمة غير موجودة.');
    return;
  }

  const message = `
📌 *تفاصيل المهمة*

━━━━━━━━━━━━━━━━━━━━━━━
🏷️ العنوان: ${task.title}
📝 الوصف: ${task.description || 'لا يوجد'}

📍 الموقع: ${task.location_text || 'غير محدد'}
🗺️ المديرية: ${task.district || 'غير محددة'}
👥 المستهدفين: ${task.target_beneficiaries || 0} شخص

⏰ الموعد النهائي: ${task.due_date || 'غير محدد'}
🔖 الأولوية: ${getPriorityLabel(task.priority)}
━━━━━━━━━━━━━━━━━━━━━━━
  `;

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

async function sendEmergencyAlert(bot, chatId, taskId) {
  const volunteer = await getVolunteerByTelegramId(chatId);
  
  if (!volunteer) {
    await bot.sendMessage(chatId, '⚠️ أنت غير مسجل في النظام.');
    return;
  }

  const task = await getTaskById(taskId);

  // Send urgent notification to all coordinators
  await sendNotificationToCoordinators(
    volunteer.organization_id,
    `🚨 *بلاغ طوارئ!*

👤 المتطوع: ${volunteer.full_name}
📱 الهاتف: ${volunteer.phone}
📋 المهمة: ${task?.title || 'غير محددة'}
📍 الموقع: ${task?.location_text || volunteer.district || 'غير محدد'}

⏰ الوقت: ${new Date().toLocaleString('ar-YE')}
  `,
    'high'
  );

  await bot.sendMessage(chatId, `
🚨 *تم إرسال البلاغ الطارئ!*

🔴 تم إبلاغ المنسقين فوراً
📞 سيتواصلون معك قريباً

⚠️ ابقَ في مكانك آمناً
  `, { parse_mode: 'Markdown' });
}

async function requestLocation(bot, chatId) {
  await bot.sendMessage(chatId, `
📍 *شارك موقعك الحالي*

اضغط على الزر أدناه لمشاركة موقعك مع المنسقين:
  `, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[{
        text: '📍 مشاركة الموقع',
        request_location: true,
      }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

function getPriorityLabel(priority) {
  const labels = {
    critical: '🔴 حرج',
    high: '🟠 عالي',
    normal: '🟡 عادي',
    low: '🟢 منخفض',
  };
  return labels[priority] || '⚪ غير محدد';
}
