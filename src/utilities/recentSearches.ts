// Recent search terms, kept in localStorage so the search box can suggest
// them when focused and empty.
const STORAGE_KEY = "recent-searches";
const MAX = 6;

export const getRecentSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addRecentSearch = (term: string): string[] => {
  const trimmed = term.trim();
  if (!trimmed) return getRecentSearches();
  // Case-insensitive dedupe, newest first, capped.
  const existing = getRecentSearches().filter(
    (t) => t.toLowerCase() !== trimmed.toLowerCase()
  );
  const updated = [trimmed, ...existing].slice(0, MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
