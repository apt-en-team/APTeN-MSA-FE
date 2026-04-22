<script setup>
// TODO: 인증 화면 전용 레이아웃 영역을 구성합니다.
</script>

<template>
  <div class="auth-layout">
    <main class="auth-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.auth-layout__main {
  width: 100%;
  max-width: 420px;
}
</style>
