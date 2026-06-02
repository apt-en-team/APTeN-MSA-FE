<script setup>
import {onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuthStore} from '@/stores/useAuthStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const RESIDENT_RESTRICTED_STATUSES = ['PENDING', 'REJECTED', '01', '03', '대기', '반려', '거절']

onMounted(() => {
  const { accessToken, refreshToken, userId, userUid, name, role, status, building, unit, complexId } = route.query

  // 토큰이 없으면 로그인 페이지로
  if (!accessToken) {
    router.replace('/login')
    return
  }

  // 스토어에 인증 정보 저장
  authStore.setAuth({
    accessToken,
    refreshToken,
    userId,
    userUid,
    name,
    role,
    status,
    building,
    unit,
    complexId,
  })

  // 역할별 페이지로 이동
  if (role === 'USER' && RESIDENT_RESTRICTED_STATUSES.includes(status)) {
    router.replace(`/resident/${complexId}/pending`)
  } else if (role === 'USER') {
    router.replace(`/resident/${complexId}/home`)
  } else if (role === 'ADMIN') {
    router.replace('/admin/dashboard')
  } else if (role === 'MASTER') {
    router.replace('/admin/master/complexes')
  } else {
    router.replace('/login')
  }
})
</script>

<template>
  <!-- 처리 중 로딩 표시 -->
  <div class="callback">
    <div class="callback__spinner"></div>
    <p class="callback__text">로그인 처리 중...</p>
  </div>
</template>

<style scoped>
.callback {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-16);
  background: var(--resident-bg-1);
}

.callback__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(73, 115, 229, 0.2);
  border-top-color: var(--resident-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.callback__text {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
