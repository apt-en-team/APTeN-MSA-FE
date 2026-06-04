<script setup>
import { computed, onMounted, ref } from 'vue'
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

const receiveAllEnabled = computed(() => {
  const settings = notificationStore.settings
  return settings.length > 0 && settings.every((category) => category.enabled)
})

// 전체 토글 하나로 모든 알림 category를 같은 ON/OFF 값으로 저장한다
async function handleToggleAll() {
  const nextEnabled = !receiveAllEnabled.value
  const previousSettings = notificationStore.settings.map((category) => ({ ...category }))

  try {
    // 화면은 단순하게 보여도 백엔드는 category별 설정을 유지하므로 전체 category를 한 번에 바꾼다
    notificationStore.settings.forEach((category) => {
      category.enabled = nextEnabled
    })

    // store에서 백엔드 PATCH DTO에 맞게 category/enabled만 추려서 전송한다
    await notificationStore.updateSettings(notificationStore.settings)
  } catch {
    // 실패 시 원복
    notificationStore.settings = previousSettings
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

    <!-- 설정 로드 실패 -->
    <div v-else-if="notificationStore.error && notificationStore.settings.length === 0" class="notif-setting-page__state">
      <p class="notif-setting-page__error-text">알림 설정을 불러오지 못했습니다.</p>
      <button class="notif-setting-page__retry-btn" type="button" @click="notificationStore.fetchSettings()">
        다시 시도
      </button>
    </div>

    <!-- 전체 알림 ON/OFF 설정 -->
    <div v-else class="notif-setting-page__section">
      <div class="notif-setting-page__copy">
        <span class="notif-setting-page__name">알림 받기</span>
        <span class="notif-setting-page__desc">앱 안에서 알림을 받습니다.</span>
      </div>

      <button
        type="button"
        role="switch"
        :aria-checked="receiveAllEnabled"
        class="notif-setting-page__toggle"
        :class="{ 'is-on': receiveAllEnabled }"
        :disabled="notificationStore.loading || notificationStore.settings.length === 0"
        @click="handleToggleAll"
      >
        <span class="notif-setting-page__toggle-thumb" />
      </button>
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
  margin: 0 0 16px;
  font-family: 'Noto Sans KR', sans-serif;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #FFFFFF;
}

.notif-setting-page__copy {
  flex: 1;
  min-width: 0;
}

.notif-setting-page__name {
  display: block;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.notif-setting-page__desc {
  display: block;
  margin-top: 4px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

/* 토글 스위치 */
.notif-setting-page__toggle {
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

.notif-setting-page__toggle.is-on {
  background: var(--resident-primary, #4973E5);
}

.notif-setting-page__toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notif-setting-page__toggle-thumb {
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

.notif-setting-page__toggle.is-on .notif-setting-page__toggle-thumb {
  transform: translateX(20px);
}

.notif-setting-page__error-text {
  margin: 0 0 12px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  color: var(--color-danger, #e53e3e);
}

.notif-setting-page__retry-btn {
  padding: 8px 20px;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  background: #FFFFFF;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
}
</style>
