import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { exec } from 'child_process';
import { promisify } from 'util';

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

    const { sourceDatabase, targetDatabase } = await request.json();
    
    if (!sourceDatabase || !targetDatabase) {
      return NextResponse.json({ error: '소스 데이터베이스와 타겟 데이터베이스 이름이 필요합니다.' }, { status: 400 });
    }

    // MongoDB 인증 파라미터 가져오기
    const authParams = getMongoAuthParams();

    // mongodump로 소스 데이터베이스 백업
    const tempBackupPath = `/tmp/${sourceDatabase}_clone_${Date.now()}`;
    const dumpCommand = `mongodump ${authParams} --db ${sourceDatabase} --out ${tempBackupPath}`;
    
    console.log('백업 명령어:', dumpCommand);
    
    const { stderr: dumpError } = await execAsync(dumpCommand);
    if (dumpError && !dumpError.includes('done dumping') && !dumpError.includes('writing') && !dumpError.includes('connected to')) {
      console.error('백업 오류:', dumpError);
      return NextResponse.json({ error: '소스 데이터베이스 백업 중 오류가 발생했습니다.' }, { status: 500 });
    }
    
    // 정상적인 출력 메시지도 로그에 기록
    if (dumpError) {
      console.log('백업 진행 상황:', dumpError);
    }

    // mongorestore로 타겟 데이터베이스에 복원
    const restoreCommand = `mongorestore ${authParams} --db ${targetDatabase} ${tempBackupPath}/${sourceDatabase}`;
    
    console.log('복원 명령어:', restoreCommand);
    
    const { stderr: restoreError } = await execAsync(restoreCommand);
    if (restoreError && 
        !restoreError.includes('done') && 
        !restoreError.includes('finished') &&
        !restoreError.includes('restoring') && 
        !restoreError.includes('connected to') &&
        !restoreError.includes('document(s) restored successfully') &&
        !restoreError.includes('no indexes to restore')) {
      console.error('복원 오류:', restoreError);
      return NextResponse.json({ error: '타겟 데이터베이스 복원 중 오류가 발생했습니다.' }, { status: 500 });
    }
    
    // 정상적인 출력 메시지도 로그에 기록
    if (restoreError) {
      console.log('복원 진행 상황:', restoreError);
    }

    // 임시 백업 파일 정리
    await execAsync(`rm -rf ${tempBackupPath}`);

    return NextResponse.json({ 
      success: true, 
      message: `데이터베이스 ${sourceDatabase}이(가) ${targetDatabase}로 복제되었습니다.`
    });
  } catch (error) {
    console.error('데이터베이스 복제 오류:', error);
    return NextResponse.json({ error: '데이터베이스 복제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 