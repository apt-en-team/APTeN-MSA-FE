<script setup>
import { computed, inject, onMounted, onUnmounted, reactive } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const facilityStore = useFacilityStore()
const registerOpenModal = inject('registerOpenModal', () => {})

const facilityTypeOptions = [
  { value: 'STUDY_ROOM', label: '독서실' },
  { value: 'GYM', label: '헬스장' },
  { value: 'GOLF', label: '골프연습장' },
  { value: 'GX', label: 'GX' },
  { value: 'POOL', label: '수영장' },
  { value: 'SAUNA', label: '사우나' },
  { value: 'GUEST_HOUSE', label: '게스트하우스' },
  { value: 'LAUNDRY', label: '세탁실' },
  { value: 'CAFE', label: '카페' },
  { value: 'ETC', label: '기타' },
]

const state = reactive({
  mode: 'list', // 'list' | 'edit'
  // list mode
  facilities: [],
  policiesMap: {}, // { typeCode: policy }
  // edit mode
  facilityTypeCode: 'GYM',
  baseFee: 0,
  slotMin: 60,
  cancelDeadlineHours: 2,
  gxWaitingEnabled: false,
  isActive: true,
  editPolicies: [],
  loading: false,
  submitting: false,
  errorMessage: '',
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
})

const normalizeFacilities = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.content)) return response.content
  if (Array.isArray(response?.data?.content)) return response.data.content
  return []
}

const normalizeReservationType = (type) => {
  const value = String(type || '').trim()
  if (value === '좌석형') return 'SEAT'
  if (value === '정원형') return 'COUNT'
  if (value === '승인형') return 'APPROVAL'
  return value
}

