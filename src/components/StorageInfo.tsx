'use client';

import { useState, useEffect } from 'react';
import { type StorageInfo, formatBytes, getStorageColor } from '@/lib/storage';

interface StorageInfoProps {
  type: 'backup' | 'snapshot';
  title: string;
}

export default function StorageInfo({ type, title }: StorageInfoProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    total: 0,
    available: 0,
    usagePercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorageInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/storage/${type}`);
        if (response.ok) {
          const data = await response.json();
          setStorageInfo(data);
        }
      } catch (error) {
        console.error(`${title} 스토리지 정보 조회 실패:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageInfo();
    
    // 30초마다 스토리지 정보 업데이트
    const interval = setInterval(fetchStorageInfo, 30000);
    
    return () => clearInterval(interval);
  }, [type, title]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">{title} 스토리지</h3>
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(storageInfo.used)}
            </div>
            <div className="text-sm text-gray-500">
              / {formatBytes(storageInfo.total)}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-semibold ${getStorageColor(storageInfo.usagePercentage)}`}>
            {storageInfo.usagePercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            사용 중
          </div>
        </div>
      </div>
      
      {/* 진행률 바 */}
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              storageInfo.usagePercentage >= 90 ? 'bg-red-500' :
              storageInfo.usagePercentage >= 75 ? 'bg-yellow-500' :
              storageInfo.usagePercentage >= 50 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(storageInfo.usagePercentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        사용 가능: {formatBytes(storageInfo.available)}
      </div>
    </div>
  );
} 