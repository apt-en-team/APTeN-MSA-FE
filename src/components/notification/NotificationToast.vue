<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/useNotificationStore'

const props = defineProps({
  variant: {
    type: String,
    default: 'admin', // 'admin' | 'resident'
  },
  duration: {
    type: Number,
    default: 5000,
  },
})

const router = useRouter()
const notificationStore = useNotificationStore()

// 브라우저 정책: AudioContext는 사용자 제스처(클릭 등) 이후에만 소리 재생 가능
// 제스처 전에 도착한 알림은 소리 없이 토스트만 표시하고, 이후부터는 소리가 난다
let audioCtx = null
let audioUnlocked = false

function unlockAudio() {
  if (audioUnlocked) return
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume()
    audioUnlocked = true
  } catch { /* noop */ }
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockAudio, { once: true })
  window.addEventListener('keydown', unlockAudio, { once: true })
}

// 관리자 전용 알림음 — 잠금 해제 전 알림은 소리 없이 스킵
function playSound() {
  if (props.variant !== 'admin') return
  if (!audioUnlocked || !audioCtx) return
  try {
    const oscillator = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    oscillator.connect(gain)
    gain.connect(audioCtx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.4)
  } catch { /* noop */ }
}

// 새 토스트가 추가될 때 자동 제거 타이머 + 알림음
watch(
  () => notificationStore.toasts.length,
  (newLen, oldLen) => {
    if (newLen <= oldLen) return
    const toast = notificationStore.toasts[0]
    if (!toast) return
    playSound()
    setTimeout(() => notificationStore.removeToast(toast.id), props.duration)
  },
)

function handleClick(toast) {
  notificationStore.removeToast(toast.id)
  if (toast.linkPath) router.push(toast.linkPath)
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      :name="variant === 'admin' ? 'toast-admin' : 'toast-resident'"
      tag="div"
      :class="variant === 'admin' ? 'toast-container--admin' : 'toast-container--resident'"
    >
      <div
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-item--${variant}`"
        role="alert"
        @click="handleClick(toast)"
      >
        <div class="toast-item__body">
          <p class="toast-item__title">{{ toast.title }}</p>
          <p v-if="toast.content" class="toast-item__content">{{ toast.content }}</p>
        </div>
        <button class="toast-item__close" @click.stop="notificationStore.removeToast(toast.id)">✕</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
/* 관리자 — 우측 상단 */
.toast-container--admin {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

/* 입주민 — 하단 중앙 */
.toast-container--resident {
  position: fixed;
  bottom: 80px; /* bottom-nav 위 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  pointer-events: none;
  width: 100%;
  max-width: 400px;
  padding: 0 16px;
  box-sizing: border-box;
}

.toast-item {
  pointer-events: all;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  border-radius: 10px;
  background: #fff;
  border-left: 4px solid #4973E5;
}

.toast-item--admin {
  border-left-color: #1e2a3e;
}

.toast-item--admin {
  width: 320px;
  padding: 14px 12px 14px 16px;
}

.toast-item--resident {
  width: 100%;
  padding: 12px 12px 12px 16px;
}

.toast-item__body {
  flex: 1;
  min-width: 0;
}

.toast-item__title {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary, #1a1a2e);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-item__content {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary, #666);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toast-item--resident .toast-item__content {
  -webkit-line-clamp: 1;
}

.toast-item__close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

/* 관리자 트랜지션 — 오른쪽에서 슬라이드인 */
.toast-admin-enter-active,
.toast-admin-leave-active {
  transition: all 0.3s ease;
}
.toast-admin-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-admin-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* 입주민 트랜지션 — 아래에서 슬라이드업 */
.toast-resident-enter-active,
.toast-resident-leave-active {
  transition: all 0.25s ease;
}
.toast-resident-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.toast-resident-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
