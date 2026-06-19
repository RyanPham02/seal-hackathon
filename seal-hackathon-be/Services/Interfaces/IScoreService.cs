using SEAL.NET.DTOs.Score;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>
    /// Scoring/evaluation logic extracted from <c>ScoresController</c>. The acting user's id
    /// and an <c>isAdmin</c> bypass flag are supplied by the controller.
    /// </summary>
    public interface IScoreService
    {
        Task<ServiceResult> SubmitScoreAsync(Guid judgeId, CreateScoreRequest request);
        Task<ServiceResult> GetMyAssignedSubmissionsAsync(Guid judgeId);
        Task<ServiceResult> GetEvaluationAsync(Guid currentUserId, Guid submissionId, bool isAdmin);
        Task<ServiceResult> SaveEvaluationAsync(Guid currentUserId, SaveEvaluationRequest request, bool isAdmin);
    }
}
