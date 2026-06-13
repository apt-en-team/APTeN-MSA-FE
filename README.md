# APTeN-MSA-FE

> 아파트 통합 주거관리 플랫폼 — 프론트엔드

입주민(PWA)과 관리자(PC) 화면이 하나의 SPA 안에서 레이아웃·라우터·권한 가드로 완전 분리된 Vue 3 기반 프론트엔드입니다.

---

## 배포 링크

| 구분 | 링크 |
|---|---|
| 사용자 / 관리자 | [APTeN 바로가기](https://tc.greenart.n-e.kr) |
| 마스터 관리자 | [마스터 로그인](https://tc.greenart.n-e.kr/admin/master) |

### 테스트 계정

| 구분 | 이메일 | 비밀번호 |
|---|---|---|
| 관리자 | manager33@apten.com | test1234! |
| 입주민 | resident31@apten.com | test1234! |
| 마스터 | master@apten.com | master1234! |

---

## 팀원 및 담당 도메인

| 이름 | 담당 |
|---|---|
| 박소영 | 공통 모듈, Kafka Outbox, 단지 관리, 시설예약, GX, 알림 |
| 김가은 | 인증/인가, OAuth2(Google·Kakao·Naver), Gateway, 차량·방문차량, 주차 |
| 손지혜 | 세대 관리, 동/호수 등록, 입주민 자동·수동 매칭, 관리비 |
| 이윤주 | 게시판, 공지사항, 댓글, 투표, 파일 업로드 |

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | Vue 3.5 |
| 빌드 도구 | Vite 8 |
| 상태 관리 | Pinia 3 |
| 라우팅 | Vue Router 5 |
| HTTP 클라이언트 | Axios 1.x |
| 실시간 알림 | WebSocket (native) |
| 실시간 주차 | SSE (@microsoft/fetch-event-source) |
| 푸시 알림 | Firebase 12 (FCM) |
| 리치 텍스트 에디터 | TipTap 3 |
| 차트 | ApexCharts + vue3-apexcharts |
| PWA | vite-plugin-pwa (workbox, standalone) |
| 린팅 | oxlint + eslint-plugin-vue |
| Node | ^20.19.0 \|\| >=22.12.0 |

---

## 화면 구성

3개 역할이 하나의 SPA 안에서 레이아웃과 라우터로 분리됩니다.

| 역할 | 경로 | 레이아웃 |
|---|---|---|
| 입주민 (USER) | `/resident/:complexId/*` | BottomNav 하단 탭 (모바일 PWA) |
| 관리자 (MANAGER·ADMIN) | `/admin/*` | 좌측 사이드바 (PC) |
| 마스터 (MASTER) | `/admin/master/*` | 독립 화면 |

---

## 핵심 구현 포인트

**3역할 분리 SPA**  
입주민·관리자·마스터 화면이 레이아웃·라우터·권한 가드로 완전 분리됩니다.  
`beforeEach` 가드에서 `requiresAuth + roles` 메타로 접근을 제어하고, PENDING 상태 입주민은 모든 경로를 `/pending`으로 차단합니다.

**단지별 기능 플래그 (Feature Gate)**  
시설예약·주차현황·전자투표 기능은 단지별로 ON/OFF됩니다.  
`featureGate.js`가 비활성화된 기능의 라우트와 사이드바 메뉴를 동시에 차단합니다.

**MASTER 단지 컨텍스트**  
MASTER가 단지를 선택하면 선택 단지 ID를 sessionStorage에 저장하고, 모든 API 요청에 `X-Selected-Complex-Id` 헤더를 자동 주입합니다.

**실시간 3채널**
- WebSocket — 앱 실행 중 인앱 토스트 알림·미읽음 수 실시간 갱신
- SSE — 주차 센서 상태 변화를 `spot-changed` / `zone-counter-changed` 이벤트로 수신
- FCM — 앱 백그라운드·종료 상태 푸시 알림 (HTTPS 환경에서만 활성화)

**JWT 자동 갱신**  
401 응답 시 Refresh Token으로 Access Token을 재발급합니다.  
`_retry` 플래그로 인터셉터 무한 루프를 방지하고, 갱신 실패 시 localStorage를 초기화하고 로그인 페이지로 이동합니다.

**PWA**  
standalone 모드로 설치 가능하며, 정적 자원을 precache합니다.  
실시간성이 필요한 알림·주차 데이터는 캐싱에서 제외합니다.


---

## 실행 방법

### 사전 요구사항

- Node.js `^20.19.0` 또는 `>=22.12.0`

### 1. 환경변수 설정

```bash
cp .env.example .env.development
```

`.env.development` 파일을 열어 값을 채웁니다.

```
VITE_API_BASE_URL=http://localhost:9000/api
VITE_FCM_ENABLED=false   # HTTPS 환경에서만 true
```

> `.env.development`는 `.gitignore`에 포함되어 있어 커밋되지 않습니다.  
> 키 목록은 `.env.example`을 참고하세요.

### 2. 패키지 설치 및 개발 서버 실행

```bash
npm install
npm run dev
```

### 3. 빌드

```bash
npm run build
```

> API 연결은 로컬 BE Gateway (포트 9000)를 기준으로 합니다.  
> 소셜 로그인은 `localhost:9080`에서 별도로 처리됩니다.
