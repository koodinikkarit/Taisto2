import React from "react";
import { useLocation } from "react-router-dom";

export const AuthContext = React.createContext({ required: false, authenticated: true, role: "anonymous", username: "" });

const isPromodePath = pathname => pathname === "/promode" || pathname.startsWith("/promode/");
const isSettingsPath = pathname => pathname === "/settings" || pathname.startsWith("/settings/");

export const useAuth = () => React.useContext(AuthContext);

export default function ProtectedApp({ children }) {
  const location = useLocation();
  const protectedPath = isPromodePath(location.pathname) || isSettingsPath(location.pathname);
  const [authorization, setAuthorization] = React.useState({ path: "", status: null });

  React.useEffect(() => {
    let active = true;
    let expirationTimer;
    const next = `${location.pathname}${location.search}${location.hash}`;
    const redirectToLogin = () => window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    const checkAuthorization = () => fetch("/auth/status", { credentials: "same-origin", cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Authentication check failed")))
      .then(status => {
        if (!active) return;
        if (protectedPath && status.required && !status.authenticated) return redirectToLogin();
        if (isSettingsPath(location.pathname) && status.required && status.role !== "admin") return window.location.replace("/");
        setAuthorization({ path: location.pathname, status });
        clearTimeout(expirationTimer);
        if (status.expiresAt) expirationTimer = setTimeout(redirectToLogin, Math.max(0, status.expiresAt - Date.now()));
      })
      .catch(() => { if (active && protectedPath) redirectToLogin(); });

    checkAuthorization();
    const statusTimer = setInterval(checkAuthorization, 60000);
    return () => {
      active = false;
      clearInterval(statusTimer);
      clearTimeout(expirationTimer);
    };
  }, [location.pathname, location.search, location.hash, protectedPath]);

  if (protectedPath && (authorization.path !== location.pathname || !authorization.status)) {
    return <div className="taisto-auth-check" role="status" aria-live="polite">
      <span className="taisto-auth-spinner" aria-hidden="true" />
      <span>Tarkistetaan kirjautumista...</span>
    </div>;
  }

  return <AuthContext.Provider value={authorization.status || { required: false, authenticated: true, role: "anonymous", username: "" }}>
    {children}
  </AuthContext.Provider>;
}
