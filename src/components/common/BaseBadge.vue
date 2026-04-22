<script setup>
// TODO: 공통 뱃지 컴포넌트 뼈대를 제공합니다.
</script>

<template>
  <span class="base-badge">
    <slot>Badge</slot>
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-block;
  padding: 4px 8px;
}
</style>
