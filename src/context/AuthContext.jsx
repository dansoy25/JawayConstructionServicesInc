import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true) // initial boot
  const [profileLoading, setProfileLoading] = useState(false)
  const uidRef = useRef(null) // guards against stale profile fetches

  const loadProfile = useCallback(async (uid) => {
    uidRef.current = uid
    if (!uid) {
      setProfile(null); setSite(null); setProfileLoading(false)
      return
    }
    setProfileLoading(true)

    // Two attempts with a small delay handles the race with our AFTER INSERT
    // trigger on auth.users: on a brand-new user the trigger fires just
    // after signInWithPassword returns, and the profile row may not be
    // visible on the very first fetch.
    let p = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await supabase
        .from('profiles')
        .select('*, site:sites(*)')
        .eq('id', uid)
        .maybeSingle()
      if (uidRef.current !== uid) return // superseded by a newer session
      if (data) { p = data; break }
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)))
    }

    if (uidRef.current !== uid) return
    setProfile(p || null)
    setSite(p?.site || null)
    setProfileLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      if (mounted) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      // Reset profile immediately so gates don't see the previous user's row
      setProfile(null); setSite(null)
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
    // Eagerly load profile so the redirect sees it on the very next render,
    // rather than waiting for onAuthStateChange to fire and race with the
    // navigation. This is what makes login feel instant.
    await loadProfile(data.session?.user?.id)
    return data
  }

  const signIn = async (email, password) => {
    const res = await supabase.auth.signInWithPassword({ email, password })
    if (!res.error) await loadProfile(res.data.session?.user?.id)
    return res
  }
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthCtx.Provider value={{
      session, profile, site,
      loading, profileLoading,
      signIn, signInWithPin, signOut,
      refreshProfile: () => loadProfile(session?.user?.id),
    }}>
      {children}
    </AuthCtx.Provider>
  )
}
