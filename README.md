# 자산관리 SaaS (Asset Management System)

MVP 버전의 자산관리 SaaS UI 프로토타입입니다. 회사 자산(유형/무형)을 등록, 추적, 순환하고, 자산 관련 요청을 티켓으로 처리하며, RBAC 기반 권한 관리를 제공합니다.

## 🎯 주요 기능

### 1. 대시보드
- **KPI 카드**: 총 자산 수, 열린 티켓, 만료 임박 자산, 수리 중 자산
- **차트**: 자산 상태별 분포(파이 차트), 카테고리별 자산(바 차트)
- **최근 활동**: 최근 배정 이력, 최근 티켓 목록

### 2. 자산 관리
- **자산 목록**: 검색, 필터(유형, 상태), 정렬 기능
- **자산 상세**: 
  - 기본 정보 (제조사, 모델, 시리얼 번호 등)
  - 재무 정보 (구매일, 구매가, 감가상각 추정치)
  - 무형자산 갱신 일정 (만료일, 갱신 주기, 비용)
  - QR 코드 생성 및 다운로드
  - 라벨 인쇄 기능
- **자산 등록/수정**: 
  - 유형자산: 구매 정보, 감가상각 정책
  - 무형자산: 만료일, 갱신 주기, 벤더 정보
- **자산 배정**: 팀원에게 자산 할당/회수, 이력 관리

### 3. 티켓 시스템
- **티켓 목록**: 상태, 우선순위 필터
- **티켓 상세**: 
  - 설명, 우선순위, 상태
  - 연결된 자산 정보
  - 활동 로그 (상태 변경, 담당자 할당)
  - 댓글 기능 (플레이스홀더)
- **티켓 생성**: 자산과 자동 연결 가능

### 4. 조직 관리
- **카테고리**: IT 장비, 소프트웨어, 가구 등 자산 분류
- **팀 관리**: 팀원 초대, 역할 부여 (Admin/Manager/Member)
- **권한 체계**:
  - **Admin**: 모든 리소스 접근 및 관리
  - **Manager**: 권한 범위 내 자산/티켓 관리
  - **Member**: 할당된 자산 조회만 가능

### 5. 설정
- 회사 정보 관리
- 프로필 설정
- 알림 설정
- 보안 설정 (비밀번호 변경, 2FA)

## 🏗️ 기술 스택

- **React** + **TypeScript**
- **React Router** (Data mode)
- **Tailwind CSS v4**
- **Zod** (스키마 검증)
- **React Hook Form** (폼 관리)
- **Recharts** (차트)
- **QRCode** (QR 코드 생성)
- **Lucide React** (아이콘)
- **date-fns** (날짜 처리)
- **Sonner** (토스트 알림)

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── App.tsx              # 메인 앱 (RouterProvider)
│   └── routes.ts            # 라우팅 설정
├── components/
│   ├── layout/
│   │   ├── layout.tsx       # 메인 레이아웃
│   │   └── sidebar.tsx      # 사이드바 네비게이션
│   └── ui/                  # 재사용 가능한 UI 컴포넌트
├── pages/
│   ├── dashboard.tsx        # 대시보드
│   ├── assets/
│   │   ├── assets-list.tsx  # 자산 목록
│   │   ├── asset-detail.tsx # 자산 상세
│   │   ├── asset-form.tsx   # 자산 등록/수정
│   │   └── asset-assign-form.tsx # 자산 배정
│   ├── tickets/
│   │   ├── tickets-list.tsx # 티켓 목록
│   │   ├── ticket-detail.tsx # 티켓 상세
│   │   └── ticket-form.tsx  # 티켓 생성
│   ├── categories.tsx       # 카테고리 관리
│   ├── team.tsx            # 팀 관리
│   └── settings.tsx        # 설정
├── lib/
│   ├── types.ts            # TypeScript 타입 정의
│   ├── schemas.ts          # Zod 검증 스키마
│   ├── mock-data.ts        # 목 데이터
│   └── utils.ts            # 유틸리티 함수
└── styles/
    └── theme.css           # Tailwind 테마
