using SEAL.NET.DTOs.Submission;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface ISubmissionService
    {
        Task<ServiceResult> SubmitProjectAsync(Guid currentUserId, CreateSubmissionRequest request);
        Task<ServiceResult> GetTeamSubmissionsAsync(Guid currentUserId, Guid teamId, bool isAdminOrJudge);
        Task<ServiceResult> GetRoundSubmissionsAsync(Guid roundId);
        Task<ServiceResult> GetScoringQueueAsync(Guid currentUserId, bool isAdmin);
    }
}
