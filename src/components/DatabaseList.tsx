'use client';

import { useState, useEffect } from 'react';

interface Database {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export default function DatabaseList() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [newDbName, setNewDbName] = useState('');

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/databases');
      if (!response.ok) {
        throw new Error('데이터베이스 목록을 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      setDatabases(data.databases);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneDatabase = async () => {
    if (!selectedDb || !newDbName) {
      alert('데이터베이스명과 새 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/databases/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceDatabase: selectedDb,
          targetDatabase: newDbName,
        }),
      });

      if (!response.ok) {
        throw new Error('데이터베이스 복제에 실패했습니다.');
      }

      const data = await response.json();
      alert(data.message);
      setShowCloneModal(false);
      setSelectedDb('');
      setNewDbName('');
      fetchDatabases(); // 목록 새로고침
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDatabases}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">데이터베이스 목록</h2>
        <button
          onClick={fetchDatabases}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {databases.map((db) => (
            <li key={db.name} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">
                        {db.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{db.name}</div>
                    <div className="text-sm text-gray-500">
                      크기: {formatBytes(db.sizeOnDisk)} | 
                      상태: {db.empty ? '비어있음' : '데이터 있음'}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDb(db.name);
                      setShowCloneModal(true);
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    복제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 복제 모달 */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">데이터베이스 복제</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소스 데이터베이스
                </label>
                <input
                  type="text"
                  value={selectedDb}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 데이터베이스 이름
                </label>
                <input
                  type="text"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="새 데이터베이스 이름을 입력하세요"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setSelectedDb('');
                    setNewDbName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCloneDatabase}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                >
                  복제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 