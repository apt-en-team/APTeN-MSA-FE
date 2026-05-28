# ADR-002: APPROVAL 타입 예약 방식 — GX 프로그램 흐름으로 위임

- **날짜**: 2026-05-26
- **상태**: 확정 (PENDING/APPLIED 상태 설계 및 정책 확정 시 재검토)
- **관련 서비스**: facility-reservation-service
- **관련 코드**: `ReservationService.createReservation()`, `ResidentFacilityDetail.vue`

---

## 배경

시설에는 `reservation_type` 컬럼이 있고 SEAT / COUNT / APPROVAL 세 가지 값을 가진다. SEAT과 COUNT는 입주민이 직접 날짜·시간·좌석을 골라 즉시 예약하는 방식이다.

APPROVAL은 관리자 승인 없이는 확정되지 않는 방식으로 설계됐다. 이를 구현하려면 PENDING 상태를 추가하고, 관리자 승인/거절 API와 화면을 별도로 만들어야 한다.

그런데 이미 GX 프로그램이 "신청 → WAITING → 관리자 승인 → CONFIRMED" 흐름을 완전히 구현하고 있다. 두 흐름이 목적상 동일하다는 점에서 APPROVAL을 따로 구현할지 여부를 결정해야 했다.

---

## 선택지

- **옵션 A**: APPROVAL 예약 흐름 전면 구현 — PENDING 상태, 관리자 승인/거절 API, 관리자 화면 신규 추가
- **옵션 B**: APPROVAL 수신 시 throw 처리, FE에서 GX 프로그램 신청으로 안내
- **옵션 C**: APPROVAL 타입 자체를 제거하고 GX 시설은 `typeCode=GX`로만 구분

---

## 결정

**옵션 B — APPROVAL 수신 시 throw 처리 유지, GX 프로그램 흐름으로 안내**

---

## 이유

옵션 A는 GX 프로그램이 이미 담당하는 기능을 중복 구현하는 것이다. 신청→대기→승인→확정 흐름이 두 곳에 생기면 운영 화면도 두 곳이 되고, 정책 변경 시 두 곳을 모두 수정해야 한다.

옵션 C는 `reservation_type=APPROVAL` 데이터를 제거하거나 마이그레이션해야 한다. 부트스트랩으로 초기화되는 타입 정보가 바뀌면 기존 시설 데이터와 정합성 문제가 생길 수 있고, 코드 변경 범위도 크다.

옵션 B는 현재 구조를 유지하면서 가장 작은 변경으로 의도를 표현한다. "APPROVAL로 직접 예약 시도하면 오류" — 이 throw 자체가 "이 경로는 의도적으로 막아둔 것"이라는 코드 수준의 문서다. FE에서는 `reservationType=APPROVAL`이면 approvalModal을 띄워 "GX 프로그램을 통해 신청해 주세요"로 안내한다. PENDING/APPLIED 상태 설계가 필요한 시점이 오면 그때 옵션 A로 전환을 검토한다.

---

## 결과

- `ReservationService.createReservation()`에서 `reservationType=APPROVAL` 수신 시 `INVALID_PARAMETER` throw. 이 처리는 유지한다.
- `ResidentFacilityDetail.vue`에서 APPROVAL 시설 진입 시 "승인형 시설입니다. GX 프로그램을 통해 신청해 주세요." 모달 노출. 일반 예약 버튼 없음.
- APPROVAL 타입은 `reservation_type` 컬럼 값으로 유지되며 GX 시설을 식별하는 용도로 남는다.
- 재검토 조건: PENDING/APPLIED 상태 설계가 확정되거나 GX와 별개의 승인형 시설이 생길 때.
