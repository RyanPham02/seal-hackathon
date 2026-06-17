using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Auth;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        private string? CurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest model)
            => this.ToActionResult(await _authService.RegisterAsync(model));

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
            => this.ToActionResult(await _authService.LoginAsync(model));

        [HttpPost("logout")]
        public IActionResult Logout()
            => this.ToActionResult(_authService.Logout());

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
            => this.ToActionResult(await _authService.GetMeAsync(CurrentUserId()));

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
            => this.ToActionResult(await _authService.UpdateProfileAsync(CurrentUserId(), request));

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
            => this.ToActionResult(await _authService.ChangePasswordAsync(CurrentUserId(), request));

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
            => this.ToActionResult(await _authService.ForgotPasswordAsync(model));

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
            => this.ToActionResult(await _authService.ResetPasswordAsync(model));
    }
}