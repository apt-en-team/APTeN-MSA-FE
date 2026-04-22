<script setup>
// TODO: 공통 카드 컴포넌트 뼈대를 제공합니다.
</script>

<template>
  <div class="base-card">
    <slot>Card Content</slot>
  </div>
</template>

<style scoped>
.base-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
}
</style>
