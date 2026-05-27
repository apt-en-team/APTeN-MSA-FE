<script setup>
import { reactive, onMounted } from 'vue'
import { getFacilitySeats, createFacilitySeat, updateFacilitySeat } from '@/api/facilityApi'
import BaseModal from '@/components/common/BaseModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const props = defineProps({
  facilityId: { type: [String, Number], required: true },
})

const state = reactive({
  seats: [],
  loading: false,
  submitting: false,
  errorMessage: '',
  showAddModal: false,
  showEditModal: false,
  addForm: { seatNo: '', seatName: '', isActive: true },
  editSeat: null,
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
})

const openResultModal = (type, title, subtitle) => {
  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.show = true
}

const fetchSeats = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await getFacilitySeats(props.facilityId)
    state.seats = Array.isArray(res) ? res : []
  } catch (e) {
    state.errorMessage = e.response?.data?.message || '좌석 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const openAdd = () => {
  state.addForm = { seatNo: '', seatName: '', isActive: true }
  state.showAddModal = true
}

const submitAdd = async () => {
  if (!state.addForm.seatNo || !state.addForm.seatName) {
    state.errorMessage = '좌석 번호와 이름을 입력해주세요.'
    return
  }
  state.submitting = true
  state.errorMessage = ''
  try {
    await createFacilitySeat(props.facilityId, {
      seatNo: Number(state.addForm.seatNo),
      seatName: String(state.addForm.seatName).trim(),
      isActive: state.addForm.isActive,
    })
    await fetchSeats()
    state.showAddModal = false
    openResultModal('success', '좌석이 등록되었습니다.', `${state.addForm.seatName} 좌석이 추가되었습니다.`)
  } catch (e) {
    openResultModal('danger', '좌석 등록에 실패했습니다.', e.response?.data?.message || '잠시 후 다시 시도해주세요.')
    state.showAddModal = false
  } finally {
    state.submitting = false
  }
}

const openEdit = (seat) => {
  state.editSeat = { ...seat }
  state.showEditModal = true
}

const submitEdit = async () => {
  if (!state.editSeat) return
  state.submitting = true
  try {
    await updateFacilitySeat(state.editSeat.seatId, {
      seatName: String(state.editSeat.seatName).trim(),
      isActive: state.editSeat.isActive,
    })
    await fetchSeats()
    state.showEditModal = false
    openResultModal('success', '좌석이 수정되었습니다.', '')
  } catch (e) {
    openResultModal('danger', '좌석 수정에 실패했습니다.', e.response?.data?.message || '잠시 후 다시 시도해주세요.')
    state.showEditModal = false
  } finally {
    state.submitting = false
  }
}

onMounted(fetchSeats)
</script>

<template>
  <section class="seat-tab">
    <div class="panel">
      <div class="panel-header">
        <div>
          <h3>좌석 관리</h3>
          <p>시설에 등록된 좌석 목록을 관리합니다.</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" type="button" @click="fetchSeats">새로고침</button>
          <button class="btn-primary" type="button" @click="openAdd">+ 좌석 추가</button>
        </div>
      </div>

      <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

      <div v-if="state.loading" class="empty-box">좌석 목록을 불러오는 중...</div>

      <table v-else class="seat-table">
        <thead>
          <tr>
            <th>좌석 번호</th>
            <th>좌석명</th>
            <th>운영 상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="seat in state.seats" :key="seat.seatId">
            <td>{{ seat.seatNo }}</td>
            <td>{{ seat.seatName }}</td>
            <td>
              <span :class="['status-badge', seat.isActive ? 'active' : 'inactive']">
                {{ seat.isActive ? '운영 중' : '중단' }}
              </span>
            </td>
            <td>
              <button class="btn-row-action" type="button" @click="openEdit(seat)">수정</button>
            </td>
          </tr>
          <tr v-if="state.seats.length === 0">
            <td colspan="4" class="empty-cell">등록된 좌석이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-if="state.showAddModal" title="좌석 추가" @close="state.showAddModal = false">
      <div class="modal-form">
        <label class="form-field">
          <span>좌석 번호 *</span>
          <input v-model="state.addForm.seatNo" type="number" placeholder="예: 1" />
        </label>
        <label class="form-field">
          <span>좌석명 *</span>
          <input v-model="state.addForm.seatName" type="text" placeholder="예: A-01" />
        </label>
        <label class="toggle-row">
          <span>운영 여부</span>
          <input v-model="state.addForm.isActive" type="checkbox" />
        </label>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="state.showAddModal = false">취소</button>
        <button class="btn-submit" :disabled="state.submitting" @click="submitAdd">
          {{ state.submitting ? '등록 중' : '등록하기' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal v-if="state.showEditModal && state.editSeat" title="좌석 수정" @close="state.showEditModal = false">
      <div class="modal-form">
        <label class="form-field">
          <span>좌석 번호</span>
          <input :value="state.editSeat.seatNo" type="number" disabled />
        </label>
        <label class="form-field">
          <span>좌석명 *</span>
          <input v-model="state.editSeat.seatName" type="text" />
        </label>
        <label class="toggle-row">
          <span>운영 여부</span>
          <input v-model="state.editSeat.isActive" type="checkbox" />
        </label>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="state.showEditModal = false">취소</button>
        <button class="btn-submit" :disabled="state.submitting" @click="submitEdit">
          {{ state.submitting ? '저장 중' : '수정완료' }}
        </button>
      </template>
    </BaseModal>

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
.seat-tab {
  font-family: 'Noto Sans KR', sans-serif;
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 24px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e2a3e;
}

.panel-header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #687282;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.seat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.seat-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: #7b8ea8;
  border-bottom: 1px solid #e2e8f0;
}

.seat-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #eef2f7;
  color: #1e2a3e;
}

.seat-table tr:last-child td {
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: #a0aec0;
  padding: 32px;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.active {
  background: #ebf5ee;
  color: #4d8b5a;
}

.status-badge.inactive {
  background: #e0e0e0;
  color: #4a5568;
}

.btn-row-action {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #4a5568;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-row-action:hover {
  background: #f5f6f8;
}

.modal-form {
  display: flex;
  flex-direction: column;
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
  font-family: 'Noto Sans KR', sans-serif;
}

.form-field input:disabled {
  background: #f5f6f8;
  color: #a0aec0;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  color: #1e2a3e;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary,
.btn-secondary {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
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

.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-submit {
  padding: 9px 24px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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
}
</style>
