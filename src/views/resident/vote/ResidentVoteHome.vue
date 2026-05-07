<script setup>
// 입주민 모바일 투표 대표 페이지에서 사용할 카드 데이터를 구성한다.
const voteCards = [
  {
    title: '진행 중 투표',
    desc: '현재 참여 가능한 단지 투표를 확인하고 참여할 수 있습니다.',
    tone: 'primary',
  },
  {
    title: '종료된 투표',
    desc: '마감된 투표와 진행 이력을 한눈에 확인할 수 있습니다.',
    tone: 'mint',
  },
  {
    title: '투표 결과',
    desc: '실제 투표 결과와 상세 화면은 API 연동 후 제공될 예정입니다.',
    tone: 'soft',
  },
]
</script>

<template>
  <section class="resident-feature-page">
    <header class="resident-feature-page__hero">
      <p class="resident-feature-page__eyebrow">VOTE</p>
      <h1 class="resident-feature-page__title">모바일 투표</h1>
      <p class="resident-feature-page__desc">
        진행 중인 단지 투표에 참여하고 결과를 확인합니다.
      </p>
    </header>

    <!-- 모바일 투표 대표 카드를 기존 PWA 톤에 맞춰 배치한다. -->
    <section class="resident-feature-page__cards">
      <article
        v-for="card in voteCards"
        :key="card.title"
        class="resident-feature-card"
        :class="`resident-feature-card--${card.tone}`"
      >
        <div class="resident-feature-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="m9 12 2 2 4-4" />
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
