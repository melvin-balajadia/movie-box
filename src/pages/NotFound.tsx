// Catch-all page for unknown routes (e.g. a mistyped or dead movie URL) so
// the app shows a clear message instead of a blank screen.
import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import Footer from "../components/Footer";
import { usePageTitle } from "../utilities/usePageTitle";

function NotFound() {
  usePageTitle("Page not found");
  return (
    <main>
      <div className="wrapper">
        <div className="state-message" style={{ minHeight: "50vh" }}>
          <p className="text-5xl font-extrabold text-ink">404</p>
          <p className="font-semibold text-ink">Page not found</p>
          <p className="text-sm">
            The page you're looking for doesn't exist or has moved.
          </p>
          <Link to="/" className="ticket-button mt-2 inline-flex items-center gap-2">
            <LuArrowLeft aria-hidden="true" />
            Back home
          </Link>
        </div>
        <Footer />
      </div>
    </main>
  );
}

export default NotFound;
