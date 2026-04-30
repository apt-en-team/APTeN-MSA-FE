<script setup>
// TODO: MASTER가 단지를 등록하고 최초 관리자 계정을 함께 생성하는 화면입니다.
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import { useComplexStore } from '@/stores/useComplexStore'

const router = useRouter()
const complexStore = useComplexStore()

const state = reactive({
  form: {
    name: '',
    address: '',
    addressDetail: '',
    zipCode: '',
    description: '',
    managerEmail: '',
    managerPassword: '',
    managerName: '',
    managerPhone: '',
  },
  addressKeyword: '',
  addressResults: [],
  loading: false,
  showAddressModal: false,
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

// 주소 검색
const handleSearchAddress = async () => {
  if (!state.addressKeyword.trim()) {
    openResultModal({
      title: '주소 검색어를 입력해주세요.',
      subtitle: '단지 주소를 찾으려면 검색어를 먼저 입력해야 합니다.',
    })
    return
  }

  state.loading = true

  try {
    // 프론트는 VWorld를 직접 호출하지 않고 백엔드 주소 검색 API만 호출한다.
    const results = await complexStore.searchComplexAddress(state.addressKeyword.trim())
    state.addressResults = Array.isArray(results) ? results : []
    state.showAddressModal = true
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '주소 검색에 실패했습니다.',
      subtitle: error?.message || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 주소 검색 결과 선택
const handleSelectAddress = (address) => {
  state.form.address = address?.address || ''
  state.form.addressDetail = address?.addressDetail || ''
  state.form.zipCode = address?.zipCode || ''
  state.showAddressModal = false
}

// 단지 등록 요청
const handleSubmit = async () => {
  state.loading = true

  try {
    // 단지 등록 시 최초 관리자 정보 포함
    await complexStore.createMasterComplex({
      name: state.form.name,
      address: state.form.address,
      addressDetail: state.form.addressDetail,
      zipCode: state.form.zipCode,
      description: state.form.description,
      managerEmail: state.form.managerEmail,
      managerPassword: state.form.managerPassword,
      managerName: state.form.managerName,
      managerPhone: state.form.managerPhone,
    })

    // 관리자 생성은 백엔드에서 Auth 내부 호출 처리
    // 단지 등록 성공 모달
    openResultModal({
      title: '단지 생성이 완료되었습니다.',
      subtitle: '목록 화면으로 이동해 방금 등록한 단지를 확인할 수 있습니다.',
      onConfirm: () => {
        router.push('/admin/master/complexes')
      },
    })
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '단지 생성에 실패했습니다.',
      subtitle: error?.message || '입력값을 확인한 뒤 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 목록 화면으로 이동합니다.
const goToList = () => {
  router.push('/admin/master/complexes')
}
</script>

<template>
  <section class="master-complex-form page-container">
    <div class="master-complex-form__shell">
      <div class="master-complex-form__header">
        <div>
          <p class="master-complex-form__eyebrow">MASTER</p>
          <h1 class="master-complex-form__title">단지 등록</h1>
          <p class="master-complex-form__description">
            단지를 등록하면 최초 관리자 계정도 함께 생성됩니다.
          </p>
        </div>
        <button type="button" class="master-complex-form__ghost-button" @click="goToList">
          목록으로
        </button>
      </div>

      <div class="master-complex-form__body">
        <div class="master-complex-form__section">
          <h2 class="master-complex-form__section-title">단지 정보</h2>

          <label class="master-complex-form__field">
            <span>단지명</span>
            <input v-model="state.form.name" type="text" placeholder="단지명을 입력해주세요." />
          </label>

          <div class="master-complex-form__field">
            <span>주소 찾기</span>
            <div class="master-complex-form__inline">
              <input
                v-model="state.addressKeyword"
                type="text"
                placeholder="주소 또는 아파트명을 검색해주세요."
              />
              <button
                type="button"
                class="master-complex-form__secondary-button"
                :disabled="state.loading"
                @click="handleSearchAddress"
              >
                주소 검색
              </button>
            </div>
          </div>

          <div class="master-complex-form__grid">
            <label class="master-complex-form__field">
              <span>주소</span>
              <input v-model="state.form.address" type="text" readonly />
            </label>
            <label class="master-complex-form__field">
              <span>상세주소</span>
              <input v-model="state.form.addressDetail" type="text" readonly />
            </label>
          </div>

          <label class="master-complex-form__field">
            <span>우편번호</span>
            <input v-model="state.form.zipCode" type="text" readonly />
          </label>

          <label class="master-complex-form__field">
            <span>설명</span>
            <textarea
              v-model="state.form.description"
              rows="4"
              placeholder="단지 설명을 입력해주세요."
            />
          </label>
        </div>

        <div class="master-complex-form__section">
          <h2 class="master-complex-form__section-title">초기 관리자 계정</h2>

          <label class="master-complex-form__field">
            <span>이메일</span>
            <input v-model="state.form.managerEmail" type="email" placeholder="admin@example.com" />
          </label>

          <label class="master-complex-form__field">
            <span>비밀번호</span>
            <input
              v-model="state.form.managerPassword"
              type="password"
              placeholder="초기 비밀번호를 입력해주세요."
            />
          </label>

          <div class="master-complex-form__grid">
            <label class="master-complex-form__field">
              <span>관리자 이름</span>
              <input v-model="state.form.managerName" type="text" placeholder="이름" />
            </label>
            <label class="master-complex-form__field">
              <span>연락처</span>
              <input v-model="state.form.managerPhone" type="text" placeholder="010-0000-0000" />
            </label>
          </div>
        </div>
      </div>

      <div class="master-complex-form__footer">
        <button type="button" class="master-complex-form__ghost-button" @click="goToList">
          취소
        </button>
        <button
          type="button"
          class="master-complex-form__primary-button"
          :disabled="state.loading"
          @click="handleSubmit"
        >
          {{ state.loading ? '등록 중...' : '등록' }}
        </button>
      </div>
    </div>

    <BaseModal
      :visible="state.showAddressModal"
      title="주소 검색 결과"
      subtitle="백엔드 주소 검색 API 결과를 선택하면 폼에 자동 반영됩니다."
      @close="state.showAddressModal = false"
    >
      <div v-if="state.addressResults.length === 0" class="master-complex-form__modal-empty">
        검색 결과가 없습니다.
      </div>
      <div v-else class="master-complex-form__address-list">
        <button
          v-for="address in state.addressResults"
          :key="`${address.address}-${address.zipCode}`"
          type="button"
          class="master-complex-form__address-item"
          @click="handleSelectAddress(address)"
        >
          <strong>{{ address.apartmentName || '주소 결과' }}</strong>
          <span>{{ address.address }}</span>
          <span>{{ address.addressDetail || '-' }} / {{ address.zipCode || '-' }}</span>
        </button>
      </div>
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
  gap: 28px;
  padding: 28px;
}

.master-complex-form__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.master-complex-form__section-title {
  margin: 0;
  font-size: var(--font-size-heading-3);
  color: var(--color-text-primary);
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

.master-complex-form__inline {
  display: flex;
  gap: 12px;
}

.master-complex-form__inline input {
  flex: 1;
}

.master-complex-form__primary-button,
.master-complex-form__secondary-button,
.master-complex-form__ghost-button {
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

.master-complex-form__secondary-button,
.master-complex-form__ghost-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.master-complex-form__modal-empty {
  color: var(--color-text-secondary);
}

.master-complex-form__address-list {
  display: flex;
  max-height: 320px;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.master-complex-form__address-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.master-complex-form__address-item span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

@media (max-width: 960px) {
  .master-complex-form__header,
  .master-complex-form__footer,
  .master-complex-form__inline {
    flex-direction: column;
    align-items: stretch;
  }

  .master-complex-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
