import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 從 LocalStorage 讀取歷史 Token，保持重新整理後不登出
  const token = ref(localStorage.getItem('jwt_token') || '')

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('jwt_token', newToken)
  }

  const logout = () => {
    token.value = ''
    localStorage.removeItem('jwt_token')
  }

  return { token, setToken, logout }
})