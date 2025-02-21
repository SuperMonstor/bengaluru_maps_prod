"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "../supabase/client"

interface AuthContextValue {
  user: UserSchema | null
  isLoading: boolean
  signOut: () => Promise<void>
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserSchema | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUserData(authUserId: string | null) {
      if (!authUserId) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUserId)
        .single()

      if (error) {
        console.error("Error fetching user data:", error.message)
        setUser(null)
      } else {
        setUser(data as UserSchema)
      }
      setIsLoading(false)
    }

    async function getSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        console.error("Error getting session:", error.message)
        setUser(null)
        setIsLoading(false)
      } else {
        await fetchUserData(session?.user?.id || null)
      }
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      fetchUserData(session?.user?.id || null)
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error.message)
    }
  }

  const value: AuthContextValue = { user, isLoading, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}