<script setup>
import { onMounted, ref } from 'vue'
import { useNotificationStore } from '@/stores/useNotificationStore'
import NotificationPushSetting from '@/components/notification/NotificationPushSetting.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const notificationStore = useNotificationStore()

// 결과 모달
const resultModal = ref({ visible: false, type: 'success', title: '', subtitle: '' })

function showResult(type, title, subtitle = '') {
  resultModal.value = { visible: true, type, title, subtitle }
}

// 페이지 진입 시 설정 조회
onMounted(async () => {
  await notificationStore.fetchSettings()
})

// 토글 변경 시 즉시 저장
async function handleToggle(category) {
  try {
    // 로컬에서 먼저 반영 (낙관적 업데이트)
    category.enabled = !category.enabled

    await notificationStore.updateSettings({ categories: notificationStore.settings })
  } catch {
    // 실패 시 원복
    category.enabled = !category.enabled
    showResult('danger', '설정 저장 실패', '알림 설정을 저장하는 중 오류가 발생했습니다.')
  }
}
</script>

<template>
  <section class="page-container notif-setting-page">
    <h1 class="notif-setting-page__title">알림 설정</h1>

    <!-- 로딩 -->
    <div v-if="notificationStore.loading && notificationStore.settings.length === 0" class="notif-setting-page__state">
      불러오는 중...
    </div>

    <!-- 카테고리별 ON/OFF 설정 -->
    <div v-else class="notif-setting-page__section">
      <p class="notif-setting-page__section-label">수신 알림 종류</p>

      <ul class="notif-setting-page__list">
        <li
          v-for="category in notificationStore.settings"
          :key="category.category ?? category.type"
          class="notif-setting-page__item"
        >
          <div class="notif-setting-page__item-copy">
            <span class="notif-setting-page__item-name">{{ category.label ?? category.category }}</span>
            <span v-if="category.description" class="notif-setting-page__item-desc">
              {{ category.description }}
            </span>
          </div>

          <!-- 토글 스위치 -->
          <button
            type="button"
            role="switch"
            :aria-checked="category.enabled"
            class="notif-setting-page__toggle"
            :class="{ 'is-on': category.enabled }"
            @click="handleToggle(category)"
          >
            <span class="notif-setting-page__toggle-thumb" />
          </button>
        </li>
      </ul>
    </div>

    <!-- FCM 푸시 설정 (HTTPS 활성화 후 동작) -->
    <NotificationPushSetting />
  </section>

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
.notif-setting-page__title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.notif-setting-page__state {
  padding: 48px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.notif-setting-page__section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  overflow: hidden;
}

.notif-setting-page__section-label {
  margin: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.notif-setting-page__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.notif-setting-page__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.notif-setting-page__item:last-child {
  border-bottom: none;
}

.notif-setting-page__item-copy {
  flex: 1;
  min-width: 0;
}

.notif-setting-page__item-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.notif-setting-page__item-desc {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* 토글 스위치 */
.notif-setting-page__toggle {
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

.notif-setting-page__toggle.is-on {
  background: var(--resident-primary, #4973E5);
}

.notif-setting-page__toggle-thumb {
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

.notif-setting-page__toggle.is-on .notif-setting-page__toggle-thumb {
  transform: translateX(20px);
}
</style>
