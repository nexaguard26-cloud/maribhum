import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

// Get all tasks (with filters)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      status,
      priority,
      category,
      province,
      district,
      assigned_to,
      organization_id,
      page = 1,
      limit = 20,
    } = req.query;

    let query = supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assigned_volunteer:volunteers!assigned_to(full_name, phone, telegram_id),
        assigned_by_staff:staff!assigned_by(full_name),
        organization:organizations(name, name_ar)
      `, { count: 'exact' });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);
    if (province) query = query.eq('province', province);
    if (district) query = query.eq('district', district);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (organization_id) query = query.eq('organization_id', organization_id);

    // Pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    // Order
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

// Get single task
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assigned_volunteer:volunteers!assigned_to(*),
        assigned_by_staff:staff!assigned_by(full_name),
        organization:organizations(name, name_ar),
        reports:field_reports(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'المهمة غير موجودة',
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

// Create task
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      title,
      title_ar,
      description,
      description_ar,
      category,
      priority,
      province,
      district,
      location_text,
      location_lat,
      location_lng,
      target_community,
      target_beneficiaries,
      beneficiary_type,
      required_skills,
      required_volunteers,
      required_materials,
      budget,
      funding_source,
      tags,
      due_date,
      start_date,
      end_date,
      organization_id,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        title,
        title_ar,
        description,
        description_ar,
        category: category || 'general',
        priority: priority || 'normal',
        status: 'pending',
        province,
        district,
        location_text,
        location_lat,
        location_lng,
        target_community,
        target_beneficiaries,
        beneficiary_type,
        required_skills,
        required_volunteers,
        required_materials,
        budget,
        funding_source,
        tags,
        due_date,
        start_date,
        end_date,
        organization_id: organization_id || req.user.organization_id,
        assigned_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      organization_id: data.organization_id,
      entity_type: 'task',
      entity_id: data.id,
      action: 'created',
      actor_type: 'staff',
      actor_id: req.user.id,
      actor_name: req.user.full_name,
      changes: data,
    });

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.assigned_by;

    const { data: oldData } = await supabaseAdmin
      .from('tasks')
      .select()
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      organization_id: data.organization_id,
      entity_type: 'task',
      entity_id: data.id,
      action: 'updated',
      actor_type: 'staff',
      actor_id: req.user.id,
      actor_name: req.user.full_name,
      changes: { old: oldData, new: data },
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Update task status
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'حالة غير صالحة',
      });
    }

    const updates = { 
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If completed, free the volunteer
    if (status === 'completed' && data.assigned_to) {
      await supabaseAdmin
        .from('volunteers')
        .update({ 
          status: 'active',
          current_task_id: null 
        })
        .eq('id', data.assigned_to);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Assign task to volunteer
router.post('/:id/assign', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { volunteer_id, notes } = req.body;

    // Get volunteer info
    const { data: volunteer, error: volError } = await supabaseAdmin
      .from('volunteers')
      .select('*')
      .eq('id', volunteer_id)
      .single();

    if (volError || !volunteer) {
      return res.status(404).json({
        success: false,
        error: 'المتطوع غير موجود',
      });
    }

    // Update task
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({
        assigned_to: volunteer_id,
        assigned_by: req.user.id,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update volunteer status
    await supabaseAdmin
      .from('volunteers')
      .update({
        status: 'busy',
        current_task_id: id,
      })
      .eq('id', volunteer_id);

    // Create notification for volunteer
    if (volunteer.telegram_id) {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_telegram_id: volunteer.telegram_id,
          user_type: 'volunteer',
          organization_id: data.organization_id,
          type: 'task_assigned',
          title: '📋 تم تعيين مهمة جديدة',
          message: `تم تعيين المهمة "${data.title}" لك. اضغط للمزيد.`,
          data: { task_id: id },
          priority: data.priority,
        });
    }

    // Log activity
    await logActivity({
      organization_id: data.organization_id,
      entity_type: 'task',
      entity_id: data.id,
      action: 'assigned',
      actor_type: 'staff',
      actor_id: req.user.id,
      actor_name: req.user.full_name,
      changes: { volunteer_id, volunteer_name: volunteer.full_name },
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'تم حذف المهمة بنجاح',
    });
  } catch (error) {
    next(error);
  }
});

// Get tasks calendar
router.get('/calendar/month', authMiddleware, async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        id, title, title_ar, status, priority, due_date,
        assigned_volunteer:volunteers!assigned_to(full_name)
      `)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0]);

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
