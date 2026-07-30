import { getVolunteerByTelegramId, createReport } from '../services/database.js';
import { reportTypeKeyboard } from '../keyboards/inline.js';

let reportStates = new Map(); // userId -> { step, data }

export async function handleReport(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Check if registered
    const volunteer = await getVolunteerByTelegramId(chatId);

    if (!volunteer) {
      await bot.sendMessage(chatId, 
        '⚠️ أنت غير مسجل في النظام.\n\nاضغط /start للتسجيل أولاً.'
      );
      return;
    }

    // Initialize report state
    reportStates.set(userId, { step: 'type', volunteer });

    await bot.sendMessage(chatId, `
📝 *تقديم تقرير ميداني*

━━━━━━━━━━━━━━━━━━━━━━━
اختر *نوع التقرير*:
    `, {
      parse_mode: 'Markdown',
      reply_markup: reportTypeKeyboard,
    });

  } catch (error) {
    console.error('Error in handleReport:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
}

export async function handleReportCallback(bot, query) {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  try {
    const state = reportStates.get(userId);

    if (!state) {
      await bot.answerCallbackQuery(query.id, { text: 'انتهت صلاحية الطلب.' });
      return;
    }

    // Parse callback data
    const [action, value] = data.split(':');

    if (action === 'report_type') {
      state.step = 'description';
      state.data = { report_type: value };

      await bot.answerCallbackQuery(query.id);
      await bot.editMessageText(`
✍️ *${getReportTypeLabel(value)}*

اكتب تفاصيل التقرير:

━━━━━━━━━━━━━━━━━━━━━━━
📝 مثال:
تم توزيع 50 حقيبة غذائية على الأسر المتضررة في حي السوق
      `, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
      });

    } else if (action === 'cancel_report') {
      reportStates.delete(userId);
      await bot.answerCallbackQuery(query.id, { text: 'تم إلغاء التقرير.' });
      await bot.editMessageText('❌ تم إلغاء التقرير.', {
        chat_id: chatId,
        message_id: query.message.message_id,
      });
    }

  } catch (error) {
    console.error('Error in handleReportCallback:', error);
    await bot.answerCallbackQuery(query.id, { text: 'حدث خطأ.' });
  }
}

// Handle text input for reports
export async function handleReportText(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  try {
    const state = reportStates.get(userId);

    if (!state || state.step !== 'description') {
      return; // Not in report flow
    }

    state.data.description = text;
    state.step = 'severity';

    await bot.sendMessage(chatId, `
✅ تم حفظ الوصف

📍 هل تريد إضافة موقع؟

🔹 اضغط /location لمشاركة موقعك
🔹 أو اكتب "تخطي" للمتابعة
    `);

    // For simplicity, we'll proceed to create the report
    await createAndSubmitReport(bot, chatId, state);

  } catch (error) {
    console.error('Error in handleReportText:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
}

async function createAndSubmitReport(bot, chatId, state) {
  const { volunteer, data } = state;

  try {
    const report = await createReport({
      volunteer_id: volunteer.id,
      organization_id: volunteer.organization_id,
      report_type: data.report_type,
      title: getReportTypeLabel(data.report_type),
      description: data.description,
      location_text: data.location || null,
      severity: data.severity || 'medium',
    });

    reportStates.delete(volunteer.telegram_id);

    await bot.sendMessage(chatId, `
✅ *تم إرسال التقرير بنجاح!*

━━━━━━━━━━━━━━━━━━━━━━━
📋 النوع: ${getReportTypeLabel(data.report_type)}
📝 الوصف: ${data.description?.substring(0, 50)}...
⏰ الوقت: ${new Date().toLocaleString('ar-YE')}

🔄 شكراً لتقريرك! سيتم مراجعته من قبل المنسقين.
    `, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error creating report:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ. يرجى المحاولة مرة أخرى.');
  }
}

function getReportTypeLabel(type) {
  const labels = {
    progress: 'تقرير تقدم',
    completion: 'تقرير إنجاز',
    issue: 'تقرير مشكلة',
    checkpoint: 'نقطة وصول',
    need_assessment: 'تقييم احتياج',
    emergency: 'بلاغ طوارئ',
  };
  return labels[type] || type;
}
