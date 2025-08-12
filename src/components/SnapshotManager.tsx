'use client';

import { useState, useEffect } from 'react';
import Toast from './Toast';
import StorageInfo from './StorageInfo';
import { generateShortUUIDv7 } from '@/lib/uuid';

interface Snapshot {
  name: string;
  databaseName: string;
  collectionName: string;
  snapshotName: string;
  createdAt: Date;
  size: number;
}

interface Database {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

interface Collection {
  name: string;
  type: string;
  size: number;
  storageSize: number;
  count: number;
}

export default function SnapshotManager() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  
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

  useEffect(() => {
    fetchDatabases();
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showRollbackModal) {
          setShowRollbackModal(false);
          setSelectedSnapshot('');
        }
      }
    };

    if (showRollbackModal) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showRollbackModal]);

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

  const fetchCollections = async (databaseName: string) => {
    try {
      const response = await fetch(`/api/collections?database=${databaseName}`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
      }
    } catch (error) {
      console.error('컬렉션 목록 조회 실패:', error);
      setCollections([]);
    }
  };

  const handleDatabaseChange = (databaseName: string) => {
    setSelectedDatabase(databaseName);
    setSelectedCollection('');
    if (databaseName) {
      fetchCollections(databaseName);
      fetchSnapshots(databaseName, ''); // 데이터베이스만 선택된 경우 해당 데이터베이스의 모든 스냅샷 가져오기
    } else {
      setCollections([]);
      setSnapshots([]);
    }
  };

  const handleCollectionChange = (collectionName: string) => {
    setSelectedCollection(collectionName);
    if (collectionName && selectedDatabase) {
      // 특정 컬렉션 선택 시
      fetchSnapshots(selectedDatabase, collectionName);
    } else if (selectedDatabase) {
      // "컬렉션을 선택하세요" 선택 시 - 데이터베이스의 모든 스냅샷 표시
      fetchSnapshots(selectedDatabase, undefined);
    } else {
      setSnapshots([]);
    }
  };

  const fetchSnapshots = async (databaseName?: string, collectionName?: string) => {
    const dbName = databaseName || selectedDatabase;
    
    if (!dbName) return;
    
    try {
      let url: string;
      if (collectionName) {
        // 특정 컬렉션 선택 시
        url = `/api/snapshot?database=${dbName}&collection=${collectionName}`;
      } else {
        // 데이터베이스만 선택 시 (collectionName이 undefined 또는 빈 문자열)
        url = `/api/snapshot?database=${dbName}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots);
      }
    } catch (error) {
      console.error('스냅샷 목록 조회 실패:', error);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedDatabase || !selectedCollection) {
      showToast('데이터베이스와 컬렉션을 선택해주세요.', 'error');
      return;
    }

    setIsCreatingSnapshot(true);

    try {
      const response = await fetch('/api/snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          snapshotName: generateShortUUIDv7(),
        }),
      });

      if (!response.ok) {
        throw new Error('스냅샷 생성에 실패했습니다.');
      }

      const data = await response.json();
      showToast(data.message, 'success');
      fetchSnapshots(selectedDatabase, selectedCollection);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '스냅샷 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedSnapshot) {
      showToast('복원할 스냅샷을 선택해주세요.', 'error');
      return;
    }

    // 선택된 스냅샷에서 데이터베이스와 컬렉션 정보 추출
    const snapshot = snapshots.find(s => s.name === selectedSnapshot);
    if (!snapshot) {
      showToast('스냅샷 정보를 찾을 수 없습니다.', 'error');
      return;
    }

    if (!confirm('정말로 이 스냅샷으로 복원하시겠습니까? 현재 데이터는 삭제됩니다.')) {
      return;
    }

    try {
      const response = await fetch('/api/snapshot/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshotName: selectedSnapshot,
          databaseName: snapshot.databaseName,
          collectionName: snapshot.collectionName,
        }),
      });

      if (!response.ok) {
        throw new Error('복원에 실패했습니다.');
      }

      const data = await response.json();
      showToast(data.message);
      setShowRollbackModal(false);
      setSelectedSnapshot('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '복원 중 오류가 발생했습니다.', 'error');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR');
  };

  const handleDeleteSnapshot = async (snapshotName: string) => {
    if (!confirm('정말로 이 스냅샷을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/snapshot?name=${encodeURIComponent(snapshotName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('스냅샷 삭제에 실패했습니다.');
      }

      const data = await response.json();
      showToast(data.message, 'success');
      fetchSnapshots(selectedDatabase, selectedCollection);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '스냅샷 삭제 중 오류가 발생했습니다.', 'error');
    }
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
      {/* 스토리지 정보 */}
      <StorageInfo type="snapshot" title="스냅샷" />
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">스냅샷 관리</h2>
      </div>

      {/* 스냅샷 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">스냅샷 히스토리</h3>
          <p className="text-sm text-gray-500 mt-1">
            각 컬렉션별로 최대 10개의 스냅샷을 유지합니다. 새로운 스냅샷 생성 시 오래된 스냅샷은 자동으로 삭제됩니다.
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                데이터베이스
              </label>
              <select
                value={selectedDatabase}
                onChange={(e) => handleDatabaseChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">데이터베이스를 선택하세요</option>
                {databases.map((db) => (
                  <option key={db.name} value={db.name}>
                    {db.name} ({formatBytes(db.sizeOnDisk)})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                컬렉션
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => handleCollectionChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">컬렉션을 선택하세요</option>
                {collections.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({formatBytes(col.size)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleCreateSnapshot}
                disabled={!selectedDatabase || !selectedCollection || isCreatingSnapshot}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                title={!selectedDatabase ? "데이터베이스를 선택해주세요" : !selectedCollection ? "컬렉션을 선택해주세요" : "스냅샷 생성"}
              >
                {isCreatingSnapshot ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    생성 중...
                  </>
                ) : (
                  '스냅샷 생성'
                )}
              </button>
            </div>
          </div>
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
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-sm font-semibold">
                        <span className="text-sm">{snapshot.databaseName}.</span>
                        <span className="text-base font-bold">{snapshot.collectionName}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {snapshot.snapshotName}
                      </div>
                      <div className="text-sm text-gray-500">
                        생성일: {formatDate(snapshot.createdAt)} | 크기: {formatBytes(snapshot.size)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSnapshot(snapshot.name);
                        setShowRollbackModal(true);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      복원
                    </button>
                    <button
                      onClick={() => handleDeleteSnapshot(snapshot.name)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 롤백 모달 */}
      {showRollbackModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">스냅샷 복원</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>경고:</strong> 이 작업은 현재 컬렉션의 모든 데이터를 삭제하고 
                  스냅샷 데이터로 교체합니다. 되돌릴 수 없습니다.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복원할 스냅샷
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
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  복원 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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