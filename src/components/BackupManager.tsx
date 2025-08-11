'use client';

import { useState, useEffect } from 'react';

interface Backup {
  name: string;
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
}

export default function BackupManager() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupType, setBackupType] = useState<'full' | 'partial'>('full');

  useEffect(() => {
    fetchDatabases();
    fetchBackups();
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showBackupModal) {
        setShowBackupModal(false);
        setSelectedDatabase('');
        setSelectedCollections([]);
        setBackupType('full');
      }
    };

    if (showBackupModal) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showBackupModal]);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('/api/databases');
      if (response.ok) {
        const data = await response.json();
        setDatabases(data.databases);
      }
    } catch (error) {
      console.error('데이터베이스 목록 조회 실패:', error);
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

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('백업 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseChange = (databaseName: string) => {
    setSelectedDatabase(databaseName);
    setSelectedCollections([]);
    if (databaseName) {
      fetchCollections(databaseName);
    } else {
      setCollections([]);
    }
  };

  const handleCollectionToggle = (collectionName: string) => {
    setSelectedCollections(prev => 
      prev.includes(collectionName)
        ? prev.filter(name => name !== collectionName)
        : [...prev, collectionName]
    );
  };

  const handleBackup = async () => {
    if (!selectedDatabase) {
      alert('데이터베이스를 선택해주세요.');
      return;
    }

    if (backupType === 'partial' && selectedCollections.length === 0) {
      alert('백업할 컬렉션을 선택해주세요.');
      return;
    }

    setBackupLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseName: selectedDatabase,
          collections: backupType === 'partial' ? selectedCollections : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('백업에 실패했습니다.');
      }

      const data = await response.json();
      alert(data.message);
      setShowBackupModal(false);
      setSelectedDatabase('');
      setSelectedCollections([]);
      setBackupType('full');
      fetchBackups(); // 백업 목록 새로고침
    } catch (error) {
      alert(error instanceof Error ? error.message : '백업 중 오류가 발생했습니다.');
    } finally {
      setBackupLoading(false);
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
        <h2 className="text-2xl font-bold text-gray-900">백업 관리</h2>
        <button
          onClick={() => setShowBackupModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          새 백업 생성
        </button>
      </div>

      {/* 백업 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">백업 히스토리</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {backups.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              백업이 없습니다.
            </li>
          ) : (
            backups.map((backup) => (
              <li key={backup.name} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                    <div className="text-sm text-gray-500">
                      생성일: {formatDate(backup.createdAt)} | 크기: {formatBytes(backup.size)}
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 백업 생성 모달 */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">백업 생성</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  데이터베이스 선택
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  백업 유형
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="backupType"
                      value="full"
                      checked={backupType === 'full'}
                      onChange={(e) => setBackupType(e.target.value as 'full' | 'partial')}
                      className="mr-2"
                    />
                    전체 데이터베이스 백업
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="backupType"
                      value="partial"
                      checked={backupType === 'partial'}
                      onChange={(e) => setBackupType(e.target.value as 'full' | 'partial')}
                      className="mr-2"
                    />
                    특정 컬렉션만 백업
                  </label>
                </div>
              </div>

              {/* 컬렉션 선택 영역 */}
              {backupType === 'partial' && selectedDatabase && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    백업할 컬렉션 선택 ({selectedCollections.length}개 선택됨)
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {collections.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-2">
                        컬렉션을 불러오는 중...
                      </div>
                    ) : (
                      collections.map((collection) => (
                        <label key={collection.name} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            checked={selectedCollections.includes(collection.name)}
                            onChange={() => handleCollectionToggle(collection.name)}
                            className="mr-2"
                          />
                          <span className="text-sm">{collection.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBackupModal(false);
                    setSelectedDatabase('');
                    setSelectedCollections([]);
                    setBackupType('full');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleBackup}
                  disabled={backupLoading || !selectedDatabase || (backupType === 'partial' && selectedCollections.length === 0)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {backupLoading ? '백업 중...' : '백업 생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 