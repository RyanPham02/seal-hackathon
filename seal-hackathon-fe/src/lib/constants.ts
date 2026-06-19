// Shared business constants. Keep these in one place — several pages
// (event creation, registration, profiles) previously duplicated them.

export const TRACKS_OPTIONS = [
  "AI & Machine Learning",
  "Web Development",
  "Mobile App",
  "Cybersecurity",
  "Open Innovation",
];

export const MAX_TEAM_MEMBERS = 5;

// Mirrors the backend ASP.NET Identity password policy so users get a
// friendly client-side message instead of raw Identity error strings.
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/;
export const PASSWORD_RULE_MESSAGE =
  "Password must be at least 6 characters and include uppercase, lowercase, number, and special character.";
