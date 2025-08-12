export interface ApiHistory {
  _id?: string;
  endpoint: string;
  method: string;
  database?: string;
  collection?: string;
  action: string;
  actionType: 'backup' | 'restore' | 'snapshot' | 'cron' | 'other';
  target: string; // 구체적인 대상 (예: "instarsearch 데이터베이스", "users 컬렉션")
  status: 'success' | 'error';
  message: string;
  timestamp: Date;
  userEmail?: string;
  duration?: number;
  details?: any;
}

export interface ApiHistoryFilters {
  search?: string;
  endpoint?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'timestamp' | 'action' | 'actionType' | 'target' | 'method';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} 