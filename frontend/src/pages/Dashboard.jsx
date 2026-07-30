import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Users, 
  Building2, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, tasksRes] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getTimeline({ limit: 5 }),
      ]);

      setStats(overviewRes.data.data);
      setRecentActivity(tasksRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في نظام إدارة المهام الإنسانية</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="المهام النشطة"
          value={stats?.stats?.active_tasks || 0}
          icon={ClipboardList}
          color="blue"
          trend="+12%"
        />
        <StatsCard
          title="المتطوعون النشطون"
          value={stats?.stats?.active_volunteers || 0}
          icon={Users}
          color="green"
          trend="+5"
        />
        <StatsCard
          title="المهام المكتملة"
          value={stats?.stats?.completed_tasks || 0}
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="تقارير جديدة"
          value={stats?.stats?.total_reports || 0}
          icon={FileText}
          color="purple"
          trend="+3"
        />
      </div>

      {/* Critical alerts */}
      {(stats?.stats?.critical_tasks || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-900">مهام حرجة تتطلب اهتماماً</h3>
            <p className="text-sm text-red-700">
              يوجد {stats.stats.critical_tasks} مهمة بأولوية حرجة بانتظار التنفيذ
            </p>
          </div>
          <Link
            to="/tasks?priority=critical"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            عرض المهام
          </Link>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">المهام العاجلة</h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد مهام حالية</p>
              </div>
            ) : (
              recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>

        {/* Activity section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">النشاط الأخير</h2>
          </div>
          <div className="p-4 space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا يوجد نشاط حديث</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${getActivityColor(activity.action)}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.actor_name || 'نظام'}</span>
                      {' '}
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat
          icon={TrendingUp}
          label="نسبة إكمال المهام"
          value="85%"
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <QuickStat
          icon={Clock}
          label="متوسط وقت المهمة"
          value="3.5 ساعة"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <QuickStat
          icon={Building2}
          label="المنظمات المسجلة"
          value={stats?.stats?.total_organizations || 0}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function getActivityColor(action) {
  const colors = {
    created: 'bg-green-500',
    updated: 'bg-blue-500',
    completed: 'bg-emerald-500',
    assigned: 'bg-purple-500',
    deleted: 'bg-red-500',
  };
  return colors[action] || 'bg-gray-500';
}

function getActivityText(activity) {
  const actions = {
    created: `أنشأ ${activity.entity_type === 'task' ? 'مهمة جديدة' : 'سجل جديد'}`,
    updated: `حدّث ${activity.entity_type === 'task' ? 'مهمة' : 'سجل'}`,
    completed: `أكمل مهمة`,
    assigned: `عيّن مهمة`,
    deleted: `حذف سجل`,
  };
  return actions[activity.action] || activity.action;
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  return date.toLocaleDateString('ar-YE');
}
