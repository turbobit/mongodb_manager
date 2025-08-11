import { MongoClient } from 'mongodb';

// 환경 변수가 없으면 기본값 사용
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mongodb_manager';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서는 전역 변수를 사용하여 연결을 재사용
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  // 프로덕션 환경에서는 새로운 연결
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise; 