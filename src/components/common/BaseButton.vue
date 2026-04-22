<script setup>
// TODO: 공통 버튼 컴포넌트 뼈대를 제공합니다.
</script>

<template>
  <button type="button" class="base-button">
    <slot>Button</slot>
  </button>
</template>

<style scoped>
.base-button {
  padding: 8px 12px;
}
</style>
