# 시설예약 상세 작업 로그

> 이 문서는 작업 당시 구현 범위와 흐름을 보관하는 Archive입니다.
> 최종 요구사항/API/테이블/UI 명세는 구글시트 최종본을 기준으로 관리합니다.

---

## 1. 작업 목적

아파트 단지 내 시설(독서실·헬스장·골프장 등)을 예약하고 관리하는 도메인을 구현했다. 단순 CRUD가 아니라 예약 중복 방지, 좌석 임시 선점(Redis TEMP_HOLD), GX 프로그램 대기/승인 흐름, FLAT/PER_PERSON 구독 기반 월정산처럼 상태 전환이 복잡한 기능들을 포함한다.

핵심 과제는 다음 세 가지였다.

- **동시성 제어**: 같은 좌석·GX 순번·정원에 여러 요청이 동시에 들어올 때 정합성을 보장하는 방식 선택
- **GX 흐름 설계**: APPROVAL 타입 시설의 승인형 예약을 별도 구현하지 않고 GX 프로그램 신청/승인 흐름으로 통합
- **구독 정산 기반 마련**: FLAT/PER_PERSON 시설에 구독 모델을 도입하고, 신청 기준일/해지 기준일을 분리해 유연한 청구 정책을 지원

---

## 2. 구현 흐름

### 2-1. 시설 관리

관리자가 단지 기준으로 시설을 등록·수정·삭제·활성 변경하는 흐름이다.

- 시설 등록 시 `typeId`, `name`, `reservationType`(SEAT/COUNT/APPROVAL), `maxCount`, 운영 시간 등을 받는다.
- 목록은 페이지 응답으로 반환하며 `isTodayBlocked` 필드를 포함해 오늘 차단된 시설을 즉시 식별할 수 있게 했다.
- 삭제는 소프트 삭제. 예약 이력이 있으면 삭제 대신 비활성 처리를 유도한다.
- 비활성 시설은 입주민 화면에 미노출되고 예약도 불가하다.

**시설 타입 관리 방식**
- 시설 타입(SEAT/COUNT/GX 등)은 서비스 기동 시 `InitialFacilityTypeBootstrapConfig`로 초기 데이터를 INSERT하고, 운영 중 추가·수정 API(`API-607`, `API-609`)는 주석 처리했다.
- 현재 운영에서 타입 자체를 추가·변경할 일이 없고, 잘못 수정했을 때 전체 시설 타입 정합성이 깨질 위험이 크다고 판단했다.

**예약 방식 구분**
- `SEAT`: 좌석을 선택하고 임시 선점 후 예약 확정
- `COUNT`: 인원만 지정해 예약. 중복 방지는 정원 상한 검증
- `APPROVAL`: 직접 예약 불가. GX 프로그램 신청 흐름으로 분기

---

### 2-2. 시설 정책

시설별 예약 정책(운영 시간·요금·취소 마감·구독 기준일 등)을 관리한다.

- **facilityId 기준**으로 관리한다. 초기에는 `facilityTypeCode` 기준으로 설계됐으나, 같은 타입의 시설이라도 단지별로 정책이 달라야 하는 경우가 있어 `facilityId` 기준으로 전환했다. UniqueConstraint: `complex_id + facility_id`.
- `feeType`(FLAT/PER_PERSON/PER_USE), `usageUnitType`(MINUTE/DAY), `baseFee`, `slotMin`, `cancelDeadlineHours`, `maxReservationCount`, `includedPersonCount`, `extraPersonFee` 필드를 포함한다.
- `subscribeCutoffDay`(신청 기준일)와 `cancelCutoffDay`(해지 기준일)는 두 개의 독립 필드로 분리했다. 단일 `billingCutoffDay`로 합치면 "신청은 10일 기준, 해지는 20일 기준"처럼 기준이 다른 정책을 표현할 수 없기 때문이다.
- GX 시설(`typeCode=GX`)은 정책 대상에서 제외한다. GX는 시설 정책이 아니라 GX 프로그램 단위로 요금·정원·대기 여부를 관리한다.
- `gxWaitingEnabled` 필드는 초기에 `facility_policy`에 있었으나, GX 프로그램 개별 설정이 맞다고 판단해 `GxProgram.waitingEnabled`로 이관했다.

