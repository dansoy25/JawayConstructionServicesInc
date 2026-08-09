import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) { setProfile(null); setSite(null); return }
    const { data: p } = await supabase
      .from('profiles')
      .select('*, site:sites(*)')
      .eq('id', uid)
      .maybeSingle()
    setProfile(p || null)
    setSite(p?.site || null)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      await loadProfile(s?.user?.id)
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [loadProfile])

  const signInWithPin = async (companyCode, employeeCode, pin) => {
    const syntheticEmail = `${employeeCode.toLowerCase()}@${companyCode.toLowerCase()}.tingsync.local`
    const { data, error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password: pin,
    })
    if (error) {
      if (error.message?.includes('Invalid login')) {
        throw new Error('Invalid company code, employee ID, or PIN.')
      }
      throw error
    }
    return data
  }

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthCtx.Provider value={{ session, profile, site, loading, signIn, signInWithPin, signOut, refreshProfile: () => loadProfile(session?.user?.id) }}>
      {children}
    </AuthCtx.Provider>
  )
}
