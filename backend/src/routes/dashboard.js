import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard overview
router.get('/overview', authMiddleware, async (req, res, next) => {
  try {
    const { organization_id } = req.query;

    // Tasks stats
    let tasksQuery = supabaseAdmin.from('tasks').select('status', { count: 'exact' });
    let volunteersQuery = supabaseAdmin.from('volunteers').select('status', { count: 'exact' });
    let reportsQuery = supabaseAdmin.from('field_reports').select('id', { count: 'exact' });

    if (organization_id) {
      tasksQuery = tasksQuery.eq('organization_id', organization_id);
      volunteersQuery = volunteersQuery.eq('organization_id', organization_id);
    }

    const [tasksResult, volunteersResult, reportsResult] = await Promise.all([
      tasksQuery,
      volunteersQuery,
      reportsQuery,
    ]);

    // Tasks by status
    const { data: tasksByStatus } = await supabaseAdmin
      .from('tasks')
      .select('status')
      .then(async (query) => {
        const result = await (organization_id 
          ? query.eq('organization_id', organization_id)
          : query);
        return result;
      });

    // Count by status
    const tasksByStatusCount = {};
    tasksByStatus?.forEach(t => {
      tasksByStatusCount[t.status] = (tasksByStatusCount[t.status] || 0) + 1;
    });

    // Critical tasks
    const { count: criticalTasks } = await (organization_id
      ? supabaseAdmin.from('tasks').select('id', { count: 'exact' })
          .eq('priority', 'critical')
          .in('status', ['pending', 'assigned', 'in_progress'])
          .eq('organization_id', organization_id)
      : supabaseAdmin.from('tasks').select('id', { count: 'exact' })
          .eq('priority', 'critical')
          .in('status', ['pending', 'assigned', 'in_progress']));

    // Recent activity
    const { data: recentActivity } = await supabaseAdmin
      .from('activity_log')
      .select('*')
      .then(async (query) => {
        const result = await (organization_id
          ? query.eq('organization_id', organization_id)
          : query);
        return result;
      })
      .order('created_at', { ascending: false })
      .limit(10);

    // Volunteers by province
    const { data: volunteersByProvince } = await supabaseAdmin
      .from('volunteers')
      .select('province');

    const provinceCount = {};
    volunteersByProvince?.forEach(v => {
      provinceCount[v.province] = (provinceCount[v.province] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        stats: {
          total_tasks: tasksResult.count || 0,
          pending_tasks: tasksByStatusCount['pending'] || 0,
          active_tasks: (tasksByStatusCount['assigned'] || 0) + (tasksByStatusCount['in_progress'] || 0),
          completed_tasks: tasksByStatusCount['completed'] || 0,
          critical_tasks: criticalTasks || 0,
          
          total_volunteers: volunteersResult.count || 0,
          active_volunteers: volunteersByProvince?.filter(v => {
            return true; // All active volunteers
          }).length || 0,
          
          total_reports: reportsResult.count || 0,
        },
        tasks_by_status: tasksByStatusCount,
        volunteers_by_province: provinceCount,
        recent_activity: recentActivity || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get KPIs
router.get('/kpis', authMiddleware, async (req, res, next) => {
  try {
    const { organization_id } = req.query;

    let tasksQuery = supabaseAdmin.from('tasks').select('*');
    let volunteersQuery = supabaseAdmin.from('volunteers').select('*');

    if (organization_id) {
      tasksQuery = tasksQuery.eq('organization_id', organization_id);
      volunteersQuery = volunteersQuery.eq('organization_id', organization_id);
    }

    const [tasks, volunteers] = await Promise.all([
      tasksQuery,
      volunteersQuery,
    ]);

    // Calculate KPIs
    const completedTasks = tasks.data?.filter(t => t.status === 'completed') || [];
    const activeTasks = tasks.data?.filter(t => ['assigned', 'in_progress'].includes(t.status)) || [];
    
    // Task completion rate
    const totalTasks = tasks.data?.length || 0;
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks.length / totalTasks) * 100) 
      : 0;

    // Average beneficiaries per task
    const totalBeneficiaries = tasks.data?.reduce((sum, t) => sum + (t.target_beneficiaries || 0), 0) || 0;
    const activeVolunteers = volunteers.data?.filter(v => v.status === 'active') || [];

    // Tasks this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyTasks = tasks.data?.filter(t => 
      new Date(t.created_at) >= oneWeekAgo
    ) || [];

    // Completed this week
    const completedThisWeek = completedTasks.filter(t =>
      new Date(t.completed_at || t.updated_at) >= oneWeekAgo
    );

    res.json({
      success: true,
      data: {
        task_completion_rate: completionRate,
        total_beneficiaries_target: totalBeneficiaries,
        active_volunteers: activeVolunteers.length,
        volunteers_utilization: activeVolunteers.length > 0 
          ? Math.round((activeTasks.length / activeVolunteers.length) * 100) 
          : 0,
        tasks_this_week: weeklyTasks.length,
        completed_this_week: completedThisWeek.length,
        average_task_duration_hours: completedTasks.length > 0 
          ? Math.round(completedTasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0) / completedTasks.length)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get map data
router.get('/map', authMiddleware, async (req, res, next) => {
  try {
    const { organization_id } = req.query;

    let query = supabaseAdmin
      .from('volunteers')
      .select('province, district, status, skills')
      .eq('status', 'active');

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    const { data: volunteers } = await query;

    // Get tasks with locations
    let tasksQuery = supabaseAdmin
      .from('tasks')
      .select('province, district, status, priority, location_lat, location_lng')
      .not('province', 'is', null);

    if (organization_id) {
      tasksQuery = tasksQuery.eq('organization_id', organization_id);
    }

    const { data: tasks } = await tasksQuery;

    // Aggregate by district
    const districts = {};

    volunteers?.forEach(v => {
      const key = `${v.province}-${v.district}`;
      if (!districts[key]) {
        districts[key] = {
          province: v.province,
          district: v.district,
          volunteers: 0,
          tasks: 0,
        };
      }
      districts[key].volunteers++;
    });

    tasks?.forEach(t => {
      const key = `${t.province}-${t.district}`;
      if (!districts[key]) {
        districts[key] = {
          province: t.province,
          district: t.district,
          volunteers: 0,
          tasks: 0,
        };
      }
      districts[key].tasks++;
    });

    res.json({
      success: true,
      data: Object.values(districts),
    });
  } catch (error) {
    next(error);
  }
});

// Get activity timeline
router.get('/timeline', authMiddleware, async (req, res, next) => {
  try {
    const { organization_id, limit = 20 } = req.query;

    let query = supabaseAdmin
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

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

export default router;
