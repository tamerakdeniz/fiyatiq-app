"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService } from "@/services/api"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  signout: () => void
  backendConnected: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [backendConnected, setBackendConnected] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      console.log("🔍 Checking authentication and backend connection...")

      if (token) {
        const userData = await authService.getProfile()
        setUser(userData)
        setBackendConnected(true)
        console.log("✅ User authenticated and backend connected:", userData.name)
      } else {
        // Still check backend connection even without token
        try {
          await authService.getProfile()
          setBackendConnected(true)
          console.log("✅ Backend connected but no user token")
        } catch {
          setBackendConnected(false)
          console.log("❌ Backend not available")
        }
      }
    } catch (error) {
      console.log("❌ Auth check failed:", error)
      localStorage.removeItem("token")
      setBackendConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const signin = async (email: string, password: string) => {
    console.log("🔐 Signing in user:", email)
    try {
      const response = await authService.signin(email, password)
      localStorage.setItem("token", response.token)
      setUser(response.user)
      setBackendConnected(true)
      console.log("✅ User signed in successfully:", response.user.name)
    } catch (error) {
      setBackendConnected(false)
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    console.log("📝 Creating new account:", { name, email })
    try {
      const response = await authService.signup(name, email, password)
      localStorage.setItem("token", response.token)
      setUser(response.user)
      setBackendConnected(true)
      console.log("✅ Account created successfully:", response.user.name)
    } catch (error) {
      setBackendConnected(false)
      throw error
    }
  }

  const signout = () => {
    console.log("👋 Signing out user")
    localStorage.removeItem("token")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout, backendConnected }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
