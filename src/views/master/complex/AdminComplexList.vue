<script setup>
// TODO: MASTER 단지 목록에서 선택 후 관리자 화면으로 진입하는 페이지입니다.
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useComplexStore } from '@/stores/useComplexStore'

const router = useRouter()
const complexStore = useComplexStore()

// 검색 조건은 목록 조회 파라미터로만 사용합니다.
const filters = reactive({
  keyword: '',
})

// 목록 응답이 페이지 객체이거나 배열이어도 화면에서는 배열로 사용합니다.
const complexRows = computed(() => {
  if (Array.isArray(complexStore.complexList)) {
    return complexStore.complexList
  }

  if (Array.isArray(complexStore.complexList?.content)) {
    return complexStore.complexList.content
  }

  return []
})

// 상태 표시는 서버 원본 값을 우선 사용합니다.
const formatStatus = (status) => status || '미정'

// 등록일 표시는 값이 없을 때 대시로 대체합니다.
const formatDate = (dateValue) => {
  if (!dateValue) {
    return '-'
  }

  return String(dateValue).slice(0, 10)
}

// 단지 목록 조회
const loadComplexes = async () => {
  await complexStore.fetchMasterComplexes({
    keyword: filters.keyword || undefined,
  })
}

// 검색 조건으로 단지 목록 재조회
const handleSearch = async () => {
  await loadComplexes()
}

// 선택 단지를 저장하고 관리자 화면으로 이동
const handleSelectComplex = (complex) => {
  complexStore.setSelectedComplex(complex)
  router.push('/admin/dashboard')
}

// 단지 상세 화면 이동
const goToDetail = (code) => {
  router.push(`/admin/master/complexes/${code}`)
}

// 단지 관리자 배정 화면 이동
const goToAdmins = (code) => {
  router.push(`/admin/master/complexes/${code}/admins`)
}

// 단지 등록 화면 이동
const goToCreate = () => {
  router.push('/admin/master/complexes/create')
}

// 페이지 진입 시 전체 단지 목록을 조회합니다.
onMounted(loadComplexes)
</script>

<template>
  <section class="page-container">
    <div class="master-complex-list__header">
      <div>
        <h1 class="page-title">전체 단지 관리</h1>
        <p class="master-complex-list__description">
          관리할 아파트 단지를 선택하면 해당 단지 기준 관리자 화면으로 이동합니다.
        </p>
      </div>
      <button type="button" class="master-complex-list__primary-button" @click="goToCreate">
        단지 등록
      </button>
    </div>

    <div class="card-section master-complex-list__filter">
      <input
        v-model="filters.keyword"
        type="text"
        class="master-complex-list__input"
        placeholder="단지명 또는 코드 검색"
      />
      <button type="button" class="master-complex-list__secondary-button" @click="handleSearch">
        조회
      </button>
    </div>

    <div class="card-section">
      <p v-if="complexStore.loading" class="master-complex-list__feedback">단지 목록을 불러오는 중입니다.</p>
      <p
        v-else-if="complexStore.error"
        class="master-complex-list__feedback master-complex-list__feedback--error"
      >
        단지 목록을 불러오지 못했습니다.
      </p>
      <div class="master-complex-list__table-wrap">
        <table class="master-complex-list__table">
          <thead>
            <tr>
              <th>단지명</th>
              <th>코드</th>
              <th>주소</th>
              <th>상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!complexStore.loading && complexRows.length === 0">
              <td colspan="6" class="master-complex-list__empty">조회된 단지가 없습니다.</td>
            </tr>
            <tr v-for="complex in complexRows" :key="complex.code || complex.id">
              <td>{{ complex.name || complex.complexName || '-' }}</td>
              <td>{{ complex.code || '-' }}</td>
              <td>{{ complex.address || '-' }}</td>
              <td>{{ formatStatus(complex.status) }}</td>
              <td>{{ formatDate(complex.createdAt || complex.createdDate) }}</td>
              <td>
                <div class="master-complex-list__actions">
                  <button type="button" class="master-complex-list__text-button" @click="goToDetail(complex.code)">
                    상세
                  </button>
                  <button type="button" class="master-complex-list__text-button" @click="goToAdmins(complex.code)">
                    관리자 배정
                  </button>
                  <button type="button" class="master-complex-list__primary-button" @click="handleSelectComplex(complex)">
                    이 단지로 관리자 화면 보기
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.master-complex-list__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.master-complex-list__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-complex-list__filter {
  display: flex;
  gap: 12px;
  align-items: center;
}

.master-complex-list__input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  font: inherit;
}

.master-complex-list__table-wrap {
  overflow-x: auto;
}

.master-complex-list__feedback {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-complex-list__feedback--error {
  color: var(--color-danger);
}

.master-complex-list__table {
  width: 100%;
  border-collapse: collapse;
}

.master-complex-list__table th,
.master-complex-list__table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--color-table-line);
  text-align: left;
  font-size: var(--font-size-detail);
}

.master-complex-list__table th {
  background: var(--color-table-head-bg);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.master-complex-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.master-complex-list__primary-button,
.master-complex-list__secondary-button,
.master-complex-list__text-button {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.master-complex-list__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-complex-list__secondary-button,
.master-complex-list__text-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.master-complex-list__empty {
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
