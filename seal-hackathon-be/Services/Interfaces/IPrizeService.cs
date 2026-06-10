using SEAL.NET.DTOs.Prize;
using SEAL.NET.Services.Common;

namespace SEAL.NET.Services.Interfaces
{
    public interface IPrizeService
    {
        Task<ServiceResult> GetPrizesAsync(Guid? eventId);
        Task<ServiceResult> GetPrizeByIdAsync(Guid id);
        Task<ServiceResult> CreatePrizeAsync(CreatePrizeRequest request);
        Task<ServiceResult> UpdatePrizeAsync(Guid id, UpdatePrizeRequest request);
        Task<ServiceResult> DeletePrizeAsync(Guid id);
    }
}
