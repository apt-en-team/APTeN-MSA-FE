import apiClient from './apiClient'

// 챗봇 질의
export const queryChatbot = async (body) => {
  const res = await apiClient.post('/api/chatbot/query', body)
  return res.data
}

// 챗봇 FAQ 조회
export const getChatbotFaqs = async (params) => {
  const res = await apiClient.get('/api/chatbot/faqs', { params })
  return res.data
}

// 챗봇 추천 질문 조회
export const getChatbotSuggestions = async (params) => {
  const res = await apiClient.get('/api/chatbot/suggestions', { params })
  return res.data
}

// 챗봇 문의 이력 조회
export const getChatbotHistory = async (params) => {
  const res = await apiClient.get('/api/chatbot/history', { params })
  return res.data
}

// 관리자 FAQ 등록
export const createAdminFaq = async (body) => {
  const res = await apiClient.post('/api/admin/chatbot/faqs', body)
  return res.data
}

// 관리자 FAQ 수정
export const updateAdminFaq = async (faqUid, body) => {
  const res = await apiClient.patch(`/api/admin/chatbot/faqs/${faqUid}`, body)
  return res.data
}

// 관리자 FAQ 삭제
export const deleteAdminFaq = async (faqUid) => {
  const res = await apiClient.delete(`/api/admin/chatbot/faqs/${faqUid}`)
  return res.data
}

export default {
  queryChatbot,
  getChatbotFaqs,
  getChatbotSuggestions,
  getChatbotHistory,
  createAdminFaq,
  updateAdminFaq,
  deleteAdminFaq,
}
