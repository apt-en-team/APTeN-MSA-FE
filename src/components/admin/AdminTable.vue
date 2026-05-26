<script setup>
// 1차 관리자 표 스타일을 유지한 공통 테이블 컴포넌트이다.
// 컬럼 정의와 행 데이터를 props로 받아 범용 테이블로 사용한다.
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowClass: { type: Function, default: null },
})

// 행 클릭 이벤트를 부모 컴포넌트로 전달한다.
const emit = defineEmits(['row-click'])
</script>

<template>
  <table class="data-table">
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        <th v-if="$slots.action">
          <slot name="action-header">관리</slot>
        </th>
      </tr>
    </thead>
    <tbody>
      <!-- 데이터가 없으면 빈 상태 행을 표시한다. -->
      <tr v-if="!rows || rows.length === 0" class="empty-row">
        <td :colspan="columns.length + ($slots.action ? 1 : 0)">데이터가 없습니다.</td>
      </tr>
      <!-- 기본 셀 렌더링 또는 named slot 기반 커스텀 셀 렌더링을 지원한다. -->
      <tr
        v-else
        v-for="row in rows"
        :key="row.id ?? row.userId ?? row.code ?? row.householdId ?? row.reservationId ?? row.sensorId"
        :class="rowClass ? rowClass(row) : null"
        @click="emit('row-click', row)"
      >
        <td v-for="col in columns" :key="col.key">
          <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
            {{ row[col.key] ?? '-' }}
          </slot>
        </td>
        <td v-if="$slots.action">
          <slot name="action" :row="row" />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 11px 16px;
  border-bottom: 1px solid #E2E8F0;
  background: #F5F6F8;
  color: #718096;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.data-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #E2E8F0;
  color: #333333;
  text-align: center;
  font-size: 13px;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background: #F5F6F8;
}

.data-table tbody tr {
  cursor: pointer;
}

.empty-row td {
  padding: 48px 0;
  color: #A0AEC0;
  text-align: center;
  font-size: 13px;
}
</style>
