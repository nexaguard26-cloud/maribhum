import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Phone, MapPin, Car, Calendar, CheckCircle, FileText } from 'lucide-react';
import { volunteersApi, tasksApi } from '../services/api';
import clsx from 'clsx';

export default function VolunteerDetail() {
  const { id } = useParams();
  const [volunteer, setVolunteer] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteer();
    fetchTasks();
    fetchStats();
  }, [id]);

  const fetchVolunteer = async () => {
    try {
      const response = await volunteersApi.getById(id);
      setVolunteer(response.data.data);
    } catch (error) {
      console.error('Error fetching volunteer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await volunteersApi.getAll({ assigned_to: id });
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await volunteersApi.getStats(id);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVerify = async () => {
    try {
      await volunteersApi.verify(id);
      fetchVolunteer();
    } catch (error) {
      console.error('Error verifying volunteer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!volunteer) {
    return <div>المتطوع غير موجود</div>;
  }

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    busy: 'bg-blue-100 text-blue-700',
    inactive: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/volunteers" className="text-primary-600 hover:underline mb-2 block">
          ← العودة للمتطوعين
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-3xl">
              {volunteer.full_name?.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{volunteer.full_name}</h1>
            <span className={clsx('px-2 py-1 rounded text-sm font-medium inline-block mt-2', statusColors[volunteer.status])}>
              {volunteer.status === 'active' ? 'نشط' : 
               volunteer.status === 'pending' ? 'بانتظار الموافقة' :
               volunteer.status === 'busy' ? 'مشغول' : 'غير نشط'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {volunteer.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-yellow-800">هذا المتطوع بانتظار الموافقة</p>
          <button
            onClick={handleVerify}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            موافقة
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">معلومات التواصل</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">الهاتف</p>
                  <p className="text-gray-900">{volunteer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">الموقع</p>
                  <p className="text-gray-900">{volunteer.district || 'غير محدد'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">المهام ({tasks.length})</h2>
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد مهام</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{task.title}</span>
                      <span className={clsx('px-2 py-0.5 rounded text-xs', 
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {task.status === 'completed' ? 'مكتمل' : task.status === 'in_progress' ? 'قيد التنفيذ' : task.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">الإحصائيات</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">المهام المكتملة</span>
                <span className="font-bold text-green-600">{stats?.completed_tasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">المهام الحالية</span>
                <span className="font-bold text-blue-600">{stats?.active_tasks || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">التقارير</span>
                <span className="font-bold text-purple-600">{stats?.total_reports || 0}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">المهارات</h2>
            <div className="flex flex-wrap gap-2">
              {volunteer.skills?.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  {getSkillLabel(skill)}
                </span>
              ))}
              {volunteer.has_vehicle && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1">
                  <Car size={14} />
                  مركبة
                </span>
              )}
            </div>
          </div>

          {/* Registration info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">معلومات التسجيل</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ التسجيل</span>
                <span>{new Date(volunteer.created_at).toLocaleDateString('ar-YE')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المصدر</span>
                <span>{volunteer.registration_source === 'telegram' ? 'تيليجرام' : 'ويب'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSkillLabel(skill) {
  const labels = {
    distribution: 'توزيع مواد',
    medical: 'طبي',
    first_aid: 'إسعافات أولية',
    logistics: 'لوجستي',
    awareness: 'توعية',
    driver: 'سائق',
    media: 'إعلام',
    coordination: 'تنسيق',
  };
  return labels[skill] || skill;
}
