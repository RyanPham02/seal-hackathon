using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SEAL.NET.DTOs.Auth;
using SEAL.NET.Helpers;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SEAL.NET.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private const string AuthCookieName = "seal_token";
        private const string PasswordResetLoginProvider = "PasswordReset";
        private const string PasswordResetOtpTokenName = "OtpHash";
        private const string PasswordResetOtpExpiryName = "OtpExpiresAt";

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IConfiguration configuration,
            IEmailService emailService,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult> RegisterAsync(RegisterRequest model)
        {
            if (!Enum.TryParse<DeveloperRole>(model.DeveloperRole.Trim(), ignoreCase: true, out var developerRole)
                || !Enum.IsDefined(typeof(DeveloperRole), developerRole))
            {
                return ServiceResult.BadRequest("DeveloperRole must be one of: Backend, Frontend, Fullstack.");
            }

            if (!DeveloperProfileOptions.TryNormalizeLanguages(
                    model.ProgrammingLanguages,
                    out var languagesCsv,
                    out var languagesError))
            {
                return ServiceResult.BadRequestBody(new { message = languagesError });
            }

            if (string.IsNullOrWhiteSpace(languagesCsv))
                return ServiceResult.BadRequest("Select at least one programming language or technology.");

            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return ServiceResult.BadRequest("Email is already used.");

            if (!string.IsNullOrWhiteSpace(model.StudentCode))
            {
                var studentCode = model.StudentCode.Trim();

                var duplicateStudentCode = await _userManager.Users.AnyAsync(u =>
                    u.StudentCode != null &&
                    u.StudentCode.ToLower() == studentCode.ToLower());

                if (duplicateStudentCode)
                    return ServiceResult.BadRequest("Student code is already used.");
            }

            if (model.StudentType == StudentType.External &&
                string.IsNullOrWhiteSpace(model.SchoolName))
            {
                return ServiceResult.BadRequest("School name is required for external students.");
            }

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                StudentType = model.StudentType,
                StudentCode = string.IsNullOrWhiteSpace(model.StudentCode) ? null : model.StudentCode.Trim(),
                SchoolName = model.SchoolName,
                PhoneNumber = model.PhoneNumber.Trim(),
                DeveloperRole = developerRole,
                ProgrammingLanguages = languagesCsv,
                IsApproved = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            if (!await _roleManager.RoleExistsAsync("Member"))
                await _roleManager.CreateAsync(new IdentityRole<Guid>("Member"));

            await _userManager.AddToRoleAsync(user, "Member");

            return ServiceResult.OkMessage("Created account successfully. You can sign in now.");
        }

        public async Task<ServiceResult> LoginAsync(LoginRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return ServiceResult.Unauthorized("Email or password is incorrect.");

            if (await _userManager.IsLockedOutAsync(user))
                return ServiceResult.Unauthorized("Your account is temporarily locked due to too many failed attempts. Please try again later.");

            if (!await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await _userManager.AccessFailedAsync(user);
                return ServiceResult.Unauthorized("Email or password is incorrect.");
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            if (!user.IsApproved)
                return ServiceResult.Unauthorized("Your account is disabled or not allowed to access.");

            var (token, userRoles) = await IssueAuthCookieAsync(user);

            return ServiceResult.Ok(new
            {
                expiration = token.ValidTo,
                user = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    roles = userRoles
                }
            });
        }

        public ServiceResult Logout()
        {
            Response.Cookies.Delete(AuthCookieName, new CookieOptions
            {
                Secure = true,
                SameSite = GetCookieSameSite(),
                Path = "/"
            });

            return ServiceResult.OkMessage("Logged out successfully.");
        }

        public async Task<ServiceResult> GetMeAsync(string? userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return ServiceResult.Unauthorized("Invalid authentication token.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return ServiceResult.Unauthorized("User not found.");

            if (!user.IsApproved)
                return ServiceResult.Unauthorized("Your account is disabled or not allowed to access.");

            var roles = await _userManager.GetRolesAsync(user);

            return ServiceResult.Ok(BuildProfile(user, roles));
        }

        public async Task<ServiceResult> UpdateProfileAsync(string? userId, UpdateProfileRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return ServiceResult.Unauthorized("Invalid authentication token.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return ServiceResult.Unauthorized("User not found.");

            if (!string.IsNullOrWhiteSpace(request.StudentCode) &&
                !string.Equals(user.StudentCode, request.StudentCode, StringComparison.OrdinalIgnoreCase))
            {
                var studentCode = request.StudentCode.Trim();

                var duplicateStudentCode = await _userManager.Users.AnyAsync(u =>
                    u.Id != user.Id &&
                    u.StudentCode != null &&
                    u.StudentCode.ToLower() == studentCode.ToLower());

                if (duplicateStudentCode)
                    return ServiceResult.BadRequest("Student code is already used.");
            }

            // Developer profile (descriptive metadata only — not an auth role).
            DeveloperRole? developerRole = null;
            if (!string.IsNullOrWhiteSpace(request.DeveloperRole))
            {
                if (!Enum.TryParse<DeveloperRole>(request.DeveloperRole.Trim(), ignoreCase: true, out var parsedRole)
                    || !Enum.IsDefined(typeof(DeveloperRole), parsedRole))
                {
                    return ServiceResult.BadRequest("DeveloperRole must be one of: Backend, Frontend, Fullstack.");
                }
                developerRole = parsedRole;
            }

            if (!DeveloperProfileOptions.TryNormalizeLanguages(request.ProgrammingLanguages, out var languagesCsv, out var languagesError))
            {
                return ServiceResult.BadRequestBody(new { message = languagesError });
            }

            user.FullName = request.FullName.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
            user.StudentCode = string.IsNullOrWhiteSpace(request.StudentCode) ? user.StudentCode : request.StudentCode.Trim();
            user.DeveloperRole = developerRole;
            user.ProgrammingLanguages = string.IsNullOrEmpty(languagesCsv) ? null : languagesCsv;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            var roles = await _userManager.GetRolesAsync(user);

            return ServiceResult.Ok(BuildProfile(user, roles));
        }

        public async Task<ServiceResult> ChangePasswordAsync(string? userId, ChangePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return ServiceResult.Unauthorized("Invalid authentication token.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return ServiceResult.Unauthorized("User not found.");

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            // ChangePasswordAsync rotates the SecurityStamp, which invalidates every existing
            // token for this user. Re-issue this browser's auth cookie with the new stamp.
            await IssueAuthCookieAsync(user);

            return ServiceResult.OkMessage("Password changed successfully.");
        }

        public async Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return ServiceResult.Ok(new { message = "If the email exists, an OTP has been sent." });

            var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            var expiresAt = DateTimeOffset.UtcNow.AddMinutes(10);

            await _userManager.SetAuthenticationTokenAsync(
                user,
                PasswordResetLoginProvider,
                PasswordResetOtpTokenName,
                HashOtp(user.Email!, otp));

            await _userManager.SetAuthenticationTokenAsync(
                user,
                PasswordResetLoginProvider,
                PasswordResetOtpExpiryName,
                expiresAt.ToString("O"));

            try
            {
                await _emailService.SendPasswordResetOtpAsync(user.Email!, user.FullName, otp);
            }
            catch (InvalidOperationException ex)
            {
                await ClearPasswordResetOtpAsync(user);
                return ServiceResult.ServerError(ex.Message);
            }
            catch (SmtpException)
            {
                await ClearPasswordResetOtpAsync(user);
                return ServiceResult.ServerError("Could not send OTP email. Please check Gmail SMTP credentials.");
            }

            return ServiceResult.Ok(new { message = "If the email exists, an OTP has been sent." });
        }

        public async Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return ServiceResult.BadRequest("Invalid OTP or email.");

            var savedOtpHash = await _userManager.GetAuthenticationTokenAsync(
                user,
                PasswordResetLoginProvider,
                PasswordResetOtpTokenName);

            var expiryValue = await _userManager.GetAuthenticationTokenAsync(
                user,
                PasswordResetLoginProvider,
                PasswordResetOtpExpiryName);

            if (string.IsNullOrWhiteSpace(savedOtpHash) ||
                string.IsNullOrWhiteSpace(expiryValue) ||
                !DateTimeOffset.TryParse(expiryValue, out var expiresAt) ||
                expiresAt < DateTimeOffset.UtcNow ||
                savedOtpHash != HashOtp(user.Email!, model.Otp))
            {
                return ServiceResult.BadRequest("Invalid or expired OTP.");
            }

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            await ClearPasswordResetOtpAsync(user);

            return ServiceResult.OkMessage("Password reset successfully.");
        }

        private HttpResponse Response =>
            _httpContextAccessor.HttpContext?.Response
            ?? throw new InvalidOperationException("No active HTTP context.");

        private object BuildProfile(ApplicationUser user, IList<string> roles) => new
        {
            id = user.Id,
            fullName = user.FullName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            studentCode = user.StudentCode,
            schoolName = user.SchoolName,
            studentType = user.StudentType == null ? null : user.StudentType.ToString(),
            developerRole = user.DeveloperRole == null ? null : user.DeveloperRole.ToString(),
            programmingLanguages = DeveloperProfileOptions.ParseLanguages(user.ProgrammingLanguages),
            roles
        };

        private async Task<(JwtSecurityToken token, IList<string> roles)> IssueAuthCookieAsync(ApplicationUser user)
        {
            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim("FullName", user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(
                    _userManager.Options.ClaimsIdentity.SecurityStampClaimType,
                    await _userManager.GetSecurityStampAsync(user))
            };

            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = GenerateNewJsonWebToken(authClaims);
            var tokenValue = new JwtSecurityTokenHandler().WriteToken(token);

            Response.Cookies.Append(AuthCookieName, tokenValue, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = GetCookieSameSite(),
                Path = "/",
                Expires = token.ValidTo
            });

            return (token, userRoles);
        }

        private JwtSecurityToken GenerateNewJsonWebToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["Jwt:ExpireDays"])),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return token;
        }

        private SameSiteMode GetCookieSameSite()
        {
            var configured = _configuration["Auth:CookieSameSite"];

            return Enum.TryParse<SameSiteMode>(configured, ignoreCase: true, out var sameSite)
                ? sameSite
                : SameSiteMode.Lax;
        }

        private string HashOtp(string email, string otp)
        {
            var secret = _configuration["Jwt:Key"] ?? string.Empty;
            var input = $"{email.Trim().ToUpperInvariant()}:{otp}:{secret}";
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));

            return Convert.ToHexString(bytes);
        }

        private async Task ClearPasswordResetOtpAsync(ApplicationUser user)
        {
            await _userManager.RemoveAuthenticationTokenAsync(
                user,
                PasswordResetLoginProvider,
                PasswordResetOtpTokenName);

            await _userManager.RemoveAuthenticationTokenAsync(
                user,
                PasswordResetLoginProvider,
                PasswordResetOtpExpiryName);
        }
    }
}
