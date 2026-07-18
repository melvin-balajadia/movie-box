// Cast member page: photo, bio, and a filmography grid built from their
// movie credits (reuses MovieCard, same as the details page's grids).
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { LuArrowLeft, LuCake, LuMapPin } from "react-icons/lu";
import PersonSkeleton from "../components/PersonSkeleton";
import MovieCard from "../components/MovieCard";
import Footer from "../components/Footer";
import { API_BASE_URL, API_OPTIONS, Person, PersonMovieCredit } from "../utilities/utils";
import { usePageTitle } from "../utilities/usePageTitle";

function PersonDetails() {
  const { id } = useParams<{ id: string }>();

  const [person, setPerson] = useState<Person | null>(null);
  const [credits, setCredits] = useState<PersonMovieCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  usePageTitle(person?.name);

  useEffect(() => {
    const fetchPerson = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const [personResponse, creditsResponse] = await Promise.all([
          axios.get<Person>(`${API_BASE_URL}/person/${id}`, API_OPTIONS),
          axios.get(`${API_BASE_URL}/person/${id}/movie_credits`, API_OPTIONS),
        ]);

        setPerson(personResponse.data);

        // Prolific actors can have 100+ credits (including tiny/uncredited
        // roles) — rank by popularity so the most recognizable films surface
        // first, and cap the list so the page stays a reasonable length.
        const cast: PersonMovieCredit[] = creditsResponse.data.cast || [];
        const ranked = [...cast]
          .filter((credit) => credit.poster_path)
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 18);
        setCredits(ranked);
      } catch (error) {
        console.log(error);
        setErrorMessage(
          "Something went wrong while fetching this person. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

  return (
    <main>
      <div className="wrapper">
        <Link to="/" className="back-link">
          <LuArrowLeft aria-hidden="true" />
          Back to search
        </Link>

        {loading && <PersonSkeleton />}

        {!loading && errorMessage && (
          <div className="state-message">
            <p className="text-red-600 font-semibold">{errorMessage}</p>
          </div>
        )}

        {!loading && !errorMessage && person && (
          <>
            <section className="person-hero">
              <img
                className="person-photo"
                src={
                  person.profile_path
                    ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
                    : "/no-movie.png"
                }
                alt={person.name}
              />
              <div>
                <h1 className="page-heading">{person.name}</h1>
                <p className="text-ink-soft">
                  {person.known_for_department}
                </p>

                <div className="meta-row">
                  {person.birthday && (
                    <span className="flex items-center gap-1">
                      <LuCake aria-hidden="true" />
                      {person.birthday}
                    </span>
                  )}
                  {person.place_of_birth && (
                    <span className="flex items-center gap-1">
                      <LuMapPin aria-hidden="true" />
                      {person.place_of_birth}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="details-body">
              {person.biography && (
                <>
                  <h2>Biography</h2>
                  <p className="overview-text">{person.biography}</p>
                </>
              )}

              {credits.length > 0 && (
                <>
                  <h2>Filmography</h2>
                  <ul className="more-like-this">
                    {credits.map((credit) => (
                      <MovieCard key={credit.id} movie={credit} />
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        )}

        <Footer />
      </div>
    </main>
  );
}

export default PersonDetails;
