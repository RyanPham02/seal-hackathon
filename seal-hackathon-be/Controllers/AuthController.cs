using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
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
                StudentCode = model.StudentCode,
                SchoolName = model.SchoolName,
                IsApproved = false
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            if (!await _roleManager.RoleExistsAsync("Member"))
                await _roleManager.CreateAsync(new IdentityRole<Guid>("Member"));

            await _userManager.AddToRoleAsync(user, "Member");

            return Ok(new { message = "Created account successfully!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
                return Unauthorized(new { message = "Email or password is incorrect." });

            if (!user.IsApproved)
                return Unauthorized(new { message = "Your account is waiting for approval." });

            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email!),
                    new Claim("FullName", user.FullName),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                };

            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = GenerateNewJsonWebToken(authClaims);

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
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

            return Ok(new { message = "OTP has been sent to your email." });
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
