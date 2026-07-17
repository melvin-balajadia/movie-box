// Floating button that appears once the page has scrolled a bit and jumps
// back to the top — the details page in particular can get long.
import { useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <LuArrowUp aria-hidden="true" />
    </button>
  );
};

export default BackToTop;
