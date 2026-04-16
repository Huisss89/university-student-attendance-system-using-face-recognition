import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Dashboard from "./Dashboard";
import StudentRegistration from "./StudentRegistration";
import TakeAttendance from "./TakeAttendance";
import About from "./About"

const cognitoDomain = process.env.REACT_APP_COGNITO_DOMAIN?.replace(/\/$/, "");
const clientId = "43rsa7qcapqblndupegmnk29nq";
const redirectUri = `${window.location.origin}/`;
const logoutRedirectUri = `${window.location.origin}/`;
const tokenEndpoint = cognitoDomain ? `${cognitoDomain}/oauth2/token` : "";
const logoutEndpoint = cognitoDomain ? `${cognitoDomain}/logout` : "";
const STORAGE_KEY = "attendance_auth_session";
const OAUTH_STATE_KEY = "attendance_oauth_state";
const PKCE_VERIFIER_KEY = "attendance_pkce_verifier";

function readSession() {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(OAUTH_STATE_KEY);
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
}

function createRandomString(length = 64) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "").slice(0, length);
}

async function createCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function parseJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function ProtectedRoute({ isAuthenticated, isSigningOut, children }) {
  const location = useLocation();

  if (isSigningOut) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function LecturerLogin({ isBusy, onSignIn }) {
  return (
    <div className="page-shell center-content">
      <section className="hero-card auth-card login-enhanced">
        <div className="login-main">
          <div>
            <h1>Lecturer Sign in</h1>
            <p className="hero-copy">
              Access your class dashboard to take attendance, manage student
              registrations and review session history. Sign in with your
              university identity provider for secure single sign-on.
            </p>

            <div className="feature-list" style={{ marginTop: "1rem" }}>
              <span className="status-pill idle">Dashboard</span>
              <span className="status-pill idle">Attendance</span>
              <span className="status-pill idle">Student Registry</span>
              <span className="status-pill live">SSO Secure</span>
            </div>
          </div>

          <div className="login-illustration" aria-hidden>
            <svg width="100%" height="100%" viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
              <rect x="0" y="0" width="240" height="140" rx="10" fill="#f4faf8" />
              <g transform="translate(12,18)" fill="none" stroke="#cfeee7" strokeWidth="2">
                <rect x="0" y="0" width="100" height="24" rx="6" fill="#e8f6f3" stroke="none" />
                <rect x="0" y="34" width="220" height="12" rx="6" />
                <rect x="0" y="54" width="180" height="12" rx="6" />
                <rect x="0" y="74" width="140" height="12" rx="6" />
              </g>
            </svg>
          </div>
        </div>

        <div className="login-actions" style={{ marginTop: "1.25rem" }}>
          {!cognitoDomain && (
            <div className="alert error-alert">
              Set <code>REACT_APP_COGNITO_DOMAIN</code> to your Cognito Hosted UI
              domain.
            </div>
          )}

          <button
            className="btn btn-primary btn-wide"
            onClick={onSignIn}
            disabled={!cognitoDomain || isBusy}
          >
            {isBusy ? "Redirecting..." : "Continue with Sign In"}
          </button>
        </div>
      </section>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [authSession, setAuthSession] = useState(readSession);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const finishLogin = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const errorDescription = url.searchParams.get("error_description");

      if (error) {
        setAuthError(errorDescription || error);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (!code) {
        return;
      }

      const storedState = window.sessionStorage.getItem(OAUTH_STATE_KEY);
      const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);

      if (!state || !storedState || state !== storedState || !verifier) {
        setAuthError("Login session validation failed. Please try signing in again.");
        clearSession();
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Consume the one-time authorization code immediately so React StrictMode
      // or any rerender cannot trigger a second token exchange with the same code.
      window.history.replaceState({}, document.title, window.location.pathname);

      setIsLoading(true);
      setAuthError("");

      try {
        const response = await fetch(tokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            code,
            redirect_uri: redirectUri,
            code_verifier: verifier,
          }).toString(),
        });

        if (!response.ok) {
          let message = `Token exchange failed (${response.status}).`;

          try {
            const errorBody = await response.json();
            if (errorBody.error_description) {
              message += ` ${errorBody.error_description}`;
            } else if (errorBody.error) {
              message += ` ${errorBody.error}`;
            }
          } catch {
            try {
              const text = await response.text();
              if (text) {
                message += ` ${text}`;
              }
            } catch {
              // Keep the base message when the response body can't be read.
            }
          }

          throw new Error(message);
        }

        const tokenData = await response.json();
        const profile = parseJwt(tokenData.id_token);
        const session = {
          ...tokenData,
          profile,
        };

        writeSession(session);
        setAuthSession(session);
        window.sessionStorage.removeItem(OAUTH_STATE_KEY);
        window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        clearSession();
        setAuthError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    finishLogin();
  }, [navigate]);

  const startFreshLogin = async () => {
    if (!cognitoDomain) {
      return;
    }

    setIsLoading(true);
    setAuthError("");
    clearSession();

    const state = createRandomString(48);
    const verifier = createRandomString(96);
    const challenge = await createCodeChallenge(verifier);

    window.sessionStorage.setItem(OAUTH_STATE_KEY, state);
    window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

    const authorizeUrl = new URL(`${cognitoDomain}/oauth2/authorize`);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "email openid phone profile");
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    authorizeUrl.searchParams.set("code_challenge", challenge);

    window.location.assign(authorizeUrl.toString());
  };

  const signOut = () => {
    setIsSigningOut(true);
    clearSession();
    setAuthSession(null);

    if (logoutEndpoint) {
      const url = new URL(logoutEndpoint);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("logout_uri", logoutRedirectUri);
      window.location.replace(url.toString());
      return;
    }

    window.location.replace("/");
  };

  if (isLoading && !authSession) {
    return (
      <div className="page-shell center-content">
        <div className="hero-card loading-card">
          <div className="loader" />
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">University Student Attendance System</p>
          {/* <h2>Student Attendance</h2> */}
        </div>
        {!authSession && (
          <nav className="menu-bar" aria-label="Primary">
            <Link to="/" className="menu-link">
              Attendance
            </Link>
            <Link to="/login" className="menu-link">
              Lecturer Login
            </Link>
            <Link to="/about" className="menu-link">
              About
            </Link>
          </nav>
        )}
      </header>

      {authError && (
        <div className="page-shell">
          <div className="alert error-alert">{authError}</div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<TakeAttendance />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/login"
          element={
            authSession ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LecturerLogin isBusy={isLoading} onSignIn={startFreshLogin} />
            )
          }
        />
        <Route
          path="/register-student"
          element={
            <ProtectedRoute
              isAuthenticated={Boolean(authSession)}
              isSigningOut={isSigningOut}
            >
              <StudentRegistration
                lecturerId={
                  authSession?.profile?.lecturer_id ??
                  authSession?.profile?.["custom:lecturer_id"] ??
                  ""
                }
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              isAuthenticated={Boolean(authSession)}
              isSigningOut={isSigningOut}
            >
              <Dashboard
                user={authSession?.profile ?? {}}
                lecturerId={
                  authSession?.profile?.lecturer_id ??
                  authSession?.profile?.["custom:lecturer_id"] ??
                  ""
                }
                signOut={signOut}
              />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