---

### 2-3. 차단 시간 / 정기 휴무

시설 점검·행사·휴무로 예약을 막아야 하는 구간을 관리한다.

**단건 차단 (`FacilityBlockTime`)**
- 특정 날짜·시간대를 직접 지정해 차단한다.
- `seatId=null`이면 시설 전체 차단, `seatId`를 지정하면 특정 좌석만 차단한다.
- 배치 등록 시 요일+기간 범위를 받아 FacilityBlockTime 다건을 생성하고 공통 `batchId`로 그룹화한다. 그룹 비활성화는 `batchId` 기준으로 일괄 처리한다.

**정기 휴무 규칙 (`FacilityClosureRule`)**
- 매주 월요일 휴무, 매월 둘째 주 화요일 휴무처럼 반복 패턴을 행 하나로 표현한다.
- `ruleType`은 WEEKLY / MONTHLY_NTH 두 가지. `isDateBlocked()` 엔티티 메서드로 런타임에 해당 날짜가 차단인지 계산한다.

**두 방식을 분리한 이유**
- 단건 차단은 "오늘 점검"처럼 일시적이고 구체적인 날짜·시간 정보가 필요하다.
- 정기 휴무는 반복 패턴을 1행으로 표현하는 것이 훨씬 효율적이다. 단건으로 표현하면 매주 수십 건씩 INSERT해야 한다.
- FE에서도 두 개의 서브탭(임시 차단 / 정기 휴무)으로 분리해 UX를 구성했다.

---

### 2-4. 좌석 관리 / 좌석형 예약

**좌석 관리**
- 좌석 단건 등록, 일괄 등록(`/seats/bulk`), 목록 조회, 수정을 지원한다.
- 좌석번호(`seatNo`) 수정은 미지원. 등록 후 번호 변경이 필요하면 비활성 처리 후 재등록이 필요하다(후속 개선).

**좌석 임시 선점 흐름**
1. 좌석 상태 조회: 날짜·시간대 기준 좌석별 AVAILABLE/HOLDING/RESERVED 상태 반환
2. 임시 선점: Redis SETNX + TTL 15분으로 선점 키 생성, DB `reservation_temp_hold`에 HOLDING 상태 병행 저장
3. 예약 확정: holdId 포함해 예약 생성 요청. Redis 값에서 userId 검증 후 예약 저장
4. 자동 만료: `ReservationTempHoldExpireScheduler` 60초 주기로 만료된 HOLDING 항목을 EXPIRED 처리

**DB 락 대신 Redis TTL을 선택한 이유**
- 좌석 선점은 "10분 안에 확정하지 않으면 자동 해제"라는 시간 기반 만료가 핵심이다.
- DB 비관적 락으로 이를 처리하려면 트랜잭션을 10분간 열어둬야 하므로 적절하지 않다.
- Redis SETNX + TTL은 선점 상태와 자동 만료를 한 번에 표현할 수 있고, 좌석 상태 조회 시 HOLDING 여부를 빠르게 확인할 수 있다.

---

### 2-5. 일반 예약

**예약 가능 시간 조회**
- 시설·날짜 기준으로 슬롯별 `availableCount`, `totalCount`, `isReservable`을 반환한다.
- 차단 시간, 정기 휴무, 기존 예약, TEMP_HOLD를 모두 반영한다.
- overnight 운영시간(`openTime > closeTime`)은 익일 마감으로 처리한다.

**예약 생성**
- SEAT 타입: `seatId` + `holdId` 필수. Redis holdId 검증 후 예약 저장.
- COUNT 타입: `quantity` 기준. 정원 초과 시 오류.
- APPROVAL 타입: `INVALID_PARAMETER` throw. GX 프로그램 흐름으로 안내.

