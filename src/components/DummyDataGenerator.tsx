'use client';

import { useState, useEffect } from 'react';

interface Database {
  name: string;
  sizeOnDisk: number;
  empty: boolean;
}

export default function DummyDataGenerator() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [dataType, setDataType] = useState('users');
  const [count, setCount] = useState(100);

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

  const handleGenerateDummyData = async () => {
    if (!selectedDatabase || !collectionName) {
      alert('데이터베이스와 컬렉션명을 입력해주세요.');
      return;
    }

    if (count <= 0 || count > 10000) {
      alert('데이터 개수는 1~10,000개 사이여야 합니다.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/dummy-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseName: selectedDatabase,
          collectionName: collectionName,
          dataType: dataType,
          count: count,
        }),
      });

      if (!response.ok) {
        throw new Error('더미 데이터 생성에 실패했습니다.');
      }

      const data = await response.json();
      alert(data.message);
      setCollectionName('');
      setCount(100);
    } catch (error) {
      alert(error instanceof Error ? error.message : '더미 데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const dataTypeOptions = [
    { value: 'users', label: '사용자 데이터', description: '이름, 이메일, 나이, 활성 상태' },
    { value: 'products', label: '상품 데이터', description: '상품명, 가격, 카테고리, 재고' },
    { value: 'orders', label: '주문 데이터', description: '고객ID, 총액, 상태, 주문 항목' },
    { value: 'custom', label: '기본 데이터', description: '제목, 설명, 값, 생성일' },
  ];

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
        <h2 className="text-2xl font-bold text-gray-900">더미 데이터 생성</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            더미 데이터 생성 설정
          </h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                데이터베이스 선택
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                컬렉션명
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="컬렉션명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                데이터 유형
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {dataTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {dataTypeOptions.find(opt => opt.value === dataType)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                데이터 개수
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                min="1"
                max="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1-10000"
              />
              <p className="mt-1 text-sm text-gray-500">
                1~10,000개 사이의 값을 입력하세요
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerateDummyData}
              disabled={generating || !selectedDatabase || !collectionName || count <= 0}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? '생성 중...' : '더미 데이터 생성'}
            </button>
          </div>
        </div>
      </div>

      {/* 데이터 유형 설명 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            데이터 유형 상세 설명
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dataTypeOptions.map((option) => (
              <div key={option.value} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{option.label}</h4>
                <p className="text-sm text-gray-600">{option.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  예시 필드:
                  {option.value === 'users' && ' id, name, email, age, createdAt, isActive'}
                  {option.value === 'products' && ' id, name, price, category, stock, createdAt'}
                  {option.value === 'orders' && ' id, customerId, totalAmount, status, items, createdAt'}
                  {option.value === 'custom' && ' id, title, description, value, createdAt'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 