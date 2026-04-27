import apiClient from './apiClient'

// 이메일 로그인
export const login = async (body) => {
  const res = await apiClient.post('/api/auth/login', body)
  return res.data
}

// 로그아웃
export const logout = async () => {
  const res = await apiClient.post('/api/auth/logout')
  return res.data
}

// 회원가입
export const register = async (body) => {
  const res = await apiClient.post('/api/auth/register', body)
  return res.data
}

// Google 로그인 URL 반환
export const getGoogleLoginUrl = () => '/oauth2/authorization/google'

// Kakao 로그인 URL 반환
export const getKakaoLoginUrl = () => '/oauth2/authorization/kakao'

// Naver 로그인 URL 반환
export const getNaverLoginUrl = () => '/oauth2/authorization/naver'

// 소셜 추가정보 회원가입
export const socialSignup = async (body) => {
  const res = await apiClient.post('/api/auth/social/signup', body)
  return res.data
}

// 토큰 재발급
export const refreshToken = async (body) => {
  const res = await apiClient.post('/api/auth/token/refresh', body)
  return res.data
}

// 비밀번호 재설정 메일 발송
export const sendPasswordResetMail = async (body) => {
  const res = await apiClient.post('/api/auth/password/forgot', body)
  return res.data
}

// 비밀번호 재설정
export const resetPassword = async (body) => {
  const res = await apiClient.post('/api/auth/password/reset', body)
  return res.data
}

// SMS 인증번호 발송
export const sendSmsCode = async (body) => {
  const res = await apiClient.post('/api/auth/sms/send', body)
  return res.data
}

// SMS 인증번호 검증
export const verifySmsCode = async (body) => {
  const res = await apiClient.post('/api/auth/sms/verify', body)
  return res.data
}

// 이메일 중복 확인
export const checkEmail = async (params) => {
  const res = await apiClient.get('/api/auth/check-email', { params })
  return res.data
}

// 비밀번호 변경
export const changePassword = async (body) => {
  const res = await apiClient.patch('/api/users/me/password', body)
  return res.data
}

// 회원 탈퇴
export const deleteMyAccount = async (body) => {
  const res = await apiClient.delete('/api/users/me', { data: body })
  return res.data
}

export default {
  login,
  logout,
  register,
  getGoogleLoginUrl,
  getKakaoLoginUrl,
  getNaverLoginUrl,
  socialSignup,
  refreshToken,
  sendPasswordResetMail,
  resetPassword,
  sendSmsCode,
  verifySmsCode,
  checkEmail,
  changePassword,
  deleteMyAccount,
}
