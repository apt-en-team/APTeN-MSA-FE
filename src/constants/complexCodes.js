// 단지 상태 코드를 화면에서 공통으로 사용합니다.
export const COMPLEX_STATUS_OPTIONS = [
  { code: '01', value: '활성' },
  { code: '02', value: '비활성' },
  { code: '03', value: '삭제' },
]

// 단지 관리자 권한 코드를 화면에서 공통으로 사용합니다.
export const COMPLEX_ADMIN_ROLE_OPTIONS = [
  { code: '01', value: '매니저' },
  { code: '02', value: '스태프' },
]

// 단지 상태 code와 value가 섞여 내려와도 화면에서 라벨을 찾습니다.
export const getComplexStatusLabel = (status) => {
  const matched = COMPLEX_STATUS_OPTIONS.find((option) => {
    return option.code === status || option.value === status
  })

  if (matched) {
    return matched.value
  }

  if (status === 'ACTIVE') return '활성'
  if (status === 'INACTIVE') return '비활성'
  if (status === 'DELETED') return '삭제'

  return status || '-'
}

// 관리자 권한 code와 value가 섞여 내려와도 화면에서 라벨을 찾습니다.
export const getComplexAdminRoleLabel = (adminRole) => {
  const matched = COMPLEX_ADMIN_ROLE_OPTIONS.find((option) => {
    return option.code === adminRole || option.value === adminRole
  })

  if (matched) {
    return matched.value
  }

  if (adminRole === 'MANAGER') return '매니저'
  if (adminRole === 'STAFF') return '스태프'

  return adminRole || '-'
}
