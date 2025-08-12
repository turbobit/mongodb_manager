import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 스냅샷 폴더 경로
const SNAPSHOT_DIR = path.join(process.cwd(), 'backups', 'snapshot');

// 폴더 크기 계산 함수
async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return stats.size;
    }

    const files = await fs.readdir(dirPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const fileStats = await fs.stat(filePath);
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

// 디스크 사용량 정보 가져오기
async function getDiskUsage(): Promise<{ total: number; available: number }> {
  try {
    // df 명령어로 디스크 사용량 확인
    const { stdout } = await execAsync(`df -B1 "${SNAPSHOT_DIR}" | tail -1`);
    const parts = stdout.trim().split(/\s+/);
    
    if (parts.length >= 4) {
      const total = parseInt(parts[1], 10);
      const available = parseInt(parts[3], 10);
      return { total, available };
    }
    
    throw new Error('디스크 사용량 정보를 파싱할 수 없습니다.');
  } catch (error) {
    console.error('디스크 사용량 조회 오류:', error);
    // 기본값 반환
    return { total: 0, available: 0 };
  }
}

export async function GET(request: NextRequest) {
  try {
    // 스냅샷 폴더가 존재하는지 확인
    try {
      await fs.access(SNAPSHOT_DIR);
    } catch (error) {
      // 스냅샷 폴더가 없으면 생성
      await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
    }

    // 스냅샷 폴더 크기 계산
    const used = await getDirectorySize(SNAPSHOT_DIR);
    
    // 디스크 전체 사용량 정보 가져오기
    const { total, available } = await getDiskUsage();
    
    // 사용률 계산
    const usagePercentage = total > 0 ? (used / total) * 100 : 0;

    return NextResponse.json({
      used,
      total,
      available,
      usagePercentage: Math.round(usagePercentage * 10) / 10 // 소수점 첫째 자리까지
    });

  } catch (error) {
    console.error('스냅샷 스토리지 정보 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '스냅샷 스토리지 정보를 가져올 수 없습니다.',
        used: 0,
        total: 0,
        available: 0,
        usagePercentage: 0
      },
      { status: 500 }
    );
  }
} 