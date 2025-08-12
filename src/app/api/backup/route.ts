import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { saveApiHistory } from '@/lib/api-history';

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
  const startTime = Date.now();
  
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { databaseName } = await request.json();
    
    // 프로젝트 루트 디렉토리 찾기 (Next.js API route 기준)
    const projectRoot = path.resolve(process.cwd());
    const backupDir = process.env.BACKUP_DIR || path.join(projectRoot, 'backups');
    const allBackupDir = path.join(backupDir, 'allbackup');
    
    console.log('현재 작업 디렉토리:', process.cwd());
    console.log('프로젝트 루트:', projectRoot);
    console.log('백업 디렉토리:', backupDir);
    console.log('전체 백업 디렉토리:', allBackupDir);
    console.log('환경 변수 BACKUP_DIR:', process.env.BACKUP_DIR);
    
    // 전체 백업 디렉토리 생성
    if (!fs.existsSync(allBackupDir)) {
      fs.mkdirSync(allBackupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(allBackupDir, `${databaseName}_${timestamp}`);
    
    // MongoDB 인증 파라미터 가져오기
    const authParams = getMongoAuthParams();
    

    
    // 전체 데이터베이스 백업
    const command = `mongodump ${authParams} --db ${databaseName} --out ${backupPath}`;

    console.log('실행할 명령어:', command);

    const { stdout, stderr } = await execAsync(command);
    
    // mongodump는 진행 상황을 stderr로 출력하므로, 실제 오류인지 확인
    if (stderr && !stderr.includes('done dumping') && !stderr.includes('writing') && !stderr.includes('connected to')) {
      console.error('백업 오류:', stderr);
      
      // 존재하지 않는 데이터베이스 오류인지 확인
      const isDatabaseNotFound = stderr.includes('doesn\'t exist') || 
                               stderr.includes('not found') || 
                               stderr.includes('No database') ||
                               stderr.includes('Failed to connect');
      
      const errorMessage = isDatabaseNotFound 
        ? `데이터베이스 '${databaseName}'이(가) 존재하지 않습니다.`
        : '백업 중 오류가 발생했습니다.';
      
      // API 히스토리 저장 (실패)
      await saveApiHistory({
        endpoint: '/api/backup',
        method: 'POST',
        database: databaseName,
        action: '전체 백업',
        actionType: 'backup',
        target: `${databaseName} 데이터베이스`,
        status: 'error',
        message: errorMessage,
        userEmail: session.user?.email || undefined,
        duration: Date.now() - startTime,
        details: { error: stderr, isDatabaseNotFound }
      });
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // 정상적인 출력 메시지도 로그에 기록
    if (stderr) {
      console.log('백업 진행 상황:', stderr);
    }

    // 백업 완료 후 오래된 백업 정리 (각 데이터베이스별 최대 7개 유지)
    await cleanupOldBackups(databaseName, allBackupDir);

    // API 히스토리 저장 (성공)
    await saveApiHistory({
      endpoint: '/api/backup',
      method: 'POST',
      database: databaseName,
      action: '전체 백업',
      actionType: 'backup',
      target: `${databaseName} 데이터베이스`,
      status: 'success',
      message: '백업이 완료되었습니다.',
      userEmail: session.user?.email || undefined,
      duration: Date.now() - startTime,
      details: { backupPath }
    });

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

// 폴더 크기 계산 함수
async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const stats = await fs.promises.stat(dirPath);
    if (!stats.isDirectory()) {
      return stats.size;
    }

    const files = await fs.promises.readdir(dirPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const fileStats = await fs.promises.stat(filePath);
        if (fileStats.isDirectory()) {
          totalSize += await getDirectorySize(filePath);
        } else {
          totalSize += fileStats.size;
        }
      } catch (error) {
        console.error(`파일 크기 계산 오류 (${filePath}):`, error);
      }
    }

    return totalSize;
  } catch (error) {
    console.error(`디렉토리 크기 계산 오류 (${dirPath}):`, error);
    return 0;
  }
}

// 오래된 백업 정리 함수
async function cleanupOldBackups(databaseName: string, backupDir: string) {
  try {
    if (!fs.existsSync(backupDir)) {
      return;
    }

    // 해당 데이터베이스의 백업 폴더들 찾기
    const backupFolders = fs.readdirSync(backupDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .filter(dirent => dirent.name.startsWith(`${databaseName}_`))
      .map(dirent => ({
        name: dirent.name,
        path: path.join(backupDir, dirent.name),
        createdAt: fs.statSync(path.join(backupDir, dirent.name)).birthtime
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // 최신순 정렬

    // 7개 초과하는 오래된 백업 삭제
    if (backupFolders.length > 7) {
      const foldersToDelete = backupFolders.slice(7);
      
      for (const folder of foldersToDelete) {
        try {
          fs.rmSync(folder.path, { recursive: true, force: true });
          console.log(`오래된 백업 삭제됨: ${folder.name}`);
        } catch (error) {
          console.error(`백업 삭제 실패: ${folder.name}`, error);
        }
      }
      
      console.log(`${databaseName} 데이터베이스의 오래된 백업 ${foldersToDelete.length}개가 정리되었습니다.`);
    }
  } catch (error) {
    console.error('백업 정리 중 오류:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const backupDir = process.env.BACKUP_DIR || path.join(path.resolve(process.cwd()), 'backups');
    const allBackupDir = path.join(backupDir, 'allbackup');
    
    if (!fs.existsSync(allBackupDir)) {
      return NextResponse.json({ backups: [], backupStats: {} });
    }

    const backupFoldersData = fs.readdirSync(allBackupDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const stats = fs.statSync(path.join(allBackupDir, dirent.name));
        return {
          name: dirent.name,
          path: path.join(allBackupDir, dirent.name),
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 각 백업 폴더의 실제 크기 계산
    const backupFolders = await Promise.all(
      backupFoldersData.map(async (backup) => {
        const size = await getDirectorySize(backup.path);
        return {
          name: backup.name,
          createdAt: backup.createdAt,
          size: size
        };
      })
    );

    // 데이터베이스별로 백업 그룹화
    const backupStats: { [database: string]: { total: number; kept: number; deleted: number } } = {};
    
    backupFolders.forEach(backup => {
      // 백업 이름에서 데이터베이스명 추출 (예: test_2025-08-11T07-26-28-116Z -> test)
      const databaseName = backup.name.split('_')[0];
      
      if (!backupStats[databaseName]) {
        backupStats[databaseName] = { total: 0, kept: 0, deleted: 0 };
      }
      
      backupStats[databaseName].total++;
      
      // 각 데이터베이스별로 최대 7개만 유지
      if (backupStats[databaseName].kept < 7) {
        backupStats[databaseName].kept++;
      } else {
        backupStats[databaseName].deleted++;
      }
    });

    return NextResponse.json({ 
      backups: backupFolders,
      backupStats,
      maxBackupsPerDatabase: 7
    });
  } catch (error) {
    console.error('백업 목록 조회 오류:', error);
    return NextResponse.json({ error: '백업 목록을 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 