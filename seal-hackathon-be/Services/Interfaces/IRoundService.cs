using SEAL.NET.DTOs.Round;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface IRoundService
    {
        Task<ServiceResult> GetRoundsAsync(Guid eventId);
        Task<ServiceResult> GetRoundByIdAsync(Guid eventId, Guid roundId);
        Task<ServiceResult> CreateRoundAsync(Guid eventId, CreateRoundRequest request);
        Task<ServiceResult> UpdateRoundAsync(Guid eventId, Guid roundId, UpdateRoundRequest request);
        Task<ServiceResult> DeleteRoundAsync(Guid eventId, Guid roundId);
        Task<ServiceResult> AdvanceRoundAsync(Guid roundId);
    }
}
