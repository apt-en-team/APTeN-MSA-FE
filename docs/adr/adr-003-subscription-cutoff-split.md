# ADR-003: 구독 기준일 이중화 — subscribeCutoffDay / cancelCutoffDay 분리

- **날짜**: 2026-05-26
- **상태**: 확정
- **관련 서비스**: facility-reservation-service
- **관련 코드**: `FacilityPolicy`, `FacilityPolicyTab.vue`, `ResidentMySubscriptionView.vue`

---

## 배경

FLAT / PER_PERSON 요금 방식 시설은 구독 기반으로 과금된다. "매월 며칠까지 신청하면 당월 청구, 이후면 익월 청구"처럼 기준일이 필요하다. 초기 설계에서는 `billingCutoffDay` 단일 필드로 신청과 해지를 동일한 기준일로 처리하려 했다.

구현 과정에서 신청 기준일과 해지 기준일이 다를 수 있다는 문제가 제기됐다. 예를 들어 "신청은 10일 이전까지 당월 적용, 해지는 20일 이전까지 당월 적용"처럼 아파트 운영 정책에 따라 두 기준이 독립적으로 설정될 수 있다.

---

## 선택지

- **옵션 A**: `billingCutoffDay` 단일 필드 유지 — 신청과 해지에 같은 기준일 적용
- **옵션 B**: `subscribeCutoffDay`(신청 기준일) + `cancelCutoffDay`(해지 기준일) 두 필드로 분리
- **옵션 C**: 기준일 없이 항상 전액 청구 — 단순화

---

## 결정

**옵션 B — 두 필드 분리**

---

## 이유

옵션 A는 지금은 동일한 기준일을 쓴다고 해도, 나중에 분리하려면 DB 컬럼 추가와 기존 데이터 마이그레이션이 필요하다. 지금 분리해 두면 초기 비용이 거의 없다.

옵션 C는 단순하지만 입주민 UX를 해친다. 기준일 없이 "신청하면 당월 바로 청구, 해지해도 당월 청구"만 하면 해지 시점을 고민할 필요가 없어지지만, 아파트 관리 현장에서 실제 정책과 맞지 않을 가능성이 높다.

옵션 B에서 두 필드를 모두 `nullable`로 설계하면 옵션 C를 포함할 수 있다. `null`이면 항상 전액 청구로 동작하므로 "기준일 없음" 정책도 표현 가능하다. FE에서는 두 값을 오늘 날짜와 각각 비교해 "신청 시 안내 문구"와 "해지 시 안내 문구"를 독립적으로 생성한다.

---

## 결과

`facility_policy` 테이블에 `subscribe_cutoff_day`와 `cancel_cutoff_day` 컬럼을 분리해 추가했다. 두 컬럼 모두 nullable. null이면 항상 전액 청구.

FE 동작:
- **구독 신청 안내** (`ResidentReservationCreate.vue`): 오늘 날짜 vs `subscribeCutoffDay` 비교 → "이번 달 청구" / "다음 달 청구" 분기 메시지
- **구독 해지 안내** (`ResidentMySubscriptionView.vue`): 오늘 날짜 + `hasCompletedThisMonth` vs `cancelCutoffDay` 비교 → 당월/익월 처리 안내 메시지

관리자 정책 화면(`FacilityPolicyTab.vue`)에서 FLAT/PER_PERSON 요금 방식일 때만 두 입력 필드가 노출된다. GX 및 PER_USE 시설은 구독 개념이 없으므로 두 필드 모두 미노출.
