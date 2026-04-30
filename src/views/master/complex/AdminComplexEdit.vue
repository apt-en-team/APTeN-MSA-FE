<script setup>
// TODO: MASTER가 단지 정보의 일부를 수정하고 소프트 삭제 상태를 변경하는 화면입니다.
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import { getComplexStatusLabel } from '@/constants/complexCodes'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const complexStore = useComplexStore()

const state = reactive({
  form: {
    name: '',
    address: '',
    addressDetail: '',
    zipCode: '',
    description: '',
    status: '',
    code: '',
    createdAt: '',
    updatedAt: '',
  },
  loading: false,
  showDeleteConfirm: false,
  resultModal: {
    show: false,
    title: '',
    subtitle: '',
    confirmText: '확인',
    onConfirm: null,
  },
})

// alert 대신 결과 모달로 사용자에게 처리 결과를 안내합니다.
const openResultModal = ({ title, subtitle, confirmText = '확인', onConfirm = null }) => {
  state.resultModal.show = true
  state.resultModal.title = title
  state.resultModal.subtitle = subtitle
  state.resultModal.confirmText = confirmText
  state.resultModal.onConfirm = onConfirm
}

// 결과 모달 확인 버튼을 처리합니다.
const handleResultConfirm = () => {
  const callback = state.resultModal.onConfirm

  state.resultModal.show = false
  state.resultModal.onConfirm = null

  if (typeof callback === 'function') {
    callback()
  }
}

// 단지 상태 라벨을 안전하게 표시합니다.
const formatStatus = (status) => {
  return getComplexStatusLabel(status)
}

// 단지 상세 조회
const loadComplexDetail = async () => {
  const code = route.params.code

  if (!code) {
    router.push('/admin/master/complexes')
    return
  }

  state.loading = true

  try {
    const detail = await complexStore.fetchMasterComplexDetail(code)

    state.form.name = detail?.name || ''
    state.form.address = detail?.address || ''
    state.form.addressDetail = detail?.addressDetail || ''
    state.form.zipCode = detail?.zipCode || ''
    state.form.description = detail?.description || ''
    state.form.status = detail?.status || ''
    state.form.code = detail?.code || ''
    state.form.createdAt = detail?.createdAt || ''
    state.form.updatedAt = detail?.updatedAt || ''
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '단지 정보를 불러오지 못했습니다.',
      subtitle: error?.message || '목록 화면으로 돌아가 다시 시도해주세요.',
      onConfirm: () => {
        router.push('/admin/master/complexes')
      },
    })
  } finally {
    state.loading = false
  }
}

