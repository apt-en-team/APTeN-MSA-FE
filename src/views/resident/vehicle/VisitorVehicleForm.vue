<script setup>
// 입주민 방문차량 등록/수정 페이지입니다.
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
const visitorVehicleId = computed(() => route.params.visitorVehicleId ?? null)
const isEdit = computed(() => !!visitorVehicleId.value)

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
  visitDate: '',
})

// 로컬 필수값 검증 상태
const localError = reactive({
  licensePlate: false,
  visitDate: false,
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
const listPath = computed(() => `/resident/${route.params.complexId}/visitor-vehicle`)

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
    const detail = await visitorVehicleStore.fetchVisitorVehicleDetail(visitorVehicleId.value)
    form.licensePlate = detail?.licensePlate ?? ''
    form.visitorName = detail?.visitorName ?? ''
    form.phone = detail?.phone ?? ''
    form.visitDate = detail?.visitDate?.slice(0, 10) ?? ''
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
const pageTitle = computed(() => (isEdit.value ? '방문차량 수정' : '방문차량 등록'))

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

// 필수값 검증 후 등록 또는 수정 제출
const handleSubmit = async () => {
  localError.licensePlate = !form.licensePlate.trim()
  localError.visitDate = !form.visitDate
  if (localError.licensePlate || localError.visitDate) return
  submitting.value = true
  errorMessage.value = ''
  const body = {
    licensePlate: form.licensePlate.trim(),
    visitorName: form.visitorName.trim() || null,
    phone: form.phone.trim() || null,
    visitPurpose: resolveVisitPurpose() || null,
    visitDate: form.visitDate,
  }
  try {
    if (isEdit.value) {
      await visitorVehicleStore.updateVisitorVehicle(visitorVehicleId.value, body)
    } else {
      await visitorVehicleStore.createVisitorVehicle(body)
    }
    // 변이 액션은 에러를 store.error에 담으므로 통일된 처리로 끌어올린다.
    if (visitorVehicleStore.error) throw visitorVehicleStore.error
    resultModal.title = isEdit.value ? '방문차량 정보가 수정되었습니다' : '방문차량이 등록되었습니다'
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
      <span>방문차량</span>
    </button>

    <!-- 헤더 -->
    <header class="vehicle-form-page__header">
      <h1 class="vehicle-form-page__title">{{ pageTitle }}</h1>
      <p class="vehicle-form-page__subtitle">
        {{ isEdit ? '수정할 방문차량 정보를 입력해주세요.' : '방문 예정 차량 정보를 입력해주세요.' }}
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
            :error="localError.licensePlate"
          />
          <p v-if="localError.licensePlate" class="vehicle-form__error">차량번호를 입력해주세요.</p>
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

        <!-- 방문예정일 -->
        <div class="vehicle-form__field">
          <label class="vehicle-form__label">
            방문예정일 <span class="vehicle-form__required">*</span>
          </label>
          <BaseInput v-model="form.visitDate" type="date" :error="localError.visitDate" />
          <p v-if="localError.visitDate" class="vehicle-form__error">방문예정일을 선택해주세요.</p>
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
