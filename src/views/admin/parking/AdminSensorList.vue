<script setup>
// 관리자 주차 센서 관리 화면, 단건 CRUD를 처리하고 일괄 등록은 Step 3-3에서 연결한다.
import { computed, inject, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSensorStore } from '@/stores/useSensorStore'
import { useParkingStore } from '@/stores/useParkingStore'
import { useAuthStore } from '@/stores/useAuthStore'
import AdminTable from '@/components/admin/AdminTable.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const route = useRoute()
const router = useRouter()
const sensorStore = useSensorStore()
const parkingStore = useParkingStore()
const authStore = useAuthStore()
const { list: sensorList, loading: sensorLoading } = storeToRefs(sensorStore)
const { parkingZones } = storeToRefs(parkingStore)

// AdminLayout 헤더 액션 버튼에 등록 모달 열기 함수를 등록한다.
const registerOpenModal = inject('registerOpenModal', null)

const SENSOR_CODE_RE = /^[A-Za-z0-9_-]+$/
const SPOT_NUMBER_RE = /^[\w가-힣-]+$/
const BULK_MAX_LINES = 100

// route query에서 zoneId 추출
const zoneId = computed(() => {
  const raw = route.query.zoneId
  if (raw == null || raw === '') return null
  // BE Snowflake ID는 Number로 변환하면 정밀도 손실 발생, 문자열 그대로 유지
  return String(raw)
})

// 현재 zone 정보 계산
const currentZone = computed(() => {
  if (zoneId.value == null) return null
  return (parkingZones.value ?? []).find((z) => String(z.zoneId) === zoneId.value) ?? null
})

// 화면 타이틀 텍스트 계산
const headerTitle = computed(() => {
  const z = currentZone.value
  if (!z) return '센서 관리'
  const zonePart = z.zoneName ? ` / ${z.zoneName}` : ''
  return `${z.areaName}${zonePart} 센서 관리`
})

