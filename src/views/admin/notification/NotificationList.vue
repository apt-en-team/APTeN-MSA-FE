<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import NotificationItem from '@/components/notification/NotificationItem.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const authStore = useAuthStore()

// MASTER는 알림 기능을 사용하지 않으므로 대시보드로 리다이렉트
if (authStore.role === 'MASTER') {
  router.replace('/admin/dashboard')
}

const notificationStore = useNotificationStore()

// 미읽음만 보기 필터
const filterUnread = ref(false)

// 결과 모달
const resultModal = ref({ visible: false, type: 'danger', title: '', subtitle: '' })

function showError(msg) {
  resultModal.value = { visible: true, type: 'danger', title: '오류', subtitle: msg }
}

const PAGE_SIZE = 6

// 목록 조회 (필터/페이지 파라미터 포함)
// 미읽음 필터: unreadOnly=true → isRead=false, 전체는 undefined
function buildParams() {
  return {
    size: PAGE_SIZE,
    isRead: filterUnread.value ? false : undefined,
  }
}

async function loadNotifications() {
  notificationStore.resetNotifications()
  await notificationStore.fetchNotifications(buildParams())
}

onMounted(async () => {
  await loadNotifications()
  await notificationStore.fetchUnreadCount()
})

// 미읽음 필터 토글
async function toggleFilter() {
  filterUnread.value = !filterUnread.value
  notificationStore.page = 1
  await loadNotifications()
}

// 페이지 변경
async function handlePageChange(newPage) {
  notificationStore.page = newPage
  await notificationStore.fetchNotifications(buildParams())
}

// 전체 읽음 처리
async function handleMarkAllAsRead() {
  try {
    await notificationStore.markAllAsRead()
  } catch {
    showError('전체 읽음 처리에 실패했습니다.')
  }
}

// 읽음 에러 전달받음
function handleReadError(msg) {
  showError(msg)
}
</script>

<template>
  <div class="notif-admin-list">
    <!-- 페이지 헤더 -->
    <div class="notif-admin-list__header">
      <div class="notif-admin-list__header-left">
        <!-- 미읽음만 보기 토글 -->
        <button
          type="button"
          class="notif-admin-list__filter-btn"
          :class="{ 'is-active': filterUnread }"
          @click="toggleFilter"
        >
          미읽음만 보기
        </button>
      </div>

      <button
        v-if="notificationStore.hasUnread"
        type="button"
        class="notif-admin-list__read-all-btn"
        :disabled="notificationStore.loading"
        @click="handleMarkAllAsRead"
      >
        전체 읽음
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="notificationStore.loading && notificationStore.notifications.length === 0" class="notif-admin-list__loading">
      불러오는 중...
    </div>

    <!-- 빈 목록 -->
    <BaseEmpty
      v-else-if="!notificationStore.loading && notificationStore.notifications.length === 0"
    >
      {{ filterUnread ? '미읽음 알림이 없습니다.' : '알림이 없습니다.' }}
    </BaseEmpty>

    <!-- 알림 목록 -->
    <ul v-else class="notif-admin-list__list">
      <NotificationItem
        v-for="item in notificationStore.notifications"
        :key="item.notificationId"
        :notification="item"
        @read-error="handleReadError"
      />
    </ul>

    <!-- 페이지네이션 -->
    <AppPagination
      v-if="notificationStore.totalPages > 1"
      :current-page="notificationStore.page"
      :total-pages="notificationStore.totalPages"
      :total-all="notificationStore.totalElements"
      :total-filtered="notificationStore.notifications.length"
      unit="건"
      @change="handlePageChange"
    />
  </div>

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
.notif-admin-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.notif-admin-list__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-admin-list__filter-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.notif-admin-list__filter-btn.is-active {
  border-color: var(--color-primary);
  background: rgba(73, 115, 229, 0.08);
  color: var(--color-primary);
}

.notif-admin-list__read-all-btn {
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

.notif-admin-list__read-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notif-admin-list__loading {
  padding: 48px 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.notif-admin-list__list {
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  overflow: hidden;
}
</style>
