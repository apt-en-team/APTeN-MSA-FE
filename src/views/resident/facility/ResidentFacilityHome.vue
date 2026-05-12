<script setup>
// 입주민 시설 목록 대표 페이지의 고정 카드 데이터를 준비한다.
const featureCards = [
  {
    title: '시설 둘러보기',
    desc: '우리 단지에서 이용 가능한 공용 시설을 확인할 수 있습니다.',
    tone: 'primary',
  },
  {
    title: '예약 가능 시설',
    desc: '예약 가능한 시설과 이용 시간을 한눈에 살펴볼 수 있습니다.',
    tone: 'mint',
  },
  {
    title: '준비중 안내',
    desc: '실제 시설 조회 API 연결 후 상세 목록과 예약 화면이 함께 제공될 예정입니다.',
    tone: 'soft',
  },
]
</script>

<template>
  <section class="resident-feature-page">
    <header class="resident-feature-page__hero">
      <p class="resident-feature-page__eyebrow">FACILITY</p>
      <h1 class="resident-feature-page__title">시설 목록</h1>
      <p class="resident-feature-page__desc">
        우리 단지에서 이용 가능한 시설을 확인하고 예약할 수 있습니다.
      </p>
    </header>

    <!-- 모바일 PWA 톤에 맞춘 카드형 대표 섹션이다. -->
    <section class="resident-feature-page__cards">
      <article
        v-for="card in featureCards"
        :key="card.title"
        class="resident-feature-card"
        :class="`resident-feature-card--${card.tone}`"
      >
        <div class="resident-feature-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18" />
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
