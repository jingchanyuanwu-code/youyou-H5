import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Doctor } from '@/api'

export const useUserStore = defineStore('user', () => {
  const doctor = ref<Doctor | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const setDoctor = (data: Doctor) => {
    doctor.value = data
  }

  const setToken = (t: string) => {
    token.value = t
    localStorage.setItem('token', t)
  }

  const logout = () => {
    doctor.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return { doctor, token, setDoctor, setToken, logout }
})
