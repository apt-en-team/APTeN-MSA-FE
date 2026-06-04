<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const authStore = useAuthStore()

function goHome() {
  const role = authStore.role
  if (role === 'USER') router.push(`/resident/${authStore.complexId}/home`)
  else if (role === 'MANAGER' || role === 'ADMIN') router.push('/admin/dashboard')
  else if (role === 'MASTER') router.push('/admin/master')
  else router.push('/')
}
</script>

<template>
  <div class="not-found">
    <div class="not-found__box">
      <p class="not-found__code">404</p>
      <p class="not-found__title">페이지를 찾을 수 없습니다.</p>
      <p class="not-found__desc">주소가 잘못되었거나 삭제된 페이지예요.</p>
      <button class="not-found__btn" type="button" @click="goHome">홈으로 돌아가기</button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8fafc;
}

.not-found__box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 32px;
  text-align: center;
}

.not-found__code {
  margin: 0;
  font-size: 72px;
  font-weight: 800;
  color: #4973e5;
  font-family: 'Noto Sans KR', sans-serif;
  line-height: 1;
}

.not-found__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.not-found__desc {
  margin: 0;
  font-size: 14px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.not-found__btn {
  margin-top: 8px;
  height: 44px;
  padding: 0 28px;
  background: #4973e5;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.not-found__btn:hover {
  background: #3a5ec8;
}
</style>
