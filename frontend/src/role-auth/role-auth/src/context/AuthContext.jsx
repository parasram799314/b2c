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
    // 1. Check if there's a token in the URL (Session Sharing from Dashboard)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      localStorage.setItem('fb_token', urlToken);
      // Clean URL to keep it pretty
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken(true);
          localStorage.setItem('fb_token', token); // Sync latest token
          const name = firebaseUser.displayName || firebaseUser.email.split('@')[0];
          const res = await axios.post('/api/users/sync', { name }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          firebaseUser.role = res.data.data.role;
          setUser(firebaseUser);
        } else {
          // No Firebase user, but maybe we have a URL/LocalStorage token?
          const storedToken = localStorage.getItem('fb_token');
          if (storedToken) {
            try {
              const res = await axios.get('/api/users/profile', {
                headers: { Authorization: `Bearer ${storedToken}` }
              });
              if (res.data?.success) {
                // Mock user object for the app
                const mockUser = {
                  ...res.data.data,
                  uid: res.data.data.uid,
                  email: res.data.data.email,
                  role: res.data.data.role,
                  getIdToken: async () => storedToken
                };
                setUser(mockUser);
              } else {
                setUser(null);
                localStorage.removeItem('fb_token');
              }
            } catch (err) {
              console.error('Manual token sync failed:', err.message);
              setUser(null);
              localStorage.removeItem('fb_token');
            }
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth sync failed:', err.message);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    localStorage.removeItem('fb_token');
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