<script setup>
// 입주민 내 세대 차량 목록 화면입니다.
import { ref, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useVehicleStore } from '@/stores/useVehicleStore'
import { useAuthStore } from '@/stores/useAuthStore'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import VehicleFormModal from '@/components/resident/vehicle/VehicleFormModal.vue'
import { vehicleImageByModelName } from '@/constants/vehicleImage'

const vehicleStore = useVehicleStore()
const authStore = useAuthStore()
const { myVehicles } = storeToRefs(vehicleStore)

// 목록 로딩/에러 상태 (store.loading은 변이 액션과 공유되므로 화면 전용 상태를 따로 둔다)
const listLoading = ref(false)
const loadError = ref(false)

// 등록/수정 모달 상태
const formModal = reactive({
  open: false,
  mode: 'create',
  vehicle: null,
  submitting: false,
  errorMessage: '',
})

// 삭제 확인 모달 상태
const deleteModal = reactive({
  open: false,
  target: null,
  submitting: false,
})

// 결과 모달 상태
const resultModal = reactive({
  open: false,
  type: 'success',
  title: '',
  desc: '',
})

// 차종 이미지 로드 실패 차량 기록
const imgError = reactive({})

// 상태 값에 따른 뱃지 색상 매핑
const STATUS_VARIANT = {
  승인대기: 'warning',
  승인완료: 'success',
  승인거절: 'danger',
}

// 요일 표기 사전
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 내 세대 차량 목록 조회
const loadVehicles = async () => {
  listLoading.value = true
  loadError.value = false
  try {
    await vehicleStore.fetchMyVehicles()
  } catch {
    loadError.value = true
  } finally {
    listLoading.value = false
  }
}

onMounted(loadVehicles)

// 로그인 사용자가 등록한 차량인지 판단
const isMine = (item) => Number(item.userId) === Number(authStore.userId)

// 수정 가능 여부 판단 (본인 차량 + 승인대기/승인완료 상태)
const canEdit = (item) => isMine(item) && (item.status === '승인대기' || item.status === '승인완료')

// 상태 뱃지 색상 반환
const badgeVariant = (status) => STATUS_VARIANT[status] ?? 'neutral'

// 차종 텍스트에 매핑된 카드 이미지 반환
const vehicleImage = (item) => vehicleImageByModelName(item.modelName)

// 이미지 로드 실패 처리
const onImgError = (vehicleId) => {
  imgError[vehicleId] = true
}

// 등록일을 yyyy.MM.dd로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

// 입출차 시각을 한국어 형식으로 변환
const formatKoreanDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const day = WEEKDAYS[date.getDay()]
  const hour24 = date.getHours()
  const meridiem = hour24 < 12 ? '오전' : '오후'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minute = date.getMinutes()
  return `${yyyy}.${mm}.${dd}(${day}) ${meridiem} ${hour12}시 ${minute}분`
}

// 카드에 표시할 최근 입출차 문구 반환
const formatLastLog = (item) => {
  if (!item.lastLoggedAt) return '입출차 기록 없음'
  const prefix = item.lastEntryType ? `${item.lastEntryType} / ` : ''
  return `${prefix}${formatKoreanDateTime(item.lastLoggedAt)}`
}

// 결과 모달 표시
const openResult = (type, title, desc = '') => {
  resultModal.type = type
  resultModal.title = title
  resultModal.desc = desc
  resultModal.open = true
}

// 결과 모달 닫기
const closeResult = () => {
  resultModal.open = false
}

// 등록 모달 열기
const openCreate = () => {
  formModal.mode = 'create'
  formModal.vehicle = null
  formModal.errorMessage = ''
  formModal.open = true
}

// 수정 모달 열기
const openEdit = (item) => {
  if (!canEdit(item)) return
  formModal.mode = 'edit'
  formModal.vehicle = item
  formModal.errorMessage = ''
  formModal.open = true
}

// 등록/수정 모달 닫기
const closeForm = () => {
  formModal.open = false
}

// 차량번호 중복 사전 확인 (실패 시 null 반환해 등록은 서버 검증에 맡긴다)
const safeCheckPlate = async (licensePlate) => {
  try {
    return await vehicleStore.checkLicensePlate({ licensePlate })
  } catch {
    return null
  }
}

