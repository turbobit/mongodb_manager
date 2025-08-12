import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';
import { generateShortUUIDv7 } from '@/lib/uuid';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// MongoDB 인증 파라미터 가져오기
function getMongoAuthParams(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) return '';
  
  // URI에서 사용자명과 비밀번호 추출
  const match = uri.match(/mongodb:\/\/([^:]+):([^@]+)@/);
  if (match) {
    const [, username, password] = match;
    return `--username ${username} --password ${password}`;
  }
  
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { databaseName, collectionName, snapshotName } = await request.json();
    
    if (!databaseName || !collectionName) {
      return NextResponse.json({ error: '데이터베이스명과 컬렉션명이 필요합니다.' }, { status: 400 });
    }

    // 스냅샷 이름이 비어있으면 UUID v7 생성
    const finalSnapshotName = snapshotName?.trim() || generateShortUUIDv7();

    // 프로젝트 루트 디렉토리 찾기
    const projectRoot = path.resolve(process.cwd());
    const backupDir = process.env.BACKUP_DIR || path.join(projectRoot, 'backups');
    const snapshotDir = path.join(backupDir, 'snapshot');
    
    // 스냅샷 디렉토리 생성
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(snapshotDir, `${databaseName}_${collectionName}_${finalSnapshotName}_${timestamp}`);
    
    // MongoDB 인증 파라미터 가져오기
    const authParams = getMongoAuthParams();
    
    // 특정 컬렉션만 백업
    const command = `mongodump ${authParams} --db ${databaseName} --collection ${collectionName} --out ${snapshotPath}`;

    console.log('스냅샷 생성 명령어:', command);

    const { stderr } = await execAsync(command);
    
    // mongodump는 진행 상황을 stderr로 출력하므로, 실제 오류인지 확인
    if (stderr && !stderr.includes('done dumping') && !stderr.includes('writing') && !stderr.includes('connected to')) {
      console.error('스냅샷 생성 오류:', stderr);
      return NextResponse.json({ error: '스냅샷 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 정상적인 출력 메시지도 로그에 기록
    if (stderr) {
      console.log('스냅샷 생성 진행 상황:', stderr);
    }

    // 스냅샷 완료 후 오래된 스냅샷 정리 (각 컬렉션별 최대 10개 유지)
    await cleanupOldSnapshots(databaseName, collectionName, snapshotDir);

    return NextResponse.json({ 
      success: true, 
      message: `컬렉션 ${collectionName}의 스냅샷 '${finalSnapshotName}'이 생성되었습니다.`,
      snapshotPath: snapshotPath
    });
  } catch (error) {
    console.error('스냅샷 생성 오류:', error);
    return NextResponse.json({ error: '스냅샷 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const databaseName = searchParams.get('database');
    const collectionName = searchParams.get('collection');

    // 프로젝트 루트 디렉토리 찾기
    const projectRoot = path.resolve(process.cwd());
    const backupDir = process.env.BACKUP_DIR || path.join(projectRoot, 'backups');
    const snapshotDir = path.join(backupDir, 'snapshot');
    
    if (!fs.existsSync(snapshotDir)) {
      return NextResponse.json({ snapshots: [] });
    }

    const snapshotFolders = fs.readdirSync(snapshotDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const stats = fs.statSync(path.join(snapshotDir, dirent.name));
        return {
          name: dirent.name,
          createdAt: stats.birthtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 필터링: 특정 데이터베이스와 컬렉션의 스냅샷만 반환
    let filteredSnapshots = snapshotFolders;
    if (databaseName && collectionName) {
      filteredSnapshots = snapshotFolders.filter(snapshot => 
        snapshot.name.startsWith(`${databaseName}_${collectionName}_`)
      );
    }

    // 스냅샷 정보 파싱
    const snapshots = filteredSnapshots.map(snapshot => {
      const parts = snapshot.name.split('_');
      const dbName = parts[0];
      const colName = parts[1];
      const snapshotName = parts[2];
      
      return {
        name: snapshot.name,
        databaseName: dbName,
        collectionName: colName,
        snapshotName: snapshotName,
        createdAt: snapshot.createdAt,
        size: snapshot.size
      };
    });

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error('스냅샷 목록 조회 오류:', error);
    return NextResponse.json({ error: '스냅샷 목록을 가져오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const snapshotName = searchParams.get('name');

    if (!snapshotName) {
      return NextResponse.json({ error: '스냅샷명이 필요합니다.' }, { status: 400 });
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

    // 스냅샷 폴더 삭제
    fs.rmSync(snapshotPath, { recursive: true, force: true });

    return NextResponse.json({ 
      success: true, 
      message: `스냅샷 '${snapshotName}'이 삭제되었습니다.`
    });
  } catch (error) {
    console.error('스냅샷 삭제 오류:', error);
    return NextResponse.json({ error: '스냅샷 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 오래된 스냅샷 정리 함수
async function cleanupOldSnapshots(databaseName: string, collectionName: string, snapshotDir: string) {
  try {
    if (!fs.existsSync(snapshotDir)) {
      return;
    }

    // 해당 데이터베이스와 컬렉션의 스냅샷 폴더들 찾기
    const snapshotFolders = fs.readdirSync(snapshotDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .filter(dirent => dirent.name.startsWith(`${databaseName}_${collectionName}_`))
      .map(dirent => ({
        name: dirent.name,
        path: path.join(snapshotDir, dirent.name),
        createdAt: fs.statSync(path.join(snapshotDir, dirent.name)).birthtime
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // 최신순 정렬

    // 10개 초과하는 오래된 스냅샷 삭제
    if (snapshotFolders.length > 10) {
      const foldersToDelete = snapshotFolders.slice(10);
      
      for (const folder of foldersToDelete) {
        try {
          fs.rmSync(folder.path, { recursive: true, force: true });
          console.log(`오래된 스냅샷 삭제됨: ${folder.name}`);
        } catch (error) {
          console.error(`스냅샷 삭제 실패: ${folder.name}`, error);
        }
      }
      
      console.log(`${databaseName}.${collectionName} 컬렉션의 오래된 스냅샷 ${foldersToDelete.length}개가 정리되었습니다.`);
    }
  } catch (error) {
    console.error('스냅샷 정리 중 오류:', error);
  }
} 