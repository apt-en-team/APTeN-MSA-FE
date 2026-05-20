<script setup>
import { computed, inject, onMounted, onUnmounted, reactive } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FacilityBlockTimeForm from '@/components/admin/facility/FacilityBlockTimeForm.vue'

const facilityStore = useFacilityStore()
const registerOpenModal = inject('registerOpenModal', () => {})

const state = reactive({
  facilities: [],
  blockTimes: [],
  facilityId: '',
  fromDate: '',
  toDate: '',
  // 'list' | 'create' | 'edit-single' | 'create-batch-prefill'
  mode: 'list',
  loading: false,
  errorMessage: '',
  editItem: null,     // 단건 수정 시 전달
  batchPrefill: null, // 배치 재등록 시 전달
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
})

// 상세 보기 모달
const detailModal = reactive({
  show: false,
  item: null,
})

// 단건 삭제 확인
const deleteSingleConfirm = reactive({
  show: false,
  loading: false,
  item: null,
})

// 배치 삭제 확인 (기존 deactivateModal 역할 유지)
const deactivateModal = reactive({
  show: false,
  loading: false,
  batchId: null,
  count: 0,
})

// 배치 수정 확인 (비활성화 후 재등록)
const editBatchConfirm = reactive({
  show: false,
  loading: false,
  item: null,
})

// 단일 + 반복(batchId 기준 그룹) 혼합 목록
const displayList = computed(() => {
  const singles = []
  const batchMap = new Map()

  for (const item of state.blockTimes) {
    if (!item.batchId) {
      singles.push({ ...item, _type: 'single' })
    } else {
      const key = String(item.batchId)
      if (!batchMap.has(key)) {
        batchMap.set(key, {
          _type: 'batch',
          batchId: item.batchId,
          startTime: item.startTime,
          endTime: item.endTime,
          reason: item.reason,
          seatId: item.seatId,
          seatNo: item.seatNo,
          minDate: item.blockDate,
          maxDate: item.blockDate,
          count: 1,
          facilityId: state.facilityId,
        })
      } else {
        const g = batchMap.get(key)
        g.count++
        if (item.blockDate < g.minDate) g.minDate = item.blockDate
        if (item.blockDate > g.maxDate) g.maxDate = item.blockDate
      }
    }
  }

  return [...singles, ...batchMap.values()].sort((a, b) => {
    const aDate = a.blockDate || a.minDate || ''
    const bDate = b.blockDate || b.minDate || ''
    return aDate < bDate ? -1 : aDate > bDate ? 1 : 0
  })
})

const normalizeFacilities = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.content)) return response.content
  if (Array.isArray(response?.data?.content)) return response.data.content
  return []
}

const openResultModal = (type, title, subtitle) => {
  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.show = true
}

