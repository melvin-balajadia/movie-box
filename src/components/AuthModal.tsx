// Sign-in modal: Google OAuth, or email with a choice of magic link vs
// password (and signup vs signin within the password flow).
import { useState, useEffect, useRef, FormEvent } from "react";
import { LuX, LuClapperboard } from "react-icons/lu";
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
  const modalRef = useRef<HTMLDivElement>(null);

  // While open: Escape closes, Tab is trapped inside the modal, focus moves
  // into it, and returns to the trigger on close. (Basic modal a11y.)
  useEffect(() => {
    if (!isAuthModalOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => !el.hasAttribute("disabled"));

    getFocusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAuthModal();
        return;
      }
      if (event.key !== "Tab") return;
      const els = getFocusable();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isAuthModalOpen, closeAuthModal]);

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
        ref={modalRef}
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
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

        <div className="auth-brand">
          <span className="logo-mark">
            <LuClapperboard aria-hidden="true" />
          </span>
          <span className="logo-word">
            Movie<span className="logo-accent">Box</span>
          </span>
        </div>

        <h2>Sign in to save movies</h2>
        <p className="auth-subtitle">
          Save titles to your watchlist and rate what you've seen.
        </p>

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
