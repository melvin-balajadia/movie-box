// Sign-in modal: Google OAuth, or email with a choice of magic link vs
// password (and signup vs signin within the password flow).
import { useState, FormEvent } from "react";
import { LuX } from "react-icons/lu";
import { useAuth } from "./AuthProvider";
import { supabase } from "../utilities/supabase";

type Method = "password" | "magiclink";
type Mode = "signin" | "signup";

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [method, setMethod] = useState<Method>("password");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!isAuthModalOpen) return null;

  const handleGoogle = async () => {
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) setError(error.message);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError("Something went wrong. Check your connection and try again.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (method === "magiclink") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) setError(error.message);
        else setMessage("Check your email for a login link.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError(error.message);
      }
    } catch (err) {
      // Network-level failures (offline, DNS, etc.) reject instead of
      // resolving with an { error }, unlike normal auth errors above.
      console.error("Auth request failed:", err);
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitLabel =
    method === "magiclink"
      ? "Send Magic Link"
      : mode === "signup"
      ? "Create Account"
      : "Sign In";

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close"
        >
          <LuX aria-hidden="true" />
        </button>

        <h2>Sign in to save movies</h2>

        <button type="button" className="google-button" onClick={handleGoogle}>
          Continue with Google
        </button>

        <div className="auth-divider">or</div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {method === "password" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          )}

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button type="submit" className="ticket-button" disabled={loading}>
            {submitLabel}
          </button>
        </form>

        <div className="auth-links">
          {method === "password" ? (
            <>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
              <button type="button" onClick={() => setMethod("magiclink")}>
                Use a magic link instead
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setMethod("password")}>
              Use a password instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
