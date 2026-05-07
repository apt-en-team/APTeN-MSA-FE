<script setup>
// 입주민 주차 현황 대표 페이지의 안내 카드를 준비한다.
const parkingCards = [
  {
    title: '주차 가능 현황',
    desc: '현재 단지의 주차 가능 현황을 빠르게 확인할 수 있습니다.',
    tone: 'primary',
  },
  {
    title: '최근 입출차 기록',
    desc: '최근 차량 입출차 이력과 이용 흐름을 확인할 수 있습니다.',
    tone: 'mint',
  },
  {
    title: '준비중 안내',
    desc: '실제 주차 API 연동 후 사용량과 입출차 기록이 함께 제공될 예정입니다.',
    tone: 'soft',
  },
]
</script>

<template>
  <section class="resident-feature-page">
    <header class="resident-feature-page__hero">
      <p class="resident-feature-page__eyebrow">PARKING</p>
      <h1 class="resident-feature-page__title">주차 현황</h1>
      <p class="resident-feature-page__desc">
        우리 단지 주차 현황과 입출차 기록을 확인합니다.
      </p>
    </header>

    <!-- 모바일 카드형으로 주차 현황 대표 정보를 보여준다. -->
    <section class="resident-feature-page__cards">
      <article
        v-for="card in parkingCards"
        :key="card.title"
        class="resident-feature-card"
        :class="`resident-feature-card--${card.tone}`"
      >
        <div class="resident-feature-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
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
