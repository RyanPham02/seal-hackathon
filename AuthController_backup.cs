using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SEAL.NET.DTOs.Auth;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using SEAL.NET.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        private readonly IEmailService _emailService;

        public AuthController(
            UserManager<ApplicationUser> userManager, 
            RoleManager<IdentityRole<Guid>> roleManager, 
            IConfiguration configuration,
            IMemoryCache cache,
            IEmailService emailService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _cache = cache;
            _emailService = emailService;
        }

        [HttpPost("send-register-otp")]
        public async Task<IActionResult> SendRegisterOtp([FromBody] SendRegisterOtpRequest request)
        {
            var emailKey = request.Email.ToLower();
            
            // Rate Limit check for sending OTP
            var attempts = _cache.GetOrCreate($"SEND_OTP_LIMIT_{emailKey}", entry => {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15);
                return 0;
            });

            if (attempts >= 3)
                return StatusCode(429, new { message = "Too many OTP requests. Please try again after 15 minutes." });

            _cache.Set($"SEND_OTP_LIMIT_{emailKey}", attempts + 1, TimeSpan.FromMinutes(15));

            var emailCount = await _userManager.Users.CountAsync(u => u.Email == request.Email);
            if (emailCount >= 1)
                return BadRequest(new { message = "This email address is already registered. Each email can only be used for one account." });

            var otp = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
            _cache.Set($"REG_OTP_{request.Email.ToLower()}", otp, TimeSpan.FromMinutes(10));

            var subject = "SEAL System - Registration Verification";
            var htmlMessage = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;'>
                    <h2 style='color: #4f46e5; text-align: center;'>SEAL System</h2>
                    <p>Hello,</p>
                    <p>Thank you for signing up. Please use the following One-Time Password (OTP) to verify your email address:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; padding: 15px 30px; background-color: #f1f5f9; border-radius: 8px;'>{otp}</span>
                    </div>
                    <p style='color: #64748b; font-size: 14px;'>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
                </div>
            ";

            await _emailService.SendEmailAsync(request.Email, subject, htmlMessage);
            return Ok(new { message = "Registration OTP has been sent to your email." });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
        {
            if (!_cache.TryGetValue($"REG_OTP_{model.Email.ToLower()}", out string? storedOtp) || storedOtp != model.Otp)
            {
                return BadRequest(new { message = "Invalid or expired OTP." });
            }

            var emailCount = await _userManager.Users.CountAsync(u => u.Email == model.Email);
            if (emailCount >= 1)
                return BadRequest(new { message = "This email address is already registered. Each email can only be used for one account." });

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
                UserName = Guid.NewGuid().ToString(),
                Email = model.Email,
                FullName = model.FullName,
                StudentType = model.StudentType,
                StudentCode = model.StudentCode,
                SchoolName = model.SchoolName,
                Skills = model.Skills,
                IsApproved = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, "Member");

            _cache.Remove($"REG_OTP_{model.Email.ToLower()}");

            return Ok(new { message = "Created account successfully!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            var users = await _userManager.Users
                .Where(u => u.Email == model.Email)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            if (!users.Any())
                return Unauthorized(new { message = "Email or password is incorrect." });

            ApplicationUser? matchedUser = null;
            foreach (var u in users)
            {
                if (await _userManager.CheckPasswordAsync(u, model.Password))
                {
                    matchedUser = u;
                    break;
                }
            }

            if (matchedUser == null)
                return Unauthorized(new { message = "Email or password is incorrect." });

            var user = matchedUser;

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
                    name = user.FullName,
                    email = user.Email,
                    role = userRoles.FirstOrDefault(),
                    studentType = user.StudentType.ToString(),
                    studentCode = user.StudentCode,
                    schoolName = user.SchoolName,
                    skills = user.Skills
                }
            });
        }

        private JwtSecurityToken GenerateNewJsonWebToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["Jwt:ExpireDays"])),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return token;
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var emailKey = request.Email.ToLower();

            // Rate Limit check for sending OTP
            var attempts = _cache.GetOrCreate($"SEND_OTP_LIMIT_{emailKey}", entry => {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15);
                return 0;
            });

            if (attempts >= 3)
                return StatusCode(429, new { message = "Too many OTP requests. Please try again after 15 minutes." });

            _cache.Set($"SEND_OTP_LIMIT_{emailKey}", attempts + 1, TimeSpan.FromMinutes(15));

            var user = await _userManager.Users.Where(u => u.Email == request.Email).OrderByDescending(u => u.CreatedAt).FirstOrDefaultAsync();
            if (user == null)
            {
                return BadRequest(new { message = "Tài khoản chưa được đăng ký." });
            }

            // Generate 6-digit OTP securely
            var otp = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

            // Store in cache for 5 minutes
            _cache.Set($"OTP_{request.Email.ToLower()}", otp, TimeSpan.FromMinutes(5));

            // Send email
            var subject = "SEAL Password Reset OTP";
            var htmlMessage = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;'>
                    <h2 style='color: #4f46e5; text-align: center;'>SEAL System</h2>
                    <p>Hello {user.FullName},</p>
                    <p>We received a request to reset your password. Here is your One-Time Password (OTP):</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; padding: 15px 30px; background-color: #f1f5f9; border-radius: 8px;'>{otp}</span>
                    </div>
                    <p style='color: #64748b; font-size: 14px;'>This OTP is valid for 5 minutes. Do not share this code with anyone.</p>
                    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;' />
                    <p style='color: #94a3b8; font-size: 12px; text-align: center;'>If you did not request this, please ignore this email.</p>
                </div>
            ";

            // Don't await email sending if you want it to be fire-and-forget, 
            // but awaiting it is safer to ensure it doesn't fail silently.
            await _emailService.SendEmailAsync(request.Email, subject, htmlMessage);

            return Ok(new { message = "If your email is registered, you will receive an OTP shortly." });
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var emailKey = request.Email.ToLower();

            // Check Brute-force limit
            var fails = _cache.GetOrCreate($"OTP_FAILS_{emailKey}", entry => {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15);
                return 0;
            });

            if (fails >= 5)
                return StatusCode(429, new { message = "Account locked due to too many failed OTP attempts. Please try again in 15 minutes." });

            if (_cache.TryGetValue($"OTP_{emailKey}", out string? storedOtp))
            {
                if (storedOtp == request.Otp)
                {
                    _cache.Remove($"OTP_FAILS_{emailKey}");
                    return Ok(new { message = "OTP verified successfully." });
                }
            }

            // Increment fail count
            _cache.Set($"OTP_FAILS_{emailKey}", fails + 1, TimeSpan.FromMinutes(15));
            return BadRequest(new { message = "Invalid or expired OTP." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!_cache.TryGetValue($"OTP_{request.Email.ToLower()}", out string? storedOtp) || storedOtp != request.Otp)
            {
                return BadRequest(new { message = "Invalid or expired OTP." });
            }

            var user = await _userManager.Users.Where(u => u.Email == request.Email).OrderByDescending(u => u.CreatedAt).FirstOrDefaultAsync();
            if (user == null)
            {
                return BadRequest(new { message = "User not found." });
            }

            // Generate the proper Identity reset token internally
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            
            // Reset the password
            var result = await _userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
            
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Clear the OTP from cache so it can't be reused
            _cache.Remove($"OTP_{request.Email.ToLower()}");

            return Ok(new { message = "Password has been reset successfully." });
        }
    }
}
