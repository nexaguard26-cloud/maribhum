import { Link } from 'react-router-dom';
import { MapPin, Users, Calendar, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export default function TaskCard({ task, showActions = false }) {
  const priorityColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    normal: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const priorityLabels = {
    critical: 'حرج',
    high: 'عالي',
    normal: 'عادي',
    low: 'منخفض',
  };

  const statusLabels = {
    pending: 'قيد الانتظار',
    assigned: 'تم التعيين',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={clsx('px-2 py-1 rounded text-xs font-medium', priorityColors[task.priority])}>
              {priorityLabels[task.priority]}
            </span>
            <span className={clsx('px-2 py-1 rounded text-xs font-medium', statusColors[task.status])}>
              {statusLabels[task.status]}
            </span>
          </div>
          
          <Link to={`/tasks/${task.id}`} className="block">
            <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors">
              {task.title}
            </h3>
          </Link>

          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            {task.district && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {task.district}
              </span>
            )}
            {task.target_beneficiaries && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {task.target_beneficiaries} مستفيد
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(task.due_date).toLocaleDateString('ar-YE')}
              </span>
            )}
          </div>

          {task.assigned_volunteer && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xs text-primary-700 font-medium">
                  {task.assigned_volunteer.full_name?.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {task.assigned_volunteer.full_name}
              </span>
            </div>
          )}
        </div>

        {showActions && (
          <Link
            to={`/tasks/${task.id}`}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}
