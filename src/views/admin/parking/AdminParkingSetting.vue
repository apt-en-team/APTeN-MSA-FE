<script setup>
// 관리자 주차 운영 타입 설정 화면
// NONE / BASIC / SENSOR 라디오 카드 + 변경 확인 모달 구성
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/useParkingStore'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const parkingStore = useParkingStore()
const { parkingSetting } = storeToRefs(parkingStore)

// 운영 타입 옵션 정의
// name: 백엔드 enum 이름 (PATCH 요청 본문에 사용)
// code: DB 저장 코드 (현재값과 비교에 사용)
const PARKING_TYPE_OPTIONS = [
  {
    name: 'NONE',
    code: '01',
    label: '미사용',
    badgeVariant: 'neutral',
    summary: '주차 시스템을 사용하지 않음',
    description: '주차 구역, 입출차 기록, 주차 현황 화면이 모두 비활성화됩니다.',
  },
  {
    name: 'BASIC',
    code: '02',
    label: '기본',
    badgeVariant: 'info',
    summary: '단지 전체 점유율 기준으로 관리',
    description: '주차 구역과 입출차 기록을 관리하며, 전체 면수 대비 점유율을 집계해 표시합니다.',
  },
  {
    name: 'SENSOR',
    code: '03',
    label: '센서',
    badgeVariant: 'primary',
    summary: '자리별 센서로 실시간 점유 관리',
    description: '주차면 단위 실시간 점유 정보를 SSE로 받아 표시합니다. 더 정밀한 운영이 가능합니다.',
  },
]

// 현재 선택된 운영 타입 name
const selectedName = ref('')

// 변경 확인 모달 상태
const isConfirmOpen = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

// 현재 운영 타입 옵션 조회
const currentOption = computed(() => {
  return PARKING_TYPE_OPTIONS.find((opt) => opt.code === parkingSetting.value.parkingTypeCode) ?? null
})

// 선택된 옵션 조회
const selectedOption = computed(() => {
  return PARKING_TYPE_OPTIONS.find((opt) => opt.name === selectedName.value) ?? null
})

// 저장 버튼 활성화 여부 — 현재값과 다른 값을 선택했을 때만
const canSave = computed(() => {
  if (!selectedOption.value || !currentOption.value) return false
  return selectedOption.value.code !== currentOption.value.code
})

// 옵션 카드 클릭 처리
const handleSelect = (name) => {
  if (submitting.value) return
  selectedName.value = name
}

// 저장 클릭, 변경 확인 모달 오픈
const openConfirm = () => {
  if (!canSave.value) return
  errorMessage.value = ''
  isConfirmOpen.value = true
}

// 변경 확인 모달 닫기
const closeConfirm = () => {
  if (submitting.value) return
  isConfirmOpen.value = false
}

// 변경 확정 처리
const confirmChange = async () => {
  if (!canSave.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await parkingStore.updateParkingSetting(selectedName.value)
    isConfirmOpen.value = false
    // store가 새 코드/value로 갱신됐으니 selectedName도 새 값으로 동기화
    const updated = PARKING_TYPE_OPTIONS.find(
      (opt) => opt.code === parkingSetting.value.parkingTypeCode,
    )
    if (updated) selectedName.value = updated.name
  } catch (e) {
    errorMessage.value = e?.response?.data?.message || '변경 실패'
  } finally {
    submitting.value = false
  }
}

// 마운트 시 현재 운영 타입 조회 후 기본 선택값 세팅
onMounted(async () => {
  await parkingStore.fetchParkingSetting()
  if (currentOption.value) {
    selectedName.value = currentOption.value.name
  }
})
</script>

