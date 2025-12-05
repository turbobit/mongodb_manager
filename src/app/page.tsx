'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const getAccessRestrictionText = () => {
    const domains = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const emails = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length > 0 && domains.length > 0) {
      return `다음 이메일 또는 도메인 계정만 로그인할 수 있습니다: ${emails.join(', ')} / ${domains.map((d) => `@${d}`).join(', ')}`;
    }
    if (emails.length > 0) {
      return `다음 이메일만 로그인할 수 있습니다: ${emails.join(', ')}`;
    }
    const domainsDisplay = (domains.length > 0 ? domains : ['2weeks.co']).map((d) => `@${d}`).join(', ');
    return `${domainsDisplay} 도메인 계정만 로그인할 수 있습니다.`;
  };

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            MongoDB 관리자
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            MongoDB 데이터베이스를 효율적으로 관리하고 백업하세요. 
            직관적인 인터페이스로 데이터베이스 운영을 간편하게 만드세요.
          </p>
          
          {/* 도메인 제한 안내 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  접근 제한
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {getAccessRestrictionText()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => signIn('google')}
              className="bg-white text-gray-700 px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center mx-auto space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google로 로그인</span>
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">데이터베이스 관리</h3>
              <p className="text-gray-600">직관적인 인터페이스로 MongoDB 데이터베이스를 쉽게 관리하세요.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">자동 백업</h3>
              <p className="text-gray-600">스케줄된 백업으로 데이터 안전성을 보장하세요.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">스냅샷 & 롤백</h3>
              <p className="text-gray-600">데이터 스냅샷을 생성하고 필요시 롤백할 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
