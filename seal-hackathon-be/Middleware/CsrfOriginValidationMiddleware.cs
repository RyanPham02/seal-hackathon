namespace SEAL.NET.Middleware
{
    /// <summary>
    /// CSRF defense for cookie-authenticated API requests using Origin/Referer validation.
    ///
    /// For unsafe HTTP methods (POST, PUT, PATCH, DELETE) targeting "/api" paths, the request's
    /// Origin header (or, when absent, the Referer header) must exactly match one of the origins
    /// configured under "Cors:AllowedOrigins". Matching is done on scheme + host + port only —
    /// no substring matching and no hardcoded domains.
    ///
    /// Safe methods (GET/HEAD/OPTIONS), CORS preflight, and non-/api paths are passed through
    /// untouched, so existing CORS behavior and the HttpOnly JWT cookie auth flow are unchanged.
    /// </summary>
    public class CsrfOriginValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly HashSet<string> _allowedOrigins;

        public CsrfOriginValidationMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;

            var configured = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? Array.Empty<string>();

            _allowedOrigins = new HashSet<string>(StringComparer.Ordinal);
            foreach (var origin in configured)
            {
                var normalized = NormalizeOrigin(origin);
                if (normalized != null)
                    _allowedOrigins.Add(normalized);
            }
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (RequiresOriginCheck(context.Request) && !IsTrustedOrigin(context.Request))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "Invalid request origin." });
                return;
            }

            await _next(context);
        }

        // Only unsafe methods on /api paths are validated. GET/HEAD/OPTIONS (including CORS
        // preflight) and any non-/api path are exempt.
        private static bool RequiresOriginCheck(HttpRequest request)
        {
            if (!request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
                return false;

            var method = request.Method;
            return HttpMethods.IsPost(method)
                || HttpMethods.IsPut(method)
                || HttpMethods.IsPatch(method)
                || HttpMethods.IsDelete(method);
        }

        // Prefer the Origin header; fall back to Referer. A missing/invalid/unmatched value
        // on an unsafe /api request is treated as untrusted.
        private bool IsTrustedOrigin(HttpRequest request)
        {
            if (request.Headers.TryGetValue("Origin", out var originValues))
            {
                var origin = originValues.ToString();
                if (!string.IsNullOrWhiteSpace(origin))
                {
                    var normalized = NormalizeOrigin(origin);
                    return normalized != null && _allowedOrigins.Contains(normalized);
                }
            }

            if (request.Headers.TryGetValue("Referer", out var refererValues))
            {
                var referer = refererValues.ToString();
                if (!string.IsNullOrWhiteSpace(referer))
                {
                    var normalized = NormalizeOrigin(referer);
                    return normalized != null && _allowedOrigins.Contains(normalized);
                }
            }

            return false;
        }

        // Reduces an absolute http(s) URL or origin to a canonical "scheme://host:port" string
        // (always including the explicit or default port) so comparison is by scheme + host + port.
        private static string? NormalizeOrigin(string value)
        {
            if (!Uri.TryCreate(value, UriKind.Absolute, out var uri))
                return null;

            if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
                return null;

            return $"{uri.Scheme.ToLowerInvariant()}://{uri.Host.ToLowerInvariant()}:{uri.Port}";
        }
    }
}
