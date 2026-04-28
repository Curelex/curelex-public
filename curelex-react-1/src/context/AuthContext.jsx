// import { createContext, useContext, useState } from 'react'

// const AuthContext = createContext(null)

// export function AuthProvider({ children }) {
//   const [currentUser, setCurrentUser] = useState(() => {
//     const stored = localStorage.getItem('curelex-current-user')
//     return stored ? JSON.parse(stored) : null
//   })
//   const [token, setToken] = useState(() => localStorage.getItem('token') || null)

//   const login = (user, tok) => {
//     localStorage.setItem('curelex-current-user', JSON.stringify(user))
//     localStorage.setItem('token', tok)
//     setCurrentUser(user)
//     setToken(tok)
//   }

//   const logout = () => {
//     localStorage.removeItem('curelex-current-user')
//     localStorage.removeItem('token')
//     setCurrentUser(null)
//     setToken(null)
//   }

//   return (
//     <AuthContext.Provider value={{ currentUser, token, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export const useAuth = () => useContext(AuthContext)

import { createContext, useContext, useState } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('curelex-current-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user-role') || null);

  const login = (user, tok, role) => {
    localStorage.setItem('curelex-current-user', JSON.stringify(user));
    localStorage.setItem('token', tok);
    localStorage.setItem('user-role', role);
    apiClient.setToken(tok);
    setCurrentUser(user);
    setToken(tok);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('curelex-current-user')
    // Clear doctor-specific data so next login doesn't see stale profile
    localStorage.removeItem('doctor-data')
    localStorage.removeItem('doctor-profile-complete')
    localStorage.removeItem('doctor-approved')
    localStorage.removeItem('doctor-is-active')
    setCurrentUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, token, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);