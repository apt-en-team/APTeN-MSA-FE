<script setup>
// 1차 관리자 화면 스타일을 유지한 공통 페이지네이션 컴포넌트이다.
import { computed } from 'vue'

// 현재 페이지와 전체 페이지 수 정보를 props로 받는다.
const props = defineProps({
  currentPage: Number,
  maxPage: Number,
  totalPages: Number,
  totalAll: Number,
  totalFiltered: Number,
  unit: { type: String, default: '건' },
  activeColor: { type: String, default: '#2B3A55' },
})

// 페이지 변경 이벤트를 부모 컴포넌트로 전달한다.
const emit = defineEmits(['change'])

// 기존 props 이름 차이를 흡수해 실제 최대 페이지 수를 계산한다.
const resolvedMaxPage = computed(() => props.totalPages ?? props.maxPage ?? 1)
const pageGroupSize = 10

// 현재 페이지 기준으로 노출할 페이지 그룹을 계산한다.
const currentGroup = computed(() => Math.ceil((props.currentPage || 1) / pageGroupSize))
const startPage = computed(() => (currentGroup.value - 1) * pageGroupSize + 1)
const endPage = computed(() => Math.min(currentGroup.value * pageGroupSize, resolvedMaxPage.value))
const displayedPages = computed(() => {
  const pages = []
  for (let i = startPage.value; i <= endPage.value; i += 1) pages.push(i)
  return pages
})
</script>

<template>
  <div class="pagination-wrap">
    <div class="pagination-info">
      총 {{ totalAll }}{{ unit }} 중 {{ totalFiltered }}{{ unit }} 조회
    </div>
    <!-- 좌우 이동과 직접 페이지 이동 버튼을 함께 제공한다. -->
    <div class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="emit('change', 1)">&lt;&lt;</button>
      <button class="page-btn" :disabled="currentPage === 1" @click="emit('change', currentPage - 1)">&lt;</button>
      <button
        v-for="page in displayedPages"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage }"
        :style="page === currentPage ? { background: activeColor, borderColor: activeColor, color: '#fff' } : {}"
        @click="emit('change', page)"
      >
        {{ page }}
      </button>
      <button
        class="page-btn"
        :disabled="currentPage === resolvedMaxPage || resolvedMaxPage === 0"
        @click="emit('change', currentPage + 1)"
      >
        &gt;
      </button>
      <button
        class="page-btn"
        :disabled="currentPage === resolvedMaxPage || resolvedMaxPage === 0"
        @click="emit('change', resolvedMaxPage)"
      >
        &gt;&gt;
      </button>
    </div>
    <div class="pagination-spacer" />
  </div>
</template>

<style scoped>
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid #E2E8F0;
}

.pagination-info,
.pagination-spacer {
  flex: 1;
  font-size: 12px;
  color: #687282;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.page-btn {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  background: #FFFFFF;
  color: #687282;
  font-size: 12px;
  cursor: pointer;
}

.page-btn:hover {
  background: #F5F6F8;
}

.page-btn.active {
  color: #FFFFFF;
}

.page-btn:disabled {
  background: #FFFFFF;
  color: #E2E8F0;
  cursor: default;
}
</style>
