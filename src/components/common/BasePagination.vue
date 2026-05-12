<script setup>
// TODO: 페이지 그룹 이동과 목록 개수 표시를 함께 제공하는 공통 페이지네이션입니다.
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: undefined,
  },
  maxPage: {
    type: Number,
    default: undefined,
  },
  totalAll: {
    type: Number,
    default: 0,
  },
  totalFiltered: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    default: '건',
  },
  activeColor: {
    type: String,
    default: '#2B3A55',
  },
})

const emit = defineEmits(['change'])

// 기존 props 호환 처리
const resolvedTotalPages = computed(() => {
  const source = props.totalPages ?? props.maxPage ?? 1
  return Math.max(1, Number(source) || 1)
})

const current = computed(() => {
  return Math.min(Math.max(1, Number(props.currentPage) || 1), resolvedTotalPages.value)
})

// 10개 단위 페이지 그룹을 계산합니다.
const currentGroup = computed(() => {
  return Math.floor((current.value - 1) / 10)
})

const groupStartPage = computed(() => {
  return currentGroup.value * 10 + 1
})

const groupEndPage = computed(() => {
  return Math.min(groupStartPage.value + 9, resolvedTotalPages.value)
})

// 로컬 페이지네이션 계산에 사용할 페이지 배열을 만듭니다.
const pageNumbers = computed(() => {
  const pages = []

  for (let page = groupStartPage.value; page <= groupEndPage.value; page += 1) {
    pages.push(page)
  }

  return pages
})

const isFirstPage = computed(() => current.value <= 1)
const isLastPage = computed(() => current.value >= resolvedTotalPages.value)

// 페이지 변경 처리
const changePage = (page) => {
  const nextPage = Math.min(Math.max(1, Number(page) || 1), resolvedTotalPages.value)

  if (nextPage === current.value) {
    return
  }

  emit('change', nextPage)
}

const goFirst = () => changePage(1)
const goPrev = () => changePage(current.value - 1)
const goNext = () => changePage(current.value + 1)
const goLast = () => changePage(resolvedTotalPages.value)
</script>

<template>
  <div class="base-pagination">
    <p class="base-pagination__summary">
      전체 <strong>{{ totalAll }}</strong>{{ unit }}
      <span class="base-pagination__divider">|</span>
      현재 <strong>{{ totalFiltered }}</strong>{{ unit }}
    </p>

    <nav class="base-pagination__nav" aria-label="Pagination">
      <button type="button" class="base-pagination__button" :disabled="isFirstPage" @click="goFirst">
        &laquo;
      </button>
      <button type="button" class="base-pagination__button" :disabled="isFirstPage" @click="goPrev">
        &lsaquo;
      </button>

      <div class="base-pagination__pages">
        <button
          v-for="page in pageNumbers"
          :key="page"
          type="button"
          class="base-pagination__page"
          :class="{ 'is-active': page === current }"
          :style="page === current ? { '--pagination-active-color': activeColor } : {}"
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </div>

      <button type="button" class="base-pagination__button" :disabled="isLastPage" @click="goNext">
        &rsaquo;
      </button>
      <button type="button" class="base-pagination__button" :disabled="isLastPage" @click="goLast">
        &raquo;
      </button>
    </nav>
  </div>
</template>

<style scoped>
.base-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
}

.base-pagination__summary {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.base-pagination__summary strong {
  color: var(--color-text-primary);
}

.base-pagination__divider {
  display: inline-block;
  margin: 0 8px;
  color: var(--color-border);
}

.base-pagination__nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.base-pagination__pages {
  display: inline-flex;
  gap: 8px;
}

.base-pagination__button,
.base-pagination__page {
  display: inline-flex;
  min-width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  font: inherit;
}

.base-pagination__button:disabled,
.base-pagination__page:disabled {
  cursor: not-allowed;
  opacity: 0.44;
}

.base-pagination__page.is-active {
  border-color: var(--pagination-active-color, var(--color-primary));
  background: var(--pagination-active-color, var(--color-primary));
  color: var(--color-white);
  font-weight: 700;
}

@media (max-width: 960px) {
  .base-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .base-pagination__nav {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
