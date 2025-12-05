'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function AccessDenied() {
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
      return `다음 이메일 또는 도메인 계정만 사용할 수 있습니다: ${emails.join(', ')} / ${domains.map((d) => `@${d}`).join(', ')}`;
    }
    if (emails.length > 0) {
      return `다음 이메일만 사용할 수 있습니다: ${emails.join(', ')}`;
    }
    const domainsDisplay = (domains.length > 0 ? domains : ['2weeks.co']).map((d) => `@${d}`).join(', ');
    return `${domainsDisplay} 도메인 계정만 사용할 수 있습니다.`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            접근이 거부되었습니다
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            이 애플리케이션은 {getAccessRestrictionText()}
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    도메인 제한
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>현재 로그인한 계정은 허용된 범위가 아닙니다.</p>
                    <p className="mt-1">허용 조건: {getAccessRestrictionText()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => signOut()}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                로그아웃
              </button>
              
              <Link
                href="/"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-center block"
              >
                홈으로 돌아가기
              </Link>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                문의사항이 있으시면 관리자에게 연락해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 