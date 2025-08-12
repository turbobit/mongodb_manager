'use client';

import { useState } from 'react';
import Toast from '@/components/Toast';

export default function ApiPage() {
  const [databaseName, setDatabaseName] = useState('instarsearch');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleTestApi = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cron/backup?database=${databaseName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        showToast('API 호출이 성공했습니다!', 'success');
        console.log('API Response:', result);
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || '알 수 없는 오류';
        showToast(`API 호출에 실패했습니다: ${errorMessage}`, 'error');
        console.error('API Error Response:', errorData);
      }
    } catch (error) {
      showToast('API 호출 중 오류가 발생했습니다.', 'error');
      console.error('API Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('클립보드에 복사되었습니다!', 'success');
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API 엔드포인트</h1>
        <p className="mt-2 text-gray-600">
          MongoDB 백업을 위한 크론잡 실행 API 엔드포인트입니다.
        </p>
      </div>

      {/* API 엔드포인트 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">백업 크론잡 API</h2>
        
        <div className="space-y-4">
          {/* 데이터베이스 이름 입력 */}
          <div>
            <label htmlFor="databaseName" className="block text-sm font-medium text-gray-700 mb-2">
              데이터베이스 이름
            </label>
            <input
              type="text"
              id="databaseName"
              value={databaseName}
              onChange={(e) => setDatabaseName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="예: instarsearch"
            />
            <p className="mt-1 text-sm text-gray-500">
              백업할 MongoDB 데이터베이스의 이름을 입력하세요.
            </p>
          </div>

          {/* API 엔드포인트 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">API 엔드포인트 정보</h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">URL:</span>
                <div className="flex items-center mt-1">
                  <code className="bg-white px-3 py-2 rounded border text-sm font-mono flex-1">
                    POST /api/cron/backup?database={databaseName}
                  </code>
                  <button
                    onClick={() => copyToClipboard(`POST /api/cron/backup?database=${databaseName}`)}
                    className="ml-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                  >
                    복사
                  </button>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700">cURL 예시:</span>
                <div className="flex items-center mt-1">
                  <code className="bg-white px-3 py-2 rounded border text-sm font-mono flex-1">
                    curl -X POST "http://localhost:3000/api/cron/backup?database={databaseName}"
                  </code>
                  <button
                    onClick={() => copyToClipboard(`curl -X POST "http://localhost:3000/api/cron/backup?database=${databaseName}"`)}
                    className="ml-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                  >
                    복사
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 테스트 버튼 */}
          <div className="pt-4">
            <button
              onClick={handleTestApi}
              disabled={isLoading || !databaseName.trim()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '테스트 중...' : 'API 테스트'}
            </button>
          </div>
        </div>
      </div>

      {/* API 설명 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API 설명</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">기능</h3>
            <p className="text-gray-600">
              이 API는 지정된 MongoDB 데이터베이스의 백업을 실행하는 크론잡 엔드포인트입니다.
              로컬 환경에서만 호출 가능하도록 제한되어 있습니다.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">매개변수</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">database (query parameter)</span>
                  <p className="text-sm text-gray-600">백업할 MongoDB 데이터베이스의 이름</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">응답</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">성공 시 (200)</span>
                  <pre className="text-sm text-gray-600 mt-1">
{`{
  "success": true,
  "message": "백업이 성공적으로 시작되었습니다.",
  "database": "데이터베이스명",
  "timestamp": "2024-01-01T00:00:00.000Z"
}`}
                  </pre>
                </div>
                <div>
                  <span className="font-medium text-gray-700">오류 시 (400/500)</span>
                  <pre className="text-sm text-gray-600 mt-1">
{`{
  "success": false,
  "error": "오류 메시지"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">보안</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>로컬 환경에서만 호출 가능 (localhost 제한)</li>
              <li>인증된 사용자만 접근 가능</li>
              <li>데이터베이스 이름 검증</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">사용 예시</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">
                크론잡에서 다음과 같이 설정할 수 있습니다:
              </p>
              <pre className="text-sm text-gray-600">
{`# 매일 새벽 2시에 ${databaseName} 데이터베이스 백업 실행
0 2 * * * curl -X POST "http://localhost:3000/api/cron/backup?database=${databaseName}"

# 매주 일요일 새벽 3시에 백업 실행
0 3 * * 0 curl -X POST "http://localhost:3000/api/cron/backup?database=${databaseName}"

# 매일 오후 6시에 백업 실행
0 18 * * * curl -X POST "http://localhost:3000/api/cron/backup?database=${databaseName}"`}
              </pre>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 크론잡 설정 가이드</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>1. 크론잡 편집:</strong> <code className="bg-white px-2 py-1 rounded">crontab -e</code></p>
                  <p><strong>2. 다음 라인 추가:</strong></p>
                  <div className="bg-white p-3 rounded border">
                    <code>0 2 * * * curl -X POST "http://localhost:3000/api/cron/backup?database={databaseName}"</code>
                  </div>
                  <p><strong>3. 저장 후 종료:</strong> <code className="bg-white px-2 py-1 rounded">Ctrl+X, Y, Enter</code></p>
                  <p><strong>4. 크론잡 확인:</strong> <code className="bg-white px-2 py-1 rounded">crontab -l</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
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