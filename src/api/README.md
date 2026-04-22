# API / Store 규칙

## API 규칙

- 페이지(View) 또는 Store에서 axios를 직접 import하여 사용하지 않는다.
- 모든 HTTP 요청은 반드시 apiClient.js를 통해서만 처리한다.
- API 파일은 auth, board, reservation, vehicle, notification 등 도메인별로 분리하여 관리한다.
- API endpoint 경로는 백엔드 명세서와 동일하게 유지한다.
- 인증 헤더 주입, 토큰 재발급, 공통 에러 처리는 interceptor 구조에서만 처리하고, 개별 API에서는 구현하지 않는다.

## Store 규칙

- 모든 store는 state / getters / actions 구조를 유지한다.
- View(페이지)에서 axios를 직접 호출하지 않는다.
- View는 반드시 store 또는 도메인 API 모듈을 통해서만 데이터 요청을 수행한다.
- 요구사항이 확정되기 전까지는 store에 비즈니스 로직을 작성하지 않는다.

## View 규칙

- views 폴더는 페이지 단위 컴포넌트만 작성한다.
- 버튼, 모달, 배지, 드롭다운, 폼 내부 컴포넌트는 components로 분리한다.
- 페이지 파일명에 View 접미사를 사용하지 않는다.
