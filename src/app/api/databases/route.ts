import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession();
    
    // if (!session) {
    //   return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    // }

    const client = await clientPromise;
    const adminDb = client.db('admin');
    
    // 데이터베이스 목록 가져오기
    const databases = await adminDb.admin().listDatabases();
    
    const dbList = databases.databases
      .filter(db => !['admin', 'local', 'config'].includes(db.name))
      .map(db => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk,
        empty: db.empty
      }));

    return NextResponse.json({ databases: dbList });
  } catch (error) {
    console.error('데이터베이스 목록 조회 오류:', error);
    return NextResponse.json({ error: '데이터베이스 목록을 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 