<script setup>
// TODO: 입주민 하단 내비게이션 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <nav class="bottom-nav">
    <div class="bottom-nav__item">
      <span class="bottom-nav__icon" />
      <span class="bottom-nav__label">Home</span>
    </div>
    <div class="bottom-nav__item">
      <span class="bottom-nav__icon" />
      <span class="bottom-nav__label">Menu</span>
    </div>
    <div class="bottom-nav__item">
      <span class="bottom-nav__icon" />
      <span class="bottom-nav__label">My</span>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--space-8) var(--space-16) calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(73, 115, 229, 0.12);
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) 0;
  color: var(--color-text-secondary);
}

.bottom-nav__icon {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background-color: rgba(73, 115, 229, 0.18);
}

.bottom-nav__label {
  font-size: var(--font-size-label);
}
</style>
