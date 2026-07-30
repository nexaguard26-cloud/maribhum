import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    throw error;
  }
}

// ===================
// VOLUNTEER OPERATIONS
// ===================

export async function getVolunteerByTelegramId(telegramId) {
  try {
    // Query the volunteers table directly via Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error getting volunteer:', error);
    return null;
  }
}

export async function createVolunteer(volunteerData) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('volunteers')
      .insert(volunteerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating volunteer:', error);
    throw error;
  }
}

export async function updateVolunteerField(telegramId, updates) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('volunteers')
      .update(updates)
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating volunteer:', error);
    throw error;
  }
}

export async function updateVolunteerPhone(telegramId, phone) {
  return updateVolunteerField(telegramId, { phone });
}

export async function getVolunteerStats(volunteerId) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get completed tasks count
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('assigned_to', volunteerId)
      .eq('status', 'completed');

    // Get active tasks count
    const { count: activeTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('assigned_to', volunteerId)
      .in('status', ['assigned', 'in_progress']);

    // Get reports count
    const { count: reportsCount } = await supabase
      .from('field_reports')
      .select('id', { count: 'exact' })
      .eq('volunteer_id', volunteerId);

    return {
      completed_tasks: completedTasks || 0,
      active_tasks: activeTasks || 0,
      total_reports: reportsCount || 0,
    };
  } catch (error) {
    console.error('Error getting volunteer stats:', error);
    return {
      completed_tasks: 0,
      active_tasks: 0,
      total_reports: 0,
    };
  }
}

// ===================
// TASK OPERATIONS
// ===================

export async function getVolunteerTasks(volunteerId) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', volunteerId)
      .in('status', ['assigned', 'in_progress'])
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting volunteer tasks:', error);
    return [];
  }
}

export async function getTaskById(taskId) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error getting task:', error);
    return null;
  }
}

export async function updateTaskStatus(taskId, status, completedBy = null) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      
      // Get task to update volunteer status
      const task = await getTaskById(taskId);
      if (task?.assigned_to) {
        await supabase
          .from('volunteers')
          .update({
            status: 'active',
            current_task_id: null,
          })
          .eq('id', task.assigned_to);
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// ===================
// REPORT OPERATIONS
// ===================

export async function createReport(reportData) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from('field_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
}

// ===================
// NOTIFICATION OPERATIONS
// ===================

export async function getPendingNotifications(telegramId) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_telegram_id', telegramId)
      .eq('is_read', false)
      .eq('send_telegram', true)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}
