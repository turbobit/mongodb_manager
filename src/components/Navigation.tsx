'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { id: 'dashboard', name: '대시보드', icon: '📊', path: '/dashboard' },
  { id: 'backup', name: '백업 관리(디비 통백업)', icon: '💾', path: '/dashboard/backup' },
  { id: 'snapshot', name: '스냅샷(컬렉션별 백업)', icon: '📸', path: '/dashboard/snapshot' },
  { id: 'dummy', name: '더미 데이터', icon: '🎲', path: '/dashboard/dummy' },
  { id: 'api', name: 'API 엔드포인트', icon: '🔗', path: '/dashboard/api' },
  { id: 'history', name: 'API 히스토리', icon: '📋', path: '/dashboard/history' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    // 각 탭의 경로와 정확히 매칭
    if (pathname === '/dashboard') {
      return 'dashboard';
    }
    if (pathname === '/dashboard/backup') {
      return 'backup';
    }
    if (pathname === '/dashboard/snapshot') {
      return 'snapshot';
    }
    if (pathname === '/dashboard/dummy') {
      return 'dummy';
    }
    if (pathname === '/dashboard/api') {
      return 'api';
    }
    if (pathname === '/dashboard/history') {
      return 'history';
    }
    
    return 'dashboard';
  };

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                getActiveTab() === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 