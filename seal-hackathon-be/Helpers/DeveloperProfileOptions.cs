namespace SEAL.NET.Helpers
{
    /// <summary>
    /// Canonical list of selectable programming languages / technologies for the
    /// developer profile, plus helpers to parse the stored value and to validate
    /// and normalize an incoming selection.
    ///
    /// Programming languages are persisted on the user as a simple comma-separated
    /// string (matching the project's existing scalar-field convention), so no
    /// extra table is required. To offer a new option, just add it to
    /// <see cref="AllowedLanguages"/>.
    /// </summary>
    public static class DeveloperProfileOptions
    {
        public static readonly IReadOnlyList<string> AllowedLanguages = new[]
        {
            "C#", "Java", "JavaScript", "TypeScript", "Python", "PHP", "Go",
            "C++", "SQL", "HTML", "CSS", "React", "Next.js", "ASP.NET Core", "Node.js"
        };

        // Lookup from a case-insensitive key to the canonical display value.
        private static readonly Dictionary<string, string> CanonicalByKey =
            AllowedLanguages.ToDictionary(l => l.ToLowerInvariant(), l => l);

        /// <summary>Splits the stored comma-separated value back into a list.</summary>
        public static List<string> ParseLanguages(string? stored)
        {
            if (string.IsNullOrWhiteSpace(stored))
                return new List<string>();

            return stored
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();
        }

        /// <summary>
        /// Validates an incoming list of languages and normalizes it to canonical
        /// casing. Rejects values that are not in <see cref="AllowedLanguages"/> and
        /// rejects duplicates (case-insensitive). Produces the comma-separated string
        /// to persist. A null/empty input is valid and yields an empty result.
        /// </summary>
        public static bool TryNormalizeLanguages(
            IEnumerable<string>? input,
            out string csv,
            out string? error)
        {
            csv = string.Empty;
            error = null;

            if (input == null)
                return true;

            var normalized = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var raw in input)
            {
                var value = raw?.Trim() ?? string.Empty;
                if (value.Length == 0)
                    continue;

                if (!CanonicalByKey.TryGetValue(value.ToLowerInvariant(), out var canonical))
                {
                    error = $"Unsupported programming language: '{raw}'.";
                    return false;
                }

                if (!seen.Add(canonical))
                {
                    error = $"Duplicate programming language: '{canonical}'.";
                    return false;
                }

                normalized.Add(canonical);
            }

            csv = string.Join(",", normalized);
            return true;
        }
    }
}
