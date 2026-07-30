// Inline keyboards for task actions

export function taskInlineKeyboard(taskId, status) {
  const buttons = [];

  if (status === 'assigned') {
    buttons.push([
      { text: '🔄 بدأت التنفيذ', callback_data: `task:start:${taskId}` },
    ]);
  }

  buttons.push([
    { text: '✅ أكملت المهمة', callback_data: `task:complete:${taskId}` },
    { text: '📌 التفاصيل', callback_data: `task:details:${taskId}` },
  ]);

  buttons.push([
    { text: '📍 مشاركة الموقع', callback_data: `task:location:${taskId}` },
    { text: '🚨 طوارئ', callback_data: `task:emergency:${taskId}` },
  ]);

  return {
    inline_keyboard: buttons,
  };
}

export function taskDetailsKeyboard(taskId) {
  return {
    inline_keyboard: [
      [
        { text: '✅ أكملت', callback_data: `task:complete:${taskId}` },
        { text: '🔄 جاري التنفيذ', callback_data: `task:start:${taskId}` },
      ],
      [
        { text: '📍 الموقع', callback_data: `task:location:${taskId}` },
        { text: '🚨 إبلاغ مشكلة', callback_data: `task:emergency:${taskId}` },
      ],
      [
        { text: '🔙 رجوع', callback_data: `back:tasks` },
      ],
    ],
  };
}

// Report type selection keyboard
export function reportTypeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📊 تقرير تقدم', callback_data: 'report:type:progress' },
        { text: '✅ تقرير إنجاز', callback_data: 'report:type:completion' },
      ],
      [
        { text: '⚠️ تقرير مشكلة', callback_data: 'report:type:issue' },
        { text: '📍 نقطة وصول', callback_data: 'report:type:checkpoint' },
      ],
      [
        { text: '🔍 تقييم احتياج', callback_data: 'report:type:need_assessment' },
      ],
      [
        { text: '❌ إلغاء', callback_data: 'report:cancel' },
      ],
    ],
  };
}

// Profile keyboard
export function profileKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '✏️ تعديل البيانات', callback_data: 'profile:edit' },
        { text: '🎯 مهاراتي', callback_data: 'profile:skills' },
      ],
      [
        { text: '📋 عرض مهامي', callback_data: 'profile:tasks' },
        { text: '📊 إحصائياتي', callback_data: 'profile:stats' },
      ],
    ],
  };
}

// Severity selection keyboard
export function severityKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🟢 منخفض', callback_data: 'severity:low' },
        { text: '🟡 متوسط', callback_data: 'severity:medium' },
      ],
      [
        { text: '🟠 مرتفع', callback_data: 'severity:high' },
        { text: '🔴 حرج', callback_data: 'severity:critical' },
      ],
    ],
  };
}

// Confirmation keyboard
export function confirmKeyboard(action, id) {
  return {
    inline_keyboard: [
      [
        { text: '✅ نعم، تأكيد', callback_data: `confirm:${action}:${id}` },
        { text: '❌ إلغاء', callback_data: `cancel:${action}:${id}` },
      ],
    ],
  };
}