**내 예약 통합 목록 (API-623)**
- FACILITY와 GX 예약을 하나의 API로 통합 반환한다.
- `phase=UPCOMING`(CONFIRMED/WAITING) / `PAST`(COMPLETED/CANCELLED/REJECTED) 탭 기준으로 필터링한다.
- `fromDate`, `toDate`, `status` 필터 파라미터는 없다.
- 통합한 이유: 입주민이 "내 예약 목록"을 볼 때 시설 예약과 GX 예약을 따로 조회하면 UX가 분산된다. 하나의 목록에서 `type=FACILITY`이면 예약 상세로, `type=GX`이면 GX 상세로 각각 라우팅한다.

**예약 취소**
- 취소 마감 시간(`cancelDeadlineHours`) 정책 검증 포함. 마감 이후 요청은 오류 반환.
- `cancelable` 필드를 예약 상세 응답에 포함해 FE에서 취소 버튼 노출 여부를 제어한다.

**관리자 예약 관리**
- FACILITY/GX 통합 목록 조회, 상세, 강제 취소를 지원한다.
- 강제 취소는 취소 마감 시간 무관으로 처리된다.
- 통합 예약현황(`/overview`) API는 명세 외 추가 구현했다. reservationKind / facilityId / residentName 등 필터 지원.

**예약 완료 스케줄러**
- `ReservationCompleteScheduler` 60초 주기. 이용 시간이 지난 CONFIRMED 예약을 COMPLETED로 자동 전환.
- overnight 예약(`endTime < startTime`)은 `reservationDate + 1` 기준으로 처리해 당일 낮에 COMPLETED로 잘못 처리되는 버그를 수정했다.

---

### 2-6. GX 프로그램

**APPROVAL 시설을 GX 흐름으로 분기한 이유**
- DB에 `reservation_type=APPROVAL`이 존재하지만, 실제 PENDING → 관리자 승인 → CONFIRMED 흐름을 별도로 구현하지 않았다.
- GX 프로그램이 이미 신청 → WAITING → 관리자 승인 → CONFIRMED 흐름을 완전히 구현하고 있다. 두 흐름을 중복 구현하면 관리 포인트가 두 곳이 된다.
- APPROVAL 수신 시 throw 처리를 유지하고, FE에서는 안내 모달로 "GX 프로그램을 통해 신청해 주세요"를 표시한다.

**GX 프로그램 관리 (관리자)**
- 프로그램명, 시설, 운영 기간, 요일, 시간, 최소/최대 인원, 요금, `waitingEnabled` 등록·수정.
- 취소 시 관련 WAITING/CONFIRMED 예약 일괄 CANCELLED 처리.
- 모집 마감(`close-waiting`): 남은 WAITING 신청자 일괄 REJECTED + 프로그램 WAITING_CLOSED 전환. CLOSED(자연 종료)와 구분.

**입주민 GX 신청 흐름**
- 전원 대기형 정책: 모든 신청자는 WAITING + `waitNo` 부여. 정원 미만이라도 즉시 CONFIRMED 없음.
- `waitNo` 중복 방지: `GxProgram`에 `PESSIMISTIC_WRITE` 락. 신청 요청을 프로그램 row 기준으로 직렬화.
- 취소 시 남은 WAITING 신청자 `waitNo` 재정렬. 자동 승격 없음.

**관리자 승인 흐름**
- 단건 승인/거절, 일괄 승인(`bulk-approve`), 최소 인원 검증(`minimum-check`) 지원.
- 일괄 승인은 `approveCount`가 null이면 가용 슬롯(maxCount - confirmedCount) 전부 승인.
- 정원 초과 동시 승인 방지: `GxProgram` 낙관적 락(`@Version`). 충돌 시 먼저 커밋한 요청만 성공.
- 최소 인원 미달이면 `cancellable=true` 반환. 취소 여부는 관리자가 직접 결정.

**GX 이용완료 처리**
- `GxCompleteScheduler` 60초 주기. `GxProgram.endDate + endTime` 기준으로 WAITING/CONFIRMED → COMPLETED 일괄 전환.

---

### 2-7. 시설 구독

**구독 생성 조건**
- FLAT / PER_PERSON 시설만 구독 대상이다.
- PER_USE는 건당 과금 방식이라 구독 개념이 없다.
- FLAT/PER_PERSON 시설 첫 예약 시 BE에서 자동으로 구독 레코드를 생성한다.

