import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all organizations
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, type, province, page = 1, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (province) query = query.eq('province', province);

    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    query = query.order('name');

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

// Get single organization
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select(`
        *,
        staff(count),
        volunteers(count),
        tasks(count)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'المنظمة غير موجودة',
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

// Create organization
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      name,
      name_ar,
      type,
      registration_number,
      contact_person,
      contact_phone,
      contact_email,
      address,
      province,
      district,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        name_ar,
        type,
        registration_number,
        contact_person,
        contact_phone,
        contact_email,
        address,
        province,
        district,
        status: 'pending',
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

// Update organization
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabaseAdmin
      .from('organizations')
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

// Get organization stats
router.get('/:id/stats', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get counts
    const [
      { count: volunteersCount },
      { count: staffCount },
      { count: tasksCount },
      { count: completedTasks },
    ] = await Promise.all([
      supabaseAdmin.from('volunteers').select('id', { count: 'exact' }).eq('organization_id', id),
      supabaseAdmin.from('staff').select('id', { count: 'exact' }).eq('organization_id', id),
      supabaseAdmin.from('tasks').select('id', { count: 'exact' }).eq('organization_id', id),
      supabaseAdmin.from('tasks').select('id', { count: 'exact' }).eq('organization_id', id).eq('status', 'completed'),
    ]);

    res.json({
      success: true,
      data: {
        volunteers: volunteersCount || 0,
        staff: staffCount || 0,
        tasks: tasksCount || 0,
        completed_tasks: completedTasks || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update organization status
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .update({ status, updated_at: new Date().toISOString() })
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
