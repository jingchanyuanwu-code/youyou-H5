import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PatientProfile {
  accountId: number
  patientId: number
  name: string
  phone: string
  nickname: string
  gender: string
  age: number
  currentIdentity: 'patient' | 'family'
}

export const usePatientStore = defineStore('patient', () => {
  const profile = ref<PatientProfile | null>(null)
  const token = ref<string | null>(localStorage.getItem('p_token'))
  const identity = ref<'patient' | 'family'>(
    (localStorage.getItem('p_identity') as 'patient' | 'family') || 'patient'
  )
  const currentMemberId = ref<number | null>(
    localStorage.getItem('p_currentMember') ? Number(localStorage.getItem('p_currentMember')) : null
  )
  const focusMemberId = ref<number | null>(
    localStorage.getItem('p_focusMember') ? Number(localStorage.getItem('p_focusMember')) : null
  )
  const focusMemberName = ref<string | null>(
    localStorage.getItem('p_focusMemberName') || null
  )

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (t: string) => {
    token.value = t
    localStorage.setItem('p_token', t)
  }

  const setProfile = (p: PatientProfile) => {
    profile.value = p
    identity.value = p.currentIdentity
    localStorage.setItem('p_identity', p.currentIdentity)
  }

  const switchIdentity = (id: 'patient' | 'family') => {
    identity.value = id
    localStorage.setItem('p_identity', id)
  }

  const setCurrentMember = (patientId: number) => {
    currentMemberId.value = patientId
    localStorage.setItem('p_currentMember', String(patientId))
  }

  const setFocusMember = (patientId: number | null, name?: string) => {
    focusMemberId.value = patientId
    focusMemberName.value = name || null
    if (patientId) {
      localStorage.setItem('p_focusMember', String(patientId))
      if (name) localStorage.setItem('p_focusMemberName', name)
    } else {
      localStorage.removeItem('p_focusMember')
      localStorage.removeItem('p_focusMemberName')
    }
  }

  const logout = () => {
    profile.value = null
    token.value = null
    identity.value = 'patient'
    currentMemberId.value = null
    focusMemberId.value = null
    focusMemberName.value = null
    localStorage.removeItem('p_token')
    localStorage.removeItem('p_identity')
    localStorage.removeItem('p_currentMember')
    localStorage.removeItem('p_focusMember')
    localStorage.removeItem('p_focusMemberName')
  }

  return {
    profile, token, identity, currentMemberId, focusMemberId, focusMemberName, isLoggedIn,
    setToken, setProfile, switchIdentity, setCurrentMember, setFocusMember, logout,
  }
})
