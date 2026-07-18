// Light/dark theme toggle. The initial theme is set before paint by the
// inline script in index.html (data-theme on <html>); this button reads that
// and flips it, persisting the choice to localStorage.
import { useState } from "react";
import { LuSun, LuMoon } from "react-icons/lu";

type Theme = "light" | "dark";

const getCurrentTheme = (): Theme =>
  (document.documentElement.getAttribute("data-theme") as Theme) || "light";

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(getCurrentTheme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <LuSun aria-hidden="true" />
      ) : (
        <LuMoon aria-hidden="true" />
      )}
    </button>
  );
};

export default ThemeToggle;
