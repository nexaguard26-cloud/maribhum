import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { path: '/tasks', icon: ClipboardList, label: 'المهام' },
  { path: '/volunteers', icon: Users, label: 'المتطوعون' },
  { path: '/reports', icon: FileText, label: 'التقارير' },
  { path: '/settings', icon: Settings, label: 'الإعدادات' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="text-center">
          <h1 className="text-lg font-bold text-primary-700">نظام مأرب</h1>
          <p className="text-xs text-gray-500">الإدارة الإنسانية</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-6 py-3 mx-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-bold">
              {user?.full_name?.charAt(0) || 'م'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || 'مستخدم'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'مدير' : 
               user?.role === 'coordinator' ? 'منسق' : 'مستخدم'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
