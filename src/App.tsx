// Route shell: site nav (present on every page), the home page, the movie
// details page, the cast member page, the watchlist, and the ratings page.
import { Routes, Route } from "react-router-dom";
import SiteNav from "./components/SiteNav";
import BackToTop from "./components/BackToTop";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import PersonDetails from "./pages/PersonDetails";
import Watchlist from "./pages/Watchlist";
import Ratings from "./pages/Ratings";

function App() {
  return (
    <>
      <SiteNav />
      <AuthModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/person/:id" element={<PersonDetails />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/ratings" element={<Ratings />} />
      </Routes>
      <BackToTop />
    </>
  );
}

export default App;
