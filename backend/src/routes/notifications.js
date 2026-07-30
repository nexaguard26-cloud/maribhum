import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    res.json({
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        unread: unreadCount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get notifications by telegram ID
router.get('/telegram/:telegramId', async (req, res, next) => {
  try {
    const { telegramId } = req.params;
    const { limit = 10 } = req.query;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_telegram_id', parseInt(telegramId))
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.post('/read-all', authMiddleware, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'تم قراءة جميع الإشعارات',
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'تم حذف الإشعار',
    });
  } catch (error) {
    next(error);
  }
});

// Send notification (for coordinators/admins)
router.post('/send', authMiddleware, async (req, res, next) => {
  try {
    const {
      user_id,
      user_telegram_id,
      user_type,
      type,
      title,
      message,
      data,
      priority,
    } = req.body;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        user_telegram_id,
        user_type,
        type: type || 'info',
        title,
        message,
        data: data || {},
        priority: priority || 'normal',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
