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
    
    // 현재 컬렉션의 모든 데이터를 가져와서 스냅샷 컬렉션에 저장
    const documents = await collection.find({}).toArray();
    
    if (documents.length === 0) {
      return NextResponse.json({ error: '스냅샷할 데이터가 없습니다.' }, { status: 400 });
    }

    // 스냅샷 컬렉션 생성 (스냅샷명을 포함한 컬렉션명)
    const snapshotCollectionName = `${collectionName}_snapshot_${snapshotName}`;
    const snapshotCollection = db.collection(snapshotCollectionName);
    
    // 기존 스냅샷이 있다면 삭제
    await snapshotCollection.drop().catch(() => {});
    
    // 새 스냅샷 생성
    if (documents.length > 0) {
      await snapshotCollection.insertMany(documents);
    }

    return NextResponse.json({ 
      success: true, 
      message: `컬렉션 ${collectionName}의 스냅샷 '${snapshotName}'이 생성되었습니다.`,
      snapshotCollection: snapshotCollectionName,
      documentCount: documents.length
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

    if (!databaseName || !collectionName) {
      return NextResponse.json({ error: '데이터베이스명과 컬렉션명이 필요합니다.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(databaseName);
    
    // 스냅샷 컬렉션 목록 조회
    const collections = await db.listCollections().toArray();
    const snapshotCollections = collections
      .filter(col => col.name.startsWith(`${collectionName}_snapshot_`))
      .map(col => ({
        name: col.name,
        snapshotName: col.name.replace(`${collectionName}_snapshot_`, ''),
        createdAt: col.options?.createdAt || new Date()
      }));

    return NextResponse.json({ snapshots: snapshotCollections });
  } catch (error) {
    console.error('스냅샷 목록 조회 오류:', error);
    return NextResponse.json({ error: '스냅샷 목록을 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 