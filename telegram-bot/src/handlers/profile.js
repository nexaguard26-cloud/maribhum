import { getVolunteerByTelegramId, getVolunteerStats } from '../services/database.js';
import { profileKeyboard } from '../keyboards/inline.js';

export async function handleProfile(bot, msg) {
  const chatId = msg.chat.id;

  try {
    const volunteer = await getVolunteerByTelegramId(chatId);

    if (!volunteer) {
      await bot.sendMessage(chatId, 
        '⚠️ أنت غير مسجل في النظام.\n\nاضغط /start للتسجيل أولاً.'
      );
      return;
    }

    const stats = await getVolunteerStats(volunteer.id);

    const statusEmoji = {
      active: '🟢',
      pending: '🟡',
      busy: '🔵',
      inactive: '⚫',
    }[volunteer.status] || '⚪';

    const message = `
👤 *ملفي الشخصي*

━━━━━━━━━━━━━━━━━━━━━━━
🆔 الاسم: ${volunteer.full_name}
📱 الهاتف: ${volunteer.phone}
${statusEmoji} الحالة: ${getStatusLabel(volunteer.status)}

📍 المحافظة: ${volunteer.province || 'غير محددة'}
🏘️ المديرية: ${volunteer.district || 'غير محددة'}

🎯 المهارات:
${formatSkills(volunteer.skills)}

🚗 مركبة: ${volunteer.has_vehicle ? 'نعم ✅' : 'لا ❌'}

━━━━━━━━━━━━━━━━━━━━━━━
📊 *إحصائياتي*

✅ المهام المكتملة: ${stats.completed_tasks}
📋 المهام الحالية: ${stats.active_tasks}
📝 التقارير المقدمة: ${stats.total_reports}

━━━━━━━━━━━━━━━━━━━━━━━
📅 تاريخ التسجيل: ${formatDate(volunteer.created_at)}
    `;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: profileKeyboard,
    });

  } catch (error) {
    console.error('Error in handleProfile:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
}

function getStatusLabel(status) {
  const labels = {
    active: 'نشط',
    pending: 'قيد المراجعة',
    busy: 'مشغول',
    inactive: 'غير نشط',
  };
  return labels[status] || status;
}

function formatSkills(skills) {
  if (!skills || skills.length === 0) return '  لا توجد مهارات مسجلة';
  
  const skillLabels = {
    distribution: '📦 توزيع مواد',
    medical: '🏥 طبي',
    first_aid: '🚑 إسعافات أولية',
    logistics: '🚚 لوجستي',
    awareness: '📢 توعية',
    education: '📚 تعليم',
    media: '📸 إعلام',
    driver: '🚗 سائق',
    coordination: '🤝 تنسيق',
    psychological_support: '💚 دعم نفسي',
  };

  return skills
    .map(s => `  • ${skillLabels[s] || s}`)
    .join('\n');
}

function formatDate(dateStr) {
  if (!dateStr) return 'غير محدد';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
