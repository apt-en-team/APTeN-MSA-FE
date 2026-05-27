<script setup>
import { ref } from 'vue'
import { deregisterToken, getRegisteredToken, isFcmEnabled, requestPermission, registerToken } from '@/services/fcmService'

// FCM 활성 여부 (env 기반)
const fcmEnabled = isFcmEnabled()

// 권한 요청 진행 상태
const requesting = ref(false)
const registered = ref(resolveRegistered())
const inlineMessage = ref('')
const inlineType = ref('') // 'success' | 'error'

function hasGrantedNotificationPermission() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

function resolveRegistered() {
  // 권한만 granted여도 서버 등록에 성공한 로컬 토큰이 없으면 실제 푸시 ON 상태로 보지 않는다
  return fcmEnabled && hasGrantedNotificationPermission() && Boolean(getRegisteredToken())
}

// 푸시 토글은 OFF→ON이면 권한/토큰 등록, ON→OFF면 서버 토큰 비활성화를 실행한다
async function handleTogglePush() {
  if (!fcmEnabled || requesting.value) return

  if (registered.value) {
    await disablePush()
    return
  }

  await enablePush()
}

async function enablePush() {
  requesting.value = true
  inlineMessage.value = ''

  try {
    const { granted } = await requestPermission()

    if (!granted) {
      registered.value = false
      inlineMessage.value = '브라우저 알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.'
      inlineType.value = 'error'
      return
    }

    const token = await registerToken()
    registered.value = Boolean(token) && resolveRegistered()
  } catch (e) {
    console.error(e)
    registered.value = false
    inlineMessage.value = '푸시 알림 등록 중 오류가 발생했습니다.'
    inlineType.value = 'error'
  } finally {
    requesting.value = false
  }
}

async function disablePush() {
  requesting.value = true
  inlineMessage.value = ''

  try {
    const token = getRegisteredToken()
    if (!token) {
      // 로컬 토큰이 없으면 서버에서 지울 대상도 없으므로 OFF 상태만 정리한다
      registered.value = false
      return
    }

    await deregisterToken(token)
    registered.value = false
  } catch (e) {
    console.error(e)
    registered.value = true
    inlineMessage.value = '푸시 알림 해제 중 오류가 발생했습니다.'
    inlineType.value = 'error'
  } finally {
    requesting.value = false
  }
}
</script>

<template>
  <section class="push-setting">
    <div class="push-setting__copy">
      <h3 class="push-setting__title">푸시 알림</h3>
      <p class="push-setting__desc">앱 밖에서도 알림을 받습니다.</p>
      <p v-if="!fcmEnabled" class="push-setting__notice-text">
        지원되는 환경에서 사용할 수 있습니다.
      </p>
    </div>

    <div class="push-setting__action">
      <button
        type="button"
        role="switch"
        :aria-checked="registered"
        class="push-setting__toggle"
        :class="{ 'is-on': registered }"
        :disabled="!fcmEnabled || requesting"
        @click="handleTogglePush"
      >
        <span class="push-setting__toggle-thumb" />
      </button>
    </div>

    <!-- 인라인 결과 메시지 -->
    <p
      v-if="inlineMessage"
      class="push-setting__inline-msg"
      :class="inlineType === 'success' ? 'is-success' : 'is-error'"
    >
      {{ inlineMessage }}
    </p>
  </section>
</template>

<style scoped>
.push-setting {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #FFFFFF;
}

.push-setting__copy {
  min-width: 0;
}

.push-setting__title {
  margin: 0;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.push-setting__desc {
  margin: 4px 0 0;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.push-setting__notice-text {
  margin: 6px 0 0;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: var(--color-warning);
}

.push-setting__action {
  display: flex;
  justify-content: flex-end;
}

.push-setting__toggle {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: #CBD5E1;
  cursor: pointer;
  transition: background 0.2s, opacity 0.15s;
}

.push-setting__toggle.is-on {
  background: var(--resident-primary, #4973E5);
}

.push-setting__toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.push-setting__toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.28);
  transition: transform 0.2s;
}

.push-setting__toggle.is-on .push-setting__toggle-thumb {
  transform: translateX(20px);
}

.push-setting__inline-msg {
  grid-column: 1 / -1;
  margin: 0;
  font-family: 'Noto Sans KR', sans-serif;
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
