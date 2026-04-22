<script setup>
// TODO: 공통 페이지네이션 컴포넌트 뼈대를 제공합니다.
</script>

<template>
  <div class="base-pagination">
    <button type="button">Prev</button>
    <span>1</span>
    <button type="button">Next</button>
  </div>
</template>

<style scoped>
.base-pagination {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
