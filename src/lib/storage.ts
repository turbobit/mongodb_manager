// 로컬 스토리지 사용량 계산 유틸리티

export interface StorageInfo {
  used: number;
  total: number;
  available: number;
  usagePercentage: number;
}

// 백업 폴더의 총 크기 계산
export const calculateBackupStorage = async (): Promise<StorageInfo> => {
  try {
    const response = await fetch('/api/storage/backup');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw new Error('백업 스토리지 정보를 가져올 수 없습니다.');
  } catch (error) {
    console.error('백업 스토리지 계산 오류:', error);
    return {
      used: 0,
      total: 0,
      available: 0,
      usagePercentage: 0
    };
  }
};

// 스냅샷 폴더의 총 크기 계산
export const calculateSnapshotStorage = async (): Promise<StorageInfo> => {
  try {
    const response = await fetch('/api/storage/snapshot');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    throw new Error('스냅샷 스토리지 정보를 가져올 수 없습니다.');
  } catch (error) {
    console.error('스냅샷 스토리지 계산 오류:', error);
    return {
      used: 0,
      total: 0,
      available: 0,
      usagePercentage: 0
    };
  }
};

// 바이트를 읽기 쉬운 형태로 변환
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 사용률에 따른 색상 반환
export const getStorageColor = (usagePercentage: number): string => {
  if (usagePercentage >= 90) return 'text-red-500';
  if (usagePercentage >= 75) return 'text-yellow-500';
  if (usagePercentage >= 50) return 'text-orange-500';
  return 'text-green-500';
}; 