const state = reactive({
  modals: { create: false, edit: false, bulk: false },
  form: { spotNumber: '', sensorCode: '', description: '', isActive: true },
  formSubmitting: false,
  formErrorMessage: '',
  selectedSensor: null,
  confirmTarget: null,
  confirmSubmitting: false,
  bulkText: '',
  bulkSubmitting: false,
  bulkErrorMessage: '',
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

const columns = [
  { key: 'spotNumber', label: '자리 번호' },
  { key: 'sensorCode', label: '센서 코드' },
  { key: 'description', label: '설명' },
  { key: 'isActive', label: '활성' },
]

// 비활성 행 시각 흐림 클래스 부여
const rowClass = (row) => (row?.isActive ? null : 'is-inactive')

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

// API 에러 메시지 추출
const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || fallback
}

// 센서 라벨 문자열 생성
const buildSensorLabel = (row) => {
  if (!row) return ''
  const code = row.sensorCode ?? ''
  const spot = row.spotNumber ?? ''
  return `${code} (${spot})`
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
  const cb = state.resultModal.afterConfirm
  state.resultModal.visible = false
  state.resultModal.afterConfirm = null
  if (typeof cb === 'function') {
    await cb()
  }
}

// 폼 초기화 처리
const resetForm = () => {
  state.form.spotNumber = ''
  state.form.sensorCode = ''
  state.form.description = ''
  state.form.isActive = true
  state.formErrorMessage = ''
  state.formSubmitting = false
}

// 센서 목록 재조회
const loadSensors = () => {
  if (zoneId.value == null) return Promise.resolve()
  return sensorStore.fetchSensorList(zoneId.value)
}

// 등록 모달 열기
const openCreateModal = () => {
  resetForm()
  state.modals.create = true
}

// 등록 모달 닫기
const closeCreateModal = () => {
  if (state.formSubmitting) return
  state.modals.create = false
  resetForm()
}

// 수정 모달 열기
const openEditModal = (row) => {
  resetForm()
  state.selectedSensor = row
  state.form.spotNumber = row.spotNumber ?? ''
  state.form.sensorCode = row.sensorCode ?? ''
  state.form.description = row.description ?? ''
  state.form.isActive = !!row.isActive
  state.modals.edit = true
}

// 수정 모달 닫기
const closeEditModal = () => {
  if (state.formSubmitting) return
  state.modals.edit = false
  state.selectedSensor = null
  resetForm()
}

// 등록 제출 가능 여부 판별
const canSubmitCreate = computed(() => {
  if (state.formSubmitting) return false
  if (!state.form.spotNumber?.trim()) return false
  if (!state.form.sensorCode?.trim()) return false
  return true
})

// 수정 제출 가능 여부 판별
const canSubmitEdit = computed(() => !state.formSubmitting)

// 등록 제출 처리
const handleCreateSubmit = async () => {
  if (!canSubmitCreate.value) return
  if (zoneId.value == null) return

  const spot = state.form.spotNumber.trim()
  const code = state.form.sensorCode.trim()
  const desc = (state.form.description ?? '').trim()

  if (!SPOT_NUMBER_RE.test(spot)) {
    state.formErrorMessage = '자리 번호는 영문, 숫자, 한글, 하이픈만 사용할 수 있습니다.'
    return
  }
  if (!SENSOR_CODE_RE.test(code)) {
    state.formErrorMessage = '센서 코드는 영문, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다.'
    return
  }

  state.formSubmitting = true
  state.formErrorMessage = ''
  const payload = {
    zoneId: zoneId.value,
    spotNumber: spot,
    sensorCode: code,
  }
  if (desc) payload.description = desc

  try {
    await sensorStore.createSensor(payload)
    state.modals.create = false
    resetForm()
    openResultModal({
      type: 'success',
      title: '센서가 등록되었습니다.',
      subtitle: '해당 구역에 신규 센서가 추가되었습니다.',
      itemName: `${code} (${spot})`,
      actionLabel: '등록',
      afterConfirm: async () => {
        await loadSensors()
      },
    })
  } catch (e) {
    state.formErrorMessage = getErrorMessage(e, '센서를 등록하지 못했습니다.')
  } finally {
    state.formSubmitting = false
  }
}

// 수정 제출 처리
const handleEditSubmit = async () => {
  if (!canSubmitEdit.value || !state.selectedSensor) return

  // 변경된 필드만 payload에 포함 (PATCH semantics)
  const payload = {}
  const newDesc = (state.form.description ?? '').trim()
  const oldDesc = (state.selectedSensor.description ?? '').trim()
  if (newDesc !== oldDesc) payload.description = newDesc
  if (state.form.isActive !== !!state.selectedSensor.isActive) {
    payload.isActive = state.form.isActive
  }

  if (Object.keys(payload).length === 0) {
    state.formErrorMessage = '변경된 항목이 없습니다.'
    return
  }

  state.formSubmitting = true
  state.formErrorMessage = ''
  const targetLabel = buildSensorLabel(state.selectedSensor)
  const sensorId = state.selectedSensor.sensorId

  try {
    await sensorStore.updateSensor(sensorId, payload)
    state.modals.edit = false
    state.selectedSensor = null
    resetForm()
    openResultModal({
      type: 'success',
      title: '센서 정보가 수정되었습니다.',
      subtitle: '변경한 내용이 반영되었습니다.',
      itemName: targetLabel,
      actionLabel: '수정',
      afterConfirm: async () => {
        await loadSensors()
      },
    })
  } catch (e) {
    state.formErrorMessage = getErrorMessage(e, '센서를 수정하지 못했습니다.')
  } finally {
    state.formSubmitting = false
  }
}

// 삭제 확인 모달 열기
const openConfirmDelete = (row) => {
  state.confirmTarget = row
}

// 삭제 확인 모달 닫기
const closeConfirmDelete = () => {
  if (state.confirmSubmitting) return
  state.confirmTarget = null
}

// 삭제 실행
const handleDeleteConfirm = async () => {
  if (!state.confirmTarget) return
  state.confirmSubmitting = true
  const target = state.confirmTarget
  try {
    await sensorStore.deleteSensor(target.sensorId)
    state.confirmTarget = null
    openResultModal({
      type: 'success',
      title: '센서가 삭제되었습니다.',
      subtitle: '해당 센서가 비활성 상태로 처리되었습니다.',
      itemName: buildSensorLabel(target),
      actionLabel: '삭제',
      afterConfirm: async () => {
        await loadSensors()
      },
    })
  } catch (e) {
    state.confirmTarget = null
    openResultModal({
      type: 'danger',
      title: '센서 삭제에 실패했습니다.',
      subtitle: getErrorMessage(e, '잠시 후 다시 시도해주세요.'),
      itemName: buildSensorLabel(target),
      actionLabel: '삭제 실패',
    })
  } finally {
    state.confirmSubmitting = false
  }
}

// 일괄 등록 textarea 라인 파싱
const bulkParsed = computed(() => {
  const lines = state.bulkText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return lines.map((line, idx) => {
    const parts = line.split(',').map((p) => p.trim())
    return {
      lineNumber: idx + 1,
      spotNumber: parts[0] || '',
      sensorCode: parts[1] || '',
      description: parts[2] || null,
    }
  })
})

// 일괄 등록 입력 라인 수
const bulkLineCount = computed(() => bulkParsed.value.length)

// 일괄 등록 검증 결과 계산 (빈 값/정규식 위반/중복/최대 라인 초과 점검)
const bulkValidation = computed(() => {
  const parsed = bulkParsed.value
  if (parsed.length === 0) {
    return { valid: false, summary: '' }
  }
  if (parsed.length > BULK_MAX_LINES) {
    return {
      valid: false,
      summary: `${BULK_MAX_LINES}건을 초과했습니다 (현재 ${parsed.length}건).`,
    }
  }

  const formatErrors = []
  const codeMap = new Map()
  const spotMap = new Map()
  const dupCodeLines = []
  const dupSpotLines = []

  parsed.forEach((row) => {
    const spotValid = row.spotNumber !== '' && SPOT_NUMBER_RE.test(row.spotNumber)
    const codeValid = row.sensorCode !== '' && SENSOR_CODE_RE.test(row.sensorCode)

    if (!spotValid || !codeValid) {
      formatErrors.push(row.lineNumber)
    }
    if (codeValid) {
      if (codeMap.has(row.sensorCode)) dupCodeLines.push(row.lineNumber)
      else codeMap.set(row.sensorCode, true)
    }
    if (spotValid) {
      if (spotMap.has(row.spotNumber)) dupSpotLines.push(row.lineNumber)
      else spotMap.set(row.spotNumber, true)
    }
  })

  const messages = []
  if (formatErrors.length > 0) {
    messages.push(`행 ${[...new Set(formatErrors)].join(', ')}의 형식이 잘못되었습니다.`)
  }
  if (dupCodeLines.length > 0) {
    messages.push(`행 ${dupCodeLines.join(', ')}의 센서 코드가 중복됩니다.`)
  }
  if (dupSpotLines.length > 0) {
    messages.push(`행 ${dupSpotLines.join(', ')}의 자리 번호가 중복됩니다.`)
  }

  return {
    valid: messages.length === 0,
    summary: messages.join(' '),
  }
})

// 일괄 등록 제출 가능 여부
const canSubmitBulk = computed(() => {
  if (state.bulkSubmitting) return false
  if (bulkLineCount.value === 0) return false
  return bulkValidation.value.valid
})

// 일괄 등록 모달 열기
const openBulkModal = () => {
  state.bulkText = ''
  state.bulkErrorMessage = ''
  state.bulkSubmitting = false
  state.modals.bulk = true
}

// 일괄 등록 모달 닫기
const closeBulkModal = () => {
  if (state.bulkSubmitting) return
  state.modals.bulk = false
  state.bulkText = ''
  state.bulkErrorMessage = ''
}

// 일괄 등록 제출 처리
const handleBulkSubmit = async () => {
  if (!canSubmitBulk.value) return
  if (zoneId.value == null) return

  state.bulkSubmitting = true
  state.bulkErrorMessage = ''

  const payload = {
    zoneId: zoneId.value,
    items: bulkParsed.value.map((row) => ({
      spotNumber: row.spotNumber,
      sensorCode: row.sensorCode,
      description: row.description || null,
    })),
  }

  try {
    const res = await sensorStore.createSensorsBulk(payload)
    const createdCount = res?.createdCount ?? bulkLineCount.value
    state.modals.bulk = false
    state.bulkText = ''
    openResultModal({
      type: 'success',
      title: '센서가 일괄 등록되었습니다.',
      subtitle: `${createdCount}건이 등록되었습니다.`,
      actionLabel: '일괄 등록',
      afterConfirm: async () => {
        await loadSensors()
      },
    })
  } catch (e) {
    state.bulkErrorMessage = getErrorMessage(e, '센서를 일괄 등록하지 못했습니다.')
  } finally {
    state.bulkSubmitting = false
  }
}

// 구역 목록 화면으로 이동
const goToZoneList = () => {
  router.push('/admin/parking/zones')
}

// 삭제 확인 모달에 표시할 라벨 계산
const confirmItemName = computed(() => buildSensorLabel(state.confirmTarget))

// 빈 상태 표시 여부 계산
const showEmptyState = computed(() => {
  return !sensorLoading.value && (sensorList.value?.length ?? 0) === 0
})

onMounted(async () => {
  if (zoneId.value == null) {
    router.replace('/admin/parking/zones')
    return
  }
  if (typeof registerOpenModal === 'function') {
    registerOpenModal(openCreateModal)
  }
  if (!parkingZones.value || parkingZones.value.length === 0) {
    await parkingStore.fetchParkingZones()
  }
  await loadSensors()
})

onUnmounted(() => {
  if (typeof registerOpenModal === 'function') {
    registerOpenModal(null)
  }
})

// zoneId 변경 시 센서 목록 재조회
watch(zoneId, async (newValue) => {
  if (newValue == null) {
    router.replace('/admin/parking/zones')
    return
  }
  await loadSensors()
})
</script>

<template>
  <section class="admin-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="page-header__copy">
        <button type="button" class="breadcrumb-link" @click="goToZoneList">
          ← 주차 구역
        </button>
        <h2 class="page-header__title">{{ headerTitle }}</h2>
      </div>
      <div class="page-header__actions">
        <button type="button" class="page-button page-button--ghost" @click="openBulkModal">
          센서 일괄 등록
        </button>
        <button type="button" class="page-button page-button--primary" @click="openCreateModal">
          + 센서 등록
        </button>
      </div>
    </div>

    <section class="admin-page__card">
      <!-- 빈 상태 가이드 또는 센서 테이블 -->
      <div v-if="showEmptyState" class="empty-state">
        <p class="empty-state__title">이 구역에 등록된 센서가 없습니다.</p>
        <p class="empty-state__desc">우측 상단 '센서 등록'을 눌러 시작하세요.</p>
      </div>
      <AdminTable
        v-else
        :columns="columns"
        :rows="sensorList ?? []"
        :row-class="rowClass"
      >
        <template #cell-description="{ value }">{{ value || '-' }}</template>

        <template #cell-isActive="{ row }">
          <BaseBadge :variant="row.isActive ? 'success' : 'neutral'">
            {{ row.isActive ? '활성' : '비활성' }}
          </BaseBadge>
        </template>

        <template #action="{ row }">
          <div class="action-cell">
            <button type="button" class="btn-action" @click.stop="openEditModal(row)">수정</button>
            <button
              type="button"
              class="btn-action btn-action--danger"
              @click.stop="openConfirmDelete(row)"
            >
              삭제
            </button>
          </div>
        </template>
      </AdminTable>
    </section>

    <!-- 단건 등록 모달 -->
    <BaseModal
      :visible="state.modals.create"
      title="센서 등록"
      subtitle="해당 구역에 새 센서를 추가합니다."
      @close="closeCreateModal"
    >
      <div class="sensor-form">
        <label class="sensor-form__row">
          <span class="sensor-form__label">자리 번호</span>
          <input
            v-model="state.form.spotNumber"
            type="text"
            class="sensor-form__input"
            maxlength="40"
            placeholder="예: A-12, 12, B2-15"
          />
        </label>
        <label class="sensor-form__row">
          <span class="sensor-form__label">센서 코드</span>
          <input
            v-model="state.form.sensorCode"
            type="text"
            class="sensor-form__input"
            maxlength="40"
            placeholder="예: SN-001, SENSOR_A12"
          />
        </label>
        <label class="sensor-form__row">
          <span class="sensor-form__label">설명 <span class="sensor-form__optional">(선택)</span></span>
          <input
            v-model="state.form.description"
            type="text"
            class="sensor-form__input"
            maxlength="200"
            placeholder="예: 입구 좌측 첫 자리"
          />
        </label>
        <p v-if="state.formErrorMessage" class="sensor-form__error">{{ state.formErrorMessage }}</p>
      </div>

      <template #footer>
        <button
          type="button"
          class="page-button page-button--ghost"
          :disabled="state.formSubmitting"
          @click="closeCreateModal"
        >
          취소
        </button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="!canSubmitCreate"
          @click="handleCreateSubmit"
        >
          {{ state.formSubmitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </BaseModal>

    <!-- 수정 모달 -->
    <BaseModal
      :visible="state.modals.edit"
      title="센서 수정"
      subtitle="설명과 활성 여부를 수정합니다. 자리 번호와 센서 코드는 변경할 수 없습니다."
      @close="closeEditModal"
    >
      <div class="sensor-form">
        <label class="sensor-form__row">
          <span class="sensor-form__label">자리 번호</span>
          <input
            :value="state.form.spotNumber"
            type="text"
            class="sensor-form__input"
            readonly
          />
        </label>
        <label class="sensor-form__row">
          <span class="sensor-form__label">센서 코드</span>
          <input
            :value="state.form.sensorCode"
            type="text"
            class="sensor-form__input"
            readonly
          />
        </label>
        <label class="sensor-form__row">
          <span class="sensor-form__label">설명 <span class="sensor-form__optional">(선택)</span></span>
          <input
            v-model="state.form.description"
            type="text"
            class="sensor-form__input"
            maxlength="200"
          />
        </label>
        <label class="sensor-form__row sensor-form__row--checkbox">
          <input
            v-model="state.form.isActive"
            type="checkbox"
            class="sensor-form__checkbox"
          />
          <span class="sensor-form__checkbox-label">활성 상태로 유지</span>
        </label>
        <p v-if="state.formErrorMessage" class="sensor-form__error">{{ state.formErrorMessage }}</p>
      </div>

      <template #footer>
        <button
          type="button"
          class="page-button page-button--ghost"
          :disabled="state.formSubmitting"
          @click="closeEditModal"
        >
          취소
        </button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="!canSubmitEdit"
          @click="handleEditSubmit"
        >
          {{ state.formSubmitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </BaseModal>

    <!-- 일괄 등록 모달 (textarea CSV) -->
    <BaseModal
      :visible="state.modals.bulk"
      title="센서 일괄 등록"
      subtitle="여러 센서를 한 번에 추가합니다."
      @close="closeBulkModal"
    >
      <div class="bulk-form">
        <div class="bulk-form__guide">
          <p>형식: <code>자리번호,센서코드,설명</code> (한 줄에 하나, 설명은 생략 가능)</p>
          <p>예시: <code>A-01,SEN001,1층 입구</code></p>
          <p>최대 {{ BULK_MAX_LINES }}건까지 한 번에 등록 가능합니다.</p>
        </div>
        <textarea
          v-model="state.bulkText"
          class="bulk-form__textarea"
          rows="15"
          placeholder="A-01,SEN001,1층 입구&#10;A-02,SEN002,1층 우측&#10;A-03,SEN003"
        ></textarea>
        <p class="bulk-form__count">현재 {{ bulkLineCount }}건 / 최대 {{ BULK_MAX_LINES }}건</p>
        <p v-if="bulkValidation.summary" class="bulk-form__summary">
          {{ bulkValidation.summary }}
        </p>
        <p v-if="state.bulkErrorMessage" class="bulk-form__error">
          {{ state.bulkErrorMessage }}
        </p>
      </div>

      <template #footer>
        <div class="bulk-form__footer">
          <button
            type="button"
            class="page-button page-button--ghost"
            :disabled="state.bulkSubmitting"
            @click="closeBulkModal"
          >
            취소
          </button>
          <button
            type="button"
            class="page-button page-button--primary"
            :disabled="!canSubmitBulk"
            @click="handleBulkSubmit"
          >
            {{ state.bulkSubmitting ? '등록 중...' : '등록' }}
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :visible="state.confirmTarget != null"
      title="센서를 삭제할까요?"
      subtitle="삭제된 센서는 비활성 상태로 처리되며 입출차 매핑에서 제외됩니다."
      item-label="센서"
      :item-name="confirmItemName"
      action-label="삭제"
      action-text="센서 삭제"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.confirmSubmitting"
      @confirm="handleDeleteConfirm"
      @cancel="closeConfirmDelete"
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

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
}

.page-header__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.breadcrumb-link {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-detail);
}

.breadcrumb-link:hover {
  color: var(--color-primary);
}

.page-header__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-heading-3);
  font-weight: 700;
}

.page-header__actions {
  display: inline-flex;
  gap: 8px;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
}

.empty-state__title {
  margin: 0 0 6px;
  color: var(--color-text-primary);
  font-size: var(--font-size-body-sm);
  font-weight: 700;
}

.empty-state__desc {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
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

:deep(tr.is-inactive) td {
  opacity: 0.55;
}

.sensor-form {
  display: grid;
  gap: 16px;
}

.sensor-form__row {
  display: grid;
  gap: 8px;
}

.sensor-form__row--checkbox {
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
}

.sensor-form__label {
  color: #687282;
  font-size: 12px;
  font-weight: 600;
}

.sensor-form__optional {
  color: var(--color-text-secondary);
  font-weight: 400;
  font-size: 11px;
}

.sensor-form__input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A202C;
  font-size: 13px;
}

.sensor-form__input:focus {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
  border-color: var(--color-primary);
}

.sensor-form__input[readonly] {
  background: #F5F6F8;
  color: #687282;
  cursor: not-allowed;
}

.sensor-form__checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
}