// 등록/수정 폼 제출 처리
const submitForm = async (payload) => {
  formModal.submitting = true
  formModal.errorMessage = ''
  const isCreate = formModal.mode === 'create'
  try {
    if (isCreate) {
      const check = await safeCheckPlate(payload.licensePlate)
      if (check?.isDuplicate) {
        formModal.errorMessage = '이미 등록된 차량번호입니다.'
        return
      }
      await vehicleStore.createVehicle({
        licensePlate: payload.licensePlate,
        modelName: payload.modelName,
        isPrimary: payload.isPrimary,
      })
    } else {
      await vehicleStore.updateVehicle(formModal.vehicle.vehicleId, {
        modelName: payload.modelName,
        isPrimary: payload.isPrimary,
      })
    }
    formModal.open = false
    openResult('success', isCreate ? '차량이 등록되었습니다' : '차량 정보가 수정되었습니다')
    await loadVehicles()
  } catch (e) {
    const message = e?.response?.data?.message || '처리에 실패했습니다.'
    openResult('danger', isCreate ? '등록 실패' : '수정 실패', message)
  } finally {
    formModal.submitting = false
  }
}

// 삭제 확인 모달 열기
const openDelete = (item) => {
  deleteModal.target = item
  deleteModal.open = true
}

// 삭제 확인 모달 닫기
const cancelDelete = () => {
  deleteModal.open = false
  deleteModal.target = null
}

// 차량 삭제 처리
const confirmDelete = async () => {
  if (!deleteModal.target || deleteModal.submitting) return
  deleteModal.submitting = true
  try {
    await vehicleStore.deleteVehicle(deleteModal.target.vehicleId)
    deleteModal.open = false
    openResult('success', '차량이 삭제되었습니다')
    await loadVehicles()
  } catch (e) {
    deleteModal.open = false
    const message = e?.response?.data?.message || '삭제에 실패했습니다.'
    openResult('danger', '삭제 실패', message)
  } finally {
    deleteModal.submitting = false
    deleteModal.target = null
  }
}
</script>

<template>
  <section class="vehicle-page">
    <header class="vehicle-page__header">
      <h1 class="vehicle-page__title">내 차량</h1>
      <p class="vehicle-page__subtitle">우리 세대에 등록된 차량을 확인하고 관리하세요.</p>
    </header>

    <!-- 로딩 -->
    <BaseLoading v-if="listLoading">차량 목록을 불러오는 중입니다...</BaseLoading>

    <!-- 에러 -->
    <BaseEmpty v-else-if="loadError">차량 정보를 불러오지 못했습니다.</BaseEmpty>

    <!-- 목록 -->
    <template v-else>
      <BaseEmpty v-if="myVehicles.length === 0">표시할 차량이 없습니다.</BaseEmpty>

      <ul v-else class="vehicle-list">
        <li v-for="(item, index) in myVehicles" :key="item.vehicleId" class="vehicle-card">
          <!-- 차종 사진 -->
          <div class="vehicle-card__thumb">
            <img
              v-if="vehicleImage(item) && !imgError[item.vehicleId]"
              :src="vehicleImage(item)"
              :alt="item.modelName"
              class="vehicle-card__thumb-img"
              @error="onImgError(item.vehicleId)"
            />
            <div v-else class="vehicle-card__thumb-fallback" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 17H3v-5l2-5h14l2 5v5h-2"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="7" cy="17" r="2" stroke="currentColor" stroke-width="1.6" />
                <circle cx="17" cy="17" r="2" stroke="currentColor" stroke-width="1.6" />
              </svg>
            </div>
          </div>

          <!-- 차량 정보 -->
          <div class="vehicle-card__body">
            <div class="vehicle-card__head">
              <span class="vehicle-card__index">내 차량 {{ index + 1 }}</span>
              <span v-if="item.residentName" class="vehicle-card__owner">등록자 {{ item.residentName }}</span>
            </div>

            <div class="vehicle-card__row">
              <div class="vehicle-card__pair">
                <span class="vehicle-card__label">차종</span>
                <span class="vehicle-card__value">{{ item.modelName || '차종 미입력' }}</span>
              </div>
              <div class="vehicle-card__pair">
                <span class="vehicle-card__label">차량 번호</span>
                <span class="vehicle-card__value">{{ item.licensePlate }}</span>
              </div>
            </div>

            <div class="vehicle-card__row">
              <div class="vehicle-card__pair">
                <span class="vehicle-card__label">등록일</span>
                <span class="vehicle-card__value vehicle-card__value--normal">{{ formatDate(item.createdAt) }}</span>
              </div>
              <div class="vehicle-card__pair">
                <span class="vehicle-card__label">등록 상태</span>
                <BaseBadge :variant="badgeVariant(item.status)">{{ item.status }}</BaseBadge>
              </div>
            </div>

            <div class="vehicle-card__log">
              <span class="vehicle-card__label">입출차 기록 시간</span>
              <span class="vehicle-card__log-value">
                <template v-if="item.lastLoggedAt">
                  <span class="vehicle-card__log-type">{{ item.lastEntryType }}</span><span class="vehicle-card__log-sep"> / </span>{{ formatKoreanDateTime(item.lastLoggedAt) }}
                </template>
                <template v-else>입출차 기록 없음</template>
              </span>
            </div>

            <!-- 본인이 등록한 차량만 관리 버튼 노출 -->
            <div v-if="isMine(item)" class="vehicle-card__actions">
              <button
                type="button"
                class="vehicle-card__btn"
                :disabled="!canEdit(item)"
                :title="!canEdit(item) ? '승인거절된 차량은 수정할 수 없습니다.' : ''"
                @click="openEdit(item)"
              >
                등록 수정
              </button>
              <button
                type="button"
                class="vehicle-card__btn vehicle-card__btn--danger"
                @click="openDelete(item)"
              >
                등록 취소
              </button>
            </div>
          </div>
        </li>
      </ul>

      <!-- 등록 카드 -->
      <button type="button" class="vehicle-register" @click="openCreate">
        <span class="vehicle-register__circle" aria-hidden="true">+</span>
        <span class="vehicle-register__label">내 차량 등록하기</span>
      </button>
    </template>

    <!-- 등록/수정 모달 -->
    <VehicleFormModal
      :visible="formModal.open"
      :mode="formModal.mode"
      :vehicle="formModal.vehicle"
      :submitting="formModal.submitting"
      :error-message="formModal.errorMessage"
      @close="closeForm"
      @submit="submitForm"
    />

    <!-- 삭제 확인 모달 -->
    <ResidentModal
      :visible="deleteModal.open"
      type="danger"
      title="차량 등록을 취소하시겠습니까?"
      subtitle="취소하면 해당 차량 정보가 삭제됩니다."
      :info-rows="deleteModal.target ? [{ label: '차량번호', value: deleteModal.target.licensePlate }] : []"
      confirm-text="등록 취소"
      confirm-type="danger"
      cancel-text="취소"
      @confirm="confirmDelete"
      @close="cancelDelete"
    />

    <!-- 결과 모달 -->
    <ResidentModal
      :visible="resultModal.open"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.desc"
      :show-cancel="false"
      confirm-text="확인"
      @close="closeResult"
      @confirm="closeResult"
    />
  </section>
