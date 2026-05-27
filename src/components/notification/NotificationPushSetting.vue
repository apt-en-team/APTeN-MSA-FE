<script setup>
import { ref } from 'vue'
import { isFcmEnabled, requestPermission, registerToken } from '@/services/fcmService'

// FCM 활성 여부 (env 기반)
const fcmEnabled = isFcmEnabled()

// 권한 요청 진행 상태
const requesting = ref(false)
const inlineMessage = ref('')
const inlineType = ref('') // 'success' | 'error'

// 푸시 알림 허용하기 — HTTPS + VITE_FCM_ENABLED=true 환경에서만 동작
async function handleEnablePush() {
  requesting.value = true
  inlineMessage.value = ''

  try {
    const { granted } = await requestPermission()

    if (!granted) {
      inlineMessage.value = '브라우저 알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.'
      inlineType.value = 'error'
      return
    }

    await registerToken()
    inlineMessage.value = '푸시 알림이 활성화되었습니다.'
    inlineType.value = 'success'
  } catch (e) {
    console.error(e)
    inlineMessage.value = '푸시 알림 등록 중 오류가 발생했습니다.'
    inlineType.value = 'error'
  } finally {
    requesting.value = false
  }
}
</script>

<template>
  <section class="push-setting">
    <h3 class="push-setting__title">푸시 알림</h3>

    <!-- HTTP 환경 또는 FCM 비활성 시 안내 표시 -->
    <div v-if="!fcmEnabled" class="push-setting__notice">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="push-setting__notice-icon">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p class="push-setting__notice-text">
        현재 환경에서는 푸시 알림이 비활성화되어 있습니다.<br>
        HTTPS 배포 환경에서 지원됩니다.
      </p>
    </div>

    <!-- HTTPS 환경(FCM 활성)에서 표시 -->
    <div v-else class="push-setting__active">
      <p class="push-setting__desc">
        기기에 푸시 알림을 허용하면 앱을 열지 않아도 새 알림을 받을 수 있습니다.
      </p>

      <button
        type="button"
        class="push-setting__btn"
        :disabled="requesting"
        @click="handleEnablePush"
      >
        {{ requesting ? '처리 중...' : '푸시 알림 허용하기' }}
      </button>

      <!-- 인라인 결과 메시지 -->
      <p
        v-if="inlineMessage"
        class="push-setting__inline-msg"
        :class="inlineType === 'success' ? 'is-success' : 'is-error'"
      >
        {{ inlineMessage }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.push-setting {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
}

.push-setting__title {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.push-setting__notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-8);
  background: rgba(245, 166, 35, 0.08);
  border: 1px solid rgba(245, 166, 35, 0.24);
}

.push-setting__notice-icon {
  flex-shrink: 0;
  color: var(--color-warning);
  margin-top: 1px;
}

.push-setting__notice-text {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.push-setting__desc {
  margin: 0 0 14px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.push-setting__btn {
  height: 36px;
  padding: 0 18px;
  border: none;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.push-setting__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.push-setting__inline-msg {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
}

.push-setting__inline-msg.is-success {
  color: var(--color-success);
}

.push-setting__inline-msg.is-error {
  color: var(--color-danger);
}
</style>
