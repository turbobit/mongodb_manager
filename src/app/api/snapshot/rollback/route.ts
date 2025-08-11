import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { databaseName, collectionName, snapshotName } = await request.json();
    
    if (!databaseName || !collectionName || !snapshotName) {
      return NextResponse.json({ error: '데이터베이스명, 컬렉션명, 스냅샷명이 필요합니다.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(databaseName);
    const collection = db.collection(collectionName);
    const snapshotCollectionName = `${collectionName}_snapshot_${snapshotName}`;
    const snapshotCollection = db.collection(snapshotCollectionName);
    
    // 스냅샷 컬렉션이 존재하는지 확인
    const snapshotExists = await db.listCollections({ name: snapshotCollectionName }).hasNext();
    if (!snapshotExists) {
      return NextResponse.json({ error: '지정된 스냅샷을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 스냅샷 데이터 가져오기
    const snapshotDocuments = await snapshotCollection.find({}).toArray();
    
    if (snapshotDocuments.length === 0) {
      return NextResponse.json({ error: '스냅샷에 데이터가 없습니다.' }, { status: 400 });
    }

    // 현재 컬렉션의 모든 데이터 삭제
    await collection.deleteMany({});
    
    // 스냅샷 데이터로 복원
    await collection.insertMany(snapshotDocuments);

    return NextResponse.json({ 
      success: true, 
      message: `컬렉션 ${collectionName}이(가) 스냅샷 '${snapshotName}'으로 롤백되었습니다.`,
      restoredDocumentCount: snapshotDocuments.length
    });
  } catch (error) {
    console.error('스냅샷 롤백 오류:', error);
    return NextResponse.json({ error: '스냅샷 롤백 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 