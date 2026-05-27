<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/useNotificationStore'

const notificationStore = useNotificationStore()

// 99 초과면 99+ 표시, 0이면 숨김
const badgeLabel = computed(() => notificationStore.unreadBadgeLabel)
const visible = computed(() => notificationStore.hasUnread)
</script>

<template>
  <!-- unreadCount가 0이면 렌더링하지 않음 -->
  <span v-if="visible" class="notif-badge" aria-label="미읽음 알림">
    {{ badgeLabel }}
  </span>
</template>

<style scoped>
.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  display: inline-flex;
  min-width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 999px;
  background: #E53E3E;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
</style>
