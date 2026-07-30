import { useState, useEffect } from 'react';
import { FileText, MapPin, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { reportsApi } from '../services/api';
import clsx from 'clsx';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    report_type: '',
    is_resolved: '',
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportsApi.getAll(filters);
      setReports(response.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, isResolved) => {
    try {
      await reportsApi.review(id, { is_resolved: !isResolved });
      fetchReports();
    } catch (error) {
      console.error('Error reviewing report:', error);
    }
  };

  const typeLabels = {
    progress: 'تقرير تقدم',
    completion: 'تقرير إنجاز',
    issue: 'تقرير مشكلة',
    emergency: 'بلاغ طوارئ',
    checkpoint: 'نقطة وصول',
  };

  const severityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير الميدانية</h1>
        <p className="text-gray-500 mt-1">مراجعة ومتابعة التقارير الواردة من المتطوعين</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">إجمالي التقارير</p>
          <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">بانتظار المراجعة</p>
          <p className="text-2xl font-bold text-yellow-600">
            {reports.filter(r => !r.is_resolved).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">تم مراجعتها</p>
          <p className="text-2xl font-bold text-green-600">
            {reports.filter(r => r.is_resolved).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">بلاغات طوارئ</p>
          <p className="text-2xl font-bold text-red-600">
            {reports.filter(r => r.report_type === 'emergency').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex gap-4">
          <select
            value={filters.report_type}
            onChange={(e) => setFilters({ ...filters, report_type: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">كل الأنواع</option>
            <option value="progress">تقرير تقدم</option>
            <option value="completion">تقرير إنجاز</option>
            <option value="issue">تقرير مشكلة</option>
            <option value="emergency">بلاغ طوارئ</option>
          </select>
          <select
            value={filters.is_resolved}
            onChange={(e) => setFilters({ ...filters, is_resolved: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">كل الحالات</option>
            <option value="false">بانتظار المراجعة</option>
            <option value="true">تم المراجعة</option>
          </select>
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تقارير</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className={clsx(
                'p-4',
                report.report_type === 'emergency' && !report.is_resolved && 'bg-red-50'
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={clsx(
                      'p-3 rounded-lg',
                      report.report_type === 'emergency' ? 'bg-red-100' : 'bg-gray-100'
                    )}>
                      {report.report_type === 'emergency' ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <FileText className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{typeLabels[report.report_type]}</span>
                        {report.severity && (
                          <span className={clsx('px-2 py-0.5 rounded text-xs', severityColors[report.severity])}>
                            {report.severity === 'critical' ? 'حرج' :
                             report.severity === 'high' ? 'مرتفع' :
                             report.severity === 'medium' ? 'متوسط' : 'منخفض'}
                          </span>
                        )}
                        {report.is_resolved ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            تم المراجعة
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                            بانتظار
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{report.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        {report.volunteer && (
                          <span>من: {report.volunteer.full_name}</span>
                        )}
                        {report.location_text && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {report.location_text}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(report.created_at).toLocaleDateString('ar-YE')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {!report.is_resolved ? (
                      <button
                        onClick={() => handleReview(report.id, report.is_resolved)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle size={16} />
                        مراجعة
                      </button>
                    ) : (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle size={16} />
                        تمت المراجعة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
