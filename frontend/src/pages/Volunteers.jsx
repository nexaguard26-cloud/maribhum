import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Phone, MapPin, CheckCircle } from 'lucide-react';
import { volunteersApi } from '../services/api';
import clsx from 'clsx';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    province: '',
    district: '',
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVolunteers();
  }, [filters]);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const response = await volunteersApi.getAll(filters);
      setVolunteers(response.data.data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await volunteersApi.verify(id);
      fetchVolunteers();
    } catch (error) {
      console.error('Error verifying volunteer:', error);
    }
  };

  const filteredVolunteers = volunteers.filter(v =>
    v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search)
  );

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    busy: 'bg-blue-100 text-blue-700',
    inactive: 'bg-gray-100 text-gray-700',
  };

  const statusLabels = {
    active: 'نشط',
    pending: 'قيد المراجعة',
    busy: 'مشغول',
    inactive: 'غير نشط',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المتطوعون</h1>
          <p className="text-gray-500 mt-1">إدارة المتطوعين ومتابعة نشاطهم</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="pending">قيد المراجعة</option>
            <option value="busy">مشغول</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">إجمالي المتطوعين</p>
          <p className="text-2xl font-bold text-gray-900">{volunteers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">نشط</p>
          <p className="text-2xl font-bold text-green-600">
            {volunteers.filter(v => v.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">بانتظار الموافقة</p>
          <p className="text-2xl font-bold text-yellow-600">
            {volunteers.filter(v => v.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">مشغول</p>
          <p className="text-2xl font-bold text-blue-600">
            {volunteers.filter(v => v.status === 'busy').length}
          </p>
        </div>
      </div>

      {/* Volunteers list */}
      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">لا يوجد متطوعون</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredVolunteers.map((volunteer) => (
              <div key={volunteer.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <Link to={`/volunteers/${volunteer.id}`} className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-bold text-lg">
                        {volunteer.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{volunteer.full_name}</h3>
                        <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', statusColors[volunteer.status])}>
                          {statusLabels[volunteer.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {volunteer.phone}
                        </span>
                        {volunteer.district && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {volunteer.district}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {volunteer.skills?.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {getSkillLabel(skill)}
                          </span>
                        ))}
                        {volunteer.has_vehicle && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                            🚗 مركبة
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    {volunteer.status === 'pending' && (
                      <button
                        onClick={() => handleVerify(volunteer.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="موافقة"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                    <Link
                      to={`/volunteers/${volunteer.id}`}
                      className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                    >
                      التفاصيل
                    </Link>
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

function getSkillLabel(skill) {
  const labels = {
    distribution: 'توزيع',
    medical: 'طبي',
    first_aid: 'إسعافات',
    logistics: 'لوجستي',
    awareness: 'توعية',
    driver: 'سائق',
    media: 'إعلام',
    coordination: 'تنسيق',
  };
  return labels[skill] || skill;
}
