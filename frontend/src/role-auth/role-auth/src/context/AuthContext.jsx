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
    // 1. Check if there's a token in the URL (SSO from B2B)
    const currentHref = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    let urlToken = urlParams.get('token');

    // Robust extraction if URLSearchParams fails (e.g. if token is after a hash or malformed)
    if (!urlToken && currentHref.includes('token=')) {
      try {
        urlToken = currentHref.split('token=')[1].split(/[?&]/)[0];
      } catch (e) {
        console.error('[Auth] Token extraction failed:', e);
      }
    }
    
    if (urlToken) {
      console.log('[Auth] New token detected in URL, saving...');
      localStorage.setItem('fb_token', urlToken);
      
      // Clean URL: Remove ONLY the token while keeping the path (e.g. /join/ABC)
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      const cleanUrl = url.pathname + url.search;
      window.history.replaceState({}, document.title, cleanUrl);
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
              // CHANGE: Use /sync (POST) instead of /profile (GET) to handle auto-creation for new SSO users
              const res = await axios.post('/api/users/sync', {}, {
                headers: { Authorization: `Bearer ${storedToken}` }
              });
              if (res.data?.success) {
                console.log('[Auth] Profile synced successfully from stored token');
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
                console.warn('[Auth] Profile sync returned success:false');
                setUser(null);
                localStorage.removeItem('fb_token');
              }
            } catch (err) {
              console.error('[Auth] Manual token sync failed (likely backend unreachable):', err.message);
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