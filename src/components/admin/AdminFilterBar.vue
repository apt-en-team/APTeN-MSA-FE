<script setup>
// TODO: 관리자 화면에서 공통으로 사용하는 검색/필터 래퍼 컴포넌트입니다.
const emit = defineEmits(['reset', 'search'])

// 필터 초기화
const handleReset = () => {
  emit('reset')
}

// 검색 이벤트를 상위 화면으로 전달합니다.
const handleSearch = () => {
  emit('search')
}
</script>

<template>
  <section class="admin-filter-bar">
    <div class="admin-filter-bar__controls">
      <slot />
    </div>

    <div class="admin-filter-bar__actions">
      <button type="button" class="admin-filter-bar__button admin-filter-bar__button--ghost" @click="handleReset">
        <span class="admin-filter-bar__icon" aria-hidden="true">↺</span>
        초기화
      </button>
      <button type="button" class="admin-filter-bar__button admin-filter-bar__button--primary" @click="handleSearch">
        조회
      </button>
    </div>
  </section>
</template>

<style scoped>
.admin-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #E2E8F0;
  border-radius: var(--radius-12) var(--radius-12) 0 0;
  background: #F5F6F8;
}

.admin-filter-bar__controls {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.admin-filter-bar__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.admin-filter-bar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.admin-filter-bar__button--ghost {
  border: 1px solid #E2E8F0;
  background: var(--color-card-bg);
  color: #1E2A3E;
}

.admin-filter-bar__button--primary {
  border: none;
  background: #2B3A55;
  color: var(--color-white);
}

.admin-filter-bar__icon {
  font-size: 14px;
  line-height: 1;
}

@media (max-width: 960px) {
  .admin-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-filter-bar__actions {
    justify-content: flex-end;
  }
}
</style>
