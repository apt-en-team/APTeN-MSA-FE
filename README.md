# APTeN-MSA-FE

## 프로젝트 소개

APTeN은 입주민과 관리자가 함께 사용하는 스마트 아파트 통합 관리 시스템입니다.

본 프론트엔드 프로젝트는 Vue 기반 SPA로 구성되었으며, 입주민, 관리자, 마스터 사용자의 화면을 하나의 프로젝트 안에서 역할별 라우터와 레이아웃으로 분리했습니다.

백엔드 MSA 구조와 연동하기 위해 API Gateway를 단일 진입점으로 사용하며, JWT 인증, 권한별 접근 제어, 실시간 알림, 실시간 주차 현황, FCM 웹 푸시 알림 등을 제공합니다.

---

## 배포 링크

| 사용자/관리자                                   | 마스터 관리자                                            |
| ----------------------------------------- | -------------------------------------------------- |
| [APTeN 바로가기](https://tc.greenart.n-e.kr/) | [마스터 로그인](https://tc.greenart.n-e.kr/master/login) |

### 테스트 계정

| 구분  | 이메일                                                 | 비밀번호        |
| --- | --------------------------------------------------- | ----------- |
| 관리자 | [manager33@apten.com](mailto:manager33@apten.com)   | test1234!   |
| 입주민 | [resident31@apten.com](mailto:resident31@apten.com) | test1234!   |
| 마스터 | [master@apten.com](mailto:master@apten.com)         | master1234! |

---

## 주요 기능

### 입주민

* 로그인 및 회원가입
* 소셜 로그인
* 입주민 대시보드
* 내 차량 등록 및 관리
* 방문차량 / 고정 방문차량 등록
* 시설 목록 조회 및 예약
* GX 프로그램 신청
* 내 예약 조회 및 취소
* 주차 현황 조회
* 게시판 / 공지사항 조회
* 전자투표 참여
* 관리비 내역 조회
* 알림 목록 및 알림 설정
* 마이페이지 정보 수정

### 관리자

* 관리자 대시보드
* 세대 목록 조회 및 승인 관리
* 차량 등록 승인 및 관리
* 방문차량 / 고정 방문차량 관리
* 주차 현황 및 입출차 기록 조회
* 주차 구역 / 센서 관리
* 시설 및 GX 프로그램 관리
* 예약 현황 조회
* 게시판 / 공지사항 / 투표 관리
* 관리비 정산
* 알림 목록 및 설정

### 마스터

* 단지 목록 조회
* 단지 등록 / 수정 / 상세 조회
* 단지별 기능 설정
* 단지 선택 후 관리자 화면 진입

---

## 기술 스택

### Frontend

* Vue 3
* Vite
* Pinia
* Vue Router
* Axios
* JavaScript

### UI / UX

* 공통 모달 컴포넌트
* 공통 로딩 / 빈 상태 컴포넌트
* 공통 Badge / Pagination 컴포넌트
* TipTap Editor
* ApexCharts

### Realtime / Push

* WebSocket
* SSE
* Firebase Cloud Messaging
* PWA

---

## 프로젝트 구조

```text
src
├── api
├── components
│   ├── common
│   ├── admin
│   ├── resident
│   └── notification
├── constants
├── layouts
├── router
├── services
├── stores
├── utils
└── views
    ├── admin
    ├── auth
    ├── common
    ├── master
    └── resident
```

### 주요 디렉터리

| 디렉터리                  | 설명                         |
| --------------------- | -------------------------- |
| `api`                 | 도메인별 API 요청 모듈             |
| `components/common`   | 공통 UI 컴포넌트                 |
| `components/admin`    | 관리자 화면 전용 컴포넌트             |
| `components/resident` | 입주민 화면 전용 컴포넌트             |
| `layouts`             | 사용자 역할별 레이아웃               |
| `router`              | 역할별 라우터 및 접근 제어            |
| `services`            | WebSocket, FCM 등 외부 서비스 연동 |
| `stores`              | Pinia 상태 관리                |
| `utils`               | 공통 유틸 함수 및 SSE 클라이언트       |
| `views`               | 실제 페이지 화면                  |

---

## 라우팅 구조

```text
/
├── login
├── register
├── resident/:complexId/*
├── admin/*
└── admin/master/*
```

| 경로                       | 대상      |
| ------------------------ | ------- |
| `/`                      | 랜딩 페이지  |
| `/login`                 | 입주민 로그인 |
| `/admin/login`           | 관리자 로그인 |
| `/master/login`          | 마스터 로그인 |
| `/register`              | 회원가입    |
| `/resident/:complexId/*` | 입주민 화면  |
| `/admin/*`               | 관리자 화면  |
| `/admin/master/*`        | 마스터 화면  |

라우터 가드에서 로그인 여부, 사용자 역할, 입주민 승인 상태, 소속 단지, 마스터 단지 선택 여부를 확인하여 접근을 제어합니다.

---

## API 연동 구조

프론트엔드는 API Gateway를 단일 진입점으로 사용합니다.

```text
Vue Client
  → Axios API Client
  → API Gateway
  → 각 백엔드 서비스
```

### Axios 공통 처리

* `VITE_API_BASE_URL` 기반 API 요청
* Access Token 자동 헤더 주입
* 사용자 역할 및 단지 정보 헤더 주입
* 401 응답 발생 시 Refresh Token으로 Access Token 재발급
* 재발급 실패 시 로그아웃 처리
* 권한 오류 발생 시 접근 제한 페이지로 이동

### 주요 헤더

| 헤더                      | 설명             |
| ----------------------- | -------------- |
| `Authorization`         | Access Token   |
| `X-User-Id`             | 사용자 ID         |
| `X-User-Role`           | 사용자 역할         |
| `X-Complex-Id`          | 입주민 소속 단지 ID   |
| `X-Selected-Complex-Id` | 마스터가 선택한 단지 ID |

---

## 상태 관리

Pinia를 사용하여 로그인 정보, 단지 정보, 알림, 주차, 예약, 게시판 등 주요 상태를 관리합니다.

| Store                    | 역할                              |
| ------------------------ | ------------------------------- |
| `useAuthStore`           | 로그인, 로그아웃, 사용자 정보, 토큰 관리        |
| `useComplexStore`        | 단지 정보, 마스터 선택 단지 관리             |
| `useNotificationStore`   | 알림 목록, 미읽음 수, 토스트, WebSocket 상태 |
| `useParkingStore`        | 주차 현황, 입출차 기록, 통계, SSE 구독       |
| `useFacilityStore`       | 시설 목록 및 상세                      |
| `useReservationStore`    | 예약 목록, 예약 생성, 취소                |
| `useGxStore`             | GX 프로그램 목록, 신청, 대기 현황           |
| `useVehicleStore`        | 입주민 차량 관리                       |
| `useVisitorVehicleStore` | 방문차량 / 고정 방문차량 관리               |
| `useHouseholdStore`      | 세대 목록, 상세, 승인                   |
| `useBillStore`           | 관리비 목록 및 상세                     |
| `useBoardStore`          | 게시판 목록, 상세, 작성, 수정, 삭제          |
| `useNoticeStore`         | 공지사항 관리                         |
| `useVoteStore`           | 전자투표 목록, 상세, 투표                 |

---

## 실시간 기능

### WebSocket 알림

앱이 실행 중일 때 WebSocket을 통해 알림을 수신하고, 알림 뱃지와 토스트를 즉시 갱신합니다.

```text
notification-service
  → WebSocket
  → notificationSocketService
  → NotificationStore
  → Toast / Badge 갱신
```

### FCM 웹 푸시

브라우저가 백그라운드 상태이거나 앱이 열려 있지 않은 경우 Firebase Cloud Messaging을 통해 웹 푸시 알림을 수신합니다.

FCM은 HTTPS 배포 환경에서만 활성화됩니다.

### SSE 주차 현황

주차 현황은 SSE를 통해 실시간으로 수신합니다.

```text
parking-vehicle-service
  → SSE
  → parkingSseClient
  → ParkingStore
  → 주차 현황 화면 갱신
```

센서 기반 자리 배치도는 SENSOR 타입 단지에서만 제공됩니다.

---

## UX 개선 포인트

* 입주민 / 관리자 / 마스터 역할별 레이아웃 분리
* 라우터 가드를 통한 권한별 접근 제어
* 승인 대기 입주민의 접근 가능 화면 제한
* 마스터 단지 선택 상태 유지
* 로딩 / 빈 상태 / 에러 화면 공통 처리
* 성공 / 실패 / 확인 모달 공통화
* 관리자 메뉴 동적 렌더링
* 주차 타입에 따른 화면 분기
* 예약, 승인, 대기 상태를 Badge로 구분 표시
* PWA 설정을 통한 앱 설치 및 standalone 실행 지원

---

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_API_BASE_URL=http://localhost:9000/api
VITE_FCM_ENABLED=false
```

FCM을 사용하는 경우 Firebase 설정값을 추가합니다.

### 3. 로컬 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

---

## 팀원

| 이름  | 담당                                    |
| --- | ------------------------------------- |
| 박소영 | 시설예약, 알림, 공통 연동 흐름 정리                 |
| 김가은 | 인증/인가, Gateway 연동, 차량/방문차량, 주차 화면     |
| 손지혜 | 세대 관리, 동/호수 등록, 회원가입 세대 자동 매칭 및 수동 승인 |
| 이윤주 | 게시판, 공지사항, 댓글, 투표, 입주민 화면             |
