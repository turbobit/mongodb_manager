'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Callback':
        return 'Google OAuth 콜백 오류가 발생했습니다. Google Cloud Console에서 리디렉션 URI를 확인해주세요.';
      case 'Configuration':
        return 'OAuth 설정 오류가 발생했습니다. 환경 변수를 확인해주세요.';
      case 'AccessDenied':
        return '접근이 거부되었습니다. @2weeks.co 도메인 계정만 사용할 수 있습니다.';
      case 'OAuthSignin':
        return 'OAuth 로그인 과정에서 오류가 발생했습니다.';
      case 'OAuthCallback':
        return 'OAuth 콜백 처리 중 오류가 발생했습니다.';
      case 'OAuthCreateAccount':
        return 'OAuth 계정 생성 중 오류가 발생했습니다.';
      case 'EmailCreateAccount':
        return '이메일 계정 생성 중 오류가 발생했습니다.';
      case 'Callback':
        return '콜백 처리 중 오류가 발생했습니다.';
      case 'OAuthAccountNotLinked':
        return 'OAuth 계정이 연결되지 않았습니다.';
      case 'EmailSignin':
        return '이메일 로그인 중 오류가 발생했습니다.';
      case 'CredentialsSignin':
        return '자격 증명 로그인 중 오류가 발생했습니다.';
      case 'SessionRequired':
        return '세션이 필요합니다. 다시 로그인해주세요.';
      default:
        return '인증 중 오류가 발생했습니다.';
    }
  };

  const isDomainRestrictionError = error === 'AccessDenied';

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
            인증 오류
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    오류 코드: {error || 'Unknown'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {isDomainRestrictionError ? (
                      <div>
                        <p>이 애플리케이션은 @2weeks.co 도메인 계정만 사용할 수 있습니다.</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>올바른 @2weeks.co 계정으로 로그인해주세요</li>
                          <li>다른 도메인 계정은 접근이 제한됩니다</li>
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <p>다음 사항을 확인해주세요:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Google Cloud Console에서 OAuth 클라이언트 설정</li>
                          <li>리디렉션 URI: https://mongodb-manager.2weeks.co/api/auth/callback/google</li>
                          <li>환경 변수 설정</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => signOut()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                로그아웃
              </button>
              <Link
                href="/"
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-center"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            로딩 중...
          </h2>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
} 