# MongoDB 관리자

MongoDB 데이터베이스를 효율적으로 관리하고 백업하는 Next.js 기반 웹 애플리케이션입니다.

## 주요 기능

### 🔐 인증 시스템
- Google OAuth를 통한 로그인 (2weeks.co 도메인 제한)
- 세션 기반 인증 관리
- 모든 API 엔드포인트에 인증 필수 적용

### 🗄️ 데이터베이스 관리
- MongoDB 데이터베이스 목록 조회
- 데이터베이스 크기 및 상태 확인
- 데이터베이스 복제 기능
- 실시간 서버 상태 모니터링
- 컬렉션별 상세 정보 조회

### 💾 백업 관리
- 전체 데이터베이스 백업
- 백업 히스토리 관리
- 백업 파일 크기 및 생성일 확인
- 백업 복원 기능 (기존 데이터 삭제 후 복원)
- 자동 백업 정리 (데이터베이스별 최대 7개 유지)

### 📸 스냅샷 & 롤백
- 컬렉션 스냅샷 생성
- 스냅샷 목록 관리
- 스냅샷 데이터로 롤백 기능 (기존 데이터 삭제 후 복원)
- 자동 스냅샷 정리 (컬렉션별 최대 10개 유지)

### 🎲 더미 데이터 생성
- 다양한 유형의 더미 데이터 생성
  - 사용자 데이터 (이름, 이메일, 나이, 활성 상태)
  - 상품 데이터 (상품명, 가격, 카테고리, 재고)
  - 주문 데이터 (고객ID, 총액, 상태, 주문 항목)
  - 기본 데이터 (제목, 설명, 값, 생성일)
- 1~10,000개 범위의 데이터 생성

### 📊 API 히스토리 & 모니터링
- 모든 API 호출 히스토리 추적
- 실시간 API 통계 및 성능 모니터링
- 필터링 및 검색 기능
- 페이지네이션 지원

### 💿 스토리지 관리
- 백업 및 스냅샷 스토리지 사용량 모니터링
- 실시간 디스크 사용률 표시
- 스토리지 경고 시스템

### 🤖 크론 백업
- 로컬 전용 크론 백업 API
- 자동화된 백업 스케줄링 지원

## 기술 스택

- **Frontend**: Next.js 15.4.6, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: MongoDB 5.9.2
- **Authentication**: NextAuth.js 4.24.11
- **OAuth Provider**: Google
- **Node.js**: 19.1.0
- **React**: 19.1.0

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# MongoDB 연결 설정
MONGODB_URI=mongodb://localhost:27017/mongodb_manager

# NextAuth 설정
NEXTAUTH_URL=http://localhost:5050
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 백업 설정
BACKUP_DIR=/home/ubuntu/backups
```

### 3. Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI에 `http://localhost:5050/api/auth/callback/google` 추가
4. 클라이언트 ID와 시크릿을 환경 변수에 설정

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 빌드
```bash
npm run build
npm start
```

## 사용법

### 1. 로그인
- 애플리케이션에 접속하면 랜딩 페이지가 표시됩니다
- "Google로 로그인" 버튼을 클릭하여 인증을 진행합니다
- 2weeks.co 도메인의 이메일만 접근 가능합니다

### 2. 데이터베이스 관리
- **데이터베이스 탭**: MongoDB 데이터베이스 목록을 확인하고 복제할 수 있습니다
- 각 데이터베이스의 크기, 컬렉션 수, 상태를 확인할 수 있습니다
- 실시간 서버 상태 및 연결 정보를 모니터링할 수 있습니다

### 3. 백업 관리
- **백업 관리 탭**: 데이터베이스 백업을 생성하고 관리할 수 있습니다
- 전체 백업을 선택할 수 있습니다
- 백업 히스토리를 확인할 수 있습니다
- 백업 복원 시 기존 데이터는 삭제되므로 주의하세요

### 4. 스냅샷 관리
- **스냅샷 탭**: 컬렉션의 스냅샷을 생성하고 관리할 수 있습니다
- 스냅샷 목록을 조회하고 필요시 롤백할 수 있습니다
- 롤백 시 현재 데이터는 삭제되므로 주의하세요

