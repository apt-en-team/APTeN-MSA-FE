<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const facilityStore = useFacilityStore()

const state = reactive({
  mode: 'list',
  facilities: [],
  policiesMap: {},
  facilityId: '',
  baseFee: 0,
  usageUnitType: 'MINUTE',
  slotMin: 60,
  cancelDeadlineHours: 2,
  maxReservationCount: '',
  isActive: true,
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

const policyList = (data) => {
  const list = toList(data)
  if (list.length > 0) return list
  if (data && typeof data === 'object' && !Array.isArray(data) && !data.content) return [data]
  return []
}

const getFacilityType = (facility) => {
  const typeId = String(facility.typeId || '')
  return facilityStore.facilityTypes?.find((type) => String(type.typeId) === typeId) || null
}

const getFacilityTypeCode = (facility) => {
  return getFacilityType(facility)?.typeCode || facility.typeCode || null
}

const getFacilityTypeLabel = (facility) => {
  return getFacilityType(facility)?.typeName || facility.typeName || getFacilityTypeCode(facility) || '-'
}

const reservationTypeLabel = (type) => {
  return { SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[normalizeReservationType(type)] || type || '-'
}

const isGxFacility = (facility) => getFacilityTypeCode(facility) === 'GX'

const policyTargets = computed(() => state.facilities.filter((facility) => !isGxFacility(facility)))

const selectedFacility = computed(() => {
  return state.facilities.find((facility) => String(facility.facilityId) === String(state.facilityId)) || null
})

const selectedPolicy = computed(() => {
  return state.policiesMap[String(state.facilityId)] || null
})

const selectedReservationType = computed(() => {
  return normalizeReservationType(selectedFacility.value?.reservationType)
})

const showMaxReservationCount = computed(() => {
  return selectedReservationType.value === 'COUNT' || selectedReservationType.value === 'APPROVAL'
})

const isMinuteUnit = computed(() => state.usageUnitType !== 'DAY')

const syncPolicyForm = (policy) => {
  state.baseFee = policy?.baseFee ?? 0
  state.usageUnitType = policy?.usageUnitType ?? 'MINUTE'
  state.slotMin = policy?.usageUnitType === 'DAY' ? 60 : policy?.slotMin ?? 60
  state.cancelDeadlineHours = policy?.cancelDeadlineHours ?? 2
  state.maxReservationCount = policy?.maxReservationCount ?? ''
  state.isActive = policy?.isActive ?? true
}

const fetchPolicyForFacility = async (facilityId) => {
  const result = await facilityStore.fetchFacilityPolicies({ facilityId })
  const list = policyList(result)
  return list.find((policy) => String(policy.facilityId) === String(facilityId)) || list[0] || null
}

// GX 정책은 프로그램 단위로 관리하므로 일반 시설만 정책 조회
const fetchFacilitiesAndPolicies = async () => {
  state.loading = true
  state.errorMessage = ''

  try {
    if (!facilityStore.facilityTypes?.length) {
      await facilityStore.fetchFacilityTypes()
    }

    const result = await facilityStore.fetchAdminFacilities()
    state.facilities = normalizeFacilities(result).map((facility) => ({
      ...facility,
      facilityId: facility.facilityId ?? facility.facilityUid ?? facility.id,
      typeId: facility.typeId ?? facility.facilityTypeId ?? facility.type?.id,
      reservationType: normalizeReservationType(facility.reservationType),
    }))

    const entries = await Promise.all(
      policyTargets.value.map(async (facility) => {
        try {
          return [String(facility.facilityId), await fetchPolicyForFacility(facility.facilityId)]
        } catch {
          return [String(facility.facilityId), null]
        }
      }),
    )

    state.policiesMap = Object.fromEntries(entries)
  } catch (error) {
    console.error('시설 정책 목록 조회 실패:', error)
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '시설 정책 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const openEditMode = (facility = policyTargets.value[0]) => {
  if (!facility) {
    state.errorMessage = '정책을 설정할 수 있는 일반 시설이 없습니다.'
    return
  }

  state.facilityId = facility.facilityId
  syncPolicyForm(state.policiesMap[String(facility.facilityId)])
  state.mode = 'edit'
}

const closeEditMode = async () => {
  state.mode = 'list'
  state.errorMessage = ''
  await fetchFacilitiesAndPolicies()
}

const selectFacility = (facility) => {
  state.facilityId = facility.facilityId
  syncPolicyForm(state.policiesMap[String(facility.facilityId)])
}

const resetPolicyForm = () => {
  syncPolicyForm(selectedPolicy.value)
  state.errorMessage = ''
}

const openResultModal = (type, title, subtitle) => {
  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.show = true
}

const closeResultModal = async () => {
  const shouldReturnToList = resultModal.type === 'success'
  resultModal.show = false

  if (shouldReturnToList) {
    await closeEditMode()
  }
}

const submitPolicy = async () => {
  if (!state.facilityId) {
    state.errorMessage = '정책을 설정할 시설을 선택해주세요.'
    return
  }

  state.submitting = true
  state.errorMessage = ''

  const payload = {
    facilityId: state.facilityId,
    baseFee: Number(state.baseFee || 0),
    usageUnitType: state.usageUnitType,
    slotMin: isMinuteUnit.value ? Number(state.slotMin || 0) : null,
    cancelDeadlineHours: Number(state.cancelDeadlineHours || 0),
    maxReservationCount: showMaxReservationCount.value
      ? state.maxReservationCount === '' || state.maxReservationCount === null
        ? null
        : Number(state.maxReservationCount)
      : null,
    isActive: !!state.isActive,
  }

  try {
    const savedPolicy = await facilityStore.saveFacilityPolicy(payload)
    state.policiesMap[String(state.facilityId)] = savedPolicy || payload
    syncPolicyForm(state.policiesMap[String(state.facilityId)])
    openResultModal('success', '시설 정책이 저장되었습니다.', `${selectedFacility.value?.name || '선택 시설'} 정책을 반영했습니다.`)
  } catch (error) {
    console.error('시설 정책 저장 실패:', error)
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

onMounted(fetchFacilitiesAndPolicies)
</script>

<template>
  <section class="policy-tab">
    <template v-if="state.mode === 'list'">
      <div class="notice-box">
        FacilityPolicy는 등록된 시설 기준으로 관리합니다. GX 시설의 요금, 정원, 대기 허용 여부는 GX 프로그램에서 관리합니다.
      </div>

      <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

      <div v-if="state.loading" class="empty-box">시설 정책을 불러오는 중...</div>

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
                <span class="meta-tag">{{ getFacilityTypeLabel(facility) }}</span>
                <span class="meta-tag">{{ reservationTypeLabel(facility.reservationType) }}</span>
              </div>
            </div>
            <span v-if="isGxFacility(facility)" class="policy-badge policy-badge--gx">
              GX 프로그램에서 관리
            </span>
            <button v-else class="btn-primary" type="button" @click="openEditMode(facility)">
              정책 설정
            </button>
          </div>

          <div v-if="!isGxFacility(facility)" class="facility-policy-card__body">
            <template v-if="state.policiesMap[String(facility.facilityId)]">
              <span class="policy-item">
                기본요금 {{ Number(state.policiesMap[String(facility.facilityId)]?.baseFee || 0).toLocaleString() }}원
              </span>
              <span class="policy-item">
                이용단위 {{ state.policiesMap[String(facility.facilityId)]?.usageUnitType === 'DAY' ? '하루 이용' : '시간 단위' }}
              </span>
              <span
                v-if="state.policiesMap[String(facility.facilityId)]?.usageUnitType !== 'DAY'"
                class="policy-item"
              >
                예약단위 {{ state.policiesMap[String(facility.facilityId)]?.slotMin || '-' }}분
              </span>
              <span class="policy-item">
                취소마감 {{ state.policiesMap[String(facility.facilityId)]?.cancelDeadlineHours || '-' }}시간 전
              </span>
              <span
                v-if="
                  ['COUNT', 'APPROVAL'].includes(normalizeReservationType(facility.reservationType))
                "
                class="policy-item"
              >
                최대 예약 인원 {{ state.policiesMap[String(facility.facilityId)]?.maxReservationCount ?? '-' }}명
              </span>
              <span
                class="policy-item"
                :class="
                  state.policiesMap[String(facility.facilityId)]?.isActive
                    ? 'policy-item--active'
                    : 'policy-item--inactive'
                "
              >
                {{ state.policiesMap[String(facility.facilityId)]?.isActive ? '정책 사용' : '정책 미사용' }}
              </span>
            </template>
            <span v-else class="policy-item policy-item--none">정책 없음</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="edit-mode-bar">
        <p class="edit-mode-notice">
          {{ selectedFacility?.name || '선택 시설' }} 기준 정책을 수정합니다.
        </p>
        <button class="btn-secondary" type="button" @click="closeEditMode">목록으로</button>
      </div>

      <div class="policy-layout">
        <aside class="type-nav">
          <button
            v-for="facility in policyTargets"
            :key="facility.facilityId"
            type="button"
            class="type-nav-btn"
            :class="{ active: String(state.facilityId) === String(facility.facilityId) }"
            @click="selectFacility(facility)"
          >
            {{ facility.name }}
          </button>
        </aside>

        <article class="panel">
          <div class="notice-box">
            GX 시설은 정책 설정 대상에서 제외됩니다. GX 프로그램에서 요금, 정원, 대기 허용 여부를 관리해주세요.
          </div>

          <div v-if="selectedReservationType === 'SEAT'" class="notice-box notice-box--subtle">
            좌석 수와 좌석별 사용 여부는 좌석 관리에서 설정합니다.
          </div>

          <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

          <div class="form-grid">
            <label class="form-field">
              <span>기본 요금</span>
              <input v-model="state.baseFee" type="number" min="0" />
            </label>

            <label class="form-field">
              <span>이용 단위</span>
              <select v-model="state.usageUnitType">
                <option value="MINUTE">시간 단위</option>
                <option value="DAY">하루 이용</option>
              </select>
            </label>

            <label v-if="isMinuteUnit" class="form-field">
              <span>예약 단위 (분)</span>
              <input v-model="state.slotMin" type="number" min="1" />
            </label>

            <label class="form-field">
              <span>취소 마감 (시간)</span>
              <input v-model="state.cancelDeadlineHours" type="number" min="0" />
            </label>

            <label v-if="showMaxReservationCount" class="form-field">
              <span>최대 예약 인원</span>
              <input v-model="state.maxReservationCount" type="number" min="0" />
            </label>
          </div>

          <div class="toggle-list">
            <label class="toggle-row">
              <span>
                정책 사용
                <em>비활성 정책은 예약 기본값으로 사용하지 않습니다.</em>
              </span>
              <input v-model="state.isActive" type="checkbox" />
            </label>
          </div>

          <div class="button-row">
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

.notice-box {
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #f0f4ff;
  color: #2b3a55;
  font-size: 13px;
}

.notice-box--subtle {
  background: #f8fafc;
  color: #687282;
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

.form-field input,
.form-field select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d7dee8;
  border-radius: 8px;
  color: #1e2a3e;
  background: #ffffff;
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
