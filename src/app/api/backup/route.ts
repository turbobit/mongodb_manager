import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// MongoDB 인증 정보를 가져오는 함수
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
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { databaseName, collections } = await request.json();
    
    // 프로젝트 루트 디렉토리 찾기 (Next.js API route 기준)
    const projectRoot = path.resolve(process.cwd());
    const backupDir = process.env.BACKUP_DIR || path.join(projectRoot, 'backups');
    
    console.log('현재 작업 디렉토리:', process.cwd());
    console.log('프로젝트 루트:', projectRoot);
    console.log('백업 디렉토리:', backupDir);
    console.log('환경 변수 BACKUP_DIR:', process.env.BACKUP_DIR);
    
    // 백업 디렉토리 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${databaseName}_${timestamp}`);
    
    // MongoDB 인증 파라미터 가져오기
    const authParams = getMongoAuthParams();
    
    let command: string;
    
    if (collections && collections.length > 0) {
      // 특정 컬렉션만 백업
      const collectionArgs = collections.map((col: string) => `--collection ${col}`).join(' ');
      command = `mongodump ${authParams} --db ${databaseName} ${collectionArgs} --out ${backupPath}`;
    } else {
      // 전체 데이터베이스 백업
      command = `mongodump ${authParams} --db ${databaseName} --out ${backupPath}`;
    }

    console.log('실행할 명령어:', command);

    const { stdout, stderr } = await execAsync(command);
    
    // mongodump는 진행 상황을 stderr로 출력하므로, 실제 오류인지 확인
    if (stderr && !stderr.includes('done dumping') && !stderr.includes('writing') && !stderr.includes('connected to')) {
      console.error('백업 오류:', stderr);
      return NextResponse.json({ error: '백업 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 정상적인 출력 메시지도 로그에 기록
    if (stderr) {
      console.log('백업 진행 상황:', stderr);
    }

    return NextResponse.json({ 
      success: true, 
      message: '백업이 완료되었습니다.',
      backupPath: backupPath
    });
  } catch (error) {
    console.error('백업 API 오류:', error);
    return NextResponse.json({ error: '백업 요청을 처리하는데 실패했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const backupDir = process.env.BACKUP_DIR || path.join(path.resolve(process.cwd()), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [] });
    }

    const backups = fs.readdirSync(backupDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const stats = fs.statSync(path.join(backupDir, dirent.name));
        return {
          name: dirent.name,
          createdAt: stats.birthtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('백업 목록 조회 오류:', error);
    return NextResponse.json({ error: '백업 목록을 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 