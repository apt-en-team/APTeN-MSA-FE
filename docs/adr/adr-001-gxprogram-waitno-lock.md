# ADR-001: GX 신청 waitNo 순번 락 전략

- **날짜**: 2026-05-26
- **상태**: 확정
- **관련 서비스**: facility-reservation-service
- **관련 코드**: `GxReservationService`, `GxProgram` (PESSIMISTIC_WRITE)

---

## 배경

GX 프로그램 신청 시 모든 신청자에게 대기 순번(`waitNo`)을 부여한다. waitNo는 "현재 신청자 수 + 1"로 계산하기 때문에, 동시에 여러 사용자가 신청하면 같은 순번이 두 명에게 중복 부여될 수 있다.

이 문제는 GxProgram 엔티티를 기준으로 신청자 수를 읽고 → 순번을 계산하고 → GxReservation을 INSERT하는 세 단계 사이에 다른 트랜잭션이 끼어들 때 발생한다. 어떤 수준의 락으로 이를 막을지 결정이 필요했다.

---

## 선택지

- **옵션 A**: 락 없음 — 동시 충돌 무시. 중복 waitNo 허용
- **옵션 B**: Redis 분산 락 (Redisson RLock)
- **옵션 C**: JPA 비관적 락 (`PESSIMISTIC_WRITE`)
- **옵션 D**: 낙관적 락 (`@Version` 컬럼)

---

## 결정

**옵션 C — JPA 비관적 락 (`PESSIMISTIC_WRITE`)**

---

## 이유

옵션 A는 waitNo 중복이 실제로 발생하면 데이터 정합성이 깨진다. 부트캠프 시연이라도 순번 표시가 신뢰 기반 기능이라 중복은 허용하기 어렵다.

옵션 D(낙관적 락)는 충돌 시 재시도가 발생한다. GX 신청은 사용자 요청이므로 재시도 실패 시 에러를 반환해야 하는데, 사용자 입장에서 "다시 시도해 주세요"는 UX가 나쁘다.

옵션 B와 C를 비교했다. Redisson은 분산 락 외에도 RMap, RSet 같은 범용 분산 자료구조를 제공하는 풀스택 라이브러리다. "waitNo 중복 방지" 하나만 보면 과하고, Redis 연결 장애가 신청 불가로 이어지는 단일 장애 지점이 생긴다.

비관적 락(C)은 GxProgram 단일 엔티티를 트랜잭션 시작 시 SELECT FOR UPDATE로 잠근다. waitNo 계산 → INSERT 전 구간을 하나의 트랜잭션 안에서 직렬화할 수 있어 순번 보장이 단순하다. GX 신청은 고트래픽 시나리오가 아니고(특정 프로그램에 제한된 인원), 락 경합이 적어 성능 영향도 미미하다. 이미 Redis는 좌석 임시 선점(TEMP_HOLD)에 쓰이고 있으므로 용도를 분리하는 것도 명확하다.

> 락 선택 기준: 충돌 빈도 × 서버 규모 두 축. Redis 분산 락은 고트래픽 + 멀티 서버일 때. 단일 엔티티 직렬화는 DB 비관적 락으로 충분.

---

## 결과

`GxReservationService`에서 GxProgram을 `PESSIMISTIC_WRITE`로 조회한 뒤 waitNo를 계산하고 GxReservation을 INSERT한다. 동시 신청이 들어오면 하나의 트랜잭션이 락을 잡고 처리하는 동안 나머지는 대기 후 순차 처리된다. waitNo 중복은 발생하지 않는다.

좌석 임시 선점(TEMP_HOLD)과 역할이 분리된다:
- Redis 기반 TTL 락 → 좌석 선점 (시간 기반 만료 필요)
- DB 비관적 락 → waitNo 순번 보장 (트랜잭션 단위 직렬화)
