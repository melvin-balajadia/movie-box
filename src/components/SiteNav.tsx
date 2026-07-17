// Site-wide top bar shown on every page: wordmark, watchlist link, and
// sign-in/account controls.
import { Link } from "react-router-dom";
import { LuBookmark, LuStar, LuLogOut } from "react-icons/lu";
import { useAuth } from "./AuthProvider";

const SiteNav = () => {
  const { user, authLoading, signOut, openAuthModal } = useAuth();

  return (
    <nav className="site-nav">
      <Link to="/" className="site-logo">
        Movie Box
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

        {!authLoading && (
          <>
            {user ? (
              <button
                type="button"
                className="nav-user"
                onClick={signOut}
                title="Sign out"
              >
                <span className="nav-email">{user.email}</span>
                <LuLogOut aria-hidden="true" />
              </button>
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
  );
};

export default SiteNav;
