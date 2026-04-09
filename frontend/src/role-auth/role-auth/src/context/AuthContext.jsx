// ============================================================
//  AuthContext.jsx  —  Firebase Role-Based Auth
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../../../firebase/config'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import axios from 'axios'

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [error, setError]         = useState('');
  const [authLoading, setAuthLoading] = useState(true); // ← YEH ADD KARO

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const token = await result.user.getIdToken()
      const name = result.user.displayName || result.user.email.split('@')[0]
      const res = await axios.post('/api/users/sync', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userWithRole = result.user;
      userWithRole.role = res.data.data.role;
      setUser(userWithRole)
    } catch (err) {
      setError(err.message)
    }
  }

  const register = async (email, password, name) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      const token = await result.user.getIdToken()
      const res = await axios.post('/api/users/sync', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userWithRole = result.user;
      userWithRole.role = res.data.data.role;
      setUser(userWithRole)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
   const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true)
      const name = firebaseUser.displayName || firebaseUser.email.split('@')[0]
      const res = await axios.post('/api/users/sync', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      firebaseUser.role = res.data.data.role;
      setUser(firebaseUser)
    } else {
      setUser(null)
    }
  } catch (err) {
    console.error('Auth sync failed:', err.message)
    setUser(null)
  } finally {
    setAuthLoading(false) // ← finally mein daalo — guaranteed chalega
  }
})
    return () => unsubscribe()
  }, [])

  const logout = () => {
    localStorage.clear(); // Clear all data including tp_profile
    return signOut(auth);
  }

  return (
    // ↓ authLoading ADD KARO value mein
    <AuthContext.Provider value={{ user, login, register, logout, error, setError, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);