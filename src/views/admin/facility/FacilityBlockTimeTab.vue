<script setup>
import { computed, inject, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { toList } from '@/utils/apiResponse'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import FacilityBlockTimeForm from '@/components/admin/facility/FacilityBlockTimeForm.vue'

const facilityStore = useFacilityStore()
const authStore = useAuthStore()
const registerOpenModal = inject('registerOpenModal', () => {})

const PAGE_SIZE = 10

const currentYearMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const TABLE_COLUMNS = [
  { key: 'dateDisplay', label: '날짜' },
  { key: 'timeDisplay', label: '시간' },
  { key: 'targetDisplay', label: '차단 대상' },
  { key: 'reason', label: '사유' },
  { key: 'typeDisplay', label: '구분' },
]

// 요일 코드 → 한글 짧은 레이블 변환
const DAY_LABEL_MAP = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목',
  FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
}
// 주차 숫자 → 한글 레이블 변환
const ORDINAL_LABEL_MAP = { 1: '첫째', 2: '둘째', 3: '셋째', 4: '넷째', 5: '다섯째' }

const formatDays = (days) =>
  Array.isArray(days) ? days.map((d) => DAY_LABEL_MAP[d] || d).join(', ') : '-'
const formatOrdinals = (ords) =>
  Array.isArray(ords) && ords.length ? ords.map((o) => ORDINAL_LABEL_MAP[o] || o).join(', ') + '주' : ''

const state = reactive({
  facilities: [],
  blockTimes: [],
  hasBlockTimesMap: {},
  facilityId: '',
  selectedMonth: currentYearMonth(),
  page: 1,
  // 'list' | 'create' | 'edit-single' | 'create-batch-prefill' | 'edit-closure-rule'
  mode: 'list',
  // 리스트 탭: 'block-times' | 'closure-rules'
  viewTab: 'block-times',
  loading: false,
  errorMessage: '',
  editItem: null,          // 단건 수정 시 전달
  batchPrefill: null,      // 배치 재등록 시 전달
  editClosureRule: null,   // 정기 휴무 규칙 수정 시 전달
  closureRules: [],        // 정기 휴무 규칙 목록
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '',
  afterConfirm: null,
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

const getCurrentTimeText = () =>
  new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })

const getCurrentActorName = () =>
  authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'

const openResultModal = ({ type = 'success', title, subtitle = '', desc = '',
  itemName = '', time = '', actionLabel = '', actor = '', afterConfirm = null } = {}) => {
  Object.assign(resultModal, { show: true, type, title, subtitle, desc,
    itemName, time, actionLabel, actor, afterConfirm })
}

