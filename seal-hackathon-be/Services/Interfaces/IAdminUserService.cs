using SEAL.NET.DTOs.User;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface IAdminUserService
    {
        Task<ServiceResult> GetUsersAsync();
        Task<ServiceResult> GetPendingUsersAsync();
        Task<ServiceResult> ApproveUserAsync(Guid? actorUserId, Guid userId);
        Task<ServiceResult> RejectUserAsync(Guid? actorUserId, Guid userId);
        Task<ServiceResult> UpdateUserRoleAsync(Guid? actorUserId, Guid userId, UpdateUserRoleRequest request);
        Task<ServiceResult> DeleteUserAsync(Guid userId);
        Task<ServiceResult> CreateGuestJudgeAsync(Guid? actorUserId, CreateGuestJudgeRequest request);
    }
}
