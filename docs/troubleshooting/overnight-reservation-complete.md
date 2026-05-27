# 자정 초과 예약의 이용완료 조기 전환 버그

## 문제 상황

독서실(오전 9시 ~ 자정 00:00) 또는 야간 운영 시설(예: 09:00 ~ 익일 02:00)을 예약했을 때,
예약 시간이 시작되지도 않았는데 입주민 "내 예약" 화면에서 **이용완료**로 표시됨.

예시:
- 오늘(2026-05-25) 21:00~00:00 독서실 예약
- 오전 10:00에 앱 확인 → 이미 "이용완료" 상태

## 원인

`ReservationCompleteScheduler`는 60초마다 `findCompletableReservations` 쿼리를 실행한다.
기존 쿼리 조건:

```sql
r.reservationDate = :currentDate AND r.endTime < :currentTime
```

`LocalTime`에서 `00:00`(자정)은 **하루의 시작(0초)**이다.
자정 종료 예약의 endTime = `00:00` → `00:00 < 10:00` 이 **항상 TRUE**.

결과적으로 reservationDate = 오늘이고 endTime = 00:00인 예약은
스케줄러가 실행되는 순간 즉시 COMPLETED 처리된다.

같은 원리로 야간 예약(예: 23:00~02:00, endTime = 02:00)도
`02:00 < 10:00` = TRUE 이므로 동일하게 조기 완료 처리된다.

## 해결 방법

`endTime < startTime` 조건으로 야간 예약(자정 초과)을 판별하고,
완료 기준일을 **reservationDate + 1**로 처리한다.

### 수정된 쿼리

```sql
-- 당일 예약 (endTime >= startTime): reservationDate 기준으로 완료
(r.endTime >= r.startTime AND (
  r.reservationDate < :currentDate
  OR (r.reservationDate = :currentDate AND r.endTime <= :currentTime)
))
OR
-- 야간 예약 (endTime < startTime): reservationDate + 1 기준으로 완료
(r.endTime < r.startTime AND (
  r.reservationDate < :yesterday
  OR (r.reservationDate = :yesterday AND r.endTime <= :currentTime)
))
```

Service에서 `yesterday = now.toLocalDate().minusDays(1)` 를 전달.

## 케이스별 검증

| 예약 | endTime vs startTime | 완료 처리 기준 |
|---|---|---|
| 09:00~12:00 | 12:00 ≥ 09:00 (당일) | 당일 12:00 이후 |
| 21:00~00:00 | 00:00 < 21:00 (야간) | 다음날 00:00 이후 |
| 23:00~02:00 | 02:00 < 23:00 (야간) | 다음날 02:00 이후 |
| 09:00~02:00 | 02:00 < 09:00 (야간) | 다음날 02:00 이후 |

## 수정 파일

- `facility-reservation-service/.../domain/repository/ReservationRepository.java`
  - `findCompletableReservations` 쿼리 분기 추가, 파라미터에 `yesterday` 추가
- `facility-reservation-service/.../application/service/ReservationService.java`
  - `completeReservations()` 에서 `now.toLocalDate().minusDays(1)` 전달

## 재발 방지 포인트

- `LocalTime(00:00)` = 0초 = 어떤 낮 시각보다도 작다. **자정 종료를 `00:00`으로 저장하면 반드시 이 문제가 발생한다.**
- 날짜+시간을 분리 저장하는 구조에서 overnight 범위를 다룰 때는 `endTime < startTime` 여부로 야간 판별 후 날짜를 보정해야 한다.
- 비슷한 구조(예: 차단시간, GX 프로그램 시간 범위)에도 동일한 패턴 적용 여부 확인 필요.

## 관련 커밋 메시지

```
fix(reservation): 자정 초과 예약의 이용완료 조기 전환 버그 수정
```