**입주민 구독 흐름**
- 구독 목록 조회: 시설명, feeType, baseFee, 기준일, 구독 상태, `hasCompletedThisMonth` 포함.
- 해지: `cancelCutoffDay` 기준으로 당월/익월 처리. FE에서 기준일과 오늘 날짜, `hasCompletedThisMonth` 조합으로 청구 안내 메시지 분기.

**관리자 구독 흐름**
- 전체 구독 목록 조회(facilityId/status 필터 지원).
- 세대별 구독 요약 목록 및 세대 상세 조회.
- 강제 해지: `complexId` 소속 검증 + 이미 해지된 구독 예외 처리 포함.

**subscribeCutoffDay / cancelCutoffDay 분리 이유**
- "신청은 10일 기준, 해지는 20일 기준"처럼 두 기준이 독립적으로 설정될 수 있다.
- 단일 `billingCutoffDay` 필드로는 이를 표현할 수 없고, 나중에 분리하려면 DB 마이그레이션이 필요하다.
- null 허용 설계로 null이면 항상 전액 청구하도록 해 "기준일 없음" 정책도 포함한다.

---

### 2-8. 시설 이용 현황 / 비용

**시설 이용 현황**
- 시설 타입/날짜 기준 예약·이용 현황 오버뷰.
- SEAT 타입: 좌석별 상태(AVAILABLE/HOLDING/RESERVED), 예약자 정보(UserCache 기반).
- COUNT 타입: 날짜·시간대별 이용 인원, 잔여 정원, 예약자 목록.
- GX: 프로그램별 신청/승인/대기/취소 인원 현황.

**비용 산정**
- COMPLETED 예약 기준으로 세대별 월별 비용를 집계한다.
- FLAT/PER_PERSON: FacilitySubscription 구독 기반. `subscribeCutoffDay`/`cancelCutoffDay` 분리 정책 적용.
- GX: `GxProgram.startDate` 소속 월 기준 산정(기존 `approvedAt` 기준에서 변경).
- `FacilityFeeScheduler`로 매월 자동 실행.

**비용 발행 상태**
- 현재는 `isPublished=true` 마킹만 처리된다.
- Household Service로의 실제 Outbox 발행은 미구현.

**Household Service Outbox 연동을 후속 개선으로 분리한 이유**
- Household Service와 payload 계약이 확정되지 않은 상태에서 발행 로직을 먼저 구현하면 이후 계약 변경 시 수정 범위가 커진다.
- 비용 집계 자체는 완료되어 있으므로, 계약 확정 후 발행 로직만 추가하면 된다.

---

## 3. 주요 선택 이유

| 선택 | 이유 |
|---|---|
| facilityId 기준 시설 정책 | 같은 타입의 시설이라도 단지별·시설별 정책이 달라야 함. facilityTypeCode 기준으로는 개별 시설 정책 설정 불가 |
| Redis TEMP_HOLD | 좌석 선점은 "10분 TTL 자동 만료"가 핵심. DB 비관적 락은 트랜잭션을 길게 유지해야 해 부적합 |
| API-623 내 예약 통합 목록 | 입주민이 시설/GX 예약을 따로 조회하면 UX 분산. phase 기준 탭 전환만으로 통합 관리 |
| APPROVAL 직접 예약 제외 | GX 프로그램이 이미 신청→승인 흐름을 담당. 중복 구현 시 관리 포인트가 두 곳으로 분산됨 |
| subscribeCutoffDay / cancelCutoffDay 분리 | 신청 기준일과 해지 기준일이 독립적으로 설정될 수 있음. 단일 필드로는 표현 불가 |
| GX waitNo 비관적 락 | 순번 중복은 절대 안 됨. 현재 트래픽에서 Redis 분산 락의 운영 복잡도 없이 DB 락으로 충분 |
| 관리자 GX 승인 낙관적 락 | 관리자 동시 승인 충돌 가능성 낮음. 충돌 시 재시도 유도가 자연스러운 업무 흐름 |
| 비용 발행 Outbox 후속 개선 | Household Service payload 계약 미확정. 계약 확정 전 발행 로직 구현은 수정 범위 확대 위험 |

