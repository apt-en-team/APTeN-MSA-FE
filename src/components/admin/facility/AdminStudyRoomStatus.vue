<script setup>
import { reactive, watch } from 'vue'
import facilityApi from '@/api/facilityApi'

const props = defineProps({
  facilityId: {
    type: [Number, String],
    required: true,
  },
  selectedDate: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update-summary'])

const state = reactive({
  loading: false,
  seats: [],
})

const isOccupied = (seat) => seat.status !== 'AVAILABLE'

const fetchSeatStatus = async () => {
  if (!props.facilityId || !props.selectedDate) return

  state.loading = true

  try {
    const res = await facilityApi.getFacilitySeatStatus(props.facilityId, {
      targetDate: props.selectedDate,
    })

    state.seats = Array.isArray(res) ? res : []

    emit('update-summary', {
      reservedCount: state.seats.filter((s) => isOccupied(s)).length,
      totalCount: state.seats.length,
    })
  } catch (e) {
    console.error('좌석 상태 조회 실패:', e)
    state.seats = []
    emit('update-summary', { reservedCount: 0, totalCount: 0 })
  } finally {
    state.loading = false
  }
}

watch(
  [() => props.facilityId, () => props.selectedDate],
  () => {
    fetchSeatStatus()
  },
  { immediate: true },
)
</script>

<template>
  <div class="study-page">
    <div v-if="state.loading" class="empty-text">좌석 현황을 불러오는 중입니다.</div>

    <div v-else-if="!state.loading && state.seats.length === 0" class="empty-text">
      좌석 데이터가 없습니다.
    </div>

    <div v-else class="room-panel">
      <div class="panel-head">
        <h3 class="panel-title">좌석 현황</h3>
        <span class="panel-desc">전체 {{ state.seats.length }}석</span>
      </div>

      <div class="seat-grid">
        <div
          v-for="seat in state.seats"
          :key="seat.seatId ?? seat.seatNo"
          class="seat-box"
          :class="{ reserved: isOccupied(seat) }"
        >
          <p class="seat-no">{{ seat.seatNo ?? '-' }}번</p>
          <p v-if="seat.seatName" class="seat-name">{{ seat.seatName }}</p>
          <template v-if="isOccupied(seat)">
            <p class="seat-user">{{ seat.residentName ?? '-' }}</p>
          </template>
          <template v-else>
            <p class="seat-empty">빈자리</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.study-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.room-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  background: #fff;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.panel-desc {
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.seat-box {
  min-height: 92px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.seat-box.reserved {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.seat-no {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  color: #334155;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-name {
  margin: 0 0 4px;
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-user {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a55;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-empty {
  margin: 0;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}
</style>
