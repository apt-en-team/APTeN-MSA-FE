<script setup>
// TODO: 공통 모달 컴포넌트 뼈대를 제공합니다.
</script>

<template>
  <div class="base-modal">
    <div class="base-modal__content">
      <slot>Modal Content</slot>
    </div>
  </div>
</template>

<style scoped>
.base-modal {
  padding: 16px;
  border: 1px solid #e5e7eb;
}
</style>
