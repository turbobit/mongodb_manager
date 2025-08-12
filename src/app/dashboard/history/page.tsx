'use client';

import { useState, useEffect } from 'react';
import Toast from '@/components/Toast';
import { ApiHistory } from '@/types/api-history';

export default function HistoryPage() {
  const [history, setHistory] = useState<ApiHistory[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    endpoint: '',
    method: '',
    startDate: '',
    endDate: '',
    sortBy: 'timestamp' as 'timestamp' | 'endpoint' | 'method',
    sortOrder: 'desc' as 'asc' | 'desc',
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });

  // Toast 상태
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      message,
      type,
      isVisible: true,
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // 필터 파라미터 추가
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });
      
      // 통계 포함
      params.append('stats', 'true');

      const response = await fetch(`/api/history?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setStats(data.stats);
        setPagination({
          totalCount: data.totalCount,
          totalPages: data.totalPages,
          currentPage: data.page,
        });
      } else {
        showToast('API 히스토리를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      showToast('API 히스토리를 불러오는 중 오류가 발생했습니다.', 'error');
      console.error('API 히스토리 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // 필터 변경 시 첫 페이지로
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      endpoint: '',
      method: '',
      startDate: '',
      endDate: '',
      sortBy: 'timestamp',
      sortOrder: 'desc',
      page: 1,
      limit: 50,
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    return `${duration}ms`;
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };



  const getMethodBadge = (method: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (method.toUpperCase()) {
      case 'GET':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'POST':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'PUT':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'DELETE':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getActionTypeBadge = (actionType: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (actionType) {
      case 'backup':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'restore':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'snapshot':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'cron':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API 히스토리</h1>
        <p className="mt-2 text-gray-600">
          모든 API 호출의 히스토리를 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 호출</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overall.totalCalls}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">성공</p>
                <p className="text-2xl font-bold text-green-600">{stats.overall.successCalls}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 응답시간</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.overall.avgDuration ? `${Math.round(stats.overall.avgDuration)}ms` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">필터</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="엔드포인트, 액션, 메시지 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* 엔드포인트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              액션 타입
            </label>
            <select
              value={filters.endpoint}
              onChange={(e) => handleFilterChange('endpoint', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">전체</option>
              <option value="/api/backup">전체 백업</option>
              <option value="/api/backup/restore">전체 백업 복원</option>
              <option value="/api/snapshot">스냅샷 생성</option>
              <option value="/api/snapshot/restore">스냅샷 복원</option>
              <option value="/api/cron/backup">크론 백업</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              액션 카테고리
            </label>
            <select
              value={filters.method}
              onChange={(e) => handleFilterChange('method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">전체</option>
              <option value="backup">백업</option>
              <option value="restore">복원</option>
              <option value="snapshot">스냅샷</option>
              <option value="cron">크론</option>
            </select>
          </div>


        </div>

        {/* 날짜 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작 날짜
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료 날짜
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 정렬 및 필터 초기화 */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬 기준
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="timestamp">시간</option>
                <option value="action">액션</option>
                <option value="actionType">액션 타입</option>
                <option value="target">대상</option>
                <option value="method">메서드</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬 순서
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="desc">최신순</option>
                <option value="asc">오래된순</option>
              </select>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 히스토리 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            API 호출 히스토리 ({pagination.totalCount}개)
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">API 호출 히스토리가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      대상
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      메서드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      응답시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(item.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="font-medium">{item.action}</span>
                          <span className={`ml-2 ${getActionTypeBadge(item.actionType)}`}>
                            {item.actionType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={item.target}>
                          {item.target}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getMethodBadge(item.method)}>
                          {item.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(item.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.userEmail || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    총 {pagination.totalCount}개 중 {(pagination.currentPage - 1) * filters.limit + 1}-
                    {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)}개
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast 컴포넌트 */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
    </div>
  );
} 