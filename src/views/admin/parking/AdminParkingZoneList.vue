<script setup>
// 관리자 주차 구역 관리 화면, BaseModal/ConfirmModal/ActionResultModal 표준 패턴을 따른다.
import { computed, inject, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/useParkingStore'
import { useAuthStore } from '@/stores/useAuthStore'
import StatsCards from '@/components/admin/StatsCards.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const parkingStore = useParkingStore()
const authStore = useAuthStore()
const router = useRouter()
const { parkingZones, parkingSetting } = storeToRefs(parkingStore)

// 센서 관리 화면으로 이동
const goToSensorList = (zoneId) => {
  router.push({ path: '/admin/parking/sensors', query: { zoneId } })
}

// AdminLayout 헤더 액션 버튼에 등록 모달 열기 함수를 등록한다.
const registerOpenModal = inject('registerOpenModal', null)

const state = reactive({
  modals: {
    form: false,
    confirmDeactivate: false,
  },
  formMode: 'create',
  selectedZone: null,
  form: {
    areaName: '',
    zoneName: '',
    totalSlots: 0,
  },
  formSubmitting: false,
  formErrorMessage: '',
  confirmTarget: null,
  confirmSubmitting: false,
  resultModal: {
    visible: false,
    type: 'success',
    title: '',
    subtitle: '',
    desc: '',
    itemName: '',
    time: '',
    actionLabel: '',
    actor: '',
    afterConfirm: null,
  },
})

// 테이블 컬럼 정의
const columns = [
  { key: 'areaName', label: '주차장' },
  { key: 'zoneName', label: '구역' },
  { key: 'totalSlots', label: '전체 면수' },
  { key: 'currentParkedCount', label: '현재 주차' },
  { key: 'remainingSlots', label: '잔여' },
  { key: 'status', label: '상태' },
]

// 상단 통계 카드 항목 계산
const summaryItems = computed(() => {
  const rows = parkingZones.value ?? []
  const activeRows = rows.filter((r) => r.isActive)
  const totalSlotsSum = activeRows.reduce((acc, r) => acc + (r.totalSlots ?? 0), 0)
  return [
    { label: '전체 구역 수', value: rows.length, unit: '개', desc: '활성 + 비활성' },
    { label: '활성 구역 수', value: activeRows.length, unit: '개', desc: '비활성 제외' },
    { label: '총 면수', value: totalSlotsSum, unit: '면', desc: '활성 구역 합산' },
  ]
})

// 비활성 행 시각 흐림 클래스 부여
const rowClass = (row) => (row?.isActive ? null : 'is-inactive')

// 구역명 표시값 변환
const formatZoneName = (value) => (value == null || value === '' ? '—' : value)

// 면수 미설정 여부 판별
const isSlotMissing = (row) => (row?.totalSlots ?? 0) === 0

// 처리 시각 문자열 생성
const getCurrentTimeText = () => {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 처리자 이름 조회
const getCurrentActorName = () => {
  return authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'
}

// 행 라벨 문자열 생성
const buildZoneLabel = (row) => {
  if (!row) return ''
  const zonePart = row.zoneName ? ` / ${row.zoneName}` : ''
  return `${row.areaName}${zonePart}`
}

// API 에러 메시지 추출
const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || fallback
}

// 결과 모달 열기
const openResultModal = ({ type, title, subtitle = '', itemName = '', actionLabel = '', afterConfirm = null }) => {
  state.resultModal.visible = true
  state.resultModal.type = type
  state.resultModal.title = title
  state.resultModal.subtitle = subtitle
  state.resultModal.desc = ''
  state.resultModal.itemName = itemName
  state.resultModal.time = getCurrentTimeText()
  state.resultModal.actionLabel = actionLabel
  state.resultModal.actor = getCurrentActorName()
  state.resultModal.afterConfirm = afterConfirm
}

// 결과 모달 확인 후 후속 처리 실행
const handleResultConfirm = async () => {
  const callback = state.resultModal.afterConfirm
  state.resultModal.visible = false
  state.resultModal.afterConfirm = null
  if (typeof callback === 'function') {
    await callback()
  }
}

// 폼 초기화 처리
const resetForm = () => {
  state.form.areaName = ''
  state.form.zoneName = ''
  state.form.totalSlots = 0
  state.formErrorMessage = ''
  state.formSubmitting = false
}

// 폼 제출 가능 여부 판별
const canSubmitForm = computed(() => {
  if (state.formSubmitting) return false
  if (!state.form.areaName?.trim()) return false
  if (state.form.totalSlots == null || state.form.totalSlots < 0) return false
  return true
})

// 목록 조회
const loadZones = () => parkingStore.fetchParkingZones()

// 등록 모달 열기
const openCreateModal = () => {
  resetForm()
  state.formMode = 'create'
  state.selectedZone = null
  state.modals.form = true
}

// 수정 모달 열기
const openEditModal = (row) => {
  resetForm()
  state.formMode = 'edit'
  state.selectedZone = row
  state.form.areaName = row.areaName ?? ''
  state.form.zoneName = row.zoneName ?? ''
  state.form.totalSlots = row.totalSlots ?? 0
  state.modals.form = true
}

// 폼 모달 닫기
const closeFormModal = () => {
  if (state.formSubmitting) return
  state.modals.form = false
  state.selectedZone = null
  resetForm()
}

// 폼 제출 처리
const handleFormSubmit = async () => {
  if (!canSubmitForm.value) return
  state.formSubmitting = true
  state.formErrorMessage = ''

  const payload = {
    areaName: state.form.areaName.trim(),
    zoneName: state.form.zoneName?.trim() ? state.form.zoneName.trim() : null,
    totalSlots: Number(state.form.totalSlots),
  }

  try {
    if (state.formMode === 'create') {
      await parkingStore.createParkingZone({ ...payload, isActive: true })
      const label = buildZoneLabel(payload)
      state.modals.form = false
      resetForm()
      openResultModal({
        type: 'success',
        title: '주차 구역이 등록되었습니다.',
        subtitle: '신규 구역이 활성 상태로 추가되었습니다.',
        itemName: label,
        actionLabel: '등록',
        afterConfirm: async () => {
          await loadZones()
        },
      })
    } else {
      const currentActive = state.selectedZone?.isActive ?? true
      await parkingStore.updateParkingZone(state.selectedZone.zoneId, { ...payload, isActive: currentActive })
      const label = buildZoneLabel(payload)
      state.modals.form = false
      state.selectedZone = null
      resetForm()
      openResultModal({
        type: 'success',
        title: '주차 구역 정보가 수정되었습니다.',
        subtitle: '구역 이름과 면수가 최신 상태로 반영되었습니다.',
        itemName: label,
        actionLabel: '수정',
        afterConfirm: async () => {
          await loadZones()
        },
      })
    }
  } catch (error) {
    console.error(error)
    state.formErrorMessage = getErrorMessage(
      error,
      state.formMode === 'create' ? '주차 구역을 등록하지 못했습니다.' : '주차 구역을 수정하지 못했습니다.',
    )
  } finally {
    state.formSubmitting = false
  }
}

// 활성화 즉시 처리
const handleActivate = async (row) => {
  try {
    await parkingStore.updateParkingZone(row.zoneId, {
      areaName: row.areaName,
      zoneName: row.zoneName,
      totalSlots: row.totalSlots,
      isActive: true,
    })
    openResultModal({
      type: 'success',
      title: '주차 구역이 활성화되었습니다.',
      subtitle: '해당 구역에 다시 입출차 기록이 생성됩니다.',
      itemName: buildZoneLabel(row),
      actionLabel: '활성화',
      afterConfirm: async () => {
        await loadZones()
      },
    })
  } catch (error) {
    console.error(error)
    openResultModal({
      type: 'danger',
      title: '주차 구역 활성화에 실패했습니다.',
      subtitle: getErrorMessage(error, '잠시 후 다시 시도해주세요.'),
      itemName: buildZoneLabel(row),
      actionLabel: '활성화 실패',
    })
  }
}

// 비활성화 확인 모달 열기
const openConfirmDeactivate = (row) => {
  state.confirmTarget = row
  state.modals.confirmDeactivate = true
}

// 비활성화 확인 모달 닫기
const closeConfirmDeactivate = () => {
  if (state.confirmSubmitting) return
  state.modals.confirmDeactivate = false
  state.confirmTarget = null
}

// 비활성화 실행
const handleDeactivateConfirm = async () => {
  if (!state.confirmTarget) return
  state.confirmSubmitting = true
  const target = state.confirmTarget
  try {
    await parkingStore.deactivateParkingZone(target.zoneId)
    state.modals.confirmDeactivate = false
    state.confirmTarget = null
    openResultModal({
      type: 'success',
      title: '주차 구역이 비활성화되었습니다.',
      subtitle: '해당 구역에는 더 이상 새 입출차 기록이 생성되지 않습니다.',
      itemName: buildZoneLabel(target),
      actionLabel: '비활성화',
      afterConfirm: async () => {
        await loadZones()
      },
    })
  } catch (error) {
    console.error(error)
    state.modals.confirmDeactivate = false
    state.confirmTarget = null
    openResultModal({
      type: 'danger',
      title: '주차 구역 비활성화에 실패했습니다.',
      subtitle: getErrorMessage(error, '잠시 후 다시 시도해주세요.'),
      itemName: buildZoneLabel(target),
      actionLabel: '비활성화 실패',
    })
  } finally {
    state.confirmSubmitting = false
  }
}

// 비활성화 확인 모달에 표시할 라벨 계산
const confirmItemName = computed(() => buildZoneLabel(state.confirmTarget))

// 비활성화 확인 모달에 표시할 면수 계산
const confirmExtraValue = computed(() => {
  const total = state.confirmTarget?.totalSlots ?? 0
  return `${total}면`
})

// 폼 모달 제목 계산
const formModalTitle = computed(() => (state.formMode === 'edit' ? '주차 구역 수정' : '주차 구역 등록'))

// 폼 모달 부제 계산
const formModalSubtitle = computed(() =>
  state.formMode === 'edit'
    ? '주차장 이름, 구역 이름, 면수를 수정합니다.'
    : '신규 주차 구역을 등록합니다. 등록 직후 활성 상태가 됩니다.',
)

onMounted(() => {
  if (typeof registerOpenModal === 'function') {
    registerOpenModal(openCreateModal)
  }
  loadZones()
  // 주차 운영 타입 조회, [센서 관리] 버튼 노출 여부 판별에 사용
  parkingStore.fetchParkingSetting()
})

onUnmounted(() => {
  if (typeof registerOpenModal === 'function') {
    registerOpenModal(null)
  }
})
</script>

<template>
  <section class="admin-page">
    <!-- 통계 카드 3장 -->
    <StatsCards :stats="summaryItems" />

    <section class="admin-page__card">
      <!-- 주차 구역 테이블 -->
      <AdminTable :columns="columns" :rows="parkingZones" :row-class="rowClass">
        <template #cell-zoneName="{ value }">{{ formatZoneName(value) }}</template>

        <template #cell-totalSlots="{ row }">
          <span :class="{ 'slot-missing': isSlotMissing(row) }">{{ row.totalSlots ?? 0 }}</span>
        </template>

        <template #cell-status="{ row }">
          <div class="status-cell">
            <BaseBadge :variant="row.isActive ? 'success' : 'neutral'">
              {{ row.isActive ? '활성' : '비활성' }}
            </BaseBadge>
            <BaseBadge v-if="isSlotMissing(row)" variant="warning">⚠ 면수 미설정</BaseBadge>
          </div>
        </template>

        <template #action="{ row }">
          <div class="action-cell">
            <template v-if="row.isActive">
              <button type="button" class="btn-action" @click.stop="openEditModal(row)">수정</button>
              <button
                v-if="parkingSetting?.parkingTypeCode === '03'"
                type="button"
                class="btn-action"
                @click.stop="goToSensorList(row.zoneId)"
              >
                센서 관리
              </button>
              <button
                type="button"
                class="btn-action btn-action--danger"
                @click.stop="openConfirmDeactivate(row)"
              >
                비활성화
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="btn-action btn-action--success"
                @click.stop="handleActivate(row)"
              >
                활성화
              </button>
              <button type="button" class="btn-action btn-action--danger" disabled>
                비활성화
              </button>
            </template>
          </div>
        </template>
      </AdminTable>
    </section>

    <!-- 등록/수정 폼 모달 -->
    <BaseModal
      :visible="state.modals.form"
      :title="formModalTitle"
      :subtitle="formModalSubtitle"
      @close="closeFormModal"
    >
      <div class="zone-form">
        <label class="zone-form__row">
          <span class="zone-form__label">주차장 이름</span>
          <input
            v-model="state.form.areaName"
            type="text"
            class="zone-form__input"
            maxlength="20"
            placeholder="예: B1, B2, 지상주차장"
          />
        </label>
        <label class="zone-form__row">
          <span class="zone-form__label">구역 이름 <span class="zone-form__optional">(선택)</span></span>
          <input
            v-model="state.form.zoneName"
            type="text"
            class="zone-form__input"
            maxlength="20"
            placeholder="C타입 단지에서만 사용 (예: A구역)"
          />
        </label>
        <label class="zone-form__row">
          <span class="zone-form__label">전체 면수</span>
          <input
            v-model.number="state.form.totalSlots"
            type="number"
            min="0"
            class="zone-form__input"
            placeholder="0"
          />
        </label>
        <p v-if="state.formErrorMessage" class="zone-form__error">{{ state.formErrorMessage }}</p>
      </div>

      <template #footer>
        <button
          type="button"
          class="page-button page-button--ghost"
          :disabled="state.formSubmitting"
          @click="closeFormModal"
        >
          취소
        </button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="!canSubmitForm"
          @click="handleFormSubmit"
        >
          {{ state.formSubmitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </BaseModal>

    <!-- 비활성화 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.confirmDeactivate"
      title="주차 구역을 비활성화할까요?"
      subtitle="비활성 상태에서는 새 입출차 기록이 생성되지 않습니다."
      item-label="구역"
      :item-name="confirmItemName"
      action-label="비활성화"
      action-text="주차 구역 비활성화"
      :extra-value="confirmExtraValue"
      extra-label="전체 면수"
      confirm-text="비활성화"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.confirmSubmitting"
      @confirm="handleDeactivateConfirm"
      @cancel="closeConfirmDeactivate"
    />

    <!-- 처리 결과 알림 모달 -->
    <ActionResultModal
      :visible="state.resultModal.visible"
      :type="state.resultModal.type"
      :title="state.resultModal.title"
      :subtitle="state.resultModal.subtitle"
      :desc="state.resultModal.desc"
      :item-name="state.resultModal.itemName"
      :time="state.resultModal.time"
      :action-label="state.resultModal.actionLabel"
      :actor="state.resultModal.actor"
      @close="handleResultConfirm"
    />
  </section>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.admin-page__card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
  overflow: hidden;
}

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.slot-missing {
  color: var(--color-warning);
  font-weight: 700;
}

.action-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-action {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #FFFFFF;
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-action:hover {
  background: #F5F6F8;
}

.btn-action--danger {
  border-color: rgba(229, 62, 62, 0.4);
  color: #E53E3E;
}

.btn-action--danger:hover {
  background: rgba(229, 62, 62, 0.06);
}

.btn-action--success {
  border-color: rgba(47, 134, 90, 0.4);
  color: #2F855A;
}

.btn-action--success:hover {
  background: rgba(47, 134, 90, 0.06);
}

.btn-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-action:disabled:hover {
  background: #FFFFFF;
}

:deep(tr.is-inactive) td {
  opacity: 0.55;
}

.zone-form {
  display: grid;
  gap: 16px;
}

.zone-form__row {
  display: grid;
  gap: 8px;
}

.zone-form__label {
  color: #687282;
  font-size: 12px;
  font-weight: 600;
}

.zone-form__optional {
  color: var(--color-text-secondary);
  font-weight: 400;
  font-size: 11px;
}

.zone-form__input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A202C;
  font-size: 13px;
}

.zone-form__input:focus {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
  border-color: var(--color-primary);
}

.zone-form__error {
  margin: 16px 0 0;
  color: #E53E3E;
  font-size: 12px;
}

.page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.page-button--ghost {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #1A202C;
}

.page-button--primary {
  border: none;
  background: #2B3A55;
  color: #FFFFFF;
}

.page-button--primary:disabled,
.page-button--ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
