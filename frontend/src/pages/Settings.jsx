import { useState } from 'react';
import { User, Bell, Shield, Database, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'system', label: 'النظام', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة حسابك وإعدادات النظام</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'system' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ user }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-gray-900 mb-6">الملف الشخصي</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
          <input
            type="text"
            defaultValue={user?.full_name}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
          <input
            type="tel"
            defaultValue={user?.phone}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            defaultValue={user?.email}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="pt-4">
          <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-gray-900 mb-6">إعدادات الإشعارات</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium text-gray-900">إشعارات المهام الجديدة</p>
            <p className="text-sm text-gray-500">استلام إشعار عند إنشاء مهمة جديدة</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <p className="font-medium text-gray-900">إشعارات التقارير</p>
            <p className="text-sm text-gray-500">استلام إشعار عند ورود تقرير جديد</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">إشعارات الطوارئ</p>
            <p className="text-sm text-gray-500">إشعارات فورية للبلاغات الطارئة</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-gray-900 mb-6">الأمان</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-4">تغيير كلمة المرور</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الحالية</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              تحديث كلمة المرور
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="font-semibold text-gray-900 mb-6">معلومات النظام</h2>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">نسخة النظام</span>
          <span className="text-gray-900">v1.0.0</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">آخر تحديث</span>
          <span className="text-gray-900">يناير 2024</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-500">الحالة</span>
          <span className="text-green-600">نشط</span>
        </div>
      </div>
    </div>
  );
}
