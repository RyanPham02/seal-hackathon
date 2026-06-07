using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Repositories.Implementations;
using SEAL.NET.Repositories.Interfaces;
using SEAL.NET.Services.Implementations;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Refuse to start in Production with a missing, too-short, or placeholder JWT signing key.
// A weak/known key would let anyone forge authentication tokens. Development is left
// untouched so the local placeholder key continues to work.
var jwtKey = builder.Configuration["Jwt:Key"];
if (builder.Environment.IsProduction() &&
    (string.IsNullOrWhiteSpace(jwtKey) ||
     jwtKey.Length < 32 ||
     jwtKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase)))
{
    throw new InvalidOperationException(
        "Jwt:Key is missing, shorter than 32 characters, or still set to the default placeholder. " +
        "Configure a secure Jwt:Key via user secrets or environment variables before running in Production.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));


builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    // Make the brute-force lockout policy explicit. AuthController already drives lockout via
    // IsLockedOutAsync/AccessFailedAsync/ResetAccessFailedCountAsync; this only pins the
    // thresholds (5 failed attempts -> 15 minute lockout) instead of relying on framework defaults.
    options.Lockout.AllowedForNewUsers = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();


builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IScoreRepository, ScoreRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();


builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<IRankingService, RankingService>();
builder.Services.AddScoped<IScoreService, ScoreService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IEmailService, EmailService>();


builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrWhiteSpace(context.Token) &&
                context.Request.Cookies.TryGetValue("seal_token", out var token))
            {
                context.Token = token;
            }

            return Task.CompletedTask;
        },

        // Session invalidation: a valid signature is not enough. On every authenticated
        // request we re-check the user against the store and fail closed if the user is
        // gone, unapproved, or the token's SecurityStamp no longer matches the current one
        // (rotated on role change, reject, or password change). Tokens issued before this
        // feature lack the stamp claim and are also rejected, forcing a one-time re-login.
        OnTokenValidated = async context =>
        {
            var userManager = context.HttpContext.RequestServices
                .GetRequiredService<UserManager<ApplicationUser>>();

            var principal = context.Principal;
            var userId = principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId) || !Guid.TryParse(userId, out _))
            {
                context.Fail("Invalid authentication token.");
                return;
            }

            var user = await userManager.FindByIdAsync(userId);
            if (user == null)
            {
                context.Fail("User no longer exists.");
                return;
            }

            if (!user.IsApproved)
            {
                context.Fail("Account is not approved.");
                return;
            }

            var stampClaimType = userManager.Options.ClaimsIdentity.SecurityStampClaimType;
            var tokenStamp = principal?.FindFirstValue(stampClaimType);
            if (string.IsNullOrWhiteSpace(tokenStamp))
            {
                context.Fail("Session token is missing required security information.");
                return;
            }

            var currentStamp = await userManager.GetSecurityStampAsync(user);
            if (!string.Equals(tokenStamp, currentStamp, StringComparison.Ordinal))
            {
                context.Fail("Session has been invalidated.");
                return;
            }
        }
    };
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        )
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173" }
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Document that authentication is carried by the HttpOnly seal_token cookie set at login,
    // so Swagger UI reflects the real auth scheme. Doc-only; no runtime behavior change.
    options.AddSecurityDefinition("CookieAuth", new OpenApiSecurityScheme
    {
        Name = "seal_token",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Cookie,
        Description = "Authentication uses the HttpOnly seal_token cookie set by POST /api/auth/login. Browser clients do not read or store the token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "CookieAuth"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var traceId = System.Diagnostics.Activity.Current?.Id ?? context.TraceIdentifier;

        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger("UnhandledException");
        logger.LogError(ex, "Unhandled exception while processing {Method} {Path} (traceId: {TraceId})",
            context.Request.Method, context.Request.Path, traceId);

        // If the response has already begun streaming we cannot rewrite it; rethrow so the
        // server terminates the response rather than corrupting it.
        if (context.Response.HasStarted)
            throw;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var env = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var response = new
        {
            message = env.IsDevelopment() ? ex.ToString() : "An unexpected error occurred. Please contact support.",
            traceId = traceId
        };

        await context.Response.WriteAsJsonAsync(response);
    }
});

using (var scope = app.Services.CreateScope())
{
    if (app.Environment.IsDevelopment())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        // await db.Database.MigrateAsync(); // Commented out to prevent conflict with existing database
    }

    await DbSeeder.SeedRolesAndAdminAsync(scope.ServiceProvider);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

// CSRF protection: validate Origin/Referer on unsafe /api methods against the configured
// allowed origins. Runs after CORS (so preflight is already handled) and before auth.
app.UseMiddleware<SEAL.NET.Middleware.CsrfOriginValidationMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Lightweight liveness/readiness probe. Reports DB connectivity only; no sensitive data exposed.
app.MapGet("/health", async (ApplicationDbContext dbContext, ILoggerFactory loggerFactory) =>
{
    var logger = loggerFactory.CreateLogger("HealthCheck");
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return canConnect
            ? Results.Ok(new { status = "Healthy", database = "Healthy" })
            : Results.Json(new { status = "Unhealthy", database = "Unhealthy" },
                statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Health check failed.");
        return Results.Json(new { status = "Unhealthy", database = "Unhealthy" },
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
}).AllowAnonymous();

app.MapControllers();

app.Run();
