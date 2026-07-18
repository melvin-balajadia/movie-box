// Sets document.title for the current page (helps browser tabs, history, and
// JS-capable crawlers). Restores the site default when the title is empty
// (e.g. while a detail page is still loading). Note: this is client-side only
// — social/OG link previews need server-side rendering, which a static SPA
// can't do; see the README/notes for that separate step.
import { useEffect } from "react";

const SITE_NAME = "Movie Box";

export const usePageTitle = (title?: string) => {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
    return () => {
      document.title = SITE_NAME;
    };
  }, [title]);
};