</template>

<style scoped>
.vehicle-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: var(--space-20) var(--space-16);
  min-height: 100%;
}

/* 헤더 */
.vehicle-page__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

.vehicle-page__subtitle {
  margin: 5px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 목록 */
.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* 카드 */
.vehicle-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-card-bg);
  box-shadow: 0 6px 18px rgba(73, 115, 229, 0.08);
}

.vehicle-card__thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background: var(--color-bg-muted);
  overflow: hidden;
}

.vehicle-card__thumb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.vehicle-card__thumb-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.vehicle-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vehicle-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vehicle-card__index {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.vehicle-card__owner {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.vehicle-card__row {
  display: flex;
  gap: 12px;
}

.vehicle-card__pair {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.vehicle-card__label {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.vehicle-card__value {
  min-width: 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vehicle-card__value--normal {
  font-weight: 500;
}

.vehicle-card__log {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vehicle-card__log-value {
  font-size: 14px;
  color: var(--color-text-primary);
}

.vehicle-card__log-type {
  font-weight: 700;
  color: var(--resident-primary);
}

.vehicle-card__log-sep {
  color: var(--color-text-secondary);
}

/* 버튼 영역 */
.vehicle-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 2px;
}

.vehicle-card__btn {
  min-width: 92px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.vehicle-card__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.vehicle-card__btn--danger {
  color: var(--color-danger);
  border-color: rgba(231, 76, 60, 0.45);
}

/* 등록 카드 */
.vehicle-register {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 132px;
  border: 1.5px dashed var(--color-border);
  border-radius: 16px;
  background: var(--color-card-bg);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.vehicle-register:hover {
  border-color: var(--resident-primary);
  background: #F8FAFF;
}

.vehicle-register__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--resident-primary);
  border-radius: 999px;
  color: var(--resident-primary);
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
}

.vehicle-register__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--resident-primary);
}
</style>
