# ADR-005: 단지 기능 활성화 여부를 feature cache 기반으로 통제

- **날짜**: 2026-05-26
- **상태**: 확정
- **관련 서비스**: 전 서비스 공통 (facility-reservation-service, parking-vehicle-service 외)
- **관련 코드**: `complex_feature_cache`, `FeatureAccessService`, Kafka `complex.feature.changed`

---

## 배경

단지별로 기능(FACILITY, PARKING 등) ON/OFF가 다를 수 있다. 각 서비스가 단지 서비스 원본 DB를 직접 조회하면 MSA 경계가 깨지고, 로컬 설정으로 각자 판단하면 서비스 간 불일치가 생긴다.

## 선택지

- **옵션 A**: 각 서비스가 단지 서비스 원본 DB 직접 조회
- **옵션 B**: 각 서비스에 기능 설정 개별 보관
- **옵션 C**: Kafka 이벤트로 `complex_feature_cache` 동기화, 캐시 기준 판단
- **옵션 D**: 매 요청마다 단지 서비스 기능 체크 API 호출

## 결정

**옵션 C**

## 이유

A는 서비스 간 직접 DB 의존으로 MSA 경계를 깬다. B는 서비스별 판단 기준이 달라져 불일치가 생긴다. D는 기능 게이트가 자주 호출되는 도메인에서 매 요청마다 네트워크 비용이 추가되고 단지 서비스 장애가 즉시 전파된다.

C는 변경 책임을 단지 서비스에 두고 런타임 판단은 로컬 캐시에서 처리한다. 성능 부담이 없고, `FeatureCode` 기준으로 서비스 간 판단 규칙을 공통화할 수 있다.

## 결과

단지 기능 변경 시 Kafka 이벤트로 각 서비스의 `complex_feature_cache`에 반영한다. 런타임 접근 제어는 `FeatureAccessService.validateEnabled(complexId, FeatureCode.FACILITY)`처럼 로컬 캐시 기준으로 처리한다. `PARKING`, `VOTE` 등 다른 기능 게이트에도 동일한 구조로 확장 가능하다.
