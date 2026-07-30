import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

// Get all volunteers
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      status,
      province,
      district,
      skills,
      has_vehicle,
      organization_id,
      page = 1,
      limit = 20,
    } = req.query;

    let query = supabaseAdmin
      .from('volunteers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (province) query = query.eq('province', province);
    if (district) query = query.eq('district', district);
    if (has_vehicle !== undefined) query = query.eq('has_vehicle', has_vehicle === 'true');
    if (organization_id) query = query.eq('organization_id', organization_id);
    if (skills) query = query.overlaps('skills', skills.split(','));

    // Pagination
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

// Get available volunteers (for task assignment)
router.get('/available', authMiddleware, async (req, res, next) => {
  try {
    const { province, district, skills, required_volunteers = 1 } = req.query;

    let query = supabaseAdmin
      .from('volunteers')
      .select('*')
      .eq('status', 'active');

    if (province) query = query.eq('province', province);
    if (district) query = query.eq('district', district);
    if (skills) query = query.overlaps('skills', skills.split(','));

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Get single volunteer
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('volunteers')
      .select(`
        *,
        organization:organizations(name, name_ar),
        assigned_tasks:tasks!assigned_to(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'المتطوع غير موجود',
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

// Create volunteer (from Telegram or admin)
router.post('/', async (req, res, next) => {
  try {
    const {
      telegram_id,
      telegram_username,
      full_name,
      phone,
      province,
      district,
      skills,
      has_vehicle,
      organization_id,
    } = req.body;

    // Check if already registered
    if (telegram_id) {
      const { data: existing } = await supabaseAdmin
        .from('volunteers')
        .select('id')
        .eq('telegram_id', telegram_id)
        .single();

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'هذا المتطوع مسجل مسبقاً',
          data: existing,
        });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('volunteers')
      .insert({
        telegram_id,
        telegram_username,
        full_name,
        phone,
        province: province || 'Ma\'rib',
        district,
        skills: skills || [],
        has_vehicle: has_vehicle || false,
        organization_id,
        status: 'pending',
        registration_source: telegram_id ? 'telegram' : 'web',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Update volunteer
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabaseAdmin
      .from('volunteers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
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

// Update volunteer status
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('volunteers')
      .update({
        status,
        updated_at: new Date().toISOString(),
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

// Get volunteer tasks
router.get('/:id/tasks', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('assigned_to', id);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Verify volunteer (approve registration)
router.post('/:id/verify', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('volunteers')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify volunteer
    if (data.telegram_id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_telegram_id: data.telegram_id,
          user_type: 'volunteer',
          type: 'info',
          title: '✅ تم تفعيل حسابك',
          message: 'تم قبول تسجيلك كمتطوع! الآن يمكنك استلام المهام.',
          priority: 'normal',
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

// Get volunteer stats
router.get('/:id/stats', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get completed tasks count
    const { count: completedTasks } = await supabaseAdmin
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('assigned_to', id)
      .eq('status', 'completed');

    // Get active tasks count
    const { count: activeTasks } = await supabaseAdmin
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('assigned_to', id)
      .in('status', ['assigned', 'in_progress']);

    // Get reports count
    const { count: reportsCount } = await supabaseAdmin
      .from('field_reports')
      .select('id', { count: 'exact' })
      .eq('volunteer_id', id);

    res.json({
      success: true,
      data: {
        completed_tasks: completedTasks || 0,
        active_tasks: activeTasks || 0,
        total_reports: reportsCount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
