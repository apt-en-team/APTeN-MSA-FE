<script setup>
// 랜딩 페이지 — 입주민/관리자 진입점 분기
// 로그인 불필요, 누구나 접근 가능
</script>

<template>
  <div class="landing">

    <!-- 헤더 -->
    <header class="landing__header">
      <div class="landing__logo">
        <svg viewBox="0 0 28 28" fill="none" class="landing__logo-icon">
          <rect width="28" height="28" rx="6" fill="#4973e5"/>
          <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
          <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
        </svg>
        <span class="landing__logo-text">아파트엔</span>
      </div>
    </header>

    <!-- 히어로 -->
    <main class="landing__main">
      <div class="landing__hero">
        <p class="landing__hero-sub">SMART APARTMENT MANAGEMENT</p>
        <h1 class="landing__hero-title">아파트엔</h1>
        <p class="landing__hero-desc">스마트 주거생활 통합 관리 시스템</p>
        <div class="landing__hero-line"></div>
      </div>

      <!-- 카드 -->
      <div class="landing__cards">

        <!-- 입주민 -->
        <RouterLink to="/login" class="landing__card landing__card--resident">
          <div class="landing__card-top">
            <div class="landing__card-icon-wrap landing__card-icon-wrap--resident">
              <svg viewBox="0 0 24 24" fill="none" class="landing__card-icon">
                <path d="M3 12L12 3l9 9" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round"/>
                <path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <p class="landing__card-label">입주민</p>
              <h2 class="landing__card-title">바로가기</h2>
            </div>
          </div>
          <p class="landing__card-desc">차량·시설 예약·자동 공지·주거 정보</p>
          <div class="landing__card-arrow">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </RouterLink>

        <!-- 관리자 -->
        <RouterLink to="/admin/login" class="landing__card landing__card--admin">
          <div class="landing__card-top">
            <div class="landing__card-icon-wrap landing__card-icon-wrap--admin">
              <svg viewBox="0 0 24 24" fill="none" class="landing__card-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor"
                      stroke-width="2"/>
                <path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div>
              <p class="landing__card-label">관리자</p>
              <h2 class="landing__card-title">바로가기</h2>
            </div>
          </div>
          <p class="landing__card-desc">세대 관리·승인·통계관리·주차 통계</p>
          <div class="landing__card-arrow">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </RouterLink>

      </div>
    </main>

    <!-- 푸터 -->
    <footer class="landing__footer">
      <p class="landing__footer-msg">아파트엔을 오신 것을 환영합니다 🎉</p>
      <div class="landing__footer-links">
        <a href="#" class="landing__footer-link">개인정보처리방침</a>
        <span class="landing__footer-sep">·</span>
        <a href="#" class="landing__footer-link">개인정보처리위탁</a>
        <span class="landing__footer-sep">·</span>
        <a href="#" class="landing__footer-link">고객문의</a>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f1b2d;
  color: white;
}

/* 헤더 */
.landing__header {
  padding: 20px 32px;
}

.landing__logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.landing__logo-icon {
  width: 28px;
  height: 28px;
}

.landing__logo-text {
  font-size: 17px;
  font-weight: 700;
  color: white;
}

/* 히어로 */
.landing__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 48px;
}

.landing__hero {
  text-align: center;
}

.landing__hero-sub {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.45);
  margin: 0 0 12px;
}

.landing__hero-title {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1px;
  color: white;
  margin: 0 0 12px;
}

.landing__hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 20px;
}

.landing__hero-line {
  width: 40px;
  height: 3px;
  background: #4973e5;
  border-radius: 2px;
  margin: 0 auto;
}

/* 카드 */
.landing__cards {
  display: flex;
  gap: 16px;
  width: 100%;
  max-width: 740px;
}

.landing__card {
  flex: 1;
  border-radius: 16px;
  padding: 28px 24px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  cursor: pointer;
}

.landing__card:hover {
  transform: translateY(-4px);
}

.landing__card--resident {
  background: #3655d4;
  box-shadow: 0 8px 32px rgba(73, 115, 229, 0.35);
}

.landing__card--resident:hover {
  box-shadow: 0 12px 40px rgba(73, 115, 229, 0.5);
}

.landing__card--admin {
  background: #1a2a3f;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.landing__card--admin:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.landing__card-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.landing__card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.landing__card-icon-wrap--resident {
  background: rgba(255, 255, 255, 0.2);
}

.landing__card-icon-wrap--admin {
  background: rgba(255, 255, 255, 0.1);
}

.landing__card-icon {
  width: 22px;
  height: 22px;
  color: white;
}

.landing__card-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 2px;
}

.landing__card-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0;
}

.landing__card-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
  margin: 0;
}

.landing__card-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  align-self: flex-end;
}

.landing__card-arrow svg {
  width: 16px;
  height: 16px;
  color: white;
}

/* 푸터 */
.landing__footer {
  padding: 24px 32px;
  text-align: center;
}

.landing__footer-msg {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 0 8px;
}

.landing__footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.landing__footer-link {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  transition: color 0.15s;
}

.landing__footer-link:hover {
  color: rgba(255, 255, 255, 0.7);
}

.landing__footer-sep {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
}

/* 모바일 */
@media (max-width: 520px) {
  .landing__cards {
    flex-direction: column;
  }

  .landing__hero-title {
    font-size: 32px;
  }
}
</style>
