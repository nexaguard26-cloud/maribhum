import { supabaseAdmin } from '../config/supabase.js';

/**
 * Log activity to activity_log table
 */
export const logActivity = async ({
  organization_id,
  entity_type,
  entity_id,
  action,
  actor_type,
  actor_id,
  actor_name,
  changes,
  metadata = {},
}) => {
  try {
    await supabaseAdmin.from('activity_log').insert({
      organization_id,
      entity_type,
      entity_id,
      action,
      actor_type,
      actor_id,
      actor_name,
      changes,
      metadata,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

/**
 * Get provinces in Yemen (Ma'rib focused)
 */
export const YEMEN_PROVINCES = [
  "Ma'rib",
  "Sana'a",
  "Aden",
  "Taiz",
  "Hodeidah",
  "Ibb",
  "Dhamar",
  "Al Bayda",
  "Lahj",
  "Abyan",
  "Shabwah",
  "Hadramaut",
  "Socotra",
  "Al Mahwit",
  "Amran",
  "Sa'ada",
  "Jawf",
];

/**
 * Districts for Ma'rib province
 */
export const MARIB_DISTRICTS = [
  "City Center",
  "Al-Mashajah",
  "Rabwah",
  "Sirwah",
  "Raghwan",
  "Al-Abdiyah",
  "Harib",
  "Harib Al-Qaramish",
  "Majzar",
  "Medghar",
  "Bidbadah",
  "Jbal Habesh",
];

/**
 * Task categories with Arabic translations
 */
export const TASK_CATEGORIES = {
  medical: 'طبي',
  relief: 'إغاثي',
  distribution: 'توزيع',
  shelter: 'إيواء',
  water_sanitation: 'مياه وصرف',
  education: 'تعليم',
  protection: 'حماية',
  logistics: 'لوجستي',
  coordination: 'تنسيق',
  awareness: 'توعية',
  general: 'عام',
  other: 'أخرى',
};

/**
 * Priority levels with Arabic translations
 */
export const PRIORITIES = {
  critical: 'حرج',
  high: 'عالي',
  normal: 'عادي',
  low: 'منخفض',
};

/**
 * Task statuses with Arabic translations
 */
export const TASK_STATUSES = {
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  assigned: 'تم التعيين',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  on_hold: 'معلق',
};

/**
 * Volunteer skills
 */
export const VOLUNTEER_SKILLS = [
  { key: 'distribution', label: 'توزيع مواد' },
  { key: 'medical', label: 'طبي' },
  { key: 'first_aid', label: 'إسعافات أولية' },
  { key: 'logistics', label: 'لوجستي' },
  { key: 'awareness', label: 'توعية' },
  { key: 'education', label: 'تعليم' },
  { key: 'media', label: 'إعلام' },
  { key: 'driver', label: 'سائق' },
  { key: 'coordination', label: 'تنسيق' },
  { key: 'psychological_support', label: 'دعم نفسي' },
];

/**
 * Format date to Arabic format
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date to short format
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ar-YE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format relative time (e.g., "منذ ساعة")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatDateShort(date);
};

/**
 * Send Telegram notification (placeholder for actual implementation)
 */
export const sendTelegramMessage = async (chatId, message, keyboard = null) => {
  // This would be implemented in the Telegram bot service
  console.log(`[Telegram] Sending to ${chatId}:`, message);
};

/**
 * Validate phone number (Yemen format)
 */
export const validateYemenPhone = (phone) => {
  // Remove spaces and special characters
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for Yemen formats: +967, 967, 07
  const patterns = [
    /^\+967[1-7]\d{8}$/,  // +967712345678
    /^967[1-7]\d{8}$/,    // 967712345678
    /^07\d{8}$/,           // 0771234567
  ];
  
  return patterns.some(p => p.test(clean));
};