// 단지 수정 요청
const handleSubmit = async () => {
  const code = route.params.code

  if (!code) {
    router.push('/admin/master/complexes')
    return
  }

  state.loading = true

  try {
    await complexStore.updateMasterComplex(code, {
      name: state.form.name,
      description: state.form.description,
    })

    openResultModal({
      title: '수정이 완료되었습니다.',
      subtitle: '변경된 단지 정보가 저장되었습니다.',
      onConfirm: () => {
        router.push(`/admin/master/complexes/${code}`)
      },
    })
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '수정에 실패했습니다.',
      subtitle: error?.message || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 단지 삭제 확인 모달
const openDeleteConfirm = () => {
  state.showDeleteConfirm = true
}

// 단지 삭제 상태 변경 요청
const handleDelete = async () => {
  const code = route.params.code

  if (!code) {
    router.push('/admin/master/complexes')
    return
  }

  state.showDeleteConfirm = false
  state.loading = true

  try {
    // 단지 삭제는 실제 삭제가 아니라 status=03으로 변경하는 소프트 삭제이다.
    await complexStore.updateMasterComplexStatus(code, '03')

    openResultModal({
      title: '삭제가 완료되었습니다.',
      subtitle: '단지 상태가 삭제로 변경되었습니다.',
      onConfirm: () => {
        router.push('/admin/master/complexes')
      },
    })
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '삭제 처리에 실패했습니다.',
      subtitle: error?.message || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 상세 화면으로 이동합니다.
const goToDetail = () => {
  router.push(`/admin/master/complexes/${route.params.code}`)
}

// 목록 화면으로 이동합니다.
const goToList = () => {
  router.push('/admin/master/complexes')
}

onMounted(loadComplexDetail)
</script>

<template>
  <section class="master-complex-form page-container">
    <div class="master-complex-form__shell">
      <div class="master-complex-form__header">
        <div>
          <p class="master-complex-form__eyebrow">MASTER</p>
          <h1 class="master-complex-form__title">단지 수정</h1>
          <p class="master-complex-form__description">
            단지명과 설명만 수정할 수 있으며 주소 정보는 등록 이후 변경할 수 없습니다.
          </p>
        </div>
        <button type="button" class="master-complex-form__ghost-button" @click="goToDetail">
          상세로
        </button>
      </div>

      <div class="master-complex-form__body">
        <p v-if="state.loading" class="master-complex-form__feedback">단지 정보를 불러오는 중입니다.</p>

        <div class="master-complex-form__grid">
          <label class="master-complex-form__field">
            <span>단지명</span>
            <input v-model="state.form.name" type="text" placeholder="단지명을 입력해주세요." />
          </label>

          <label class="master-complex-form__field">
            <span>상태</span>
            <input :value="formatStatus(state.form.status)" type="text" readonly />
          </label>
        </div>

        <label class="master-complex-form__field">
          <span>주소</span>
          <input v-model="state.form.address" type="text" readonly />
        </label>

        <div class="master-complex-form__grid">
          <label class="master-complex-form__field">
            <span>상세주소</span>
            <input v-model="state.form.addressDetail" type="text" readonly />
          </label>

          <label class="master-complex-form__field">
            <span>우편번호</span>
            <input v-model="state.form.zipCode" type="text" readonly />
          </label>
        </div>

        <label class="master-complex-form__field">
          <span>설명</span>
          <textarea
            v-model="state.form.description"
            rows="5"
            placeholder="단지 설명을 입력해주세요."
          />
        </label>

        <div class="master-complex-form__meta">
          <p>코드: {{ state.form.code || '-' }}</p>
          <p>등록일: {{ state.form.createdAt || '-' }}</p>
          <p>수정일: {{ state.form.updatedAt || '-' }}</p>
        </div>
      </div>

      <div class="master-complex-form__footer">
        <div class="master-complex-form__footer-left">
          <button type="button" class="master-complex-form__danger-button" @click="openDeleteConfirm">
            삭제
          </button>
        </div>
        <div class="master-complex-form__footer-actions">
          <button type="button" class="master-complex-form__ghost-button" @click="goToList">
            목록으로
          </button>
          <button
            type="button"
            class="master-complex-form__primary-button"
            :disabled="state.loading"
            @click="handleSubmit"
          >
            {{ state.loading ? '저장 중...' : '수정 저장' }}
          </button>
        </div>
      </div>
    </div>

    <BaseModal
      :visible="state.showDeleteConfirm"
      title="단지를 삭제 상태로 변경할까요?"
      subtitle="삭제는 실제 제거가 아니라 status=03으로 변경하는 소프트 삭제입니다."
      @close="state.showDeleteConfirm = false"
    >
      <template #footer>
        <button type="button" class="master-complex-form__ghost-button" @click="state.showDeleteConfirm = false">
          취소
        </button>
        <button type="button" class="master-complex-form__danger-button" @click="handleDelete">
          삭제 확인
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :visible="state.resultModal.show"
      :title="state.resultModal.title"
      :subtitle="state.resultModal.subtitle"
      @close="handleResultConfirm"
    >
      <template #footer>
        <button type="button" class="master-complex-form__primary-button" @click="handleResultConfirm">
          {{ state.resultModal.confirmText }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.master-complex-form {
  display: flex;
  justify-content: center;
}

.master-complex-form__shell {
  width: min(100%, 860px);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-medium);
}

.master-complex-form__header,
.master-complex-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 28px;
}

.master-complex-form__header {
  border-bottom: 1px solid var(--color-border);
}

.master-complex-form__footer {
  border-top: 1px solid var(--color-border);
}

.master-complex-form__footer-left,
.master-complex-form__footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.master-complex-form__eyebrow {
  margin: 0 0 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-complex-form__title {
  margin: 0;
  font-size: var(--font-size-heading-2);
  color: var(--color-text-primary);
}

.master-complex-form__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-complex-form__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px;
}

.master-complex-form__feedback {
  margin: 0;
  color: var(--color-text-secondary);
}

.master-complex-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.master-complex-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.master-complex-form__field span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-complex-form__field input,
.master-complex-form__field textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font: inherit;
}

.master-complex-form__field input[readonly] {
  background: var(--color-bg-app);
}

.master-complex-form__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-8);
  background: var(--color-bg-app);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.master-complex-form__primary-button,
.master-complex-form__ghost-button,
.master-complex-form__danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.master-complex-form__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-complex-form__ghost-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.master-complex-form__danger-button {
  border: none;
  background: var(--color-danger);
  color: var(--color-white);
}

@media (max-width: 960px) {
  .master-complex-form__header,
  .master-complex-form__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .master-complex-form__footer-left,
  .master-complex-form__footer-actions {
    justify-content: stretch;
  }

  .master-complex-form__grid,
  .master-complex-form__meta {
    grid-template-columns: 1fr;
  }
}
</style>
