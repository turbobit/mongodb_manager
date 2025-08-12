import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getApiHistory, getApiHistoryStats } from '@/lib/api-history';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const filters = {
      search: searchParams.get('search') || undefined,
      endpoint: searchParams.get('endpoint') || undefined,
      method: searchParams.get('method') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      sortBy: (searchParams.get('sortBy') as 'timestamp' | 'endpoint' | 'method' | 'status') || 'timestamp',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    // 통계 요청인지 확인
    const includeStats = searchParams.get('stats') === 'true';

    const result = await getApiHistory(filters);
    
    if (includeStats) {
      const stats = await getApiHistoryStats();
      return NextResponse.json({
        ...result,
        stats
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API 히스토리 조회 오류:', error);
    return NextResponse.json(
      { error: 'API 히스토리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 