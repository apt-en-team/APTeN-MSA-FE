// 인증 관련 API 함수를 관리합니다.
import apiClient from './apiClient'

export default {
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  register: (data) => apiClient.post('/auth/register', data),
  socialSignup: (data) => apiClient.post('/auth/social-signup', data),
  refreshToken: (data) => apiClient.post('/auth/refresh', data),
  sendResetMail: (data) => apiClient.post('/auth/password/reset-mail', data),
  resetPassword: (data) => apiClient.post('/auth/password/reset', data),
  sendSmsCode: (data) => apiClient.post('/auth/sms/send', data),
  verifySmsCode: (data) => apiClient.post('/auth/sms/verify', data),
  checkEmail: (params) => apiClient.get('/auth/check-email', { params }),
  changePassword: (data) => apiClient.patch('/auth/password/change', data),
  deleteAccount: (data) => apiClient.delete('/auth/account', { data }),
}
