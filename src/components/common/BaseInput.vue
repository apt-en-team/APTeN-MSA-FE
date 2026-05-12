<script setup>
// TODO: 공통 입력 컴포넌트의 표현용 스타일 구조를 제공합니다.
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: 'Input',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const inputClass = computed(() => [
  'base-input',
  {
    'is-error': props.error,
  },
])
</script>

<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="inputClass"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped>
.base-input {
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-input::placeholder {
  color: var(--text-disabled);
}

.base-input:focus {
  outline: 0;
  border-color: var(--resident-line-focus);
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.base-input:disabled {
  background-color: var(--color-bg-muted);
  color: var(--text-disabled);
}

.is-error {
  border-color: var(--color-danger);
}
</style>
