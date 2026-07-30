import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all reports
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      report_type,
      severity,
      is_resolved,
      task_id,
      volunteer_id,
      page = 1,
      limit = 20,
    } = req.query;

    let query = supabaseAdmin
      .from('field_reports')
      .select(`
        *,
        task:tasks(id, title, status),
        volunteer:volunteers(id, full_name, phone),
        reviewer:staff!reviewed_by(full_name)
      `, { count: 'exact' });

    if (report_type) query = query.eq('report_type', report_type);
    if (severity) query = query.eq('severity', severity);
    if (is_resolved !== undefined) query = query.eq('is_resolved', is_resolved === 'true');
    if (task_id) query = query.eq('task_id', task_id);
    if (volunteer_id) query = query.eq('volunteer_id', volunteer_id);

    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single report
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('field_reports')
      .select(`
        *,
        task:tasks(*),
        volunteer:volunteers(*),
        reviewer:staff!reviewed_by(full_name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'التقرير غير موجود',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Create report (from volunteer via Telegram)
router.post('/', async (req, res, next) => {
  try {
    const {
      task_id,
      volunteer_id,
      staff_id,
      report_type,
      title,
      description,
      location_text,
      location_lat,
      location_lng,
      families_affected,
      individuals_affected,
      photos,
      severity,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('field_reports')
      .insert({
        task_id,
        volunteer_id,
        staff_id,
        report_type: report_type || 'progress',
        title,
        description,
        location_text,
        location_lat,
        location_lng,
        families_affected,
        individuals_affected,
        photos,
        photo_count: photos?.length || 0,
        severity: severity || 'medium',
      })
      .select()
      .single();

    if (error) throw error;

    // Notify coordinators about the new report
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('organization_id, title')
      .eq('id', task_id)
      .single();

    if (task?.organization_id) {
      // Get coordinators
      const { data: coordinators } = await supabaseAdmin
        .from('staff')
        .select('telegram_id')
        .eq('organization_id', task.organization_id)
        .in('role', ['coordinator', 'supervisor', 'admin']);

      // Create notifications
      const notifications = coordinators
        .filter(c => c.telegram_id)
        .map(c => ({
          user_telegram_id: c.telegram_id,
          user_type: 'staff',
          organization_id: task.organization_id,
          type: 'new_report',
          title: '📝 تقرير جديد',
          message: `تم استلام تقرير جديد: ${title || description?.substring(0, 50)}`,
          data: { report_id: data.id, task_id },
          priority: severity === 'critical' || severity === 'high' ? 'high' : 'normal',
        }));

      if (notifications.length > 0) {
        await supabaseAdmin.from('notifications').insert(notifications);
      }
    }

    // If emergency, send urgent notification
    if (report_type === 'emergency') {
      // TODO: Send Telegram push notification immediately
    }

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Review report
router.patch('/:id/review', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_resolved, review_notes } = req.body;

    const { data, error } = await supabaseAdmin
      .from('field_reports')
      .update({
        is_resolved,
        resolution_notes: review_notes,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
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

// Get pending reports
router.get('/status/pending', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('field_reports')
      .select(`
        *,
        task:tasks(id, title),
        volunteer:volunteers(id, full_name, phone)
      `)
      .eq('is_resolved', false)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Upload photos to report
router.post('/:id/photos', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;

    const { data: report } = await supabaseAdmin
      .from('field_reports')
      .select('photos')
      .eq('id', id)
      .single();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'التقرير غير موجود',
      });
    }

    const updatedPhotos = [...(report.photos || []), ...photos];

    const { data, error } = await supabaseAdmin
      .from('field_reports')
      .update({
        photos: updatedPhotos,
        photo_count: updatedPhotos.length,
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

export default router;
