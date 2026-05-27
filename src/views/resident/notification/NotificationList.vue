<script setup>
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/useNotificationStore'
import NotificationItem from '@/components/notification/NotificationItem.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const notificationStore = useNotificationStore()

// 에러 결과 모달
const resultModal = ref({ visible: false, type: 'danger', title: '', subtitle: '' })

function showError(msg) {
  resultModal.value = { visible: true, type: 'danger', title: '오류', subtitle: msg }
}

// 초기 진입 시 알림 목록 조회
onMounted(async () => {
  notificationStore.resetNotifications()
  await notificationStore.fetchNotifications()
  await notificationStore.fetchUnreadCount()
})

// 더보기 — 다음 페이지 추가 로드
async function loadMore() {
  if (!notificationStore.hasNext || notificationStore.loading) return
  notificationStore.page += 1
  await notificationStore.fetchNotifications()
}

// 전체 읽음 처리
async function handleMarkAllAsRead() {
  try {
    await notificationStore.markAllAsRead()
  } catch {
    showError('전체 읽음 처리에 실패했습니다.')
  }
}

// NotificationItem에서 읽음 에러 전달받음
function handleReadError(msg) {
  showError(msg)
}
</script>

<template>
  <section class="page-container notif-list-page">
    <!-- 헤더 -->
    <div class="notif-list-page__header">
      <h1 class="notif-list-page__title">알림</h1>
      <button
        v-if="notificationStore.hasUnread"
        type="button"
        class="notif-list-page__read-all-btn"
        :disabled="notificationStore.loading"
        @click="handleMarkAllAsRead"
      >
        전체 읽음
      </button>
    </div>

    <!-- 로딩 (초기 로드) -->
    <div v-if="notificationStore.loading && notificationStore.notifications.length === 0" class="notif-list-page__state">
      불러오는 중...
    </div>

    <!-- 빈 목록 -->
    <div
      v-else-if="!notificationStore.loading && notificationStore.notifications.length === 0"
      class="notif-list-page__empty"
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" class="notif-list-page__empty-icon">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <p>새 알림이 없습니다.</p>
    </div>

    <!-- 알림 목록 -->
    <ul v-else class="notif-list-page__list">
      <NotificationItem
        v-for="item in notificationStore.notifications"
        :key="item.notificationId"
        :notification="item"
        @read-error="handleReadError"
      />
    </ul>

    <!-- 더보기 버튼 -->
    <div v-if="notificationStore.hasNext" class="notif-list-page__more">
      <button
        type="button"
        class="notif-list-page__more-btn"
        :disabled="notificationStore.loading"
        @click="loadMore"
      >
        {{ notificationStore.loading ? '불러오는 중...' : '더보기' }}
      </button>
    </div>
  </section>

  <!-- 에러 결과 모달 -->
  <ActionResultModal
    :visible="resultModal.visible"
    :type="resultModal.type"
    :title="resultModal.title"
    :subtitle="resultModal.subtitle"
    @close="resultModal.visible = false"
  />
</template>

<style scoped>
.notif-list-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.notif-list-page__title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.notif-list-page__read-all-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.notif-list-page__read-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notif-list-page__state {
  padding: 48px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.notif-list-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
  text-align: center;
}

.notif-list-page__empty-icon {
  opacity: 0.36;
}

.notif-list-page__list {
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  overflow: hidden;
}

.notif-list-page__more {
  margin-top: 16px;
  text-align: center;
}

.notif-list-page__more-btn {
  height: 36px;
  padding: 0 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.notif-list-page__more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
