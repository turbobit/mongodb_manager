import clientPromise from './mongodb';
import { ApiHistory, ApiHistoryFilters } from '@/types/api-history';

const DATABASE_NAME = 'mongodb_manager';
const COLLECTION_NAME = 'api_history';

export async function saveApiHistory(history: Omit<ApiHistory, '_id' | 'timestamp'>) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const historyDoc = {
      ...history,
      timestamp: new Date(),
    };

    const result = await collection.insertOne(historyDoc);
    return result;
  } catch (error) {
    console.error('API 히스토리 저장 오류:', error);
    throw error;
  }
}

export async function getApiHistory(filters: ApiHistoryFilters = {}) {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // 필터 조건 구성
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { endpoint: { $regex: filters.search, $options: 'i' } },
        { action: { $regex: filters.search, $options: 'i' } },
        { actionType: { $regex: filters.search, $options: 'i' } },
        { target: { $regex: filters.search, $options: 'i' } },
        { message: { $regex: filters.search, $options: 'i' } },
        { database: { $regex: filters.search, $options: 'i' } },
        { collection: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.endpoint) {
      query.endpoint = { $regex: filters.endpoint, $options: 'i' };
    }

    if (filters.method) {
      query.actionType = filters.method;
    }



    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate + 'T23:59:59.999Z');
      }
    }

    // 정렬 조건
    const sortOptions: any = {};
    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder || 'desc';
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 페이지네이션
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // 전체 개수 조회
    const totalCount = await collection.countDocuments(query);

    // 데이터 조회
    const cursor = collection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const history = await cursor.toArray();

    return {
      history,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error('API 히스토리 조회 오류:', error);
    throw error;
  }
}

export async function getApiHistoryStats() {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          successCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          errorCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]).toArray();

    const endpointStats = await collection.aggregate([
      {
        $group: {
          _id: '$endpoint',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    return {
      overall: stats[0] || {
        totalCalls: 0,
        successCalls: 0,
        errorCalls: 0,
        avgDuration: 0
      },
      topEndpoints: endpointStats
    };
  } catch (error) {
    console.error('API 히스토리 통계 조회 오류:', error);
    throw error;
  }
} 