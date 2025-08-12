'use client';

import { useState, useEffect } from 'react';

interface DatabaseStatus {
  totalDatabases: number;
  totalSize: number;
  activeConnections: number;
  serverStatus: 'connected' | 'disconnected' | 'error';
  lastUpdate: Date;
  databases: Array<{
    name: string;
    sizeOnDisk: number;
    empty: boolean;
    collections: number;
  }>;
  serverInfo: {
    version: string;
    uptime: number;
    memory: {
      resident: number;
      virtual: number;
      mapped: number;
      mappedWithJournal: number;
      totalSystemMemory: number;
    };
    connections: {
      current: number;
      available: number;
      active: number;
      inactive: number;
    };
    operations: {
      insert: number;
      query: number;
      update: number;
      delete: number;
      getmore: number;
      command: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      numRequests: number;
    };
    opLatencies: {
      reads: number;
      writes: number;
      commands: number;
    };
  };
}

export default function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // 30초

  useEffect(() => {
    fetchDatabaseStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDatabaseStatus, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/databases/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError('데이터베이스 상태를 가져올 수 없습니다.');
      }
    } catch {
      setError('데이터베이스 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}일 ${hours}시간 ${minutes}분`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      case 'error':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return '연결됨';
      case 'disconnected':
        return '연결 끊김';
      case 'error':
        return '오류';
      default:
        return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDatabaseStatus}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 컨트롤 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">데이터베이스 상태</h2>
        <div className="flex items-center space-x-4">
          {/* 자동 새로고침 설정 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">자동 새로고침:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
          
          {/* 새로고침 간격 설정 */}
          {autoRefresh && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">간격:</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10초</option>
                <option value={30}>30초</option>
                <option value={60}>1분</option>
                <option value={300}>5분</option>
              </select>
            </div>
          )}
          
          {/* 상태 표시 */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.serverStatus)}`}>
            {getStatusText(status.serverStatus)}
          </div>
          
          {/* 수동 새로고침 버튼 */}
          <button
            onClick={fetchDatabaseStatus}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="새로고침"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">총 데이터베이스</p>
              <p className="text-2xl font-semibold text-blue-900">{status.totalDatabases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">총 크기</p>
              <p className="text-2xl font-semibold text-green-900">{formatBytes(status.totalSize)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">활성 연결</p>
              <p className="text-2xl font-semibold text-purple-900">{status.activeConnections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">마지막 업데이트</p>
              <p className="text-sm font-semibold text-orange-900">
                {new Date(status.lastUpdate).toLocaleTimeString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 서버 정보 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">서버 정보</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">MongoDB 버전</h4>
              <p className="text-lg font-semibold text-gray-900">{status.serverInfo.version}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">가동 시간</h4>
              <p className="text-lg font-semibold text-gray-900">{formatUptime(status.serverInfo.uptime)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">활성 연결</h4>
              <p className="text-lg font-semibold text-gray-900">
                {status.serverInfo.connections.active} / {status.serverInfo.connections.current}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">네트워크 요청</h4>
              <p className="text-lg font-semibold text-gray-900">
                {status.serverInfo.network.numRequests.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메모리 사용량 상세 정보 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">메모리 사용량</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative group">
              <h4 className="text-sm font-medium text-gray-500 flex items-center">
                실제 메모리 (Resident)
                <span className="ml-1 text-gray-400 cursor-help">?</span>
              </h4>
              <p className="text-lg font-semibold text-blue-600">
                {formatBytes(status.serverInfo.memory.resident)} / {formatBytes(status.serverInfo.memory.totalSystemMemory)}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((status.serverInfo.memory.resident / status.serverInfo.memory.totalSystemMemory) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                사용률: {Math.round((status.serverInfo.memory.resident / status.serverInfo.memory.totalSystemMemory) * 100)}%
              </p>
              {/* 툴팁 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                MongoDB 프로세스가 실제로 사용하는 물리적 메모리입니다. 데이터, 인덱스, 연결 등을 포함한 실제 RAM 사용량을 나타냅니다.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <div className="relative group">
              <h4 className="text-sm font-medium text-gray-500 flex items-center">
                가상 메모리 (Virtual)
                <span className="ml-1 text-gray-400 cursor-help">?</span>
              </h4>
              <p className="text-lg font-semibold text-green-600">{formatBytes(status.serverInfo.memory.virtual)}</p>
              {/* 툴팁 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                MongoDB 프로세스가 할당받은 총 가상 메모리입니다. 물리적 RAM과 스왑 메모리를 포함한 전체 메모리 공간을 나타냅니다.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <div className="relative group">
              <h4 className="text-sm font-medium text-gray-500 flex items-center">
                매핑된 메모리 (Mapped)
                <span className="ml-1 text-gray-400 cursor-help">?</span>
              </h4>
              <p className="text-lg font-semibold text-purple-600">{formatBytes(status.serverInfo.memory.mapped)}</p>
              {/* 툴팁 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                MongoDB가 메모리에 매핑한 데이터베이스 파일의 크기입니다. 데이터와 인덱스가 메모리에 로드된 양을 나타냅니다.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            <div className="relative group">
              <h4 className="text-sm font-medium text-gray-500 flex items-center">
                저널 포함 매핑
                <span className="ml-1 text-gray-400 cursor-help">?</span>
              </h4>
              <p className="text-lg font-semibold text-orange-600">{formatBytes(status.serverInfo.memory.mappedWithJournal)}</p>
              {/* 툴팁 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                저널 파일을 포함한 총 매핑된 메모리입니다. 데이터 복구를 위한 저널 파일까지 포함한 전체 메모리 매핑 크기입니다.
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 작업 통계 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">작업 통계</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">조회</h4>
              <p className="text-lg font-semibold text-blue-600">{status.serverInfo.operations.query.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">삽입</h4>
              <p className="text-lg font-semibold text-green-600">{status.serverInfo.operations.insert.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">수정</h4>
              <p className="text-lg font-semibold text-yellow-600">{status.serverInfo.operations.update.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">삭제</h4>
              <p className="text-lg font-semibold text-red-600">{status.serverInfo.operations.delete.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">명령</h4>
              <p className="text-lg font-semibold text-purple-600">{status.serverInfo.operations.command.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500">GetMore</h4>
              <p className="text-lg font-semibold text-indigo-600">{status.serverInfo.operations.getmore.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 네트워크 통계 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">네트워크 통계</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">수신 바이트</h4>
              <p className="text-lg font-semibold text-green-600">{formatBytes(status.serverInfo.network.bytesIn)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">송신 바이트</h4>
              <p className="text-lg font-semibold text-blue-600">{formatBytes(status.serverInfo.network.bytesOut)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">총 요청 수</h4>
              <p className="text-lg font-semibold text-purple-600">{status.serverInfo.network.numRequests.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 데이터베이스 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">데이터베이스 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  데이터베이스명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  크기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  컬렉션 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {status.databases.map((db) => (
                <tr key={db.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {db.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBytes(db.sizeOnDisk)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {db.collections}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      db.empty ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {db.empty ? '비어있음' : '데이터 있음'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 