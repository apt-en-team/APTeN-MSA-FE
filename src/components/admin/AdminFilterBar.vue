<script setup>
// 1차 관리자 화면 스타일을 유지한 공통 필터바이다.
// 검색 실행과 초기화 이벤트를 부모 컴포넌트로 전달한다.
const emit = defineEmits(['search', 'reset'])
</script>

<template>
  <div class="filter-bar">
    <div class="filter-left">
      <!-- 검색 입력과 필터 요소는 slot으로 주입한다. -->
      <slot />
      <button class="btn-reset" @click="emit('reset')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        초기화
      </button>
    </div>
    <div v-if="$slots.right" class="filter-right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #E2E8F0;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #FFFFFF;
  font-size: 12px;
  color: #687282;
  cursor: pointer;
}

.btn-reset:hover {
  background: #F5F6F8;
}
</style>
