-- ============================================================
-- 시설 구독 테스트 데이터 삽입 스크립트
-- UI-652 (입주민 해지 버튼) / UI-653 (요금 안내) 검증용
-- 작성일: 2026-05-24
-- ============================================================

-- ■ STEP 1: 현재 데이터 확인 쿼리
-- 아래 쿼리를 먼저 실행하여 복사할 ID 값들을 확인한다.

-- 1-1. FLAT/PER_PERSON 요금 정책이 있는 시설 목록 조회
SELECT
    f.id          AS facility_id,
    f.name        AS facility_name,
    p.fee_type,
    p.base_fee,
    f.complex_id
FROM facility f
JOIN facility_policy p ON p.facility_id = f.id AND p.is_active = true
WHERE p.fee_type IN ('FLAT', 'PER_PERSON')
ORDER BY f.complex_id, f.name;

-- 1-2. 내 계정의 household_member_cache 확인 (userId는 로그인 후 JWT에서 확인)
-- 본인 userId를 넣어서 실행
SELECT
    hmc.user_id,
    hmc.household_id,
    hmc.status
FROM household_member_cache hmc
WHERE hmc.status = 'ACTIVE'
ORDER BY hmc.user_id;

-- 1-3. 기존 구독 데이터 확인
SELECT
    s.id,
    s.complex_id,
    s.household_id,
    s.facility_id,
    f.name AS facility_name,
    s.subscribed_at,
    s.cancelled_at,
    s.status   -- '01'=ACTIVE, '02'=CANCELLED
FROM facility_subscription s
LEFT JOIN facility f ON f.id = s.facility_id
ORDER BY s.subscribed_at DESC;


-- ■ STEP 2: 테스트 구독 데이터 삽입
-- STEP 1 결과를 보고 아래 값을 교체한 뒤 실행한다.

-- [교체 필요]
--   {COMPLEX_ID}   → 단지 ID (예: 1234567890123456789)
--   {FACILITY_ID}  → FLAT/PER_PERSON 시설 ID (STEP 1-1 결과)
--   {HOUSEHOLD_ID} → 내 세대 ID (STEP 1-2 결과)
--   {TSID}         → TSID 형식 숫자 (18자리, 아무 숫자나 고유하게 입력)

-- 2-1. ACTIVE 상태 구독 (해지 버튼 정상 작동 검증용)
INSERT INTO facility_subscription
    (id, complex_id, household_id, facility_id, subscribed_at, cancelled_at, status, created_at, updated_at)
VALUES
    (1000000000000000001, {COMPLEX_ID}, {HOUSEHOLD_ID}, {FACILITY_ID}, '2026-04-01', NULL, '01', NOW(), NOW());

-- 2-2. CANCELLED 상태 구독 (해지 불가 → 오류 메시지 검증용)
--      이미 해지된 경우 BE에서 SUBSCRIPTION_NOT_FOUND 반환
INSERT INTO facility_subscription
    (id, complex_id, household_id, facility_id, subscribed_at, cancelled_at, status, created_at, updated_at)
VALUES
    (1000000000000000002, {COMPLEX_ID}, {HOUSEHOLD_ID}, {FACILITY_ID}, '2026-03-01', '2026-03-25', '02', NOW(), NOW());


-- ■ STEP 3: 관리자 구독 현황 화면용 다계정 샘플 데이터
-- 관리자 페이지에서 여러 세대의 구독 데이터를 보려면 아래 실행
-- {HOUSEHOLD_ID_2}, {HOUSEHOLD_ID_3} 은 다른 세대 ID로 교체

INSERT INTO facility_subscription
    (id, complex_id, household_id, facility_id, subscribed_at, cancelled_at, status, created_at, updated_at)
VALUES
    (1000000000000000003, {COMPLEX_ID}, {HOUSEHOLD_ID_2}, {FACILITY_ID}, '2026-04-15', NULL, '01', NOW(), NOW()),
    (1000000000000000004, {COMPLEX_ID}, {HOUSEHOLD_ID_3}, {FACILITY_ID}, '2026-03-20', '2026-04-20', '02', NOW(), NOW()),
    (1000000000000000005, {COMPLEX_ID}, {HOUSEHOLD_ID_2}, {FACILITY_ID}, '2026-05-01', NULL, '01', NOW(), NOW());


-- ■ 정리 (테스트 후 삭제)
-- DELETE FROM facility_subscription WHERE id IN (
--     1000000000000000001,
--     1000000000000000002,
--     1000000000000000003,
--     1000000000000000004,
--     1000000000000000005
-- );
