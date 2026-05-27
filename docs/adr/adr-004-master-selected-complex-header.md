# ADR-004: MASTER 선택 단지 컨텍스트를 전용 헤더로 분리

- **날짜**: 2026-05-26
- **상태**: 확정
- **관련 서비스**: 전 서비스 공통 (Gateway, facility-reservation-service 외)
- **관련 코드**: `X-Selected-Complex-Id` 헤더, `FacilityRequestContextResolver`

---

## 배경

`ADMIN`/`MANAGER`는 자기 단지 기준으로만 작업하지만, `MASTER`는 여러 단지를 오가며 작업한다. 기존 `X-Complex-Id` 하나에 로그인 컨텍스트와 작업 대상 단지를 같이 실으면 서비스별 해석이 달라지고 잘못된 단지 데이터에 접근할 위험이 생긴다.

## 선택지

- **옵션 A**: `X-Complex-Id` 하나로 MASTER도 처리
- **옵션 B**: Request Body / Query Parameter로 `complexId` 전달
- **옵션 C**: `X-Selected-Complex-Id` 전용 헤더 추가
- **옵션 D**: MASTER 전용 API 경로 별도 설계

## 결정

**옵션 C**

## 이유

A는 로그인 컨텍스트와 작업 대상이 뒤섞인다. B는 클라이언트가 `complexId`를 자유롭게 보낼 수 있어 서비스마다 접근 권한 재검증 부담이 커지고, 헤더 기반으로 통일된 현재 구조와도 맞지 않는다. D는 권한별로 URL 체계를 이중 관리해야 해서 불필요하게 구조가 커진다.

C는 기존 헤더 구조를 유지하면서 두 컨텍스트를 명확히 분리한다. `ADMIN`/`MANAGER`는 기존 흐름 그대로, `MASTER`만 `X-Selected-Complex-Id`를 추가로 전달하면 된다.

## 결과

MASTER 요청에 한해 `X-Selected-Complex-Id`를 함께 전달한다. 각 서비스는 resolver 계층에서 이 헤더를 해석해 최종 작업 단지를 결정한다. `ADMIN`/`MANAGER`는 기존 `X-Complex-Id` 흐름을 유지한다.
