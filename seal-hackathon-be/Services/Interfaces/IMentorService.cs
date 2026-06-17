using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>Mentor-facing endpoints (their assigned teams + notes).</summary>
    public interface IMentorService
    {
        Task<ServiceResult> GetAssignedTeamsAsync(Guid mentorUserId);
        Task<ServiceResult> GetAssignedTeamDetailAsync(Guid mentorUserId, Guid teamId);
        Task<ServiceResult> SaveTeamNotesAsync(Guid mentorUserId, Guid teamId, SaveNotesRequest request);
    }
}
