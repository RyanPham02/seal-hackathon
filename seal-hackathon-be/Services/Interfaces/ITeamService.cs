using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Team domain logic extracted from <c>TeamsController</c>. The current user's id (and,
    /// where a privileged-role bypass applies, an <c>isPrivileged</c> flag) is passed in by
    /// the controller, which owns reading the <see cref="System.Security.Claims.ClaimsPrincipal"/>.
    /// </summary>
    public interface ITeamService
    {
        Task<ServiceResult> CreateTeamAsync(Guid currentUserId, CreateTeamRequest request);
        Task<ServiceResult> GetMyTeamAsync(Guid currentUserId);
        Task<ServiceResult> AddMemberToMyTeamAsync(Guid currentUserId, AddTeamMemberByStudentCodeRequest request);
        Task<ServiceResult> RemoveMemberFromMyTeamAsync(Guid currentUserId, string studentCode);
        Task<ServiceResult> LeaveTeamAsync(Guid currentUserId);
        Task<ServiceResult> UpdateMyTeamAsync(Guid currentUserId, UpdateMyTeamRequest request);
        Task<ServiceResult> TransferLeaderAsync(Guid currentUserId, TransferLeaderRequest request);
        Task<ServiceResult> AddMemberAsync(Guid currentUserId, Guid teamId, AddTeamMemberRequest request);
        Task<ServiceResult> RemoveMemberAsync(Guid currentUserId, Guid teamId, Guid userId);
        Task<ServiceResult> GetTeamByIdAsync(Guid currentUserId, Guid teamId, bool isPrivileged);
        Task<ServiceResult> GetMentorsAsync();
        Task<ServiceResult> AssignMentorToMyTeamAsync(Guid currentUserId, ChooseMentorRequest request);
        Task<ServiceResult> RemoveMentorFromMyTeamAsync(Guid currentUserId);
        Task<ServiceResult> CreateKickRequestAsync(Guid currentUserId, Guid userId, CreateKickRequestRequest request);
        Task<ServiceResult> GetPendingKickRequestsForJudgeAsync(Guid judgeUserId);
        Task<ServiceResult> ApproveKickRequestAsync(Guid judgeUserId, Guid kickRequestId);
        Task<ServiceResult> RejectKickRequestAsync(Guid judgeUserId, Guid kickRequestId);
        Task<ServiceResult> GetRecruitingTeamsAsync(Guid currentUserId);
        Task<ServiceResult> RequestToJoinTeamAsync(Guid currentUserId, Guid teamId);
    }
}