const fetchFacilities = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const result = await facilityStore.fetchAdminFacilities({ page: 0, size: 100 })
    state.facilities = normalizeFacilities(result).map((f) => ({
      ...f,
      facilityId: f.facilityId ?? f.facilityUid ?? f.id,
    }))
    if (!state.facilityId && state.facilities.length > 0) {
      state.facilityId = state.facilities[0].facilityId
    }
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage ||
      e?.response?.data?.message ||
      '시설 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const fetchBlockTimes = async () => {
  if (!state.facilityId) return
  state.loading = true
  state.errorMessage = ''
  try {
    const params = {
      fromDate: state.fromDate || undefined,
      toDate: state.toDate || undefined,
    }
    const result = await facilityStore.fetchFacilityBlockTimes(state.facilityId, params)
    state.blockTimes = toList(result)
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage ||
      e?.response?.data?.message ||
      '차단 시간 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const changeFacility = () => fetchBlockTimes()

const resetSearch = () => {
  state.fromDate = ''
  state.toDate = ''
  fetchBlockTimes()
}

const openCreateForm = () => {
  state.editItem = null
  state.batchPrefill = null
  state.mode = 'create'
}

const closeForm = () => {
  state.editItem = null
  state.batchPrefill = null
  state.mode = 'list'
}

const handleBlockTimeSaved = async (facilityName, subtitle) => {
  state.mode = 'list'
  state.editItem = null
  state.batchPrefill = null
  await fetchBlockTimes()
  openResultModal(
    'success',
    subtitle === '차단 시간이 수정되었습니다.' ? '수정 완료' : '차단 시간이 등록되었습니다.',
    subtitle || `${facilityName} 예약 차단 시간을 반영했습니다.`,
  )
}

// ── 상세 모달 ──────────────────────────────────────────
const openDetail = (item) => {
  detailModal.item = item
  detailModal.show = true
}

const closeDetail = () => {
  detailModal.show = false
  detailModal.item = null
}

// ── 단건 수정 ──────────────────────────────────────────
const startSingleEdit = () => {
  state.editItem = { ...detailModal.item, facilityId: state.facilityId }
  closeDetail()
  state.mode = 'edit-single'
}

// ── 단건 삭제 ──────────────────────────────────────────
const openDeleteSingle = () => {
  deleteSingleConfirm.item = { ...detailModal.item }
  closeDetail()
  deleteSingleConfirm.show = true
}

const cancelDeleteSingle = () => {
  deleteSingleConfirm.show = false
  deleteSingleConfirm.loading = false
  deleteSingleConfirm.item = null
}

const confirmDeleteSingle = async () => {
  deleteSingleConfirm.loading = true
  try {
    await facilityStore.deactivateFacilityBlockTime(
      state.facilityId,
      deleteSingleConfirm.item.facilityBlockTimeId,
    )
    deleteSingleConfirm.show = false
    deleteSingleConfirm.loading = false
    deleteSingleConfirm.item = null
    await fetchBlockTimes()
    openResultModal('success', '삭제 완료', '차단 시간이 비활성화되었습니다.')
  } catch (e) {
    deleteSingleConfirm.loading = false
    openResultModal(
      'error',
      '삭제 실패',
      e?.response?.data?.resultMessage || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    )
  }
}

// ── 배치 수정 ──────────────────────────────────────────
const openEditBatch = () => {
  editBatchConfirm.item = { ...detailModal.item }
  closeDetail()
  editBatchConfirm.show = true
}

const cancelEditBatch = () => {
  editBatchConfirm.show = false
  editBatchConfirm.loading = false
  editBatchConfirm.item = null
}

const confirmEditBatch = async () => {
  editBatchConfirm.loading = true
  try {
    await facilityStore.deactivateFacilityBlockTimeBatch(
      state.facilityId,
      editBatchConfirm.item.batchId,
    )
    state.batchPrefill = {
      facilityId: state.facilityId,
      startTime: editBatchConfirm.item.startTime,
      endTime: editBatchConfirm.item.endTime,
      reason: editBatchConfirm.item.reason,
      seatId: editBatchConfirm.item.seatId,
    }
    editBatchConfirm.show = false
    editBatchConfirm.loading = false
    editBatchConfirm.item = null
    state.editItem = null
    state.mode = 'create-batch-prefill'
    await fetchBlockTimes()
  } catch (e) {
    editBatchConfirm.loading = false
    openResultModal(
      'error',
      '처리 실패',
      e?.response?.data?.resultMessage || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    )
  }
}

// ── 배치 삭제 ──────────────────────────────────────────
const openDeactivate = () => {
  deactivateModal.batchId = detailModal.item.batchId
  deactivateModal.count = detailModal.item.count
  closeDetail()
  deactivateModal.show = true
}

const cancelDeactivate = () => {
  deactivateModal.show = false
  deactivateModal.loading = false
  deactivateModal.batchId = null
}

const confirmDeactivate = async () => {
  deactivateModal.loading = true
  const count = deactivateModal.count
  try {
    await facilityStore.deactivateFacilityBlockTimeBatch(
      state.facilityId,
      deactivateModal.batchId,
    )
    deactivateModal.show = false
    deactivateModal.loading = false
    await fetchBlockTimes()
    openResultModal('success', '비활성화 완료', `반복 차단 ${count}건이 비활성화되었습니다.`)
  } catch (e) {
    deactivateModal.loading = false
    openResultModal(
      'error',
      '비활성화 실패',
      e?.response?.data?.resultMessage || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    )
  }
}

onMounted(async () => {
  registerOpenModal(openCreateForm)
  await fetchFacilities()
  await fetchBlockTimes()
})

onUnmounted(() => {
  registerOpenModal(null)
})
</script>

<template>
  <section class="block-time-tab">
    <FacilityBlockTimeForm
      v-if="state.mode !== 'list'"
      :facilities="state.facilities"
      :initial-facility-id="state.facilityId"
      :edit-item="state.mode === 'edit-single' ? state.editItem : null"
      :batch-prefill="state.mode === 'create-batch-prefill' ? state.batchPrefill : null"
      @saved="handleBlockTimeSaved"
      @cancel="closeForm"
    />

    <div v-else class="tab-grid">
      <article class="panel">
        <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

        <div class="search-row">
          <label class="form-field form-field--wide">
            <span>시설 선택</span>
            <select v-model="state.facilityId" @change="changeFacility">
              <option value="" disabled>시설을 선택해주세요.</option>
              <option
                v-for="facility in state.facilities"
                :key="facility.facilityId"
                :value="facility.facilityId"
              >
                {{ facility.name }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>시작일</span>
            <input v-model="state.fromDate" type="date" />
          </label>
          <label class="form-field">
            <span>종료일</span>
            <input v-model="state.toDate" type="date" />
          </label>
          <div class="search-actions">
            <button class="btn-secondary" type="button" @click="resetSearch">초기화</button>
            <button class="btn-primary" type="button" @click="fetchBlockTimes">조회</button>
          </div>
        </div>

        <div class="block-list">
          <template
            v-for="item in displayList"
            :key="item._type === 'batch' ? `batch-${item.batchId}` : item.facilityBlockTimeId"
          >
            <!-- 반복 차단 그룹 카드 -->
            <div
              v-if="item._type === 'batch'"
              class="block-card block-card--batch block-card--clickable"
              @click="openDetail(item)"
            >
              <div class="block-card-left">
                <div class="block-card-top-row">
                  <strong>{{ item.minDate }} ~ {{ item.maxDate }}</strong>
                  <span class="batch-badge">반복 차단 {{ item.count }}건</span>
                </div>
                <p>{{ item.reason || '차단 사유 없음' }}</p>
              </div>
              <div class="block-card-meta">
                <span class="block-scope">
                  {{ item.seatId ? `좌석 ${item.seatNo || item.seatId}번 차단` : '전체 차단' }}
                </span>
                <span>
                  {{ item.startTime && item.endTime ? `${item.startTime} ~ ${item.endTime}` : '종일' }}
                </span>
              </div>
            </div>

            <!-- 단일 차단 카드 -->
            <div
              v-else
              class="block-card block-card--clickable"
              @click="openDetail(item)"
            >
              <div>
                <strong>{{ item.blockDate }}</strong>
                <p>{{ item.reason || '차단 사유 없음' }}</p>
              </div>
              <div class="block-card-meta">
                <span class="block-scope">
                  {{ item.seatId ? `좌석 ${item.seatNo || item.seatId}번 차단` : '전체 차단' }}
                </span>
                <span>
                  {{ item.startTime && item.endTime ? `${item.startTime} ~ ${item.endTime}` : '종일' }}
                </span>
              </div>
            </div>
          </template>

          <div v-if="displayList.length === 0" class="empty-box">
            조회된 차단 시간이 없습니다.
          </div>
        </div>
      </article>
    </div>

    <!-- 상세 보기 모달 -->
    <div v-if="detailModal.show" class="modal-overlay" @click.self="closeDetail">
      <div class="detail-modal">
        <div class="detail-modal-header">
          <h4>{{ detailModal.item?._type === 'batch' ? '반복 차단 상세' : '차단 시간 상세' }}</h4>
          <button class="btn-close-x" type="button" @click="closeDetail">✕</button>
        </div>

        <div class="detail-body">
          <template v-if="detailModal.item?._type === 'batch'">
            <div class="detail-row">
              <span class="detail-label">기간</span>
              <span>{{ detailModal.item.minDate }} ~ {{ detailModal.item.maxDate }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">건수</span>
              <span>{{ detailModal.item.count }}건</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">시간</span>
              <span>
                {{
                  detailModal.item.startTime && detailModal.item.endTime
                    ? `${detailModal.item.startTime} ~ ${detailModal.item.endTime}`
                    : '종일'
                }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">차단 대상</span>
              <span>
                {{
                  detailModal.item.seatId
                    ? `좌석 ${detailModal.item.seatNo || detailModal.item.seatId}번`
                    : '시설 전체'
                }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">사유</span>
              <span>{{ detailModal.item.reason || '없음' }}</span>
            </div>
          </template>

          <template v-else>
            <div class="detail-row">
              <span class="detail-label">차단일</span>
              <span>{{ detailModal.item?.blockDate }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">시간</span>
              <span>
                {{
                  detailModal.item?.startTime && detailModal.item?.endTime
                    ? `${detailModal.item.startTime} ~ ${detailModal.item.endTime}`
                    : '종일'
                }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">차단 대상</span>
              <span>
                {{
                  detailModal.item?.seatId
                    ? `좌석 ${detailModal.item.seatNo || detailModal.item.seatId}번`
                    : '시설 전체'
                }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">사유</span>
              <span>{{ detailModal.item?.reason || '없음' }}</span>
            </div>
          </template>
        </div>

        <div class="detail-actions">
          <button
            v-if="detailModal.item?._type === 'batch'"
            class="btn-action btn-action--edit"
            type="button"
            @click="openEditBatch"
          >
            수정
          </button>
          <button
            v-else
            class="btn-action btn-action--edit"
            type="button"
            @click="startSingleEdit"
          >
            수정
          </button>

          <button
            v-if="detailModal.item?._type === 'batch'"
            class="btn-action btn-action--delete"
            type="button"
            @click="openDeactivate"
          >
            삭제
          </button>
          <button
            v-else
            class="btn-action btn-action--delete"
            type="button"
            @click="openDeleteSingle"
          >
            삭제
          </button>
        </div>
      </div>
    </div>

    <!-- 단건 삭제 확인 -->
    <ConfirmModal
      :visible="deleteSingleConfirm.show"
      title="차단 시간 삭제"
      subtitle="해당 차단 시간을 비활성화합니다. 계속하시겠습니까?"
      confirm-type="danger"
      confirm-text="삭제"
      :loading="deleteSingleConfirm.loading"
      @confirm="confirmDeleteSingle"
      @cancel="cancelDeleteSingle"
    />

    <!-- 배치 삭제 확인 -->
    <ConfirmModal
      :visible="deactivateModal.show"
      title="반복 차단 삭제"
      :subtitle="`반복 차단 ${deactivateModal.count}건을 모두 비활성화합니다. 계속하시겠습니까?`"
      confirm-type="danger"
      confirm-text="삭제"
      :loading="deactivateModal.loading"
      @confirm="confirmDeactivate"
      @cancel="cancelDeactivate"
    />

    <!-- 배치 수정 확인 -->
    <ConfirmModal
      :visible="editBatchConfirm.show"
      title="반복 차단 수정"
      :subtitle="`기존 반복 차단 ${editBatchConfirm.item?.count ?? 0}건을 비활성화하고 새로 등록합니다. 계속하시겠습니까?`"
      confirm-type="primary"
      confirm-text="수정 진행"
      :loading="editBatchConfirm.loading"
      @confirm="confirmEditBatch"
      @cancel="cancelEditBatch"
    />

    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      confirm-text="확인"
      @close="resultModal.show = false"
    />
  </section>
</template>

<style scoped>
.block-time-tab {
  font-family: 'Noto Sans KR', sans-serif;
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 24px;
}

.search-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.3fr) repeat(2, minmax(160px, 1fr)) auto;
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

.form-field--wide {
  grid-column: 1 / -1;
}

.form-field input,
.form-field select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d7dee8;
  border-radius: 8px;
  color: #1e2a3e;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 8px;
}

.btn-primary,
.btn-secondary {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
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

/* ── 차단 목록 ───────────────────────────────── */
.block-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.block-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  background: #f8fafc;
}

.block-card--batch {
  border-color: #fde68a;
  background: #fffbeb;
}

.block-card--clickable {
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.block-card--clickable:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.block-card-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.block-card-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.block-card strong {
  color: #1e2a3e;
  font-size: 14px;
}

.block-card p {
  margin: 5px 0 0;
  color: #687282;
  font-size: 12px;
}

.batch-badge {
  background: #fef3c7;
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.block-card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.block-card-meta span {
  color: #2b3a55;
  font-size: 12px;
  font-weight: 800;
}

.block-scope {
  color: #7b8ea8 !important;
  font-weight: 600 !important;
}

/* ── 상세 모달 ───────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-modal {
  width: 360px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.detail-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #eef2f7;
}

.detail-modal-header h4 {
  margin: 0;
  font-size: 16px;
  color: #1e2a3e;
}

.btn-close-x {
  border: none;
  background: none;
  color: #718096;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
}

.detail-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.detail-label {
  min-width: 68px;
  color: #718096;
  font-weight: 700;
  flex-shrink: 0;
}

.detail-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px 18px;
  justify-content: flex-end;
  border-top: 1px solid #eef2f7;
}

.btn-action {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-action--edit {
  border: 1px solid #d7dee8;
  background: #ffffff;
  color: #2b3a55;
}

.btn-action--edit:hover {
  background: #f8fafc;
}

.btn-action--delete {
  border: 1.5px solid #fca5a5;
  background: #ffffff;
  color: #e53e3e;
}

.btn-action--delete:hover {
  background: #fff5f5;
  border-color: #e53e3e;
}

/* ── 빈 상태 / 에러 ──────────────────────────── */
.empty-box,
.error-box {
  padding: 14px;
  border-radius: 10px;
  font-size: 13px;
}

.empty-box {
  background: #f8fafc;
  color: #7b8ea8;
  text-align: center;
}

.error-box {
  margin-bottom: 14px;
  background: #fff5f5;
  color: #e53e3e;
}

@media (max-width: 960px) {
  .search-row {
    grid-template-columns: 1fr;
  }
}
</style>
