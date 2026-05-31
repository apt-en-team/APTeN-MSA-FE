<script setup>
// 입주민 고정방문차량 등록/수정 페이지입니다.
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVisitorVehicleStore } from '@/stores/useVisitorVehicleStore'
import BaseInput from '@/components/common/BaseInput.vue'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { VISIT_PURPOSE_PRESETS, VISIT_PURPOSE_CUSTOM } from '@/constants/visitPurpose'

const route = useRoute()
const router = useRouter()
const visitorVehicleStore = useVisitorVehicleStore()

// 라우트 파라미터의 id 유무로 수정 모드 판별
const regularVisitorVehicleId = computed(() => route.params.regularVisitorVehicleId ?? null)
const isEdit = computed(() => !!regularVisitorVehicleId.value)

// 방문 목적 프리셋 목록 (템플릿 노출용)
const purposePresets = VISIT_PURPOSE_PRESETS

// 직접 입력 식별값 (템플릿 노출용)
const purposeCustomValue = VISIT_PURPOSE_CUSTOM

// 폼 입력값
const form = reactive({
  licensePlate: '',
  visitorName: '',
  phone: '',
  purposeSelect: '',
  purposeCustom: '',
  startDate: '',
  endDate: '',
})

// 로컬 필수값 검증 상태
const localError = reactive({
  licensePlate: false,
  startDate: false,
  period: false,
})

// 수정 모드 기존값 로딩 상태
const detailLoading = ref(false)
const detailError = ref('')

// 제출 상태와 서버 오류 메시지
const submitting = ref(false)
const errorMessage = ref('')

// 결과 알림 모달 상태
const resultModal = reactive({
  show: false,
  title: '',
})

// 목록 화면 경로 생성
const listPath = computed(() => `/resident/${route.params.complexId}/regular-visitor-vehicle`)

// 방문 목적 원본값을 드롭다운 선택값과 직접 입력값으로 분해
const applyPurpose = (purpose) => {
  const value = purpose ?? ''
  if (value && VISIT_PURPOSE_PRESETS.includes(value)) {
    form.purposeSelect = value
    form.purposeCustom = ''
  } else if (value) {
    form.purposeSelect = VISIT_PURPOSE_CUSTOM
    form.purposeCustom = value
  } else {
    form.purposeSelect = ''
    form.purposeCustom = ''
  }
}

// 수정 모드 진입 시 기존값 조회 후 프리필
const loadDetail = async () => {
  detailLoading.value = true
  detailError.value = ''
  try {
    const detail = await visitorVehicleStore.fetchRegularVisitorVehicleDetail(regularVisitorVehicleId.value)
    form.licensePlate = detail?.licensePlate ?? ''
    form.visitorName = detail?.visitorName ?? ''
    form.phone = detail?.phone ?? ''
    form.startDate = detail?.startDate?.slice(0, 10) ?? ''
    form.endDate = detail?.endDate?.slice(0, 10) ?? ''
    applyPurpose(detail?.visitPurpose)
  } catch (e) {
    detailError.value = e?.response?.data?.message || '기존 정보를 불러오지 못했습니다.'
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  if (isEdit.value) loadDetail()
})

// 페이지 제목
const pageTitle = computed(() => (isEdit.value ? '고정방문차량 수정' : '고정방문차량 등록'))

// 제출 버튼 라벨
const submitLabel = computed(() => (isEdit.value ? '저장' : '등록하기'))

// 선택 또는 직접 입력값으로 최종 방문 목적 문자열 해석
const resolveVisitPurpose = () => {
  if (form.purposeSelect === VISIT_PURPOSE_CUSTOM) return form.purposeCustom.trim()
  return form.purposeSelect
}

// 목록 화면으로 이동
const goToList = () => {
  router.push(listPath.value)
}