.sensor-form__checkbox-label {
  color: var(--color-text-primary);
  font-size: 13px;
}

.sensor-form__error {
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

/* 일괄 등록 모달 (textarea CSV) */
.bulk-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.bulk-form__guide {
  background: var(--color-bg-app);
  border-radius: var(--radius-8);
  padding: var(--space-12);
  margin-bottom: var(--space-8);
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.bulk-form__guide p {
  margin: 0;
}

.bulk-form__guide code {
  background: var(--color-card-bg);
  padding: 2px 6px;
  border-radius: var(--radius-4);
  font-family: monospace;
}

.bulk-form__textarea {
  width: 100%;
  min-height: 280px;
  padding: var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-family: monospace;
  font-size: var(--font-size-body-sm);
  resize: vertical;
}

.bulk-form__textarea:focus {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
  border-color: var(--color-primary);
}

.bulk-form__count {
  margin: var(--space-4) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
}

.bulk-form__summary {
  margin: var(--space-4) 0 0;
  padding: var(--space-12);
  background: rgba(192, 139, 45, 0.1);
  border-left: 3px solid var(--color-warning);
  border-radius: var(--radius-4);
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
}

.bulk-form__error {
  margin: var(--space-4) 0 0;
  padding: var(--space-12);
  background: rgba(229, 62, 62, 0.1);
  border-left: 3px solid var(--color-danger);
  border-radius: var(--radius-4);
  color: var(--color-danger);
  font-size: var(--font-size-detail);
}

.bulk-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
  width: 100%;
}
</style>
