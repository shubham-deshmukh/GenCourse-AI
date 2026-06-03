import { create } from 'zustand'

interface AuthUser {
  name?: string
  email?: string
  picture?: string
  sub?: string
  [key: string]: any
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuthState: (user: AuthUser | null, isAuthenticated: boolean, isLoading: boolean) => void
  logoutState: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setAuthState: (user, isAuthenticated, isLoading) =>
    set({ user, isAuthenticated, isLoading }),
  logoutState: () =>
    set({ user: null, isAuthenticated: false, isLoading: false })
}))