### 5. 더미 데이터 생성
- **더미 데이터 탭**: 테스트용 더미 데이터를 생성할 수 있습니다
- 다양한 유형의 데이터를 선택하고 개수를 지정할 수 있습니다

### 6. API 히스토리
- **API 탭**: 모든 API 호출 히스토리를 확인할 수 있습니다
- 필터링, 검색, 정렬 기능을 사용할 수 있습니다
- API 통계 및 성능 정보를 모니터링할 수 있습니다

### 7. 스토리지 모니터링
- 백업 및 스냅샷 스토리지 사용량을 실시간으로 확인할 수 있습니다
- 디스크 사용률이 높을 때 경고 표시됩니다

## API 엔드포인트

### 인증
- `GET/POST /api/auth/[...nextauth]` - NextAuth 인증 처리

### 데이터베이스
- `GET /api/databases` - 데이터베이스 목록 조회
- `GET /api/databases/status` - 데이터베이스 상태 및 서버 정보
- `POST /api/databases/clone` - 데이터베이스 복제

### 컬렉션
- `GET /api/collections` - 컬렉션 목록 조회

### 백업
- `GET /api/backup` - 백업 목록 조회
- `POST /api/backup` - 백업 생성
- `POST /api/backup/restore` - 백업 복원

### 스냅샷
- `GET /api/snapshot` - 스냅샷 목록 조회
- `POST /api/snapshot` - 스냅샷 생성
- `POST /api/snapshot/restore` - 스냅샷 복원

### 더미 데이터
- `POST /api/dummy-data` - 더미 데이터 생성

### 스토리지
- `GET /api/storage/backup` - 백업 스토리지 정보
- `GET /api/storage/snapshot` - 스냅샷 스토리지 정보

### API 히스토리
- `GET /api/history` - API 호출 히스토리 조회

### 크론 백업 (로컬 전용)
- `POST /api/cron/backup` - 크론 백업 실행 (인증 불필요, 로컬에서만 접근)

## 보안 고려사항

1. **환경 변수 보호**: 민감한 정보는 반드시 환경 변수로 관리하세요
2. **인증 필수**: 모든 API 엔드포인트는 인증된 사용자만 접근 가능합니다 (크론 백업 제외)
3. **도메인 제한**: Google OAuth는 2weeks.co 도메인만 허용합니다
4. **백업 디렉토리 권한**: 백업 디렉토리의 적절한 권한 설정이 필요합니다
5. **롤백 주의**: 스냅샷 및 백업 복원은 되돌릴 수 없으므로 신중하게 사용하세요
6. **크론 백업 보안**: 크론 백업 API는 로컬에서만 접근 가능하도록 설정되어 있습니다

## 개발 가이드라인

1. **Toast 사용**: `window.alert` 대신 `@/components/Toast` 컴포넌트를 사용하세요
2. **모달 ESC 키**: 모달창 구현 시 ESC 키로 닫히도록 구현하세요
3. **MongoDB 인증**: MongoDB 인증 정보는 `getMongoAuthParams()` 함수를 사용하세요
4. **API 히스토리**: 모든 API 호출은 자동으로 히스토리에 기록됩니다

## 문제 해결

### MongoDB 연결 오류
- MongoDB 서비스가 실행 중인지 확인
- 연결 문자열이 올바른지 확인
- 방화벽 설정 확인

### Google OAuth 오류
- Google Cloud Console에서 OAuth 설정 확인
- 리디렉션 URI가 올바르게 설정되었는지 확인
- 클라이언트 ID와 시크릿이 정확한지 확인
- 이메일 도메인이 2weeks.co인지 확인

### 백업 오류
- 백업 디렉토리 권한 확인
- 디스크 공간 확인
- mongodump 명령어 사용 가능 여부 확인

### 포트 충돌
- 기본 포트는 5050으로 설정되어 있습니다
- 다른 서비스와 포트가 충돌하는 경우 환경 변수에서 변경하세요

## 라이선스

MIT License

## 기여

이슈 리포트와 풀 리퀘스트를 환영합니다.
