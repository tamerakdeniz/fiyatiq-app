"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService } from "@/services/api"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  signout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token")
      console.log("🔍 Checking authentication...", { hasToken: !!token })

      if (token) {
        const userData = await authService.getProfile()
        setUser(userData)
        console.log("✅ User authenticated:", userData.name)
      } else {
        console.log("❌ No token found")
      }
    } catch (error) {
      console.log("❌ Auth check failed:", error)
      localStorage.removeItem("token")
    } finally {
      setLoading(false)
    }
  }

  const signin = async (email: string, password: string) => {
    console.log("🔐 Signing in user:", email)
    const response = await authService.signin(email, password)
    localStorage.setItem("token", response.token)
    setUser(response.user)
    console.log("✅ User signed in successfully:", response.user.name)
  }

  const signup = async (name: string, email: string, password: string) => {
    console.log("📝 Creating new account:", { name, email })
    const response = await authService.signup(name, email, password)
    localStorage.setItem("token", response.token)
    setUser(response.user)
    console.log("✅ Account created successfully:", response.user.name)
  }

  const signout = () => {
    console.log("👋 Signing out user")
    localStorage.removeItem("token")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, signin, signup, signout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
