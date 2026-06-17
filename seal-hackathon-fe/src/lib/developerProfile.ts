// Options for the developer profile section. Keep these in sync with the
// backend (Helpers/DeveloperProfileOptions.cs and Models/Enums/DeveloperRole.cs).
// To offer a new technology, add it here and to the backend allow-list.

export const DEVELOPER_ROLES = ["Backend", "Frontend", "Fullstack"] as const;

export type DeveloperRole = (typeof DEVELOPER_ROLES)[number];

export const PROGRAMMING_LANGUAGES = [
  "C#",
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "PHP",
  "Go",
  "C++",
  "SQL",
  "HTML",
  "CSS",
  "React",
  "Next.js",
  "ASP.NET Core",
  "Node.js",
] as const;
