using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SEAL.NET.DTOs.Auth;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private const string AuthCookieName = "seal_token";
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        private const string PasswordResetLoginProvider = "PasswordReset";
        private const string PasswordResetOtpTokenName = "OtpHash";
        private const string PasswordResetOtpExpiryName = "OtpExpiresAt";

        public AuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return BadRequest(new { message = "Email is already used." });

            if (!string.IsNullOrWhiteSpace(model.StudentCode))
            {
                var studentCode = model.StudentCode.Trim();
                var duplicateStudentCode = await _userManager.Users.AnyAsync(u =>
                    u.StudentCode != null &&
                    u.StudentCode.ToLower() == studentCode.ToLower());

                if (duplicateStudentCode)
                    return BadRequest(new { message = "Student code is already used." });
            }

            if (model.StudentType == StudentType.External &&
            string.IsNullOrWhiteSpace(model.SchoolName))
            {
                return BadRequest(new
                {
                    message = "School name is required for external students."
                });
            }

            var user = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                FullName = model.FullName,
                StudentType = model.StudentType,
                StudentCode = string.IsNullOrWhiteSpace(model.StudentCode) ? null : model.StudentCode.Trim(),
                SchoolName = model.SchoolName,
                IsApproved = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            if (!await _roleManager.RoleExistsAsync("Member"))
                await _roleManager.CreateAsync(new IdentityRole<Guid>("Member"));

            await _userManager.AddToRoleAsync(user, "Member");

            return Ok(new { message = "Created account successfully. You can sign in now." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return Unauthorized(new { message = "Email or password is incorrect." });

            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized(new { message = "Your account is temporarily locked due to too many failed attempts. Please try again later." });

            if (!await _userManager.CheckPasswordAsync(user, model.Password))
            {
                await _userManager.AccessFailedAsync(user);
                return Unauthorized(new { message = "Email or password is incorrect." });
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            if (!user.IsApproved)
                return Unauthorized(new { message = "Your account is disabled or not allowed to access." });

            var (token, userRoles) = await IssueAuthCookieAsync(user);

            return Ok(new
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

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete(AuthCookieName, new CookieOptions
            {
                Secure = true,
                SameSite = GetCookieSameSite(),
                Path = "/"
            });

            return Ok(new { message = "Logged out successfully." });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Invalid authentication token." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            if (!user.IsApproved)
                return Unauthorized(new { message = "Your account is disabled or not allowed to access." });

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                studentCode = user.StudentCode,
                schoolName = user.SchoolName,
                studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                roles
            });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Invalid authentication token." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            if (!string.IsNullOrWhiteSpace(request.StudentCode) &&
                !string.Equals(user.StudentCode, request.StudentCode, StringComparison.OrdinalIgnoreCase))
            {
                var duplicateStudentCode = _userManager.Users.Any(u =>
                    u.Id != user.Id &&
                    u.StudentCode != null &&
                    u.StudentCode.ToLower() == request.StudentCode.ToLower());

                if (duplicateStudentCode)
                    return BadRequest(new { message = "Student code is already used." });
            }

            user.FullName = request.FullName.Trim();
            user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
            user.StudentCode = string.IsNullOrWhiteSpace(request.StudentCode) ? user.StudentCode : request.StudentCode.Trim();

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                studentCode = user.StudentCode,
                schoolName = user.SchoolName,
                studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                roles
            });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "Invalid authentication token." });

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found." });

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            // ChangePasswordAsync rotates the SecurityStamp, which invalidates every existing
            // token for this user. Re-issue this browser's auth cookie (with the new stamp) so
            // the current session stays usable; the user's other sessions are now invalidated.
            await IssueAuthCookieAsync(user);

            return Ok(new { message = "Password changed successfully." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return Ok(new { message = "If the email exists, an OTP has been sent." });

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
                return StatusCode(500, new { message = ex.Message });
            }
            catch (SmtpException)
            {
                await ClearPasswordResetOtpAsync(user);
                return StatusCode(500, new { message = "Could not send OTP email. Please check Gmail SMTP credentials." });
            }

            return Ok(new { message = "If the email exists, an OTP has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return BadRequest(new { message = "Invalid OTP or email." });

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
                return BadRequest(new { message = "Invalid or expired OTP." });
            }

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await ClearPasswordResetOtpAsync(user);

            return Ok(new { message = "Password reset successfully." });
        }

        // Mints a JWT (including the user's roles and current SecurityStamp) and writes it to the
        // HttpOnly auth cookie, then returns the token and roles. Shared by login and the
        // post-ChangePassword re-issue so both use identical claims and cookie options.
        private async Task<(JwtSecurityToken token, IList<string> roles)> IssueAuthCookieAsync(ApplicationUser user)
        {
            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim("FullName", user.FullName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(_userManager.Options.ClaimsIdentity.SecurityStampClaimType,
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
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddDays(Convert.ToDouble(_configuration["Jwt:ExpireDays"])),
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
            await _userManager.RemoveAuthenticationTokenAsync(user, PasswordResetLoginProvider, PasswordResetOtpTokenName);
            await _userManager.RemoveAuthenticationTokenAsync(user, PasswordResetLoginProvider, PasswordResetOtpExpiryName);
        }
    }
}
