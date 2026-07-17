// Shared site footer: required TMDB attribution plus a short credit line.
const Footer = () => {
  return (
    <footer>
      <p>
        This product uses the{" "}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          TMDB API
        </a>{" "}
        but is not endorsed or certified by TMDB.
      </p>
      <p className="mt-1">Built with React, Tailwind CSS &amp; Supabase.</p>
    </footer>
  );
};

export default Footer;
