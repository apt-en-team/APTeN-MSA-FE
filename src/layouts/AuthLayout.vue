<script setup>
// TODO: 인증 화면 전용 공통 레이아웃입니다.
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
  padding: var(--space-24);
  background: linear-gradient(180deg, #f8fafc 0%, #eef3fb 100%);
}

.auth-layout__main {
  width: 100%;
  max-width: 420px;
  padding: var(--space-24);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background-color: var(--white);
  box-shadow: var(--shadow-medium);
}
</style>
