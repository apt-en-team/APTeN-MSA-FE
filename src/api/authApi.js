// 인증 관련 API를 관리합니다.
import apiClient from './apiClient'

export default {
  // 이메일 로그인
  login(body) {
    return apiClient.post('/api/auth/login', body)
  },
  // 로그아웃
  logout() {
    return apiClient.post('/api/auth/logout')
  },
  // 회원가입
  register(body) {
    return apiClient.post('/api/auth/register', body)
  },
  // 소셜 추가정보 회원가입
  socialSignup(body) {
    return apiClient.post('/api/auth/social/signup', body)
  },
  // 토큰 재발급
  refreshToken(body) {
    return apiClient.post('/api/auth/token/refresh', body)
  },
  // 비밀번호 재설정 메일 발송
  sendPasswordResetMail(body) {
    return apiClient.post('/api/auth/password/forgot', body)
  },
  // 비밀번호 재설정
  resetPassword(body) {
    return apiClient.post('/api/auth/password/reset', body)
  },
  // SMS 인증번호 발송
  sendSmsCode(body) {
    return apiClient.post('/api/auth/sms/send', body)
  },
  // SMS 인증번호 검증
  verifySmsCode(body) {
    return apiClient.post('/api/auth/sms/verify', body)
  },
  // 이메일 중복 확인
  checkEmail(params) {
    return apiClient.get('/api/auth/check-email', { params })
  },
  // 비밀번호 변경
  changePassword(body) {
    return apiClient.patch('/api/users/me/password', body)
  },
  // 회원 탈퇴
  deleteMyAccount(body) {
    return apiClient.delete('/api/users/me', { data: body })
  },
}
