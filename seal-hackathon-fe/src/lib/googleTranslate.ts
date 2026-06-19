const LANGUAGE_STORAGE_KEY = "seal_language";
const GOOGLE_TRANSLATE_COOKIE = "googtrans";
const SOURCE_LANGUAGE = "en";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;

  const cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  document.cookie = cookie;

  const host = window.location.hostname;
  if (host.includes(".") && host !== "localhost") {
    document.cookie = `${cookie}; domain=.${host}`;
  }
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;

  const host = window.location.hostname;
  if (host.includes(".") && host !== "localhost") {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; domain=.${host}`;
  }
}

export function getSavedTranslateLanguage() {
  if (typeof window === "undefined") return SOURCE_LANGUAGE;

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved) return saved;

  const cookieValue = getCookie(GOOGLE_TRANSLATE_COOKIE);
  const cookieLanguage = cookieValue?.split("/").filter(Boolean).at(1);

  return cookieLanguage || SOURCE_LANGUAGE;
}

export function persistTranslateLanguage(language: string) {
  if (typeof window === "undefined") return;

  const normalized = language || SOURCE_LANGUAGE;

  if (normalized === SOURCE_LANGUAGE) {
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    clearCookie(GOOGLE_TRANSLATE_COOKIE);
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  writeCookie(GOOGLE_TRANSLATE_COOKIE, `/${SOURCE_LANGUAGE}/${normalized}`, 60 * 60 * 24 * 365);
}

export function changeTranslateLanguage(language: string) {
  if (typeof window === "undefined") return;

  const previous = getSavedTranslateLanguage();
  persistTranslateLanguage(language);

  if (previous !== language) {
    window.location.reload();
  }
}

