// ============================================================
//  AuthContext.jsx  —  Firebase Role-Based Auth
// ============================================================
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../../../firebase/config'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import axios from '../../../../utils/axiosConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [error, setError]         = useState('');
  const [authLoading, setAuthLoading] = useState(true);

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
    setAuthLoading(false)
  }
})
    return () => unsubscribe()
  }, [])

  const logout = () => {
    localStorage.clear();
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, logout, error, setError, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);