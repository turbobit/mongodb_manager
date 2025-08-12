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

    const { backupName, databaseName } = await request.json();
    
    if (!backupName || !databaseName) {
      return NextResponse.json({ error: '백업명과 데이터베이스명이 필요합니다.' }, { status: 400 });
    }

    const backupDir = process.env.BACKUP_DIR || path.join(path.resolve(process.cwd()), 'backups');
    const allBackupDir = path.join(backupDir, 'allbackup');
    const backupPath = path.join(allBackupDir, backupName);
    
    // 백업 폴더가 존재하는지 확인
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: '백업을 찾을 수 없습니다.' }, { status: 404 });
    }

    // MongoDB 인증 파라미터 가져오기
    const authParams = getMongoAuthParams();

    // 복원 시작 시간 기록
    const restoreStartTime = new Date();
    console.log(`[${restoreStartTime.toISOString()}] 복원 작업 시작: ${databaseName} 데이터베이스를 백업 '${backupName}'에서 복원`);

    // 기존 데이터베이스 삭제 후 복원
    const dropCommand = `mongosh ${authParams} --eval "use ${databaseName}; db.dropDatabase();"`;
    const restoreCommand = `mongorestore ${authParams} --drop --nsInclude ${databaseName}.* ${backupPath}`;
    
    console.log('데이터베이스 삭제 명령어:', dropCommand);
    console.log('복원 명령어:', restoreCommand);

    // 기존 데이터베이스 삭제 시작
    const dropStartTime = new Date();
    console.log(`[${dropStartTime.toISOString()}] 데이터베이스 삭제 시작: ${databaseName}`);
    
    const { stderr: dropError } = await execAsync(dropCommand);
    
    const dropEndTime = new Date();
    const dropDuration = dropEndTime.getTime() - dropStartTime.getTime();
    console.log(`[${dropEndTime.toISOString()}] 데이터베이스 삭제 완료: ${databaseName} (소요시간: ${dropDuration}ms)`);
    
    if (dropError && !dropError.includes('ok') && !dropError.includes('connected to')) {
      console.error('데이터베이스 삭제 오류:', dropError);
      return NextResponse.json({ error: '기존 데이터베이스 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 백업에서 복원 시작
    const restoreProcessStartTime = new Date();
    console.log(`[${restoreProcessStartTime.toISOString()}] 백업 복원 프로세스 시작: ${backupName}`);
    
    const { stderr: restoreError } = await execAsync(restoreCommand);
    
    const restoreProcessEndTime = new Date();
    const restoreProcessDuration = restoreProcessEndTime.getTime() - restoreProcessStartTime.getTime();
    console.log(`[${restoreProcessEndTime.toISOString()}] 백업 복원 프로세스 완료 (소요시간: ${restoreProcessDuration}ms)`);
    
    if (restoreError && 
        !restoreError.includes('done') && 
        !restoreError.includes('finished') &&
        !restoreError.includes('restoring') && 
        !restoreError.includes('connected to') &&
        !restoreError.includes('document(s) restored successfully') &&
        !restoreError.includes('no indexes to restore')) {
      console.error('복원 오류:', restoreError);
      return NextResponse.json({ error: '백업 복원 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 정상적인 출력 메시지도 로그에 기록
    if (restoreError) {
      console.log('복원 진행 상황:', restoreError);
    }

    // 전체 복원 작업 완료
    const restoreEndTime = new Date();
    const totalRestoreDuration = restoreEndTime.getTime() - restoreStartTime.getTime();
    console.log(`[${restoreEndTime.toISOString()}] 복원 작업 완료: ${databaseName} 데이터베이스 (총 소요시간: ${totalRestoreDuration}ms)`);
    console.log(`복원 통계: 삭제시간=${dropDuration}ms, 복원시간=${restoreProcessDuration}ms, 총시간=${totalRestoreDuration}ms`);

    return NextResponse.json({ 
      success: true, 
      message: `데이터베이스 ${databaseName}이(가) 백업 '${backupName}'에서 복원되었습니다.`
    });
  } catch (error) {
    console.error('백업 복원 API 오류:', error);
    return NextResponse.json({ error: '백업 복원 요청을 처리하는데 실패했습니다.' }, { status: 500 });
  }
} 