---

## 4. 구현 범위

### Backend

| 기능 묶음 | 내용 |
|---|---|
| 시설 CRUD | 등록·목록·상세·수정·소프트삭제·활성변경. 타입 조회(부트스트랩 대체) |
| 시설 정책 | facilityId 기준 정책 조회·저장. subscribeCutoffDay/cancelCutoffDay 분리 |
| 차단 시간 | 단건·배치 등록·조회·비활성화. batchId 그룹 비활성화 |
| 정기 휴무 | WEEKLY/MONTHLY_NTH 규칙 CRUD. isDateBlocked() 런타임 계산 |
| 좌석 관리 | 단건·일괄 등록·목록·수정. 좌석번호 수정 미지원 |
| 좌석 임시 선점 | Redis SETNX TTL 15분 + DB HOLDING 병행. ExpireScheduler 60초 |
| 일반 예약 | 가능 시간 조회, 생성(SEAT/COUNT), 상세, 취소. 예약완료 스케줄러 60초 |
| 내 예약 통합 목록 | FACILITY+GX 통합, phase=UPCOMING/PAST |
| 관리자 예약 | 목록·상세·강제취소. 통합 overview API(명세 외) |
| GX 프로그램 | 등록·목록·상세·수정·취소·모집마감. 전원대기형 신청·취소·waitNo 재정렬 |
| GX 승인 흐름 | 단건 승인/거절, 일괄 승인, 최소 인원 검증. GX 이용완료 스케줄러 60초 |
| 시설 구독 | 입주민 목록·해지. 관리자 목록·세대별 요약/상세·강제해지 |
| 시설 현황 | 이용현황 오버뷰, 좌석상태, 정원형현황, GX현황 |
| 비용 산정 | COMPLETED 예약·구독 기준 월별 집계. FacilityFeeScheduler |
| 비용 발행 | isPublished 마킹만. Outbox 연동은 후속 개선 |
| Kafka cache | ComplexFeature·User·Household·HouseholdMember 이벤트 수신 및 캐시 동기화 |

### Frontend

| 기능 묶음 | 주요 화면·컴포넌트 |
|---|---|
| 입주민 시설 목록/상세 | `ResidentFacilityHome.vue`, `ResidentFacilityDetail.vue`. APPROVAL 시설 안내 모달 |
| 입주민 예약 생성 | `ResidentReservationCreate.vue`. 날짜→타임슬롯→(좌석)→예약 생성 흐름. FLAT/PER_PERSON 첫 예약 시 요금 안내 모달 |
| 내 예약 통합 목록 | `ResidentReservationHome.vue`. upcoming/past 탭. FACILITY→예약상세, GX→GX상세 라우팅 |
| 내 예약 상세/취소 | `MyReservationDetail.vue`. cancelable 필드 기준 취소 버튼 |
| 입주민 GX | `ResidentGxProgramList.vue`, `ResidentGxProgramDetail.vue`. 전원 대기형 안내, 취소, waitNo 표시 |
| 입주민 나의 구독 | `ResidentMySubscriptionView.vue`. 구독 목록·해지. cancelCutoffDay 기준 안내 메시지 분기 |
| 관리자 시설 관리 | `AdminFacilityManageView.vue`(4탭), `AdminFacilityList.vue`, `FacilityFormView.vue` |
| 관리자 시설 정책 | `FacilityPolicyTab.vue`. GX 시설 제외. subscribeCutoffDay/cancelCutoffDay 입력 |
| 관리자 차단·휴무 | `FacilityBlockTimeTab.vue`. 임시 차단/정기 휴무 서브탭 분리 |
| 관리자 예약 목록 | `AdminReservationList.vue`. FACILITY+GX 통합, 강제 취소, GX 단건 처리 |
| 관리자 GX 관리 | `AdminGxProgramList.vue`. 프로그램 CRUD·취소·모집마감. 신청자 목록·승인·거절·일괄 승인 |
| 관리자 구독 현황 | `AdminSubscriptionView.vue`. 세대별 구독 목록·상세·강제 해지. `/admin/reservations` 라우트 |
| 관리자 시설별 현황 | `AdminFacilityStatusView.vue`. SEAT→`AdminSeatStatus`, COUNT→`AdminCountStatus`, GX→`AdminGxStatus` |

