import React from "react";
import { useLocation } from "react-router-dom";

const isProtectedPath = pathname => pathname === "/promode"
  || pathname.startsWith("/promode/")
  || pathname === "/settings"
  || pathname.startsWith("/settings/");

export default function ProtectedApp({ children }) {
  const location = useLocation();
  const protectedPath = isProtectedPath(location.pathname);
  const [authorization, setAuthorization] = React.useState({ path: "", authenticated: false });

  React.useEffect(() => {
    if (!protectedPath) return undefined;

    let active = true;
    let expirationTimer;
    const next = `${location.pathname}${location.search}${location.hash}`;
    const redirectToLogin = () => window.location.replace(`/login?next=${encodeURIComponent(next)}`);
    const checkAuthorization = () => fetch("/auth/status", { credentials: "same-origin", cache: "no-store" })
        .then(response => response.ok ? response.json() : Promise.reject(new Error("Authentication check failed")))
        .then(status => {
          if (!active) return;
          if (!status.authenticated) return redirectToLogin();
          setAuthorization({ path: location.pathname, authenticated: true });
          clearTimeout(expirationTimer);
          if (status.expiresAt) expirationTimer = setTimeout(redirectToLogin, Math.max(0, status.expiresAt - Date.now()));
        })
        .catch(() => { if (active) redirectToLogin(); });

    checkAuthorization();
    const statusTimer = setInterval(checkAuthorization, 60000);

    return () => {
      active = false;
      clearInterval(statusTimer);
      clearTimeout(expirationTimer);
    };
  }, [location.pathname, location.search, location.hash, protectedPath]);

  if (protectedPath && (authorization.path !== location.pathname || !authorization.authenticated)) {
    return <div className="taisto-auth-check" role="status" aria-live="polite">
      <span className="taisto-auth-spinner" aria-hidden="true" />
      <span>Tarkistetaan kirjautumista...</span>
    </div>;
  }

  return children;
}