```

## 🎨 주요 UI 패턴

### 색상 체계
- **파란색**: 주요 액션, 링크
- **초록색**: 성공 상태 (사용 중, 활성)
- **노란색**: 경고 (수리 중, 만료 임박)
- **빨간색**: 위험 상태 (분실, 긴급)
- **보라색**: Admin 역할
- **회색**: 비활성/폐기 상태

### 상태 뱃지
- 자산 상태: InUse, InStock, Repair, Lost, Retired
- 티켓 상태: Open, InProgress, Resolved, Closed
- 티켓 우선순위: Low, Medium, High, Urgent

## 🔧 주요 기능 구현

### 1. QR 코드 생성
```typescript
// 자산별 고유 QR 코드 생성
const url = `${window.location.origin}/assets/${asset.id}`;
QRCode.toDataURL(url, { width: 200 });
```

### 2. 라벨 인쇄
- 브라우저 인쇄 기능 활용
- 자산명, 코드, QR, 시리얼 번호 포함
- A4 라벨 템플릿 지원

### 3. 감가상각 계산 (정액법)
```typescript
// 구매가에서 매월 균등하게 감가
const monthlyDepreciation = (purchasePrice - salvageValue) / usefulLifeMonths;
const currentValue = purchasePrice - (monthlyDepreciation * monthsElapsed);
```

### 4. 만료 임박 알림
- 30일 이내 만료 예정 무형자산 표시
- 대시보드에서 한눈에 확인

## 📊 데이터 모델

### 핵심 엔티티
- **Company**: 멀티테넌트 기준
- **User & Membership**: 사용자 및 역할
- **Asset**: 유형/무형 자산 정보
- **AssetAssignment**: 자산 배정 이력 (현재 담당자 추적)
- **Ticket**: 자산 관련 요청 및 이슈
- **Category & OrgUnit**: 권한 범위 단위

### 관계
- Asset → Category (N:1)
- Asset → OrgUnit (N:1, optional)
- Asset → AssetAssignment (1:N, 이력)
- Ticket → Asset (N:1, optional)
- Ticket → User (N:1, requester/assignee)

## 🎯 RBAC (역할 기반 접근 제어)

### Admin
- ✅ 모든 자산/티켓 CRUD
- ✅ 팀원 초대 및 역할 부여
- ✅ 회사 설정 관리
- ✅ 카테고리/조직 관리

### Manager
- ✅ 할당된 범위 내 자산/티켓 CRUD
- ✅ 티켓 처리 및 상태 변경
- ❌ 팀원 관리 불가
- ❌ 회사 설정 접근 불가

### Member
- ✅ 할당된 자산 조회 (읽기 전용)
- ❌ 자산 수정 불가
- ❌ 티켓 생성 불가 (MVP, 추후 옵션 확장 가능)

## 🚀 다음 단계 (Phase 2+)

- [ ] 실제 백엔드 연동 (Supabase)
- [ ] 이메일/슬랙 알림
- [ ] 첨부파일 업로드
- [ ] 고급 검색 및 필터
- [ ] 대량 가져오기/내보내기
- [ ] 모바일 반응형 최적화
- [ ] Google Workspace 동기화
- [ ] 구독 결제 시스템
- [ ] 회계 수준 감가상각 확장

## 💡 사용 가이드

### 자산 등록 플로우
1. Assets → Add Asset 클릭
2. 유형/무형 선택
3. 기본 정보 입력 (이름, 코드, 카테고리)
4. 유형자산: 구매 정보 및 감가상각 정책
5. 무형자산: 만료일 및 갱신 정보
6. Create Asset 클릭

### 자산 배정 플로우
1. 자산 상세 페이지 → Assign 버튼
2. 팀원 선택
3. 노트 입력 (선택)
4. Assign Asset 클릭
5. 이력이 자동으로 기록됨

### 티켓 생성 플로우
1. 자산 상세에서 "Create Ticket" 클릭 (자동 연결)
2. 또는 Tickets → Create Ticket
3. 제목, 설명, 우선순위 입력
4. 관련 자산 선택 (선택)
5. Create Ticket 클릭

## 📝 참고사항

- 현재는 **목(mock) 데이터**로 동작합니다
- 실제 데이터 저장은 없으며, 페이지 새로고침 시 초기화됩니다
- 백엔드 연동 시 Supabase 권장 (Auth, Database, Storage)
- PRD의 모든 요구사항을 UI 레벨에서 구현했습니다

---

**Created with Figma Make** 🎨
