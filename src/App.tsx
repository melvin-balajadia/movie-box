// Route shell: site nav (present on every page), plus lazy-loaded page routes.
// Pages are code-split with React.lazy so the initial bundle stays small and
// each route's JS loads on demand (Spinner shown while a chunk loads).
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import SiteNav from "./components/SiteNav";
import BackToTop from "./components/BackToTop";
import AuthModal from "./components/AuthModal";
import Spinner from "./components/Spinner";

const Home = lazy(() => import("./pages/Home"));
const MovieDetails = lazy(() => import("./pages/MovieDetails"));
const TvDetails = lazy(() => import("./pages/TvDetails"));
const PersonDetails = lazy(() => import("./pages/PersonDetails"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Ratings = lazy(() => import("./pages/Ratings"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <>
      <SiteNav />
      <AuthModal />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/tv/:id" element={<TvDetails />} />
          <Route path="/person/:id" element={<PersonDetails />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <BackToTop />
    </>
  );
}

export default App;
