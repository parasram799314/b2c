// ============================================================
//  AuthContext.jsx  —  Firebase Role-Based Auth
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../../../firebase/config'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import axios from 'axios'

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [error, setError] = useState('');

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const token = await result.user.getIdToken()
      // ✅ FIX: name variable ab actually use ho raha hai
      const name = result.user.displayName || result.user.email.split('@')[0]
      const res = await axios.post('/api/users/sync', { name }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser({ ...result.user, role: res.data.data.role })
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
      setUser({ ...result.user, role: res.data.data.role })
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        // ✅ FIX: yahan bhi same fallback
        const name = firebaseUser.displayName || firebaseUser.email.split('@')[0]
        const res = await axios.post('/api/users/sync', { name }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUser({ ...firebaseUser, role: res.data.data.role })
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, login, register, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);