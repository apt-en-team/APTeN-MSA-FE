# API / Store 규칙

## API 규칙

- 페이지나 Store에서 `axios`를 직접 import하지 않는다.
- 모든 HTTP 요청은 반드시 `apiClient.js`를 통해서만 처리한다.
- API 파일은 `authApi`, `apartmentComplexApi`, `notificationApi`, `vehicleApi`처럼 명세서 기준 파일명으로 분리한다.
- API endpoint 경로는 백엔드 명세서와 동일하게 유지한다.
- 인증 헤더 주입, 토큰 재발급, 403 이동은 interceptor 구조에서 처리한다.

## Store 규칙

- 모든 store는 `state / getters / actions` 구조를 유지한다.
- View(페이지)에서 `axios`를 직접 호출하지 않는다.
- View는 반드시 store 또는 도메인 API 모듈을 통해서만 요청을 수행한다.
- 요구사항이 확정되기 전까지는 store에 비즈니스 로직을 과도하게 작성하지 않는다.

## View 규칙

- views 폴더는 페이지 단위 컴포넌트만 작성한다.
- 버튼, 모달, 드롭다운, 배지, 폼 내부 컴포넌트는 components로 분리한다.
- 권한명은 `GUEST`, `USER`, `ADMIN`, `MASTER`만 사용한다.
