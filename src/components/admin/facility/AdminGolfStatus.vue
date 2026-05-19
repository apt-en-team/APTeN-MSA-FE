<script setup>
import { reactive, computed, watch } from 'vue'
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
  openTime: {
    type: String,
    default: '',
  },
  closeTime: {
    type: String,
    default: '',
  },
})

const state = reactive({
  loading: false,
  seats: [],
})

const selectedDateLabel = computed(() => {
  const date = new Date(props.selectedDate)
  if (Number.isNaN(date.getTime())) return props.selectedDate

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayName = dayNames[date.getDay()]

  return `${month}월 ${day}일 (${dayName})`
})

const isOccupied = (seat) => seat.status !== 'AVAILABLE'

const fetchSeatStatus = async () => {
  if (!props.facilityId || !props.selectedDate || !props.openTime || !props.closeTime) return

  state.loading = true

  try {
    const res = await facilityApi.getFacilitySeatStatus(props.facilityId, {
      targetDate: props.selectedDate,
      startTime: props.openTime,
      endTime: props.closeTime,
    })
    state.seats = Array.isArray(res) ? res : []
  } catch {
    state.seats = []
  } finally {
    state.loading = false
  }
}

watch(
  [() => props.facilityId, () => props.selectedDate, () => props.openTime, () => props.closeTime],
  () => {
    fetchSeatStatus()
  },
  { immediate: true },
)
</script>

<template>
  <div class="golf-page">
    <div v-if="state.loading" class="empty-text">골프 현황을 불러오는 중입니다.</div>

    <div class="golf-table-wrap">
      <h3 class="table-title">{{ selectedDateLabel }} 타석 현황</h3>

      <div v-if="!state.loading && state.seats.length === 0" class="empty-row">
        예약 데이터가 없습니다.
      </div>

      <div v-else class="seat-grid">
        <div
          v-for="seat in state.seats"
          :key="seat.seatId ?? seat.seatNo"
          class="seat-box"
          :class="{ occupied: isOccupied(seat) }"
        >
          <p class="seat-no">{{ seat.seatNo ?? '-' }}번 타석</p>
          <p v-if="seat.seatName" class="seat-name">{{ seat.seatName }}</p>
          <template v-if="isOccupied(seat)">
            <p class="seat-user">{{ seat.residentName ?? '-' }}</p>
          </template>
          <template v-else>
            <span class="empty-mark">-</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.golf-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.golf-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  padding: 0 0 16px;
}

.table-title {
  margin: 0;
  padding: 20px 20px 12px;
  font-size: 20px;
  font-weight: 900;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 0 16px;
}

.seat-box {
  min-height: 100px;
  padding: 16px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.seat-box.occupied {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.seat-no {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #334155;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-name {
  margin: 0;
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-user {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.empty-mark {
  color: #cbd5e0;
  font-size: 22px;
  font-weight: 700;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}
</style>