// 필수값과 기간 순서를 검증 후 등록 또는 수정 제출
const handleSubmit = async () => {
  localError.licensePlate = !isEdit.value && !form.licensePlate.trim()
  localError.startDate = !form.startDate
  // 종료일은 선택값, 입력된 경우에만 시작일 이후인지 검증
  localError.period = !!form.startDate && !!form.endDate && form.endDate < form.startDate
  if (localError.licensePlate || localError.startDate || localError.period) return
  submitting.value = true
  errorMessage.value = ''
  // 종료일 미입력 시 무기한을 의미하는 null로 전송
  const endDate = form.endDate || null
  try {
    if (isEdit.value) {
      // 고정방문 수정은 차량번호를 받지 않으므로 제외
      await visitorVehicleStore.updateRegularVisitorVehicle(regularVisitorVehicleId.value, {
        visitorName: form.visitorName.trim() || null,
        phone: form.phone.trim() || null,
        visitPurpose: resolveVisitPurpose() || null,
        startDate: form.startDate,
        endDate,
      })
    } else {
      await visitorVehicleStore.createRegularVisitorVehicle({
        licensePlate: form.licensePlate.trim(),
        visitorName: form.visitorName.trim() || null,
        phone: form.phone.trim() || null,
        visitPurpose: resolveVisitPurpose() || null,
        startDate: form.startDate,
        endDate,
      })
    }
    // 변이 액션은 에러를 store.error에 담으므로 통일된 처리로 끌어올린다.
    if (visitorVehicleStore.error) throw visitorVehicleStore.error
    resultModal.title = isEdit.value ? '고정방문차량 정보가 수정되었습니다' : '고정방문차량이 등록되었습니다'
    resultModal.show = true
  } catch (e) {
    errorMessage.value = e?.response?.data?.message || '처리에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}

// 결과 모달 확인 시 목록으로 이동
const onResultConfirm = () => {
  resultModal.show = false
  goToList()
}
</script>

<template>
  <div class="vehicle-form-page">
    <!-- 뒤로가기 -->
    <button class="back-btn" type="button" @click="goToList">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>고정방문차량</span>
    </button>

    <!-- 헤더 -->
    <header class="vehicle-form-page__header">
      <h1 class="vehicle-form-page__title">{{ pageTitle }}</h1>
      <p class="vehicle-form-page__subtitle">
        {{ isEdit ? '수정할 고정방문 차량 정보를 입력해주세요.' : '고정방문 차량 정보를 입력해주세요.' }}
      </p>
    </header>

    <!-- 수정 모드 기존값 로딩 -->
    <div v-if="detailLoading" class="vehicle-form-page__feedback">기존 정보를 불러오는 중입니다...</div>

    <!-- 수정 모드 로딩 실패 -->
    <div v-else-if="detailError" class="vehicle-form-page__feedback error">{{ detailError }}</div>

    <template v-else>
      <!-- 입력 카드 -->
      <div class="vehicle-form">
        <!-- 차량번호 -->
        <div class="vehicle-form__field">
          <label class="vehicle-form__label">
            차량번호 <span class="vehicle-form__required">*</span>
          </label>
          <BaseInput
            v-model="form.licensePlate"
            placeholder="예: 12가 3456"
            :disabled="isEdit"
            :error="localError.licensePlate"
          />
          <p v-if="localError.licensePlate" class="vehicle-form__error">차량번호를 입력해주세요.</p>
          <p v-else-if="isEdit" class="vehicle-form__hint">차량번호는 수정할 수 없습니다.</p>
        </div>

        <!-- 방문자 이름 -->
        <div class="vehicle-form__field">
          <label class="vehicle-form__label">방문자 이름</label>
          <BaseInput v-model="form.visitorName" placeholder="예: 홍길동" />
        </div>

        <!-- 연락처 -->
        <div class="vehicle-form__field">
          <label class="vehicle-form__label">연락처</label>
          <BaseInput v-model="form.phone" placeholder="예: 010-1234-5678" />
        </div>

        <!-- 방문목적 -->
        <div class="vehicle-form__field">
          <label class="vehicle-form__label">방문목적</label>
          <select v-model="form.purposeSelect" class="vehicle-form__select">
            <option value="">방문목적 선택</option>
            <option v-for="purpose in purposePresets" :key="purpose" :value="purpose">{{ purpose }}</option>
            <option :value="purposeCustomValue">직접 입력</option>
          </select>
          <BaseInput
            v-if="form.purposeSelect === purposeCustomValue"
            v-model="form.purposeCustom"
            placeholder="방문 목적을 입력하세요"
          />
        </div>

        <!-- 시작일 -->
        <div class="vehicle-form__field">
          <label class="vehicle-form__label">
            시작일 <span class="vehicle-form__required">*</span>
          </label>
          <BaseInput v-model="form.startDate" type="date" :error="localError.startDate || localError.period" />
          <p v-if="localError.startDate" class="vehicle-form__error">시작일을 선택해주세요.</p>
        </div>

        <!-- 종료일 -->
        <div class="vehicle-form__field">
          <label class="vehicle-form__label">종료일</label>
          <BaseInput v-model="form.endDate" type="date" :error="localError.period" />
          <p v-if="localError.period" class="vehicle-form__error">종료일은 시작일과 같거나 이후여야 합니다.</p>
          <p v-else class="vehicle-form__hint">미입력 시 무기한으로 등록됩니다.</p>
        </div>

        <!-- 서버 오류 안내 -->
        <p v-if="errorMessage" class="vehicle-form__error">{{ errorMessage }}</p>

        <!-- 필수 항목 안내 -->
        <p class="vehicle-form__required-note">
          <span class="vehicle-form__required">*</span> 표시는 필수 입력 항목입니다.
        </p>
      </div>

      <!-- 동작 버튼 -->
      <div class="vehicle-form-page__actions">
        <button type="button" class="vehicle-form-page__cancel" @click="goToList">취소</button>
        <button
          type="button"
          class="vehicle-form-page__submit"
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '처리 중...' : submitLabel }}
        </button>
      </div>
    </template>

    <!-- 결과 알림 모달 -->
    <ResidentModal
      :visible="resultModal.show"
      type="success"
      :title="resultModal.title"
      :show-cancel="false"
      confirm-text="확인"
      @close="onResultConfirm"
      @confirm="onResultConfirm"
    />
  </div>
</template>

<style scoped>
.vehicle-form-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--space-20) var(--space-16);
  min-height: 100%;
}

/* 뒤로가기 */
.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--resident-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* 헤더 */
.vehicle-form-page__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

.vehicle-form-page__subtitle {
  margin: 5px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 로딩/에러 */
.vehicle-form-page__feedback {
  padding: 40px 0;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 13px;
}

.vehicle-form-page__feedback.error {
  color: var(--color-danger);
}

/* 입력 카드 */
.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-card-bg);
}

.vehicle-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vehicle-form__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.vehicle-form__required {
  color: var(--color-danger);
}

.vehicle-form__select {
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
}

.vehicle-form__error {
  margin: 0;
  font-size: 12px;
  color: var(--color-danger);
}

.vehicle-form__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.vehicle-form__required-note {
  margin: 4px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 동작 버튼 */
.vehicle-form-page__actions {
  display: flex;
  gap: 8px;
}

.vehicle-form-page__cancel,
.vehicle-form-page__submit {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.vehicle-form-page__cancel {
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-text-secondary);
}

.vehicle-form-page__submit {
  border: none;
  background: var(--resident-primary);
  color: #FFFFFF;
}

.vehicle-form-page__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
