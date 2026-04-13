import { Session, AuthResponse, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileResponse {
  name: string | null
  age: number | null
  gender: string | null
  college_id: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email)
}

const isFormValid = (email: string, password: string): boolean => {
  return isValidEmail(email) && password.length >= 6
}

const getValidationError = (email: string, password: string): string => {
  const invalidEmail = !isValidEmail(email)
  const shortPassword = password.length < 6

  if (invalidEmail && shortPassword) {
    return 'Invalid email format and password must be at least 6 characters'
  } else if (invalidEmail) {
    return 'Invalid email format'
  } else if (shortPassword) {
    return 'Password must be at least 6 characters'
  }
  return 'Invalid email or password'
}

// ─── Auth Manager ─────────────────────────────────────────────────────────────

const AuthManager = {

  // ── Session Management ──────────────────────────────────────────────────────

  isUserLoggedIn: async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session?.user?.id != null
    } catch (error) {
      console.log('No existing session found:', error)
      return false
    }
  },

  getCurrentSession: async (): Promise<Session | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.log('Failed to get session:', error)
      return null
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.log('Failed to get user:', error)
      return null
    }
  },

  getCurrentUserId: async (): Promise<string | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user?.id ?? null
    } catch (error) {
      console.log('Failed to get user ID:', error)
      return null
    }
  },

  // ── Auth Operations ─────────────────────────────────────────────────────────

  registerNewUserWithEmail: async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    if (!isFormValid(email, password)) {
      throw new Error(getValidationError(email, password))
    }

    const response = await supabase.auth.signUp({ email, password })
    if (response.error) throw response.error
    return response
  },

  signInWithEmail: async (
    email: string,
    password: string
  ): Promise<Session> => {
    if (!isFormValid(email, password)) {
      throw new Error('Invalid email or password')
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.session) throw new Error('Sign in succeeded but no session returned')
    return data.session
  },

  // ── Sign Out ────────────────────────────────────────────────────────────────

  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // ── Onboarding ──────────────────────────────────────────────────────────────

  isOnboardingComplete: async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, age, gender, college_id')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 = no rows found → profile doesn't exist yet
        if (error.code === 'PGRST116') {
          console.log(`No profile exists for user ${userId} - onboarding incomplete`)
          return false
        }
        console.log('Error checking onboarding:', error)
        return false
      }

      const profile = data as ProfileResponse
      return (
        profile.name != null &&
        profile.age != null &&
        profile.gender != null &&
        profile.college_id != null
      )
    } catch (error) {
      console.log('Error checking onboarding:', error)
      return false
    }
  },
}

export default AuthManager