import { createContext, useContext, useState, useCallback } from 'react';

/* ─────────────────────────────────────────────────────
   AuthContext
   Stores everything from the login API response:
   - accessToken  → sent in every API request
   - userId, username, fullName
   - roleName     → drives role-based navigation
   - branchId, branchName
   - terminalId, deviceType
───────────────────────────────────────────────────── */
const AuthContext = createContext(null);

const SESSION_KEY = 'od-session';

/* Load saved session from localStorage */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadSession());

  /* Called after successful login */
  const saveSession = useCallback((data) => {
    const s = {
      accessToken: data.accessToken,
      tokenType:   data.tokenType,
      userId:      data.userId,
      username:    data.username,
      fullName:    data.fullName,
      roleName:    data.roleName,
      branchId:    data.branchId,
      branchName:  data.branchName,
      terminalId:  data.terminalId,
      deviceType:  data.deviceType,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    /* Also store token separately for apiClient interceptor */
    localStorage.setItem('od-token', data.accessToken);
    setSession(s);
  }, []);

  /* Called on logout */
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('od-token');
    setSession(null);
  }, []);

  const isAuthenticated = !!session?.accessToken;

  return (
    <AuthContext.Provider value={{
      session,
      isAuthenticated,
      saveSession,
      clearSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
