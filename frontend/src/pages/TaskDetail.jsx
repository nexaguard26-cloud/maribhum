import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, MapPin, Users, Calendar, Clock, User,
  CheckCircle, XCircle, AlertTriangle, Edit, Trash2
} from 'lucide-react';
import { tasksApi, volunteersApi } from '../services/api';
import clsx from 'clsx';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [availableVolunteers, setAvailableVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await tasksApi.getById(id);
      setTask(response.data.data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await tasksApi.updateStatus(id, newStatus);
      fetchTask();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAssign = async (volunteerId) => {
    try {
      await tasksApi.assign(id, volunteerId);
      setShowAssignModal(false);
      fetchTask();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">المهمة غير موجودة</h2>
        <Link to="/tasks" className="text-primary-600 hover:underline mt-2 block">
          العودة للمهام
        </Link>
      </div>
    );
  }

  const priorityColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  const priorityLabels = {
    critical: 'حرج',
    high: 'عالي',
    normal: 'عادي',
    low: 'منخفض',
  };

  const statusLabels = {
    pending: 'قيد الانتظار',
    approved: 'معتمد',
    assigned: 'تم التعيين',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/tasks" className="text-primary-600 hover:underline mb-2 block">
            ← العودة للمهام
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={clsx('px-2 py-1 rounded text-sm font-medium', priorityColors[task.priority])}>
              {priorityLabels[task.priority]}
            </span>
            <span className="text-gray-500">
              {statusLabels[task.status]}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {task.status === 'pending' && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              تعيين متطوع
            </button>
          )}
          {(task.status === 'assigned' || task.status === 'in_progress') && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              إكمال المهمة
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">تفاصيل المهمة</h2>
            <div className="space-y-4">
              {task.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">الوصف</p>
                  <p className="text-gray-900">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">الموقع</p>
                    <p className="text-gray-900">{task.location_text || task.district || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">المستفيدين</p>
                    <p className="text-gray-900">{task.target_beneficiaries || 0} شخص</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">الموعد</p>
                    <p className="text-gray-900">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('ar-YE') : 'غير محدد'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="text-gray-400" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
                    <p className="text-gray-900">
                      {new Date(task.created_at).toLocaleDateString('ar-YE')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reports */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">التقارير الميدانية</h2>
            {task.reports && task.reports.length > 0 ? (
              <div className="space-y-3">
                {task.reports.map((report) => (
                  <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{report.title}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(report.created_at).toLocaleDateString('ar-YE')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد تقارير</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned volunteer */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">المتطوع المعين</h2>
            {task.assigned_volunteer ? (
              <Link to={`/volunteers/${task.assigned_volunteer.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold">
                    {task.assigned_volunteer.full_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{task.assigned_volunteer.full_name}</p>
                  <p className="text-sm text-gray-500">{task.assigned_volunteer.phone}</p>
                </div>
              </Link>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">لم يتم تعيين متطوع</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  تعيين متطوع
                </button>
              </div>
            )}
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">إجراءات</h2>
            <div className="space-y-2">
              {task.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange('approved')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    <CheckCircle size={18} />
                    اعتماد المهمة
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                  >
                    <XCircle size={18} />
                    إلغاء المهمة
                  </button>
                </>
              )}
              {task.status === 'assigned' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                >
                  <AlertTriangle size={18} />
                  بدء التنفيذ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignVolunteerModal
          taskId={id}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

function AssignVolunteerModal({ taskId, onClose, onAssign }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const response = await volunteersApi.getAvailable({ status: 'active' });
      setVolunteers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">اختر متطوعاً</h2>
          <button onClick={onClose}>×</button>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : volunteers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا يوجد متطوعون متاحون</p>
          ) : (
            <div className="space-y-2">
              {volunteers.map((volunteer) => (
                <button
                  key={volunteer.id}
                  onClick={() => onAssign(volunteer.id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-right"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold">
                      {volunteer.full_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{volunteer.full_name}</p>
                    <p className="text-sm text-gray-500">{volunteer.district}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