const reservationTypeLabel = (type) => {
  return { SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[normalizeReservationType(type)] || type || '-'
}

const facilityTypeLabel = (typeCode) => {
  return facilityTypeOptions.find((t) => t.value === typeCode)?.label || typeCode || '-'
}

const getFacilityTypeCode = (facility) => {
  const typeId = String(facility.typeId || '')
  return facilityStore.facilityTypes?.find((t) => String(t.typeId) === typeId)?.typeCode || null
}

const selectedTypeLabel = computed(() => {
  return facilityTypeOptions.find((t) => t.value === state.facilityTypeCode)?.label || '-'
})

const selectedEditPolicy = computed(() => {
  return state.editPolicies.find((p) => p.facilityTypeCode === state.facilityTypeCode) || null
})

const isGxPolicy = computed(() => state.facilityTypeCode === 'GX')

const syncEditForm = (policy) => {
  state.baseFee = policy?.baseFee ?? 0
  state.slotMin = policy?.slotMin ?? 60
  state.cancelDeadlineHours = policy?.cancelDeadlineHours ?? 2
  state.gxWaitingEnabled = !!policy?.gxWaitingEnabled
  state.isActive = policy?.isActive ?? true
}

// 시설 목록 + 타입별 정책 병렬 조회
const fetchFacilitiesAndPolicies = async () => {
  state.loading = true
  state.errorMessage = ''

  try {
    if (!facilityStore.facilityTypes?.length) {
      await facilityStore.fetchFacilityTypes()
    }

    const result = await facilityStore.fetchAdminFacilities()
    const all = normalizeFacilities(result).map((f) => ({
      ...f,
      facilityId: f.facilityId ?? f.facilityUid ?? f.id,
      typeId: f.typeId ?? f.facilityTypeId ?? f.type?.id,
    }))
    state.facilities = all

    const typeIdSet = [...new Set(all.map((f) => String(f.typeId)).filter(Boolean))]
    const typeCodes = typeIdSet
      .map((tid) => facilityStore.facilityTypes?.find((t) => String(t.typeId) === tid)?.typeCode)
      .filter(Boolean)

    const entries = await Promise.all(
      typeCodes.map(async (code) => {
        try {
          const res = await facilityStore.fetchFacilityPolicies({ facilityTypeCode: code })
          const list = toList(res)
          const policy = list.find((p) => p.facilityTypeCode === code) || list[0] || null
          return [code, policy]
        } catch {
          return [code, null]
        }
      }),
    )
    state.policiesMap = Object.fromEntries(entries)
  } catch (error) {
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '시설 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 수정 모드 진입 (AdminLayout 헤더 버튼 연결)
const openEditMode = () => {
  state.mode = 'edit'
  fetchEditPolicies()
}

// 목록 모드 복귀
const closeEditMode = () => {
  state.mode = 'list'
  state.errorMessage = ''
  fetchFacilitiesAndPolicies()
}

// 수정 모드: 타입별 정책 조회
const fetchEditPolicies = async () => {
  state.loading = true
  state.errorMessage = ''

  try {
    const result = await facilityStore.fetchFacilityPolicies({
      facilityTypeCode: state.facilityTypeCode,
    })
    state.editPolicies = toList(result)
    syncEditForm(selectedEditPolicy.value)
  } catch (error) {
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '시설 정책을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const selectEditType = (code) => {
  state.facilityTypeCode = code
  fetchEditPolicies()
}

const resetEditForm = () => {
  syncEditForm(selectedEditPolicy.value)
  state.errorMessage = ''
}

const openResultModal = (type, title, subtitle) => {
  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.show = true
}

const closeResultModal = () => {
  resultModal.show = false
}

const submitPolicy = async () => {
  state.submitting = true
  state.errorMessage = ''

  const payload = {
    facilityTypeCode: state.facilityTypeCode,
    baseFee: Number(state.baseFee || 0),
    slotMin: Number(state.slotMin || 0),
    cancelDeadlineHours: Number(state.cancelDeadlineHours || 0),
    gxWaitingEnabled: !!state.gxWaitingEnabled,
    isActive: !!state.isActive,
  }

  try {
    await facilityStore.saveFacilityPolicy(payload)
    await fetchEditPolicies()
    openResultModal('success', '시설 정책이 저장되었습니다.', `${selectedTypeLabel.value} 정책을 반영했습니다.`)
  } catch (error) {
    openResultModal(
      'danger',
      '시설 정책 저장에 실패했습니다.',
      error.response?.data?.resultMessage ||
        error.response?.data?.message ||
        '잠시 후 다시 시도해주세요.',
    )
  } finally {
    state.submitting = false
  }
}

onMounted(() => {
  registerOpenModal(openEditMode)
  fetchFacilitiesAndPolicies()
})

onUnmounted(() => {
  registerOpenModal(null)
})
</script>

<template>
  <section class="policy-tab">
    <!-- 목록 모드 -->
    <template v-if="state.mode === 'list'">
      <div class="notice-box">
        현재 정책은 시설 타입 기준으로 적용됩니다. 같은 타입의 시설은 동일한 정책이 적용되며,
        시설별 개별 정책 설정은 추후 지원될 예정입니다.
      </div>

      <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

      <div v-if="state.loading" class="empty-box">시설 목록을 불러오는 중...</div>

      <div v-else-if="state.facilities.length === 0 && !state.errorMessage" class="empty-box">
        등록된 시설이 없습니다.
      </div>

      <div v-else class="facility-policy-list">
        <div
          v-for="facility in state.facilities"
          :key="facility.facilityId"
          class="facility-policy-card"
        >
          <div class="facility-policy-card__head">
            <div class="facility-policy-card__title-wrap">
              <strong class="facility-policy-card__name">{{ facility.name }}</strong>
              <div class="facility-policy-card__meta">
                <span class="meta-tag">{{ facilityTypeLabel(getFacilityTypeCode(facility)) }}</span>
                <span class="meta-tag">{{ reservationTypeLabel(facility.reservationType) }}</span>
              </div>
            </div>
            <span
              v-if="getFacilityTypeCode(facility) === 'GX'"
              class="policy-badge policy-badge--gx"
            >
              GX 프로그램 정책 이관 예정
            </span>
          </div>

          <div v-if="getFacilityTypeCode(facility) !== 'GX'" class="facility-policy-card__body">
            <template v-if="state.policiesMap[getFacilityTypeCode(facility)]">
              <span class="policy-item">
                기본요금 {{ Number(state.policiesMap[getFacilityTypeCode(facility)]?.baseFee || 0).toLocaleString() }}원
              </span>
              <span class="policy-item">
                예약단위 {{ state.policiesMap[getFacilityTypeCode(facility)]?.slotMin || '-' }}분
              </span>
              <span class="policy-item">
                취소마감 {{ state.policiesMap[getFacilityTypeCode(facility)]?.cancelDeadlineHours || '-' }}시간 전
              </span>
              <span
                class="policy-item"
                :class="
                  state.policiesMap[getFacilityTypeCode(facility)]?.isActive
                    ? 'policy-item--active'
                    : 'policy-item--inactive'
                "
              >
                {{ state.policiesMap[getFacilityTypeCode(facility)]?.isActive ? '정책 사용' : '정책 미사용' }}
              </span>
            </template>
            <span v-else class="policy-item policy-item--none">정책 없음 (타입 기본값 적용)</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 수정 모드 -->
    <template v-else>
      <div class="edit-mode-bar">
        <p class="edit-mode-notice">
          타입 기준 정책을 수정합니다. 저장 시 같은 타입의 모든 시설에 동일하게 적용됩니다.
        </p>
        <button class="btn-secondary" type="button" @click="closeEditMode">목록으로</button>
      </div>

      <div class="policy-layout">
        <!-- 좌측: 타입 네비게이션 -->
        <aside class="type-nav">
          <button
            v-for="type in facilityTypeOptions"
            :key="type.value"
            type="button"
            class="type-nav-btn"
            :class="{ active: state.facilityTypeCode === type.value }"
            @click="selectEditType(type.value)"
          >
            {{ type.label }}
          </button>
        </aside>

        <!-- 우측: 정책 폼 -->
        <article class="panel">
          <div class="notice-box">
            현재는 타입별 정책 구조입니다. 장기적으로 시설별 정책으로 전환할 예정입니다.
          </div>

          <div v-if="isGxPolicy" class="notice-box notice-box--warning">
            GX 정책은 프로그램 단위로 관리 예정입니다. 현재 API 구조 유지를 위해 타입 정책 값만 조회/저장합니다.
          </div>

          <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

          <div class="form-grid">
            <label class="form-field">
              <span>기본 요금</span>
              <input v-model="state.baseFee" type="number" min="0" />
            </label>

            <label class="form-field">
              <span>예약 단위 (분)</span>
              <input v-model="state.slotMin" type="number" min="1" />
            </label>

            <label class="form-field">
              <span>취소 마감 (시간)</span>
              <input v-model="state.cancelDeadlineHours" type="number" min="0" />
            </label>
          </div>

          <div class="toggle-list">
            <label class="toggle-row">
              <span>
                GX 대기 허용
                <em>GX 프로그램으로 이관 예정인 설정입니다.</em>
              </span>
              <input v-model="state.gxWaitingEnabled" type="checkbox" />
            </label>

            <label class="toggle-row">
              <span>
                정책 사용
                <em>비활성 정책은 예약 기본값으로 사용하지 않습니다.</em>
              </span>
              <input v-model="state.isActive" type="checkbox" />
            </label>
          </div>

          <div class="button-row">
            <button class="btn-secondary" type="button" @click="resetEditForm">초기화</button>
            <button class="btn-primary" type="button" :disabled="state.submitting" @click="submitPolicy">
              {{ state.submitting ? '저장 중' : '정책 저장' }}
            </button>
          </div>
        </article>
      </div>
    </template>

    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      confirm-text="확인"
      @close="closeResultModal"
    />
  </section>
</template>

<style scoped>
.policy-tab {
  font-family: 'Noto Sans KR', sans-serif;
}

/* 공통 */
.notice-box {
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #f0f4ff;
  color: #2b3a55;
  font-size: 13px;
}

.notice-box--warning {
  background: #fff7ed;
  color: #c08b2d;
}

.error-box {
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

.empty-box {
  padding: 32px;
  text-align: center;
  color: #7b8ea8;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 10px;
}

/* 목록 모드 */
.facility-policy-list {
  display: grid;
  gap: 10px;
}

.facility-policy-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px 20px;
}

.facility-policy-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.facility-policy-card__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.facility-policy-card__name {
  font-size: 15px;
  font-weight: 700;
  color: #1e2a3e;
}

.facility-policy-card__meta {
  display: flex;
  gap: 6px;
}

.meta-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  background: #eef2f7;
  color: #4a5568;
  font-size: 11px;
  font-weight: 600;
}

.policy-badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.policy-badge--gx {
  background: #fff7ed;
  color: #c08b2d;
}

.facility-policy-card__body {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.policy-item {
  padding: 4px 10px;
  border-radius: 6px;
  background: #f8fafc;
  color: #2b3a55;
  font-size: 12px;
  font-weight: 600;
}

.policy-item--active {
  background: #ebf5ee;
  color: #4d8b5a;
}

.policy-item--inactive {
  background: #fff5f5;
  color: #e53e3e;
}

.policy-item--none {
  color: #a0aec0;
  background: #f5f6f8;
  font-weight: 400;
}

/* 수정 모드 */
.edit-mode-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f0f4ff;
  margin-bottom: 18px;
}

.edit-mode-notice {
  margin: 0;
  font-size: 13px;
  color: #2b3a55;
}

.policy-layout {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 18px;
  align-items: start;
}

.type-nav {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.type-nav-btn {
  width: 100%;
  padding: 10px 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #687282;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  transition: background 0.15s ease, color 0.15s ease;
}

.type-nav-btn:hover {
  background: #f5f6f8;
  color: #2b3a55;
}

.type-nav-btn.active {
  background: #1e2a3e;
  color: #ffffff;
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a55;
}

.form-field input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d7dee8;
  border-radius: 8px;
  color: #1e2a3e;
}

.toggle-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
  color: #1e2a3e;
  font-size: 13px;
  font-weight: 700;
}

.toggle-row em {
  display: block;
  margin-top: 4px;
  color: #7b8ea8;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
}

.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.btn-primary {
  border: 0;
  background: #1e2a3e;
  color: #ffffff;
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.btn-secondary {
  border: 1px solid #d7dee8;
  background: #ffffff;
  color: #2b3a55;
}

@media (max-width: 960px) {
  .policy-layout {
    grid-template-columns: 1fr;
  }

  .type-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .type-nav-btn {
    width: auto;
  }

  .edit-mode-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
