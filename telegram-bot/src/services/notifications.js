import { getPendingNotifications, markNotificationAsRead } from './database.js';
import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = 'https://api.telegram.org/bot' + BOT_TOKEN;

async function sendTelegramMessage(chatId, text, parse_mode = 'Markdown') {
  try {
    const response = await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return null;
  }
}

export async function checkPendingNotifications(bot) {
  try {
    // This would typically query all active volunteers
    // For now, we'll just log that the check ran
    console.log('[Notifications] Checking for pending notifications...');
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

export async function sendNotificationToUser(telegramId, title, message) {
  const text = `📢 *${title}*\n\n${message}`;
  return await sendTelegramMessage(telegramId, text);
}

export async function sendNotificationToCoordinators(organizationId, message, priority = 'normal') {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get coordinators for this organization
    const { data: coordinators } = await supabase
      .from('staff')
      .select('telegram_id')
      .eq('organization_id', organizationId)
      .in('role', ['coordinator', 'supervisor', 'admin', 'director'])
      .not('telegram_id', 'is', null);

    if (!coordinators || coordinators.length === 0) {
      console.log('[Notifications] No coordinators found for organization:', organizationId);
      return;
    }

    // Send to each coordinator
    for (const coordinator of coordinators) {
      if (coordinator.telegram_id) {
        await sendTelegramMessage(coordinator.telegram_id, message);
      }
    }

    console.log(`[Notifications] Sent to ${coordinators.length} coordinators`);
  } catch (error) {
    console.error('Error sending notifications to coordinators:', error);
  }
}

export async function sendEmergencyNotification(organizationId, volunteerInfo, taskInfo, location) {
  const message = `
🚨 *بلاغ طوارئ!*

━━━━━━━━━━━━━━━━━━━━━━━
👤 *المتطوع:*
   ${volunteerInfo.name}
   📱 ${volunteerInfo.phone}

📋 *المهمة الحالية:*
   ${taskInfo?.title || 'غير محددة'}

📍 *الموقع:*
   ${location || volunteerInfo.district || 'غير محدد'}

⏰ *الوقت:*
   ${new Date().toLocaleString('ar-YE')}

━━━━━━━━━━━━━━━━━━━━━━━
⚠️ تدخل سريع مطلوب!
  `;

  return await sendNotificationToCoordinators(organizationId, message, 'high');
}

export async function sendTaskAssignmentNotification(volunteerTelegramId, task) {
  const message = `
📋 *تم تعيين مهمة جديدة!*

━━━━━━━━━━━━━━━━━━━━━━━
🏷️ ${task.title}
📝 ${task.description?.substring(0, 100) || 'بدون وصف'}...

📍 المكان: ${task.location_text || task.district || 'غير محدد'}
👥 المستفيدين: ${task.target_beneficiaries || 0}
⏰ الموعد: ${task.due_date || 'غير محدد'}
🔖 الأولوية: ${getPriorityEmoji(task.priority)} ${task.priority}

━━━━━━━━━━━━━━━━━━━━━━━
✅ اضغط /my_tasks لعرض المهمة
  `;

  return await sendTelegramMessage(volunteerTelegramId, message);
}

function getPriorityEmoji(priority) {
  const emojis = {
    critical: '🔴',
    high: '🟠',
    normal: '🟡',
    low: '🟢',
  };
  return emojis[priority] || '⚪';
}
