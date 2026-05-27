<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const authStore = useAuthStore()

// MASTER는 알림 기능을 사용하지 않으므로 대시보드로 리다이렉트
if (authStore.role === 'MASTER') {
  router.replace('/admin/dashboard')
}

const notificationStore = useNotificationStore()

// 결과 모달
const resultModal = ref({ visible: false, type: 'success', title: '', subtitle: '' })

function showResult(type, title, subtitle = '') {
  resultModal.value = { visible: true, type, title, subtitle }
}

onMounted(async () => {
  await notificationStore.fetchSettings()
})

// 토글 변경 시 즉시 저장 (낙관적 업데이트)
async function handleToggle(category) {
  try {
    category.enabled = !category.enabled
    await notificationStore.updateSettings({ categories: notificationStore.settings })
  } catch {
    category.enabled = !category.enabled
    showResult('danger', '설정 저장 실패', '알림 설정을 저장하는 중 오류가 발생했습니다.')
  }
}
</script>

<template>
  <div class="notif-admin-setting">
    <div class="card-section">
      <h2 class="notif-admin-setting__title">알림 수신 설정</h2>
      <p class="notif-admin-setting__desc">
        카테고리별로 알림 수신 여부를 설정합니다. 비활성화하면 해당 유형의 알림을 받지 않습니다.
      </p>

      <!-- 로딩 -->
      <div v-if="notificationStore.loading && notificationStore.settings.length === 0" class="notif-admin-setting__loading">
        불러오는 중...
      </div>

      <!-- 설정 목록 -->
      <ul v-else class="notif-admin-setting__list">
        <li
          v-for="category in notificationStore.settings"
          :key="category.category ?? category.type"
          class="notif-admin-setting__item"
        >
          <div class="notif-admin-setting__item-copy">
            <span class="notif-admin-setting__item-name">{{ category.label ?? category.category }}</span>
            <span v-if="category.description" class="notif-admin-setting__item-desc">
              {{ category.description }}
            </span>
          </div>

          <!-- 토글 스위치 -->
          <button
            type="button"
            role="switch"
            :aria-checked="category.enabled"
            class="notif-admin-setting__toggle"
            :class="{ 'is-on': category.enabled }"
            @click="handleToggle(category)"
          >
            <span class="notif-admin-setting__toggle-thumb" />
          </button>
        </li>
      </ul>

      <!-- 빈 설정 -->
      <p v-if="!notificationStore.loading && notificationStore.settings.length === 0" class="notif-admin-setting__empty">
        설정 정보가 없습니다.
      </p>
    </div>
  </div>

  <!-- 결과 모달 -->
  <ActionResultModal
    :visible="resultModal.visible"
    :type="resultModal.type"
    :title="resultModal.title"
    :subtitle="resultModal.subtitle"
    @close="resultModal.visible = false"
  />
</template>

<style scoped>
.notif-admin-setting__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.notif-admin-setting__desc {
  margin: 0 0 20px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.notif-admin-setting__loading,
.notif-admin-setting__empty {
  padding: 24px 0;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.notif-admin-setting__list {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  overflow: hidden;
}

.notif-admin-setting__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.notif-admin-setting__item:last-child {
  border-bottom: none;
}

.notif-admin-setting__item-copy {
  flex: 1;
  min-width: 0;
}

.notif-admin-setting__item-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.notif-admin-setting__item-desc {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 토글 스위치 */
.notif-admin-setting__toggle {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: var(--color-bg-muted);
  cursor: pointer;
  transition: background 0.2s;
}

.notif-admin-setting__toggle.is-on {
  background: var(--color-primary);
}

.notif-admin-setting__toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transition: transform 0.2s;
}

.notif-admin-setting__toggle.is-on .notif-admin-setting__toggle-thumb {
  transform: translateX(20px);
}
</style>
