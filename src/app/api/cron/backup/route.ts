import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoClient } from 'mongodb';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { saveApiHistory } from '@/lib/api-history';

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (user.email && user.email.endsWith('@2weeks.co')) {
        return true;
      }
      return false;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    accessDenied: '/auth/access-denied',
  },
  debug: process.env.NODE_ENV === 'development',
};

const execAsync = promisify(exec);

// MongoDB 인증 정보를 가져오는 함수 (기존 백업 API와 동일)
function getMongoAuthParams() {
  const uri = process.env.MONGODB_URI;
  
  // 환경 변수가 없으면 기본값 사용
  if (!uri) {
    return '--host localhost --port 27017';
  }

  try {
    const url = new URL(uri);
    const username = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port || '27017';
    
    let authParams = `--host ${host} --port ${port}`;
    
    if (username && password) {
      authParams += ` --username ${username} --password ${password}`;
    }
    
    // 인증 데이터베이스가 있으면 추가
    const authSource = url.searchParams.get('authSource') || 'admin';
    authParams += ` --authenticationDatabase ${authSource}`;
    
    return authParams;
  } catch (error) {
    console.error('MongoDB URI 파싱 오류:', error);
    // 파싱 오류 시 기본값 반환
    return '--host localhost --port 27017';
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. 크론잡 호출인지 확인 (User-Agent로 구분)
    const userAgent = request.headers.get('user-agent') || '';
    const isCronCall = userAgent.includes('curl') || 
                      request.headers.get('x-cron-job') === 'true' ||
                      process.env.NODE_ENV === 'development';
    
    // 2. 인증 확인 (크론잡이 아닌 경우에만)
    let session = null;
    if (!isCronCall) {
      session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { success: false, error: '인증이 필요합니다.' },
          { status: 401 }
        );
      }
    }

    // 2. 로컬 호스트 제한 확인 (크론잡은 로컬에서만 실행)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const forwardedHost = request.headers.get('x-forwarded-host');
    
    // 모든 IP 헤더를 확인하여 외부 접근 차단
    const allIPs = [forwardedFor, realIP, forwardedHost].filter(Boolean);
    
    // 로컬 접근만 허용 (127.0.0.1, ::1, localhost)
    const isLocalhost = allIPs.length === 0 || allIPs.every(ip => 
      ip === '127.0.0.1' || 
      ip === '::1' || 
      ip === 'localhost' ||
      ip.includes('127.0.0.1') ||
      ip.includes('localhost')
    );
    
    // 외부 접근 차단
    const hasExternalIP = allIPs.some(ip => 
      ip && !ip.includes('127.0.0.1') && !ip.includes('localhost') && ip !== '::1'
    );
    
    if (!isLocalhost || hasExternalIP) {
      console.error('외부 접근 차단:', { forwardedFor, realIP, forwardedHost, userAgent });
      return NextResponse.json(
        { success: false, error: '크론잡은 로컬 환경에서만 호출 가능합니다.' },
        { status: 403 }
      );
    }

    // 3. 데이터베이스 이름 파라미터 확인
    const { searchParams } = new URL(request.url);
    const databaseName = searchParams.get('database');

    if (!databaseName) {
      return NextResponse.json(
        { success: false, error: '데이터베이스 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    // 4. 데이터베이스 이름 유효성 검사
    if (!/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 데이터베이스 이름입니다.' },
        { status: 400 }
      );
    }

    // 5. 백업 디렉토리 생성
    const projectRoot = path.resolve(process.cwd());
    const backupDir = process.env.BACKUP_DIR || path.join(projectRoot, 'backups');
    const allBackupDir = path.join(backupDir, 'allbackup');
    
    // 전체 백업 디렉토리 생성
    if (!fs.existsSync(allBackupDir)) {
      fs.mkdirSync(allBackupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(allBackupDir, `${databaseName}_${timestamp}`);

    // 6. MongoDB 인증 파라미터 가져오기
    const authParams = getMongoAuthParams();
    

    
    // 8. mongodump 명령어 실행
    const mongodumpCommand = `mongodump ${authParams} --db ${databaseName} --out ${backupPath}`;
    
    try {
      const { stdout, stderr } = await execAsync(mongodumpCommand);
      
      // mongodump는 진행 상황을 stderr로 출력하므로, 실제 오류인지 확인
      if (stderr && !stderr.includes('done dumping') && !stderr.includes('writing') && !stderr.includes('connected to')) {
        console.error('mongodump stderr:', stderr);
        
        // 존재하지 않는 데이터베이스 오류인지 확인
        const isDatabaseNotFound = stderr.includes('doesn\'t exist') || 
                                 stderr.includes('not found') || 
                                 stderr.includes('No database') ||
                                 stderr.includes('Failed to connect');
        
        const errorMessage = isDatabaseNotFound 
          ? `데이터베이스 '${databaseName}'이(가) 존재하지 않습니다.`
          : '백업 실행 중 오류가 발생했습니다.';
        
        // API 히스토리 저장 (실패)
        await saveApiHistory({
          endpoint: '/api/cron/backup',
          method: 'POST',
          database: databaseName,
          action: '크론 백업',
          actionType: 'cron',
          target: `${databaseName} 데이터베이스`,
          status: 'error',
          message: errorMessage,
          userEmail: isCronCall ? 'cron-job' : (session?.user?.email || undefined),
          duration: Date.now() - startTime,
          details: { error: stderr, command: mongodumpCommand, isDatabaseNotFound, isCronCall }
        });
        
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: 500 }
        );
      }

      // 정상적인 출력 메시지도 로그에 기록
      if (stderr) {
        console.log('백업 진행 상황:', stderr);
      }

      // API 히스토리 저장 (성공)
      await saveApiHistory({
        endpoint: '/api/cron/backup',
        method: 'POST',
        database: databaseName,
        action: '크론 백업',
        actionType: 'cron',
        target: `${databaseName} 데이터베이스`,
        status: 'success',
        message: '백업이 성공적으로 완료되었습니다.',
        userEmail: isCronCall ? 'cron-job' : (session?.user?.email || undefined),
        duration: Date.now() - startTime,
        details: { backupPath, command: mongodumpCommand, output: stdout, isCronCall }
      });

      // 8. 백업 완료 응답
      return NextResponse.json({
        success: true,
        message: '백업이 성공적으로 완료되었습니다.',
        database: databaseName,
        timestamp: new Date().toISOString(),
        backupPath: backupPath,
        details: {
          command: mongodumpCommand,
          output: stdout
        }
      });

    } catch (execError) {
      console.error('mongodump 실행 오류:', execError);
      
      // API 히스토리 저장 (실패)
      await saveApiHistory({
        endpoint: '/api/cron/backup',
        method: 'POST',
        database: databaseName,
        action: '크론 백업',
        actionType: 'cron',
        target: `${databaseName} 데이터베이스`,
        status: 'error',
        message: '백업 실행 중 오류가 발생했습니다.',
        userEmail: isCronCall ? 'cron-job' : (session?.user?.email || undefined),
        duration: Date.now() - startTime,
        details: { error: String(execError), command: mongodumpCommand, isCronCall }
      });
      
      return NextResponse.json(
        { success: false, error: '백업 실행 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET 요청도 허용 (테스트용) - 로컬에서만 접근 가능
export async function GET(request: NextRequest) {
  // 로컬 호스트 제한 확인
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const forwardedHost = request.headers.get('x-forwarded-host');
  
  // 모든 IP 헤더를 확인하여 외부 접근 차단
  const allIPs = [forwardedFor, realIP, forwardedHost].filter(Boolean);
  
  // 로컬 접근만 허용 (127.0.0.1, ::1, localhost)
  const isLocalhost = allIPs.length === 0 || allIPs.every(ip => 
    ip === '127.0.0.1' || 
    ip === '::1' || 
    ip === 'localhost' ||
    ip.includes('127.0.0.1') ||
    ip.includes('localhost')
  );
  
  // 외부 접근 차단
  const hasExternalIP = allIPs.some(ip => 
    ip && !ip.includes('127.0.0.1') && !ip.includes('localhost') && ip !== '::1'
  );
  
  if (!isLocalhost || hasExternalIP) {
    console.error('GET 요청 외부 접근 차단:', { forwardedFor, realIP, forwardedHost });
    return NextResponse.json(
      { success: false, error: '크론잡은 로컬 환경에서만 호출 가능합니다.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: '백업 API 엔드포인트가 활성화되어 있습니다.',
    usage: 'POST /api/cron/backup?database=데이터베이스명',
    example: 'POST /api/cron/backup?database=instarsearch'
  });
} 