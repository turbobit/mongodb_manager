import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import clientPromise from '@/lib/mongodb';
import * as os from 'os';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const client = await clientPromise;
    const adminDb = client.db('admin');
    
    // 데이터베이스 목록 가져오기
    const databases = await adminDb.admin().listDatabases();
    
    // 시스템 데이터베이스 제외
    const userDatabases = databases.databases.filter(db => 
      !['admin', 'local', 'config'].includes(db.name)
    );
    
    // 총 크기 계산
    const totalSize = userDatabases.reduce((sum, db) => sum + (db.sizeOnDisk || 0), 0);
    
    // 서버 상태 확인
    let serverStatus: 'connected' | 'disconnected' | 'error' = 'connected';
    let activeConnections = 0;
    let serverInfo = {
      version: 'Unknown',
      uptime: 0,
      memory: {
        resident: 0,
        virtual: 0,
        mapped: 0,
        mappedWithJournal: 0,
        totalSystemMemory: 0
      },
      connections: {
        current: 0,
        available: 0,
        active: 0,
        inactive: 0
      },
      operations: {
        insert: 0,
        query: 0,
        update: 0,
        delete: 0,
        getmore: 0,
        command: 0
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        numRequests: 0
      },
      opLatencies: {
        reads: 0,
        writes: 0,
        commands: 0
      }
    };
    
    try {
      // 서버 상태 정보 가져오기
      const serverStatusResult = await adminDb.command({ serverStatus: 1 });
      activeConnections = serverStatusResult.connections?.current || 0;
      
      serverInfo = {
        version: serverStatusResult.version || 'Unknown',
        uptime: serverStatusResult.uptime || 0,
        memory: {
          resident: (serverStatusResult.mem?.resident || 0) * 1024 * 1024, // MB to bytes
          virtual: (serverStatusResult.mem?.virtual || 0) * 1024 * 1024, // MB to bytes
          mapped: (serverStatusResult.mem?.mapped || 0) * 1024 * 1024, // MB to bytes
          mappedWithJournal: (serverStatusResult.mem?.mappedWithJournal || 0) * 1024 * 1024, // MB to bytes
          totalSystemMemory: os.totalmem() // 시스템 전체 메모리
        },
        connections: {
          current: serverStatusResult.connections?.current || 0,
          available: serverStatusResult.connections?.available || 0,
          active: serverStatusResult.connections?.active || 0,
          inactive: serverStatusResult.connections?.inactive || 0
        },
        operations: {
          insert: serverStatusResult.opcounters?.insert || 0,
          query: serverStatusResult.opcounters?.query || 0,
          update: serverStatusResult.opcounters?.update || 0,
          delete: serverStatusResult.opcounters?.delete || 0,
          getmore: serverStatusResult.opcounters?.getmore || 0,
          command: serverStatusResult.opcounters?.command || 0
        },
        network: {
          bytesIn: serverStatusResult.network?.bytesIn || 0,
          bytesOut: serverStatusResult.network?.bytesOut || 0,
          numRequests: serverStatusResult.network?.numRequests || 0
        },
        opLatencies: {
          reads: serverStatusResult.opLatencies?.reads?.latency || 0,
          writes: serverStatusResult.opLatencies?.writes?.latency || 0,
          commands: serverStatusResult.opLatencies?.commands?.latency || 0
        }
      };
    } catch (error) {
      serverStatus = 'error';
      console.error('서버 상태 조회 오류:', error);
    }

    // 각 데이터베이스의 컬렉션 수 가져오기
    const databasesWithCollections = await Promise.all(
      userDatabases.map(async (db) => {
        try {
          const dbInstance = client.db(db.name);
          const collections = await dbInstance.listCollections().toArray();
          return {
            name: db.name,
            sizeOnDisk: db.sizeOnDisk || 0,
            empty: db.empty || false,
            collections: collections.length
          };
        } catch (error) {
          console.error(`데이터베이스 ${db.name} 컬렉션 조회 오류:`, error);
          return {
            name: db.name,
            sizeOnDisk: db.sizeOnDisk || 0,
            empty: db.empty || false,
            collections: 0
          };
        }
      })
    );

    const status = {
      totalDatabases: userDatabases.length,
      totalSize: totalSize,
      activeConnections: activeConnections,
      serverStatus: serverStatus,
      lastUpdate: new Date(),
      databases: databasesWithCollections,
      serverInfo: serverInfo
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('데이터베이스 상태 조회 오류:', error);
    return NextResponse.json({ 
      error: '데이터베이스 상태를 가져오는데 실패했습니다.',
      serverStatus: 'error',
      lastUpdate: new Date(),
      totalDatabases: 0,
      totalSize: 0,
      activeConnections: 0,
      databases: [],
      serverInfo: {
        version: 'Unknown',
        uptime: 0,
        memory: { 
          resident: 0, 
          virtual: 0, 
          mapped: 0, 
          mappedWithJournal: 0,
          totalSystemMemory: os.totalmem()
        },
        connections: { 
          current: 0, 
          available: 0, 
          active: 0, 
          inactive: 0 
        },
        operations: {
          insert: 0,
          query: 0,
          update: 0,
          delete: 0,
          getmore: 0,
          command: 0
        },
        network: {
          bytesIn: 0,
          bytesOut: 0,
          numRequests: 0
        },
        opLatencies: {
          reads: 0,
          writes: 0,
          commands: 0
        }
      }
    }, { status: 500 });
  }
} 