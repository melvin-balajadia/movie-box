// Site-wide sticky header: branded logo lockup, watchlist/ratings links, and
// sign-in/account controls.
import { Link } from "react-router-dom";
import { LuBookmark, LuStar, LuLogOut, LuClapperboard } from "react-icons/lu";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

const SiteNav = () => {
  const { user, authLoading, signOut, openAuthModal } = useAuth();

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link to="/" className="site-logo" aria-label="Movie Box — home">
          <span className="logo-mark">
            <LuClapperboard aria-hidden="true" />
          </span>
          <span className="logo-word">
            Movie<span className="logo-accent">Box</span>
          </span>
        </Link>

        <div className="site-nav-actions">
        <Link to="/ratings" className="watchlist-link" aria-label="Ratings">
          <LuStar aria-hidden="true" />
          <span className="nav-label">Ratings</span>
        </Link>

        <Link
          to="/watchlist"
          className="watchlist-link"
          aria-label="Watchlist"
        >
          <LuBookmark aria-hidden="true" />
          <span className="nav-label">Watchlist</span>
        </Link>

        <ThemeToggle />

        {!authLoading && (
          <>
            {user ? (
              <>
                <Link to="/profile" className="nav-user" title="Profile">
                  <span className="nav-avatar">
                    {(
                      (user.user_metadata?.full_name as string) ||
                      user.email ||
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                  <span className="nav-email">{user.email}</span>
                </Link>
                <button
                  type="button"
                  className="theme-toggle"
                  onClick={signOut}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LuLogOut aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="nav-signin"
                onClick={openAuthModal}
              >
                Sign In
              </button>
            )}
          </>
        )}
        </div>
      </nav>
    </header>
  );
};

export default SiteNav;
