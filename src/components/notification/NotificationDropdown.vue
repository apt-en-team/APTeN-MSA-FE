<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/useNotificationStore'
import notificationApi from '@/api/notificationApi'
import { toList } from '@/utils/apiResponse'
import NotificationItem from './NotificationItem.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const notificationStore = useNotificationStore()

// 드롭다운 전용 미리보기 목록 — 전역 store.notifications와 분리
const previewNotifications = ref([])
const previewLoading = ref(false)

// 에러 모달 상태
const resultModal = ref({ visible: false, type: 'danger', title: '', subtitle: '' })

function showError(msg) {
  resultModal.value = { visible: true, type: 'danger', title: '오류', subtitle: msg }
}

// 드롭다운 전용 목록 조회 — store.notifications를 덮어쓰지 않는다
async function loadPreview() {
  previewLoading.value = true
  try {
    const res = await notificationApi.getNotifications({ page: 0, size: 10 })
    previewNotifications.value = toList(res)
  } catch (e) {
    console.error('[NotificationDropdown] 미리보기 조회 실패', e)
  } finally {
    previewLoading.value = false
  }
}

onMounted(loadPreview)

// 전체 읽음 처리 후 미리보기 + 미읽음 수만 갱신
async function handleMarkAllAsRead() {
  try {
    await notificationStore.markAllAsRead()
    // markAllAsRead가 로컬 목록도 갱신하지만 previewNotifications는 별도 ref이므로 직접 반영
    previewNotifications.value.forEach((n) => { n.isRead = true })
  } catch {
    showError('전체 읽음 처리에 실패했습니다.')
  }
}

// 전체 보기 페이지로 이동
function goToList() {
  notificationStore.closeDropdown()
  router.push('/admin/notifications')
}

// NotificationItem에서 읽음 에러 전달받음
function handleReadError(msg) {
  showError(msg)
}
</script>

<template>
  <div class="notif-dropdown">
    <!-- 드롭다운 헤더 -->
    <div class="notif-dropdown__header">
      <span class="notif-dropdown__title">알림</span>
      <div class="notif-dropdown__header-actions">
        <button
          v-if="notificationStore.hasUnread"
          type="button"
          class="notif-dropdown__text-btn"
          @click="handleMarkAllAsRead"
        >
          전체 읽음
        </button>
        <button type="button" class="notif-dropdown__text-btn" @click="goToList">
          전체 보기
        </button>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="previewLoading" class="notif-dropdown__state">
      불러오는 중...
    </div>

    <!-- 빈 목록 -->
    <div
      v-else-if="previewNotifications.length === 0"
      class="notif-dropdown__state"
    >
      새 알림이 없습니다.
    </div>

    <!-- 알림 목록 (최대 10개 미리보기) -->
    <ul v-else class="notif-dropdown__list">
      <NotificationItem
        v-for="item in previewNotifications"
        :key="item.notificationId"
        :notification="item"
        @read-error="handleReadError"
      />
    </ul>

    <!-- 전체 보기 푸터 -->
    <div class="notif-dropdown__footer">
      <button type="button" class="notif-dropdown__footer-btn" @click="goToList">
        전체 알림 보기
      </button>
    </div>
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
.notif-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.notif-dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.notif-dropdown__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.notif-dropdown__header-actions {
  display: flex;
  gap: 8px;
}

.notif-dropdown__text-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.notif-dropdown__text-btn:hover {
  color: var(--color-text-primary);
}

.notif-dropdown__state {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.notif-dropdown__list {
  flex: 1;
  overflow-y: auto;
  margin: 0;
  padding: 0;
}

.notif-dropdown__footer {
  padding: 10px 16px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.notif-dropdown__footer-btn {
  width: 100%;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-bg-app);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.notif-dropdown__footer-btn:hover {
  background: var(--color-bg-muted);
}
</style>
