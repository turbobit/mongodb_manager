import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const databaseName = searchParams.get('database');

    if (!databaseName) {
      return NextResponse.json({ error: '데이터베이스명이 필요합니다.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(databaseName);
    
    // 컬렉션 목록 가져오기
    const collections = await db.listCollections().toArray();
    
    // 각 컬렉션의 크기 정보 가져오기
    const collectionList = await Promise.all(
      collections.map(async (col) => {
        try {
          const collection = db.collection(col.name);
          const stats = await collection.stats();
          return {
            name: col.name,
            type: col.type || 'collection',
            size: stats.size || 0,
            storageSize: stats.storageSize || 0,
            count: stats.count || 0
          };
        } catch (error) {
          console.error(`컬렉션 ${col.name} 통계 조회 오류:`, error);
          return {
            name: col.name,
            type: col.type || 'collection',
            size: 0,
            storageSize: 0,
            count: 0
          };
        }
      })
    );

    return NextResponse.json({ collections: collectionList });
  } catch (error) {
    console.error('컬렉션 목록 조회 오류:', error);
    return NextResponse.json({ error: '컬렉션 목록을 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 