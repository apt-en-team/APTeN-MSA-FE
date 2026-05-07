<script setup>
// 입주민 예약 대표 페이지의 안내 카드를 고정 데이터로 구성한다.
const reservationCards = [
  {
    title: '오늘 예약',
    desc: '오늘 이용 예정인 시설 예약을 빠르게 확인할 수 있습니다.',
    tone: 'primary',
  },
  {
    title: '예약 내역',
    desc: '최근 예약 내역과 이용 일정을 한 화면에서 관리할 수 있습니다.',
    tone: 'mint',
  },
  {
    title: '이용 안내',
    desc: '시설별 이용 안내와 실제 예약 상세 목록은 API 연동 후 제공될 예정입니다.',
    tone: 'soft',
  },
]
</script>

<template>
  <section class="resident-feature-page">
    <header class="resident-feature-page__hero">
      <p class="resident-feature-page__eyebrow">RESERVATION</p>
      <h1 class="resident-feature-page__title">내 예약</h1>
      <p class="resident-feature-page__desc">
        내가 신청한 시설 예약 내역을 확인합니다.
      </p>
    </header>

    <!-- 모바일 전용 예약 대표 카드를 세로로 배치한다. -->
    <section class="resident-feature-page__cards">
      <article
        v-for="card in reservationCards"
        :key="card.title"
        class="resident-feature-card"
        :class="`resident-feature-card--${card.tone}`"
      >
        <div class="resident-feature-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div class="resident-feature-card__copy">
          <h2>{{ card.title }}</h2>
          <p>{{ card.desc }}</p>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.resident-feature-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 16px 24px;
}

.resident-feature-page__hero {
  display: grid;
  gap: 8px;
}

.resident-feature-page__eyebrow {
  margin: 0;
  color: var(--resident-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.resident-feature-page__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 700;
}

.resident-feature-page__desc {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.resident-feature-page__cards {
  display: grid;
  gap: 14px;
}

.resident-feature-card {
  display: flex;
  gap: 14px;
  padding: 18px 16px;
  border-radius: 18px;
  background: #FFFFFF;
  box-shadow: 0 4px 14px rgba(73, 115, 229, 0.08);
}

.resident-feature-card--primary {
  border: 1px solid rgba(73, 115, 229, 0.18);
}

.resident-feature-card--mint {
  border: 1px solid rgba(50, 168, 150, 0.18);
}

.resident-feature-card--soft {
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.resident-feature-card__icon {
  display: flex;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(73, 115, 229, 0.1);
  color: var(--resident-primary);
}

.resident-feature-card--mint .resident-feature-card__icon {
  background: rgba(50, 168, 150, 0.12);
  color: #239782;
}

.resident-feature-card--soft .resident-feature-card__icon {
  background: rgba(148, 163, 184, 0.12);
  color: #64748B;
}

.resident-feature-card__icon svg {
  width: 22px;
  height: 22px;
}

.resident-feature-card__copy {
  display: grid;
  gap: 6px;
}

.resident-feature-card__copy h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 700;
}

.resident-feature-card__copy p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
</style>