<template>
  <section class="admin-page">
    <!-- 현재 운영 타입 요약 카드 -->
    <section class="current-card">
      <div class="current-card__copy">
        <p class="current-card__label">현재 주차 운영 타입</p>
        <div class="current-card__row">
          <strong class="current-card__name">
            {{ currentOption?.label ?? '-' }}
          </strong>
          <BaseBadge v-if="currentOption" :variant="currentOption.badgeVariant">
            {{ currentOption.label }}
          </BaseBadge>
        </div>
        <p v-if="currentOption" class="current-card__desc">
          {{ currentOption.summary }}
        </p>
      </div>
    </section>

    <!-- 운영 타입 선택 카드 -->
    <section class="admin-page__card">
      <header class="card-header">
        <strong class="card-header__title">운영 타입 변경</strong>
        <p class="card-header__desc">
          단지의 주차 운영 방식을 선택합니다. 변경 시 주차 관련 화면 동작이 달라집니다.
        </p>
      </header>

      <div class="option-grid">
        <button
          v-for="opt in PARKING_TYPE_OPTIONS"
          :key="opt.name"
          type="button"
          class="option-card"
          :class="{ 'is-selected': selectedName === opt.name }"
          :disabled="submitting"
          @click="handleSelect(opt.name)"
        >
          <div class="option-card__head">
            <BaseBadge :variant="opt.badgeVariant">{{ opt.label }}</BaseBadge>
            <span v-if="currentOption?.name === opt.name" class="option-card__current">
              현재
            </span>
          </div>
          <strong class="option-card__name">{{ opt.label }}</strong>
          <p class="option-card__summary">{{ opt.summary }}</p>
          <p class="option-card__description">{{ opt.description }}</p>
        </button>
      </div>

      <footer class="card-footer">
        <p v-if="errorMessage" class="card-footer__error">{{ errorMessage }}</p>
        <button
          type="button"
          class="btn-save"
          :disabled="!canSave || submitting"
          @click="openConfirm"
        >
          {{ submitting ? '변경 중...' : '저장' }}
        </button>
      </footer>
    </section>

    <!-- 변경 확인 모달 -->
    <BaseModal
      :visible="isConfirmOpen"
      title="주차 운영 타입 변경"
      subtitle="저장 시 단지의 주차 운영 방식이 변경됩니다"
      @close="closeConfirm"
    >
      <div class="confirm-body">
        <div class="confirm-body__diff">
          <div class="confirm-body__col">
            <p class="confirm-body__col-label">현재</p>
            <BaseBadge v-if="currentOption" :variant="currentOption.badgeVariant">
              {{ currentOption.label }}
            </BaseBadge>
          </div>
          <span class="confirm-body__arrow">→</span>
          <div class="confirm-body__col">
            <p class="confirm-body__col-label">변경</p>
            <BaseBadge v-if="selectedOption" :variant="selectedOption.badgeVariant">
              {{ selectedOption.label }}
            </BaseBadge>
          </div>
        </div>
        <p v-if="selectedOption" class="confirm-body__desc">
          {{ selectedOption.description }}
        </p>
      </div>
      <template #footer>
        <button
          type="button"
          class="btn-cancel"
          :disabled="submitting"
          @click="closeConfirm"
        >
          취소
        </button>
        <button
          type="button"
          class="btn-submit"
          :disabled="submitting"
          @click="confirmChange"
        >
          {{ submitting ? '변경 중...' : '변경' }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.admin-page {
  display: grid;
  gap: var(--space-20);
}

/* 현재 운영 타입 요약 카드 */
.current-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.current-card__copy {
  display: grid;
  gap: 4px;
}

.current-card__label {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.current-card__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-card__name {
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: 700;
}

.current-card__desc {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

/* 선택 카드 영역 */
.admin-page__card {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.card-header {
  display: grid;
  gap: 4px;
  margin-bottom: 20px;
}

.card-header__title {
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 700;
}

.card-header__desc {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

/* 옵션 카드 그리드 */
.option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .option-grid {
    grid-template-columns: 1fr;
  }
}

.option-card {
  position: relative;
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.option-card:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.option-card.is-selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(124, 92, 219, 0.18);
}

.option-card:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.option-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-card__current {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  font-size: var(--font-size-badge);
  font-weight: 600;
}

.option-card__name {
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 700;
}

.option-card__summary {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
  font-weight: 500;
}

.option-card__description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  line-height: 1.6;
}

/* 푸터 영역 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.card-footer__error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-detail);
}

.btn-save {
  height: 40px;
  padding: 0 24px;
  border: none;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save:hover:not(:disabled) {
  filter: brightness(1.08);
}

/* 확인 모달 내부 */
.confirm-body {
  display: grid;
  gap: 16px;
}

.confirm-body__diff {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-bg-muted);
}

.confirm-body__col {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.confirm-body__col-label {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-badge);
  font-weight: 600;
}

.confirm-body__arrow {
  color: var(--color-text-secondary);
  font-size: 20px;
}

.confirm-body__desc {
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--radius-8);
  background: var(--color-bg-muted);
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
  line-height: 1.6;
}

.btn-cancel,
.btn-submit {
  min-width: 88px;
  height: 40px;
  padding: 0 var(--space-16);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-text-secondary);
}

.btn-submit {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
