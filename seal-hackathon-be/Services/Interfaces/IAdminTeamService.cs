using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>Admin team lifecycle (list / approve / reject / eliminate).</summary>
    public interface IAdminTeamService
    {
        Task<ServiceResult> GetTeamsAsync();
        Task<ServiceResult> ApproveTeamAsync(Guid? actorUserId, Guid teamId);
        Task<ServiceResult> RejectTeamAsync(Guid? actorUserId, Guid teamId);
        Task<ServiceResult> EliminateTeamAsync(Guid? actorUserId, Guid teamId, EliminateTeamRequest request);
    }
}