const handleResultConfirm = async () => {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
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
      e?.response?.data?.message ||
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
    let fromDate, toDate
    if (state.selectedMonth) {
      const [y, m] = state.selectedMonth.split('-').map(Number)
      fromDate = `${state.selectedMonth}-01`
      toDate = `${state.selectedMonth}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
    }
    const result = await facilityStore.fetchFacilityBlockTimes(state.facilityId, { fromDate, toDate })
    state.blockTimes = toList(result)
    state.page = 1
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.message ||
      e?.response?.data?.message ||
      '차단 시간 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

watch(() => state.selectedMonth, () => {
  if (state.facilityId) fetchBlockTimes()
})

const totalPages = computed(() => Math.max(1, Math.ceil(displayList.value.length / PAGE_SIZE)))

const pagedList = computed(() => {
  const start = (state.page - 1) * PAGE_SIZE
  return displayList.value.slice(start, start + PAGE_SIZE).map((item) => ({
    ...item,
    id: item._type === 'batch' ? `batch-${item.batchId}` : String(item.facilityBlockTimeId),
    dateDisplay: item._type === 'batch' ? `${item.minDate} ~ ${item.maxDate}` : item.blockDate,
    timeDisplay: item.startTime && item.endTime ? `${item.startTime} ~ ${item.endTime}` : '종일',
    targetDisplay: item.seatId ? `좌석 ${item.seatNo || item.seatId}번` : '시설 전체',
    typeDisplay: item._type === 'batch' ? `반복 ${item.count}건` : '단건',
  }))
})

const fetchBlockTimesFlags = async () => {
  const entries = await Promise.all(
    state.facilities.map(async (f) => {
      try {
        const result = await facilityStore.fetchFacilityBlockTimes(f.facilityId, {})
        return [String(f.facilityId), toList(result).length > 0]
      } catch {
        return [String(f.facilityId), false]
      }
    })
  )
  state.hasBlockTimesMap = Object.fromEntries(entries)
}

const selectFacility = (facility) => {
  state.facilityId = facility.facilityId
  state.page = 1
  fetchBlockTimes()
}

const resetMonth = () => {
  state.selectedMonth = currentYearMonth()
}

const openCreateForm = () => {
  state.editItem = null
  state.batchPrefill = null
  state.editClosureRule = null
  state.mode = 'create'
}

// 정기 휴무 규칙 목록 조회
const fetchClosureRules = async () => {
  if (!state.facilityId) return
  try {
    const res = await facilityStore.fetchClosureRules(state.facilityId)
    state.closureRules = Array.isArray(res) ? res : (res?.data?.content ?? res?.content ?? [])
  } catch (e) {
    console.error('정기 휴무 조회 실패', e)
  }
}

// 정기 휴무 규칙 저장 완료 핸들러 (form에서 rule-saved 이벤트)
const handleRuleSaved = async (actionText) => {
  state.mode = 'list'
  state.editClosureRule = null
  state.viewTab = 'closure-rules'
  await fetchClosureRules()
  openResultModal({
    type: 'success',
    title: `정기 휴무 ${actionText} 완료`,
    subtitle: '정기 휴무 규칙이 반영되었습니다.',
    actionLabel: `정기 휴무 ${actionText}`,
    time: getCurrentTimeText(),
    actor: getCurrentActorName(),
  })
}

// 정기 휴무 규칙 수정 모드 진입
const startEditClosureRule = (rule) => {
  state.editClosureRule = { ...rule, facilityId: state.facilityId }
  state.editItem = null
  state.mode = 'edit-closure-rule'
}

// 정기 휴무 규칙 삭제 확인 모달
const deleteRuleConfirm = reactive({
  show: false,
  loading: false,
  rule: null,
})

const openDeleteRule = (rule) => {
  deleteRuleConfirm.rule = { ...rule }
  deleteRuleConfirm.show = true
}

const cancelDeleteRule = () => {
  deleteRuleConfirm.show = false
  deleteRuleConfirm.loading = false
  deleteRuleConfirm.rule = null
}

const confirmDeleteRule = async () => {
  deleteRuleConfirm.loading = true
  try {
    await facilityStore.deactivateClosureRule(state.facilityId, deleteRuleConfirm.rule.closureRuleId)
    deleteRuleConfirm.show = false
    deleteRuleConfirm.loading = false
    deleteRuleConfirm.rule = null
    await fetchClosureRules()
    openResultModal({
      type: 'success',
      title: '정기 휴무 삭제 완료',
      subtitle: '정기 휴무 규칙이 비활성화되었습니다.',
      actionLabel: '정기 휴무 삭제',
      time: getCurrentTimeText(),
      actor: getCurrentActorName(),
    })
  } catch (e) {
    deleteRuleConfirm.loading = false
    openResultModal({
      type: 'error',
      title: '삭제 실패',
      subtitle: e?.response?.data?.message || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    })
  }
}

const closeForm = () => {
  state.editItem = null
  state.batchPrefill = null
  state.editClosureRule = null
  state.mode = 'list'
}

const handleBlockTimeSaved = async (facilityName, subtitle) => {
  state.mode = 'list'
  state.editItem = null
  state.batchPrefill = null
  await fetchBlockTimes()
  fetchBlockTimesFlags()
  const isEdit = subtitle === '차단 시간이 수정되었습니다.'
  openResultModal({
    type: 'success',
    title: isEdit ? '수정 완료' : '등록 완료',
    subtitle: subtitle || `${facilityName} 예약 차단 시간을 반영했습니다.`,
    actionLabel: isEdit ? '차단 시간 수정' : '차단 시간 등록',
    time: getCurrentTimeText(),
    actor: getCurrentActorName(),
  })
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
    fetchBlockTimesFlags()
    openResultModal({
      type: 'success',
      title: '삭제 완료',
      subtitle: '차단 시간이 비활성화되었습니다.',
      actionLabel: '차단 시간 삭제',
      time: getCurrentTimeText(),
      actor: getCurrentActorName(),
    })
  } catch (e) {
    deleteSingleConfirm.loading = false
    openResultModal({
      type: 'error',
      title: '삭제 실패',
      subtitle: e?.response?.data?.message || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    })
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
    openResultModal({
      type: 'error',
      title: '처리 실패',
      subtitle: e?.response?.data?.message || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    })
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
    fetchBlockTimesFlags()
    openResultModal({
      type: 'success',
      title: '삭제 완료',
      subtitle: `반복 차단 ${count}건이 비활성화되었습니다.`,
      actionLabel: '반복 차단 삭제',
      time: getCurrentTimeText(),
      actor: getCurrentActorName(),
    })
  } catch (e) {
    deactivateModal.loading = false
    openResultModal({
      type: 'error',
      title: '비활성화 실패',
      subtitle: e?.response?.data?.message || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    })
  }
}

// facilityId 변경 시 정기 휴무 목록도 함께 갱신
watch(() => state.facilityId, () => {
  if (state.facilityId) fetchClosureRules()
})

onMounted(async () => {
  registerOpenModal(openCreateForm)
  await fetchFacilities()
  await fetchBlockTimes()
  fetchBlockTimesFlags()
  fetchClosureRules()
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
      :edit-closure-rule="state.mode === 'edit-closure-rule' ? state.editClosureRule : null"
      @saved="handleBlockTimeSaved"
      @rule-saved="handleRuleSaved"
      @cancel="closeForm"
    />

    <div v-else-if="state.facilities.length === 0" class="empty-box">
      등록된 시설이 없습니다.
    </div>

    <div v-else class="policy-layout">
      <!-- 왼쪽: 시설 nav -->
      <aside class="type-nav">
        <button
          v-for="f in state.facilities"
          :key="f.facilityId"
          type="button"
          class="type-nav-btn"
          :class="{ active: String(state.facilityId) === String(f.facilityId) }"
          @click="selectFacility(f)"
        >
          <span class="nav-name">{{ f.name }}</span>
          <span
            v-if="state.hasBlockTimesMap[String(f.facilityId)]"
            class="nav-dot"
          ></span>
        </button>
      </aside>

      <!-- 오른쪽: 탭 + 카드 쉘 -->
      <div class="right-area">
        <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

        <!-- 탭 스위처: 임시 차단 / 정기 휴무 -->
        <div class="view-tabs">
          <button
            :class="['view-tab', { active: state.viewTab === 'block-times' }]"
            type="button"
            @click="state.viewTab = 'block-times'"
          >
            임시 차단
          </button>
          <button
            :class="['view-tab', { active: state.viewTab === 'closure-rules' }]"
            type="button"
            @click="state.viewTab = 'closure-rules'"
          >
            정기 휴무
            <span v-if="state.closureRules.length > 0" class="tab-count">{{ state.closureRules.length }}</span>
          </button>
        </div>

        <!-- 임시 차단 목록 -->
        <div v-if="state.viewTab === 'block-times'" class="card-shell">
          <AdminFilterBar @reset="resetMonth">
            <input
              v-model="state.selectedMonth"
              type="month"
              class="filter-input"
            />
          </AdminFilterBar>

          <AdminTable
            :columns="TABLE_COLUMNS"
            :rows="pagedList"
            style="cursor: pointer"
            @row-click="openDetail"
          >
            <template #cell-typeDisplay="{ row }">
              <span :class="row._type === 'batch' ? 'badge-batch' : 'badge-single'">
                {{ row.typeDisplay }}
              </span>
            </template>
          </AdminTable>

          <div class="pagination-row">
            <AppPagination
              v-if="displayList.length > 0"
              :currentPage="state.page"
              :maxPage="totalPages"
              :totalAll="displayList.length"
              :totalFiltered="displayList.length"
              unit="건"
              @change="state.page = $event"
            />
          </div>
        </div>

        <!-- 정기 휴무 목록 -->
        <div v-else class="card-shell">
          <div v-if="state.closureRules.length === 0" class="empty-state">
            등록된 정기 휴무 규칙이 없습니다.
          </div>
          <ul v-else class="rule-list">
            <li v-for="rule in state.closureRules" :key="rule.closureRuleId" class="rule-item">
              <div class="rule-body">
                <!-- 규칙 유형 + 요약 -->
                <div class="rule-head">
                  <span class="badge-rule-type">
                    {{ rule.ruleType === 'MONTHLY_NTH' ? '매월 N번째' : '매주' }}
                  </span>
                  <span class="rule-title">
                    {{ formatDays(rule.daysOfWeek) }}
                    <template v-if="rule.ruleType === 'MONTHLY_NTH' && rule.weekOrdinals?.length">
                      ({{ formatOrdinals(rule.weekOrdinals) }})
                    </template>
                  </span>
                </div>
                <!-- 상세 정보 -->
                <div class="rule-meta">
                  <span>
                    {{
                      rule.startTime && rule.endTime
                        ? `${rule.startTime} ~ ${rule.endTime}`
                        : '하루종일'
                    }}
                  </span>
                  <span v-if="rule.validFrom || rule.validUntil" class="rule-sep">·</span>
                  <span v-if="rule.validFrom || rule.validUntil">
                    {{ rule.validFrom || '?' }} ~ {{ rule.validUntil || '무기한' }}
                  </span>
                  <span v-if="rule.seatId" class="rule-sep">·</span>
                  <span v-if="rule.seatId">좌석 {{ rule.seatNo != null ? rule.seatNo + '번' : (rule.seatName || rule.seatId) }}</span>
                </div>
                <div v-if="rule.reason" class="rule-reason">사유: {{ rule.reason }}</div>
              </div>
              <!-- 수정/삭제 버튼 -->
              <div class="rule-actions">
                <button class="btn-rule-edit" type="button" @click="startEditClosureRule(rule)">수정</button>
                <button class="btn-rule-delete" type="button" @click="openDeleteRule(rule)">삭제</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 상세 보기 모달 -->
    <BaseModal
      :visible="detailModal.show"
      :title="detailModal.item?._type === 'batch' ? '반복 차단 상세' : '차단 시간 상세'"
      @close="closeDetail"
    >
      <template v-if="detailModal.item">
        <!-- 요약 배지 -->
        <div class="detail-summary">
          <span :class="detailModal.item._type === 'batch' ? 'badge-batch' : 'badge-single'">
            {{ detailModal.item._type === 'batch' ? `반복 ${detailModal.item.count}건` : '단건' }}
          </span>
        </div>

        <!-- 상세 그리드 -->
        <div class="detail-grid">
          <!-- 반복 차단 -->
          <template v-if="detailModal.item._type === 'batch'">
            <div class="detail-cell">
              <span class="detail-label">기간</span>
              <span class="detail-value">{{ detailModal.item.minDate }} ~ {{ detailModal.item.maxDate }}</span>
            </div>
            <div class="detail-cell">
              <span class="detail-label">건수</span>
              <span class="detail-value">{{ detailModal.item.count }}건</span>
            </div>
            <div class="detail-cell">
              <span class="detail-label">시간</span>
              <span class="detail-value">
                {{
                  detailModal.item.startTime && detailModal.item.endTime
                    ? `${detailModal.item.startTime} ~ ${detailModal.item.endTime}`
                    : '종일'
                }}
              </span>
            </div>
            <div class="detail-cell">
              <span class="detail-label">차단 대상</span>
              <span class="detail-value">
                {{
                  detailModal.item.seatId
                    ? `좌석 ${detailModal.item.seatNo != null ? detailModal.item.seatNo + '번' : (detailModal.item.seatName || '-')}`
                    : '시설 전체'
                }}
              </span>
            </div>
            <div class="detail-cell detail-cell--full">
              <span class="detail-label">사유</span>
              <span class="detail-value">{{ detailModal.item.reason || '없음' }}</span>
            </div>
          </template>

          <!-- 단건 차단 -->
          <template v-else>
            <div class="detail-cell">
              <span class="detail-label">차단일</span>
              <span class="detail-value">{{ detailModal.item.blockDate }}</span>
            </div>
            <div class="detail-cell">
              <span class="detail-label">시간</span>
              <span class="detail-value">
                {{
                  detailModal.item.startTime && detailModal.item.endTime
                    ? `${detailModal.item.startTime} ~ ${detailModal.item.endTime}`
                    : '종일'
                }}
              </span>
            </div>
            <div class="detail-cell">
              <span class="detail-label">차단 대상</span>
              <span class="detail-value">
                {{
                  detailModal.item.seatId
                    ? `좌석 ${detailModal.item.seatNo != null ? detailModal.item.seatNo + '번' : (detailModal.item.seatName || '-')}`
                    : '시설 전체'
                }}
              </span>
            </div>
            <div class="detail-cell detail-cell--full">
              <span class="detail-label">사유</span>
              <span class="detail-value">{{ detailModal.item.reason || '없음' }}</span>
            </div>
          </template>
        </div>
      </template>

      <template #footer>
        <div class="detail-footer">
          <button class="btn-danger" type="button"
            @click="detailModal.item?._type === 'batch' ? openDeactivate() : openDeleteSingle()"
          >삭제</button>
          <button class="btn-primary" type="button"
            @click="detailModal.item?._type === 'batch' ? openEditBatch() : startSingleEdit()"
          >수정</button>
        </div>
      </template>
    </BaseModal>

    <!-- 단건 삭제 확인 -->
    <ConfirmModal
      :visible="deleteSingleConfirm.show"
      title="차단 시간을 삭제하시겠습니까?"
      subtitle="해당 차단 시간이 비활성화됩니다. 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="차단 일시"
      :item-name="deleteSingleConfirm.item?.blockDate || ''"
      action-label="단건 차단"
      action-text="비활성화 처리"
      confirm-type="danger"
      confirm-text="삭제"
      cancel-text="닫기"
      :loading="deleteSingleConfirm.loading"
      @confirm="confirmDeleteSingle"
      @cancel="cancelDeleteSingle"
    />

    <!-- 배치 삭제 확인 -->
    <ConfirmModal
      :visible="deactivateModal.show"
      title="반복 차단을 삭제하시겠습니까?"
      :subtitle="`반복 차단 ${deactivateModal.count}건이 모두 비활성화됩니다. 되돌릴 수 없습니다.`"
      subtitle-color="#e53e3e"
      item-label="차단 건수"
      :item-name="`${deactivateModal.count}건`"
      action-label="반복 차단"
      action-text="전체 비활성화"
      confirm-type="danger"
      confirm-text="삭제"
      cancel-text="닫기"
      :loading="deactivateModal.loading"
      @confirm="confirmDeactivate"
      @cancel="cancelDeactivate"
    />

    <!-- 배치 수정 확인 -->
    <ConfirmModal
      :visible="editBatchConfirm.show"
      title="반복 차단을 수정하시겠습니까?"
      :subtitle="`기존 반복 차단 ${editBatchConfirm.item?.count ?? 0}건을 비활성화하고 새로 등록합니다.`"
      item-label="차단 건수"
      :item-name="`${editBatchConfirm.item?.count ?? 0}건`"
      action-label="반복 차단"
      action-text="비활성화 후 재등록"
      confirm-type="primary"
      confirm-text="수정 진행"
      cancel-text="닫기"
      :loading="editBatchConfirm.loading"
      @confirm="confirmEditBatch"
      @cancel="cancelEditBatch"
    />

    <!-- 정기 휴무 규칙 삭제 확인 -->
    <ConfirmModal
      :visible="deleteRuleConfirm.show"
      title="정기 휴무를 삭제하시겠습니까?"
      subtitle="해당 정기 휴무 규칙이 비활성화됩니다. 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="적용 요일"
      :item-name="formatDays(deleteRuleConfirm.rule?.daysOfWeek)"
      action-label="정기 휴무"
      action-text="비활성화 처리"
      confirm-type="danger"
      confirm-text="삭제"
      cancel-text="닫기"
      :loading="deleteRuleConfirm.loading"
      @confirm="confirmDeleteRule"
      @cancel="cancelDeleteRule"
    />

    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      :desc="resultModal.desc"
      :item-name="resultModal.itemName"
      :time="resultModal.time"
      :action-label="resultModal.actionLabel"
      :actor="resultModal.actor"
      confirm-text="확인"
      @close="handleResultConfirm"
    />
  </section>
</template>

<style scoped>
.block-time-tab {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── 레이아웃 ── */
.policy-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 18px;
  align-items: start;
}

/* ── 왼쪽 nav ── */
.type-nav {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.type-nav-btn {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #687282;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  transition: background 0.15s, color 0.15s;
}

.type-nav-btn:hover {
  background: #f5f6f8;
  color: #2b3a55;
}

.type-nav-btn.active {
  background: #1e2a3e;
  color: #ffffff;
}

.nav-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-left: 8px;
  background: #48bb78;
}

.type-nav-btn.active .nav-dot {
  background: #9ae6b4;
}

/* ── 오른쪽 영역 ── */
.right-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-shell {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.pagination-row {
  border-top: 1px solid #e2e8f0;
  padding: 12px 16px;
}

/* ── 필터 인풋 ── */
.filter-input {
  min-width: 140px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #1a202c;
  font: inherit;
  font-size: 13px;
}

/* ── 구분 배지 ── */
.badge-batch {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  background: #fef3c7;
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
}

.badge-single {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  background: #eef2f7;
  color: #4a5568;
  font-size: 11px;
  font-weight: 700;
}

/* ── 빈 상태 ── */
.empty-state {
  padding: 32px;
  text-align: center;
  color: #7b8ea8;
  font-size: 13px;
}

/* ── 상세 모달 본문 ── */
.detail-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #eee;
}

.detail-cell {
  padding: 12px 4px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-cell--full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 12px;
  color: #a0aec0;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

/* ── 모달 푸터 ── */
.detail-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.btn-outline {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  border: 1px solid #d7dee8;
  background: #ffffff;
  color: #2b3a55;
}

.btn-outline:hover {
  background: #f8fafc;
}

.btn-danger {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  border: 1.5px solid #fca5a5;
  background: #ffffff;
  color: #e53e3e;
}

.btn-danger:hover {
  background: #fff5f5;
  border-color: #e53e3e;
}

.btn-primary {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  border: none;
  background: #1e2a3e;
  color: #ffffff;
}

.btn-primary:hover {
  background: #2b3a55;
}

/* ── 빈 상태 / 에러 ── */
.empty-box {
  padding: 32px;
  text-align: center;
  color: #7b8ea8;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 10px;
}

.error-box {
  padding: 11px 14px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

/* ── 탭 스위처 ── */
.view-tabs {
  display: flex;
  gap: 0;
  border: 1px solid #d7dee8;
  border-radius: 10px;
  overflow: hidden;
  width: fit-content;
  margin-bottom: 12px;
}

.view-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  background: #f8fafc;
  color: #718096;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.view-tab + .view-tab {
  border-left: 1px solid #d7dee8;
}

.view-tab.active {
  background: #2b3a55;
  color: #ffffff;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #e2e8f0;
  color: #4a5568;
  font-size: 11px;
  font-weight: 700;
}

.view-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* ── 정기 휴무 규칙 목록 ── */
.rule-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f3f7;
}

.rule-item:last-child {
  border-bottom: none;
}

.rule-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rule-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-rule-type {
  flex-shrink: 0;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 11px;
  font-weight: 700;
}

.rule-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
}

.rule-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #687282;
}

.rule-sep {
  color: #cbd5e0;
}

.rule-reason {
  font-size: 12px;
  color: #a0aec0;
}

.rule-actions {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
}

.btn-rule-edit {
  padding: 5px 12px;
  border: 1px solid #d7dee8;
  border-radius: 6px;
  background: #ffffff;
  color: #2b3a55;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-rule-edit:hover {
  background: #f5f6f8;
}

.btn-rule-delete {
  padding: 5px 12px;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  background: #ffffff;
  color: #e53e3e;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-rule-delete:hover {
  background: #fff5f5;
  border-color: #e53e3e;
}

/* ── 반응형 ── */
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
}

@media (max-width: 640px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    margin-left: 0;
  }
}
</style>
