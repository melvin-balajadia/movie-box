import { RecentlyViewedMovie } from "./utils";

const STORAGE_KEY = "recently-viewed-movies";
const MAX_ENTRIES = 10;

export const getRecentlyViewed = (): RecentlyViewedMovie[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (movie: RecentlyViewedMovie): void => {
  const existing = getRecentlyViewed().filter((m) => m.id !== movie.id);
  const updated = [movie, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
