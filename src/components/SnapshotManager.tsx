'use client';

import { useState, useEffect } from 'react';

interface Snapshot {
  name: string;
  snapshotName: string;
  createdAt: Date;
}

interface Database {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export default function SnapshotManager() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [snapshotName, setSnapshotName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/databases');
      if (response.ok) {
        const data = await response.json();
        setDatabases(data.databases);
      }
    } catch (error) {
      console.error('데이터베이스 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    if (!selectedDatabase || !selectedCollection) return;
    
    try {
      const response = await fetch(`/api/snapshot?database=${selectedDatabase}&collection=${selectedCollection}`);
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots);
      }
    } catch (error) {
      console.error('스냅샷 목록 조회 실패:', error);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedDatabase || !selectedCollection || !snapshotName) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          snapshotName: snapshotName,
        }),
      });

      if (!response.ok) {
        throw new Error('스냅샷 생성에 실패했습니다.');
      }

      const data = await response.json();
      alert(data.message);
      setShowCreateModal(false);
      setSnapshotName('');
      fetchSnapshots();
    } catch (error) {
      alert(error instanceof Error ? error.message : '스냅샷 생성 중 오류가 발생했습니다.');
    }
  };

  const handleRollback = async () => {
    if (!selectedDatabase || !selectedCollection || !selectedSnapshot) {
      alert('모든 필드를 선택해주세요.');
      return;
    }

    if (!confirm('정말로 이 스냅샷으로 롤백하시겠습니까? 현재 데이터는 삭제됩니다.')) {
      return;
    }

    try {
      const response = await fetch('/api/snapshot/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          snapshotName: selectedSnapshot,
        }),
      });

      if (!response.ok) {
        throw new Error('롤백에 실패했습니다.');
      }

      const data = await response.json();
      alert(data.message);
      setShowRollbackModal(false);
      setSelectedSnapshot('');
    } catch (error) {
      alert(error instanceof Error ? error.message : '롤백 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">스냅샷 관리</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          새 스냅샷 생성
        </button>
      </div>

      {/* 스냅샷 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">스냅샷 목록</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                데이터베이스
              </label>
              <select
                value={selectedDatabase}
                onChange={(e) => {
                  setSelectedDatabase(e.target.value);
                  setSelectedCollection('');
                  setSnapshots([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">데이터베이스를 선택하세요</option>
                {databases.map((db) => (
                  <option key={db.name} value={db.name}>
                    {db.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                컬렉션
              </label>
              <input
                type="text"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                placeholder="컬렉션명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <button
            onClick={fetchSnapshots}
            disabled={!selectedDatabase || !selectedCollection}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            스냅샷 조회
          </button>
        </div>

        <ul className="divide-y divide-gray-200">
          {snapshots.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              스냅샷이 없습니다.
            </li>
          ) : (
            snapshots.map((snapshot) => (
              <li key={snapshot.name} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {snapshot.snapshotName}
                    </div>
                    <div className="text-sm text-gray-500">
                      생성일: {formatDate(snapshot.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSnapshot(snapshot.snapshotName);
                      setShowRollbackModal(true);
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    롤백
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 스냅샷 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">스냅샷 생성</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  데이터베이스
                </label>
                <select
                  value={selectedDatabase}
                  onChange={(e) => setSelectedDatabase(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">데이터베이스를 선택하세요</option>
                  {databases.map((db) => (
                    <option key={db.name} value={db.name}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  컬렉션명
                </label>
                <input
                  type="text"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="컬렉션명을 입력하세요"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  스냅샷 이름
                </label>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="스냅샷 이름을 입력하세요"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSnapshotName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateSnapshot}
                  disabled={!selectedDatabase || !selectedCollection || !snapshotName}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 롤백 모달 */}
      {showRollbackModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">스냅샷 롤백</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>경고:</strong> 이 작업은 현재 컬렉션의 모든 데이터를 삭제하고 
                  스냅샷 데이터로 교체합니다. 되돌릴 수 없습니다.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  롤백할 스냅샷
                </label>
                <input
                  type="text"
                  value={selectedSnapshot}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRollbackModal(false);
                    setSelectedSnapshot('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRollback}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  롤백 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 