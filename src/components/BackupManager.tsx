'use client';

import { useState, useEffect } from 'react';
import Toast from './Toast';
import StorageInfo from './StorageInfo';

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

interface BackupStats {
  total: number;
  kept: number;
  deleted: number;
}

interface BackupData {
  backups: Backup[];
  backupStats: { [database: string]: BackupStats };
  maxBackupsPerDatabase: number;
}

export default function BackupManager() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [filteredBackups, setFilteredBackups] = useState<Backup[]>([]);
  const [backupStats, setBackupStats] = useState<{ [database: string]: BackupStats }>({});
  const [maxBackupsPerDatabase, setMaxBackupsPerDatabase] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreLogs, setRestoreLogs] = useState<string[]>([]);
  const [showRestoreLogs, setShowRestoreLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    fetchBackups();
  }, []);

  // 검색어에 따른 백업 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBackups(backups);
    } else {
      const filtered = backups.filter(backup => 
        backup.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBackups(filtered);
    }
  }, [searchTerm, backups]);

  // ESC 키로 모달 닫기 및 검색 초기화
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showBackupModal) {
          setShowBackupModal(false);
          setSelectedDatabase('');
        }
        if (showRestoreModal) {
          setShowRestoreModal(false);
          setSelectedBackup(null);
        }
        // 검색어 초기화
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showBackupModal, showRestoreModal]);

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

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
        setFilteredBackups(data.backups);
        setBackupStats(data.backupStats);
        setMaxBackupsPerDatabase(data.maxBackupsPerDatabase);
      }
    } catch (error) {
      console.error('백업 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!selectedDatabase) {
      showToast('데이터베이스를 선택해주세요.', 'error');
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
        }),
      });

      if (!response.ok) {
        throw new Error('백업에 실패했습니다.');
      }

      const data = await response.json();
      showToast(data.message, 'success');
      setShowBackupModal(false);
      setSelectedDatabase('');
      fetchBackups(); // 백업 목록 새로고침
    } catch (error) {
      showToast(error instanceof Error ? error.message : '백업 중 오류가 발생했습니다.', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) {
      showToast('복원할 백업을 선택해주세요.', 'error');
      return;
    }

    // 백업명에서 데이터베이스명 추출
    const databaseName = selectedBackup.name.split('_')[0];

    setRestoreLoading(true);
    setRestoreLogs([]);
    setShowRestoreLogs(true);
    
    // 복원 시작 로그 추가
    const startTime = new Date();
    setRestoreLogs(prev => [...prev, `[${startTime.toLocaleTimeString()}] 복원 작업 시작: ${databaseName} 데이터베이스`]);
    
    try {
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupName: selectedBackup.name,
          databaseName: databaseName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '복원에 실패했습니다.');
      }

      const data = await response.json();
      
      // 복원 완료 로그 추가
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      setRestoreLogs(prev => [...prev, `[${endTime.toLocaleTimeString()}] 복원 작업 완료 (총 소요시간: ${duration}ms)`]);
      
      showToast(data.message, 'success');
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        setShowRestoreModal(false);
        setSelectedBackup(null);
        setShowRestoreLogs(false);
        setRestoreLogs([]);
      }, 3000);
      
    } catch (error) {
      const errorTime = new Date();
      setRestoreLogs(prev => [...prev, `[${errorTime.toLocaleTimeString()}] 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`]);
      showToast(error instanceof Error ? error.message : '복원 중 오류가 발생했습니다.', 'error');
    } finally {
      setRestoreLoading(false);
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
      {/* 스토리지 정보 */}
      <StorageInfo type="backup" title="백업" />
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">백업 관리(디비 통백업)</h2>
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
          <p className="text-sm text-gray-500 mt-1">
            각 데이터베이스별로 최대 {maxBackupsPerDatabase}개의 백업을 유지합니다.
          </p>
        </div>
        
        {/* 백업 통계 */}
        {Object.keys(backupStats).length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">백업 통계</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(backupStats).map(([database, stats]) => (
                <div key={database} className="bg-white p-3 rounded-lg border">
                  <div className="text-sm font-medium text-gray-900">{database}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    총 {stats.total}개 중 {stats.kept}개 유지
                    {stats.deleted > 0 && (
                      <span className="text-red-500 ml-1">({stats.deleted}개 자동 삭제됨)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 백업 검색 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="backup-search" className="block text-sm font-medium text-gray-700 mb-2">
                백업 이름으로 검색
              </label>
              <div className="relative">
                <input
                  id="backup-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="백업 이름을 입력하세요..."
                  className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                {filteredBackups.length} / {backups.length} 백업
              </div>
            </div>
          </div>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {filteredBackups.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              {backups.length === 0 ? '백업이 없습니다.' : '검색 결과가 없습니다.'}
            </li>
          ) : (
            filteredBackups.map((backup) => {
              const databaseName = backup.name.split('_')[0];
              const isKept = backupStats[databaseName]?.kept > 0;
              
              return (
                <li key={backup.name} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {backup.name}
                        {!isKept && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            삭제 예정
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        생성일: {formatDate(backup.createdAt)} | 크기: {formatBytes(backup.size)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowRestoreModal(true);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      복원
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* 백업 생성 모달 */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">데이터베이스 백업 생성</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  백업할 데이터베이스 선택
                </label>
                <select
                  value={selectedDatabase}
                  onChange={(e) => setSelectedDatabase(e.target.value)}
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

              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>참고:</strong> 선택한 데이터베이스의 모든 컬렉션이 백업됩니다.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBackupModal(false);
                    setSelectedDatabase('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleBackup}
                  disabled={backupLoading || !selectedDatabase}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {backupLoading ? '백업 중...' : '백업 생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 복원 확인 모달 */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">백업 복원</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>경고:</strong> 이 작업은 현재 데이터베이스의 모든 데이터를 삭제하고 
                  백업 데이터로 교체합니다. 되돌릴 수 없습니다.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  <strong>주의:</strong> 백업 시점에 존재하지 않았던 컬렉션들은 복원 후 사라집니다.
                  현재 데이터베이스의 모든 컬렉션이 백업 시점의 상태로 완전히 복원됩니다.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  복원할 백업
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-900">{selectedBackup.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    생성일: {formatDate(selectedBackup.createdAt)} | 크기: {formatBytes(selectedBackup.size)}
                  </div>
                </div>
              </div>

              {/* 복원 로그 표시 영역 */}
              {showRestoreLogs && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    복원 진행 상황
                  </label>
                  <div className="p-3 bg-black text-green-400 rounded-md font-mono text-xs h-32 overflow-y-auto">
                    {restoreLogs.length === 0 ? (
                      <div className="text-gray-500">복원 작업을 시작하면 로그가 여기에 표시됩니다...</div>
                    ) : (
                      restoreLogs.map((log, index) => (
                        <div key={index} className="mb-1">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedBackup(null);
                    setShowRestoreLogs(false);
                    setRestoreLogs([]);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleRestore}
                  disabled={restoreLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {restoreLoading ? '복원 중...' : '복원 실행'}
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