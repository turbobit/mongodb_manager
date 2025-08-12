# MongoDB 관리자

MongoDB 데이터베이스를 효율적으로 관리하고 백업하는 Next.js 기반 웹 애플리케이션입니다.

## 주요 기능

### 🔐 인증 시스템
- Google OAuth를 통한 로그인
- 세션 기반 인증 관리

### 🗄️ 데이터베이스 관리
- MongoDB 데이터베이스 목록 조회
- 데이터베이스 크기 및 상태 확인
- 데이터베이스 복제 기능

### 💾 백업 관리(디비 통백업)
- 전체 데이터베이스 백업
- 특정 컬렉션 백업
- 백업 히스토리 관리
- 백업 파일 크기 및 생성일 확인

### 📸 스냅샷 & 롤백
- 컬렉션 스냅샷 생성
- 스냅샷 목록 관리
- 스냅샷 데이터로 롤백 기능

### 🎲 더미 데이터 생성
- 다양한 유형의 더미 데이터 생성
  - 사용자 데이터 (이름, 이메일, 나이, 활성 상태)
  - 상품 데이터 (상품명, 가격, 카테고리, 재고)
  - 주문 데이터 (고객ID, 총액, 상태, 주문 항목)
  - 기본 데이터 (제목, 설명, 값, 생성일)
- 1~10,000개 범위의 데이터 생성

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **OAuth Provider**: Google

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
NEXTAUTH_URL=http://localhost:3000
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
3. 승인된 리디렉션 URI에 `http://localhost:3000/api/auth/callback/google` 추가
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

### 2. 데이터베이스 관리
- **데이터베이스 탭**: MongoDB 데이터베이스 목록을 확인하고 복제할 수 있습니다
- 각 데이터베이스의 크기와 상태를 확인할 수 있습니다

### 3. 백업 관리(디비 통백업)
- **백업 관리(디비 통백업) 탭**: 데이터베이스 백업을 생성하고 관리할 수 있습니다
- 전체 백업 또는 특정 컬렉션 백업을 선택할 수 있습니다
- 백업 히스토리를 확인할 수 있습니다

### 4. 스냅샷 관리
- **스냅샷 탭**: 컬렉션의 스냅샷을 생성하고 관리할 수 있습니다
- 스냅샷 목록을 조회하고 필요시 롤백할 수 있습니다
- 롤백 시 현재 데이터는 삭제되므로 주의하세요

### 5. 더미 데이터 생성
- **더미 데이터 탭**: 테스트용 더미 데이터를 생성할 수 있습니다
- 다양한 유형의 데이터를 선택하고 개수를 지정할 수 있습니다

## API 엔드포인트

### 인증
- `GET/POST /api/auth/[...nextauth]` - NextAuth 인증 처리

### 데이터베이스
- `GET /api/databases` - 데이터베이스 목록 조회
- `POST /api/databases/clone` - 데이터베이스 복제

### 백업
- `GET /api/backup` - 백업 목록 조회
- `POST /api/backup` - 백업 생성

### 스냅샷
- `GET /api/snapshot` - 스냅샷 목록 조회
- `POST /api/snapshot` - 스냅샷 생성
- `POST /api/snapshot/rollback` - 스냅샷 롤백

### 더미 데이터
- `POST /api/dummy-data` - 더미 데이터 생성

## 보안 고려사항

1. **환경 변수 보호**: 민감한 정보는 반드시 환경 변수로 관리하세요
2. **인증 필수**: 모든 API 엔드포인트는 인증된 사용자만 접근 가능합니다
3. **백업 디렉토리 권한**: 백업 디렉토리의 적절한 권한 설정이 필요합니다
4. **롤백 주의**: 스냅샷 롤백은 되돌릴 수 없으므로 신중하게 사용하세요

## 문제 해결

### MongoDB 연결 오류
- MongoDB 서비스가 실행 중인지 확인
- 연결 문자열이 올바른지 확인
- 방화벽 설정 확인

### Google OAuth 오류
- Google Cloud Console에서 OAuth 설정 확인
- 리디렉션 URI가 올바르게 설정되었는지 확인
- 클라이언트 ID와 시크릿이 정확한지 확인

### 백업 오류
- 백업 디렉토리 권한 확인
- 디스크 공간 확인
- mongodump 명령어 사용 가능 여부 확인

## 라이선스

MIT License

## 기여

이슈 리포트와 풀 리퀘스트를 환영합니다.
