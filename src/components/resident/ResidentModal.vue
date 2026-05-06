<script setup>
// 입주민 전용 바텀시트 모달 — 모바일 화면 기준으로 아래에서 올라오는 스타일
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'success', // success | info | warning | danger
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: '확인',
  },
  confirmType: {
    type: String,
    default: 'primary', // primary | danger
  },
  // 정보 행 목록 — [{ label: '방문 날짜', value: '2026.02.25' }]
  infoRows: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible" class="resident-modal">
        <!-- 오버레이 -->
        <div class="resident-modal__overlay" @click="$emit('close')" />

        <!-- 바텀시트 본체 -->
        <div class="resident-modal__sheet" role="dialog" aria-modal="true">
          <!-- 핸들 바 -->
          <div class="resident-modal__handle" />

          <!-- 아이콘 -->
          <div class="resident-modal__icon" :class="`is-${type}`">
            <!-- success -->
            <svg v-if="type === 'success'" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <!-- info -->
            <svg v-else-if="type === 'info'" width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 11v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="12" cy="8" r="1" fill="currentColor"/>
            </svg>
            <!-- warning / danger -->
            <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>

          <!-- 제목 / 부제목 -->
          <h2 class="resident-modal__title">{{ title }}</h2>
          <p v-if="subtitle" class="resident-modal__subtitle">{{ subtitle }}</p>

          <!-- 슬롯 (커스텀 내용 — 비밀번호 입력 등) -->
          <slot />

          <!-- 정보 행 -->
          <div v-if="infoRows.length" class="resident-modal__info">
            <div
              v-for="row in infoRows"
              :key="row.label"
              class="resident-modal__info-row"
            >
              <span class="resident-modal__info-label">{{ row.label }}</span>
              <span class="resident-modal__info-value">{{ row.value }}</span>
            </div>
          </div>

          <!-- 확인 버튼 -->
          <button
            class="resident-modal__btn"
            :class="`is-${confirmType}`"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </button>

          <!-- 취소 버튼 (confirm emit이 있으면 표시) -->
          <button class="resident-modal__cancel" @click="$emit('close')">
            취소
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.resident-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* 오버레이 */
.resident-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

/* 바텀시트 */
.resident-modal__sheet {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  padding: 12px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* 핸들 */
.resident-modal__handle {
  width: 36px;
  height: 4px;
  border-radius: 99px;
  background: #e2e8f0;
  margin-bottom: 8px;
}

/* 아이콘 */
.resident-modal__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.resident-modal__icon.is-success {
  background: #c6f6d5;
  color: #48bb78;
}

.resident-modal__icon.is-info {
  background: #eef3fb;
  color: #4973e5;
}

.resident-modal__icon.is-warning {
  background: #fef9ec;
  color: #c08b2d;
}

.resident-modal__icon.is-danger {
  background: #fff5f5;
  color: #e53e3e;
}

/* 텍스트 */
.resident-modal__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  text-align: center;
  margin: 0;
}

.resident-modal__subtitle {
  font-size: 13px;
  color: #718096;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

/* 정보 행 */
.resident-modal__info {
  width: 100%;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
}

.resident-modal__info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 1px solid #e8edf5;
}

.resident-modal__info-row:last-child {
  border-bottom: none;
}

.resident-modal__info-label {
  font-size: 13px;
  color: #94a3b8;
}

.resident-modal__info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
}

/* 확인 버튼 */
.resident-modal__btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  margin-top: 8px;
}

.resident-modal__btn.is-primary {
  background: #4973e5;
}

.resident-modal__btn.is-danger {
  background: #e53e3e;
}

/* 취소 버튼 */
.resident-modal__cancel {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #718096;
  font-size: 14px;
  cursor: pointer;
}

/* 트랜지션 */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s;
}

.sheet-enter-active .resident-modal__sheet,
.sheet-leave-active .resident-modal__sheet {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .resident-modal__sheet,
.sheet-leave-to .resident-modal__sheet {
  transform: translateY(100%);
}
</style>
