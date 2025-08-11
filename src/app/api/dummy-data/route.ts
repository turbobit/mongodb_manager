import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { databaseName, collectionName, count = 100, dataType = 'users' } = await request.json();
    
    if (!databaseName || !collectionName) {
      return NextResponse.json({ error: '데이터베이스명과 컬렉션명이 필요합니다.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    // 더미 데이터 생성 함수
    const generateDummyData = (type: string, count: number) => {
      const data = [];
      
      for (let i = 0; i < count; i++) {
        switch (type) {
          case 'users':
            data.push({
              id: i + 1,
              name: `사용자${i + 1}`,
              email: `user${i + 1}@example.com`,
              age: Math.floor(Math.random() * 50) + 18,
              createdAt: new Date(),
              isActive: Math.random() > 0.3
            });
            break;
          case 'products':
            data.push({
              id: i + 1,
              name: `상품${i + 1}`,
              price: Math.floor(Math.random() * 10000) + 1000,
              category: ['전자제품', '의류', '식품', '도서'][Math.floor(Math.random() * 4)],
              stock: Math.floor(Math.random() * 100),
              createdAt: new Date()
            });
            break;
          case 'orders':
            data.push({
              id: i + 1,
              customerId: Math.floor(Math.random() * 100) + 1,
              totalAmount: Math.floor(Math.random() * 100000) + 10000,
              status: ['대기중', '처리중', '완료', '취소'][Math.floor(Math.random() * 4)],
              items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
                productId: Math.floor(Math.random() * 100) + 1,
                quantity: Math.floor(Math.random() * 10) + 1,
                price: Math.floor(Math.random() * 10000) + 1000
              })),
              createdAt: new Date()
            });
            break;
          default:
            data.push({
              id: i + 1,
              title: `항목${i + 1}`,
              description: `이것은 ${i + 1}번째 항목입니다.`,
              value: Math.random() * 1000,
              createdAt: new Date()
            });
        }
      }
      
      return data;
    };

    const dummyData = generateDummyData(dataType, count);
    
    // 컬렉션이 존재하지 않으면 생성
    await collection.insertMany(dummyData);

    return NextResponse.json({ 
      success: true, 
      message: `${count}개의 ${dataType} 더미 데이터가 생성되었습니다.`,
      database: databaseName,
      collection: collectionName,
      insertedCount: dummyData.length
    });
  } catch (error) {
    console.error('더미 데이터 생성 오류:', error);
    return NextResponse.json({ error: '더미 데이터 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 