---

## 5. 최종 상태

| 영역 | 상태 | 비고 |
|---|---|---|
| 시설 관리 | 완료 | CRUD, 활성/비활성, 타입 조회(부트스트랩 대체) |
| 시설 정책 | 완료 | facilityId 기준. subscribeCutoffDay/cancelCutoffDay 분리 |
| 차단 시간 | 완료 | 단건·배치 등록, batchId 그룹 비활성화 |
| 정기 휴무 | 완료 | WEEKLY/MONTHLY_NTH 규칙. 런타임 계산 |
| 좌석 관리 | 완료 | 단건·일괄 등록, 수정. 좌석번호 수정은 후속 개선 |
| 좌석형 예약 | 완료 | Redis TEMP_HOLD + DB 만료 스케줄러 |
| 일반 예약 | 완료 | SEAT/COUNT. APPROVAL은 정책상 제외(throw 유지) |
| 내 예약 통합 목록 | 완료 | FACILITY+GX 통합. phase 기준 |
| 관리자 예약 관리 | 완료 | 목록·상세·강제취소. 통합 overview API 포함 |
| GX 프로그램 관리 | 완료 | 등록·수정·취소·모집마감. 이용완료 스케줄러 |
| GX 신청·승인 흐름 | 완료 | 전원대기형. 단건/일괄 승인, 최소 인원 검증 |
| 시설 구독 | 완료 | 입주민 목록·해지. 관리자 목록·세대별·강제해지 |
| 시설 이용 현황 | 완료 | 오버뷰·좌석상태·정원형·GX 현황 |
| 비용 산정 | 완료 | FacilityFeeScheduler. FLAT/PER_PERSON·GX 기준 |
| 비용 발행 | 부분완료 | isPublished 마킹만. Household Outbox 연동은 후속 개선 |
| overnight 예약 완료 처리 | 완료 | reservationDate+1 기준 버그 수정(2026-05-25) |
| Kafka 캐시 동기화 | 완료 | 4종 이벤트 수신 완료 |
| 알림 이벤트 발행 | 미구현 | 알림 서비스 담당자 구현 완료 후 연결 예정 |

---

## 6. 후속 개선

| 항목 | 이유 | 우선순위 |
|---|---|---|
| 알림 Outbox 연동 (예약 생성/취소/GX 승인·거절) | 알림 서비스 담당자 구현 완료 후 연결. 현재 `// TODO` 주석만 존재 | 중간 |
| 비용 발행 Household Service Outbox 연동 | payload 계약 미확정. isPublished 마킹만 처리 중 | 중간 |
| GX 상세 신청 상태 표시 구조 개선 | FE가 `myReservation.status`로 읽으나 BE는 flat `myStatus`/`myWaitNo` 반환. 필드 불일치로 표시 오류 가능 | 높음 |
| 좌석 선점 만료 안내 메시지 고도화 | holdId 만료 시 일반 에러만 반환. 잔여 시간 표시 및 만료 전용 안내 미구현 | 낮음 |
| 관리자 예약 통계·overview 화면 | `GET /api/admin/reservations/stats`, `/overview` BE 구현 완료. FE 화면 미연동 | 중간 |
| 좌석번호 수정 API | BE endpoint 미구현. FE에서 수정 불가로 명시 중 | 낮음 |
| GX 중복 신청 에러 코드 분기 | FE에서 에러 코드(`FRS_400_11`) 기반 전용 메시지 미구현. 일반 에러 메시지만 표시 | 낮음 |
| DB-level pagination 전환 | overview·GX 신청자 목록은 service-level in-memory pagination. 데이터 증가 시 성능 이슈 | 낮음 |
| GX 신청 마감 기한 자동화 | `gx_program.recruit_close_at` 컬럼 없음. 현재 수동 마감만 가능 | 낮음 |
| `MyReservationList.vue` 파일 정리 | placeholder 파일로 미사용 상태. 삭제 또는 역할 재정의 필요 | 낮음 |
