// Reply keyboards (main menu)
export const mainMenuKeyboard = {
  keyboard: [
    [
      { text: '📋 مهامي' },
      { text: '📝 تقرير جديد' },
    ],
    [
      { text: '👤 ملفي' },
      { text: '📊 إحصائياتي' },
    ],
    [
      { text: '❓ المساعدة' },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

// Province selection keyboard
export const provinceKeyboard = {
  keyboard: [
    [{ text: "مأرب" }],
    [
      { text: 'صنعاء' },
      { text: 'عدن' },
    ],
    [
      { text: 'تعز' },
      { text: 'الحديدة' },
    ],
    [
      { text: 'إب' },
      { text: 'ذمار' },
    ],
    [
      { text: 'حضرموت' },
      { text: 'البيضاء' },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
};

// District keyboard for Ma'rib
export const maribDistrictKeyboard = {
  keyboard: [
    [{ text: 'مركز المدينة' }],
    [
      { text: 'المشجح' },
      { text: 'الربوعة' },
    ],
    [
      { text: 'صرواح' },
      { text: 'رغوان' },
    ],
    [
      { text: 'العبدية' },
      { text: 'حريب' },
    ],
    [
      { text: 'حريب القريش' },
      { text: 'مجزر' },
    ],
    [
      { text: 'مدغهر' },
      { text: 'بدبده' },
    ],
    [
      { text: 'جبل عبس' },
      { text: 'الأ|other' },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
};

// Skills keyboard
export const skillsKeyboard = {
  keyboard: [
    [{ text: '📦 توزيع مواد', callback_data: 'skill:distribution' }],
    [{ text: '🏥 طبي', callback_data: 'skill:medical' }],
    [{ text: '🚑 إسعافات أولية', callback_data: 'skill:first_aid' }],
    [{ text: '🚚 لوجستي', callback_data: 'skill:logistics' }],
    [{ text: '📢 توعية', callback_data: 'skill:awareness' }],
    [{ text: '🚗 سائق', callback_data: 'skill:driver' }],
    [{ text: '📸 إعلام', callback_data: 'skill:media' }],
    [{ text: '✅ تأكيد التسجيل', callback_data: 'skill:confirm' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

// Vehicle keyboard
export const vehicleKeyboard = {
  keyboard: [
    [
      { text: '✅ نعم، أملك مركبة' },
      { text: '❌ لا' },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
};
