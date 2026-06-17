using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    /// <summary>Admin mentor-assignment management (for <c>AdminMentorsController</c>).</summary>
    public interface IMentorAdminService
    {
        Task<ServiceResult> GetAssignmentsAsync();
        Task<ServiceResult> AssignMentorAsync(Guid actorUserId, AssignMentorRequest request);
        Task<ServiceResult> DeactivateAssignmentAsync(Guid id);
    }
}
