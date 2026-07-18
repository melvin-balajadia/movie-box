// Vercel Edge Middleware — social/OG link previews for a client-rendered SPA.
//
// Crawlers (Facebook, Slack, iMessage, X, Discord, Google, …) don't run the
// app's JavaScript, so client-side <title>/meta never reach them. This runs on
// Vercel's edge for /movie/:id and /tv/:id: for crawler user-agents it fetches
// the title from TMDB server-side and returns minimal HTML with Open Graph
// tags; every real visitor is passed straight through to the SPA untouched.
//
// Requires a server-side env var TMDB_API_KEY in Vercel (the TMDB v4 read
// token) — separate from the client VITE_TMDB_API_KEY so it isn't bundled.
// Cannot be exercised in local dev; verify on a deployment with a link-preview
// debugger (e.g. Facebook Sharing Debugger, or paste a link into Slack).
import { next } from "@vercel/edge";

export const config = {
  matcher: ["/movie/:id", "/tv/:id"],
};

const CRAWLER =
  /(googlebot|bingbot|yandex|duckduckbot|baiduspider|applebot|facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|telegrambot|whatsapp|discordbot|linkedinbot|pinterest|redditbot|embedly|quora link preview|skypeuripreview|nuzzel|bitlybot|vkshare|w3c_validator)/i;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";

  // Real users get the normal SPA; only crawlers get the pre-rendered tags.
  if (!CRAWLER.test(userAgent)) return next();

  const key = process.env.TMDB_API_KEY;
  if (!key) return next();

  const url = new URL(request.url);
  const [, mediaType, id] = url.pathname.split("/"); // "", "movie"|"tv", ":id"
  if ((mediaType !== "movie" && mediaType !== "tv") || !id) return next();

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}`, {
      headers: { Authorization: `Bearer ${key}`, accept: "application/json" },
    });
    if (!res.ok) return next();
    const data = await res.json();

    const rawTitle = data.title || data.name || "Movie Box";
    const year = (data.release_date || data.first_air_date || "").split("-")[0];
    const title = escapeHtml(year ? `${rawTitle} (${year})` : rawTitle);
    const description = escapeHtml(
      (data.overview || "Discover movies and TV shows on Movie Box.").slice(0, 300)
    );
    const image = data.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
      : data.poster_path
      ? `https://image.tmdb.org/t/p/w780${data.poster_path}`
      : "";

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title} · Movie Box</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="video.${mediaType === "tv" ? "tv_show" : "movie"}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    ${image ? `<meta property="og:image" content="${image}" />` : ""}
    <meta property="og:url" content="${escapeHtml(url.href)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${image ? `<meta name="twitter:image" content="${image}" />` : ""}
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
    <a href="${escapeHtml(url.href)}">View on Movie Box</a>
  </body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return next();
  }
}
