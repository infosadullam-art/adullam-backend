"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "./api-client"

interface User {
  id: string
  email: string
  name: string | null
  role: "ADMIN" | "USER"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const response = await authApi.me()
      if (response.success && response.data) {
        const userData = response.data as User
        if (userData.role !== "ADMIN") {
          setUser(null)
          router.push("/admin/login")
        } else {
          setUser(userData)
        }
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password)
    if (response.success && response.data) {
      const userData = response.data as User
      if (userData.role !== "ADMIN") {
        throw new Error("Admin access required")
      }
      setUser(userData)
      router.push("/admin")
    }
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
    router.push("/admin/login")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
