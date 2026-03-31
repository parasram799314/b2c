// ============================================================
//  AuthContext.jsx  —  Dummy Role-Based Auth
//  Yahan koi real API nahi, sirf hardcoded users hain.
//  Baad mein real login API yahan replace kar dena.
// ============================================================
import { createContext, useContext, useState } from 'react';

// ── Dummy Users ──────────────────────────────────────────────
// Role = 'user'    → normal website dikhegi
// Role = 'manager' → sirf ManagerPage dikhega
const DUMMY_USERS = [
  { email: 'user@travel.com',     password: '1234', role: 'user',    name: 'Rahul Sharma'  },
  { email: 'user2@travel.com',    password: '1234', role: 'user',    name: 'Priya Patel'   },
  { email: 'manager@travel.com',  password: '1234', role: 'manager', name: 'Tushar Jain'   },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);   // null = not logged in
  const [error, setError] = useState('');

  const login = (email, password) => {
    setError('');
    const found = DUMMY_USERS.find(
      u => u.email === email.trim().toLowerCase() && u.password === password
    );
    if (found) { setUser(found); return true; }
    setError('Invalid email or password.');
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shortcut hook
export const useAuth = () => useContext(AuthContext);
