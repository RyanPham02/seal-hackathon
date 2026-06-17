using SEAL.NET.DTOs.Auth;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Authentication/account logic extracted from <c>AuthController</c>. The service owns
    /// the HttpOnly auth-cookie lifecycle (issue/clear) via <see cref="IHttpContextAccessor"/>.
    /// </summary>
    public interface IAuthService
    {
        Task<ServiceResult> RegisterAsync(RegisterRequest model);
        Task<ServiceResult> LoginAsync(LoginRequest model);
        ServiceResult Logout();
        Task<ServiceResult> GetMeAsync(string? userId);
        Task<ServiceResult> UpdateProfileAsync(string? userId, UpdateProfileRequest request);
        Task<ServiceResult> ChangePasswordAsync(string? userId, ChangePasswordRequest request);
        Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequest model);
        Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequest model);
    }
}
