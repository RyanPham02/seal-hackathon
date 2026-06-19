using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface IMatchmakingService
    {
        Task<ServiceResult> GetFreeAgentsAsync(Guid? eventId, Guid? categoryId, string? search, string? role);
        Task<ServiceResult> GetSuggestionsAsync(Guid currentUserId);
        Task<ServiceResult> CreateInvitationAsync(Guid? currentUserId, CreateInvitationRequest request);
        Task<ServiceResult> GetSentInvitationsAsync(Guid? currentUserId);
        Task<ServiceResult> GetReceivedInvitationsAsync(Guid? currentUserId);
        Task<ServiceResult> AcceptInvitationAsync(Guid? currentUserId, Guid invitationId);
        Task<ServiceResult> RejectInvitationAsync(Guid? currentUserId, Guid invitationId);
        Task<ServiceResult> CancelInvitationAsync(Guid? currentUserId, Guid invitationId);
    }
}
