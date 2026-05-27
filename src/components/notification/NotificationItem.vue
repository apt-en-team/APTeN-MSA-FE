<script setup>
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/useNotificationStore'

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['read-error'])

const router = useRouter()
const notificationStore = useNotificationStore()

// 클릭 시: 읽음 처리 후 linkPath 이동
async function handleClick() {
  if (!props.notification.isRead) {
    try {
      await notificationStore.markAsRead(props.notification.notificationId)
    } catch {
      // 읽음 처리 실패 시 부모에 에러 전달 (화면에서 안내)
      emit('read-error', '알림 읽음 처리에 실패했습니다.')
      return
    }
  }

  // linkPath가 있으면 해당 경로로 이동
  if (props.notification.linkPath) {
    router.push(props.notification.linkPath)
  }
}

// createdAt 포맷 (간단하게 날짜+시간)
function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yy}.${mm}.${dd} ${hh}:${min}`
}
</script>

<template>
  <li
    class="notif-item"
    :class="{ 'is-unread': !notification.isRead }"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
  >
    <!-- 미읽음 인디케이터 -->
    <span v-if="!notification.isRead" class="notif-item__dot" aria-hidden="true" />

    <div class="notif-item__body">
      <!-- 타입 라벨 + 제목 -->
      <div class="notif-item__header">
        <span v-if="notification.type" class="notif-item__type">{{ notification.type }}</span>
        <strong class="notif-item__title">{{ notification.title }}</strong>
      </div>

      <!-- 내용 -->
      <p v-if="notification.content" class="notif-item__content">
        {{ notification.content }}
      </p>

      <!-- 발생 일시 -->
      <time class="notif-item__time">{{ formatDate(notification.createdAt) }}</time>
    </div>
  </li>
</template>

<style scoped>
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s;
  list-style: none;
}

.notif-item:hover {
  background: var(--color-bg-muted);
}

.notif-item.is-unread {
  background: rgba(73, 115, 229, 0.04);
}

.notif-item.is-unread:hover {
  background: rgba(73, 115, 229, 0.08);
}

/* 미읽음 파란 점 */
.notif-item__dot {
  display: flex;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
  background: #4973E5;
}

.notif-item__body {
  flex: 1;
  min-width: 0;
}

.notif-item__header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.notif-item__type {
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(73, 115, 229, 0.1);
  color: #4973E5;
  font-size: 11px;
  font-weight: 700;
}

.notif-item__title {
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-item__content {
  margin: 0 0 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notif-item__time {
  color: var(--color-text-secondary);
  font-size: 11px;
  opacity: 0.72;
}
</style>
