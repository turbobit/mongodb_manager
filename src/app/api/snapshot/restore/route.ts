import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
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

    const { snapshotName, databaseName, collectionName } = await request.json();
    
    if (!snapshotName || !databaseName || !collectionName) {
      return NextResponse.json({ error: '스냅샷명, 데이터베이스명, 컬렉션명이 필요합니다.' }, { status: 400 });
    }

    // 프로젝트 루트 디렉토리 찾기
    const projectRoot = path.resolve(process.cwd());
    const backupDir = process.env.BACKUP_DIR || path.join(projectRoot, 'backups');
    const snapshotDir = path.join(backupDir, 'snapshot');
    const snapshotPath = path.join(snapshotDir, snapshotName);
    
    // 스냅샷 폴더가 존재하는지 확인
    if (!fs.existsSync(snapshotPath)) {
      return NextResponse.json({ error: '스냅샷을 찾을 수 없습니다.' }, { status: 404 });
    }

    // MongoDB 인증 파라미터 가져오기
    const authParams = getMongoAuthParams();

    // 복원 시작 시간 기록
    const totalStartTime = new Date();
    console.log(`[${totalStartTime.toISOString()}] 스냅샷 복원 작업 시작: ${databaseName}.${collectionName} 컬렉션을 스냅샷 '${snapshotName}'에서 복원`);

    // 기존 컬렉션 삭제 후 복원
    const dropCommand = `mongosh ${authParams} --eval "use ${databaseName}; db.${collectionName}.drop();"`;
    const restoreCommand = `mongorestore ${authParams} --drop --nsInclude ${databaseName}.${collectionName} ${snapshotPath}`;
    
    console.log('컬렉션 삭제 명령어:', dropCommand);
    console.log('복원 명령어:', restoreCommand);

    // 기존 컬렉션 삭제 시작
    const dropStartTime = new Date();
    console.log(`[${dropStartTime.toISOString()}] 컬렉션 삭제 시작: ${databaseName}.${collectionName}`);
    
    const { stderr: dropError } = await execAsync(dropCommand);
    
    const dropEndTime = new Date();
    const dropDuration = dropEndTime.getTime() - dropStartTime.getTime();
    console.log(`[${dropEndTime.toISOString()}] 컬렉션 삭제 완료 (소요시간: ${dropDuration}ms)`);
    
    // mongosh는 오류가 있어도 성공적으로 처리될 수 있으므로, 실제 복원 명령어 실행
    const restoreStartTime = new Date();
    console.log(`[${restoreStartTime.toISOString()}] 스냅샷 복원 시작: ${snapshotName}`);
    
    const { stderr: restoreError } = await execAsync(restoreCommand);
    
    const restoreEndTime = new Date();
    const restoreDuration = restoreEndTime.getTime() - restoreStartTime.getTime();
    console.log(`[${restoreEndTime.toISOString()}] 스냅샷 복원 완료 (소요시간: ${restoreDuration}ms)`);
    
    // mongorestore는 진행 상황을 stderr로 출력하므로, 실제 오류인지 확인
    if (restoreError && 
        !restoreError.includes('done restoring') && 
        !restoreError.includes('finished restoring') &&
        !restoreError.includes('writing') && 
        !restoreError.includes('connected to') &&
        !restoreError.includes('document(s) restored successfully') &&
        !restoreError.includes('no indexes to restore')) {
      console.error('스냅샷 복원 오류:', restoreError);
      
      // API 히스토리 저장 (실패)
      await saveApiHistory({
        endpoint: '/api/snapshot/restore',
        method: 'POST',
        database: databaseName,
        collection: collectionName,
        action: '스냅샷 복원',
        actionType: 'restore',
        target: `${databaseName}.${collectionName} 컬렉션 (${snapshotName} 스냅샷에서)`,
        status: 'error',
        message: '스냅샷 복원 중 오류가 발생했습니다.',
        userEmail: session.user?.email || undefined,
        duration: Date.now() - startTime,
        details: { error: restoreError, snapshotName }
      });
      
      return NextResponse.json({ error: '스냅샷 복원 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 정상적인 출력 메시지도 로그에 기록
    if (restoreError) {
      console.log('스냅샷 복원 진행 상황:', restoreError);
    }

    const totalDuration = restoreEndTime.getTime() - totalStartTime.getTime();
    console.log(`[${restoreEndTime.toISOString()}] 스냅샷 복원 작업 완료 (총 소요시간: ${totalDuration}ms)`);

    // API 히스토리 저장 (성공)
    await saveApiHistory({
      endpoint: '/api/snapshot/restore',
      method: 'POST',
      database: databaseName,
      collection: collectionName,
      action: '스냅샷 복원',
      actionType: 'restore',
      target: `${databaseName}.${collectionName} 컬렉션 (${snapshotName} 스냅샷에서)`,
      status: 'success',
      message: `컬렉션 ${collectionName}이(가) 스냅샷 '${snapshotName}'으로 복원되었습니다.`,
      userEmail: session.user?.email || undefined,
      duration: Date.now() - startTime,
      details: { 
        snapshotName, 
        dropDuration, 
        restoreDuration, 
        totalDuration 
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `컬렉션 ${collectionName}이(가) 스냅샷 '${snapshotName}'으로 복원되었습니다.`,
      restoreDuration: totalDuration
    });
  } catch (error) {
    console.error('스냅샷 복원 오류:', error);
    return NextResponse.json({ error: '스냅샷 복원 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 