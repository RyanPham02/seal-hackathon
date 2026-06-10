using SEAL.NET.DTOs.Judge;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface IJudgeAssignmentService
    {
        Task<ServiceResult> GetAssignmentsAsync();
        Task<ServiceResult> CreateAssignmentAsync(CreateJudgeAssignmentRequest request);
        Task<ServiceResult> DeleteAssignmentAsync(Guid assignmentId);
    }
}
